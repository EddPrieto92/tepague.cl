import crypto from "crypto";

type CreateCheckoutSessionInput = {
  paymentId: string;
  amount: number;
  billId: string;
  participantId: string;
  description: string;
  receiverName?: string;
};

export type FintocCheckoutSession = {
  id: string;
  redirect_url: string;
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
}

export async function createFintocCheckoutSession(input: CreateCheckoutSessionInput): Promise<FintocCheckoutSession> {
  if (process.env.FINTOC_MOCK_CHECKOUT === "true" || !process.env.FINTOC_SECRET_KEY) {
    const id = `cs_test_${input.paymentId}`;
    const redirectUrl = `${appUrl()}/pay/mock-checkout?payment_id=${input.paymentId}`;
    console.info("Checkout Session creada", { id, redirect_url: redirectUrl, mode: "mock_test" });
    return { id, redirect_url: redirectUrl };
  }

  const response = await fetch("https://api.fintoc.com/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: process.env.FINTOC_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "CLP",
      success_url: `${appUrl()}/pay/success?payment_id=${input.paymentId}`,
      cancel_url: `${appUrl()}/pay/cancel?payment_id=${input.paymentId}`,
      metadata: {
        bill_id: input.billId,
        participant_id: input.participantId,
        payment_id: input.paymentId,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
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
    const body = await response.text();
    console.error("Fintoc checkout error", { status: response.status, body });
    throw new Error("No se pudo crear la sesion de pago Fintoc.");
  }

  const session = (await response.json()) as FintocCheckoutSession;
  console.info("Checkout Session creada", { id: session.id, redirect_url: session.redirect_url });
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
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
