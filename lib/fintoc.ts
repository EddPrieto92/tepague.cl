import crypto from "crypto";

type CreateCheckoutSessionInput = {
  paymentId: string;
  amount: number;
  billId: string;
  billShareId: string;
  participantId: string;
  description: string;
  receiverName?: string;
  recipientAccount: {
    holder_id: string;
    number: string;
    type: "checking_account" | "sight_account";
    institution_id: string;
  };
};

export type FintocCheckoutSession = {
  id: string;
  redirect_url: string;
};

export class FintocApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FintocApiError";
  }
}

export class FintocConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FintocConfigError";
  }
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
}

function fintocSecretKey() {
  const key = process.env.FINTOC_SECRET_KEY?.trim().replace(/^Bearer\s+/i, "").replace(/^["']|["']$/g, "");
  if (!key) return undefined;
  if (key.startsWith("pk_")) {
    throw new FintocConfigError("FINTOC_SECRET_KEY debe usar la Secret key de Fintoc, no la Public key.");
  }
  return key;
}

export async function createFintocCheckoutSession(input: CreateCheckoutSessionInput): Promise<FintocCheckoutSession> {
  const secretKey = fintocSecretKey();

  if (process.env.FINTOC_MOCK_CHECKOUT === "true" || !secretKey) {
    const id = `cs_test_${input.paymentId}`;
    const redirectUrl = `${appUrl()}/pay/mock-checkout?payment_id=${input.paymentId}`;
    console.info("Checkout Session creada", { id, mode: "mock_test" });
    return { id, redirect_url: redirectUrl };
  }

  const response = await fetch("https://api.fintoc.com/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: secretKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currency: "CLP",
      success_url: `${appUrl()}/pay/success?payment_id=${input.paymentId}`,
      cancel_url: `${appUrl()}/pay/cancel?payment_id=${input.paymentId}&bill_share_id=${input.billShareId}&participant_id=${input.participantId}`,
      payment_method_types: ["bank_transfer"],
      payment_method_options: {
        bank_transfer: {
          recipient_account: input.recipientAccount,
        },
      },
      metadata: {
        bill_id: input.billId,
        participant_id: input.participantId,
        payment_id: input.paymentId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "CLP",
            unit_amount: input.amount,
            product_data: {
              name: input.description,
            },
          },
        },
      ],
      business_profile: input.receiverName ? { name: input.receiverName } : undefined,
    }),
  });

  if (!response.ok) {
    await response.body?.cancel();
    console.error("Fintoc checkout error", { status: response.status });
    throw new FintocApiError("No se pudo crear la sesion de pago Fintoc.", response.status);
  }

  const session = (await response.json()) as FintocCheckoutSession;
  console.info("Checkout Session creada", { id: session.id });
  return session;
}

export function verifyFintocWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.FINTOC_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const message = `${timestamp}.${rawBody}`;
  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  const expected = Buffer.from(digest);
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
