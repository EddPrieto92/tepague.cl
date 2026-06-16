import { NextResponse } from "next/server";
import { verifyFintocWebhookSignature } from "@/lib/fintoc";
import { findServerPayment, markWebhookProcessed, updateServerPaymentStatus } from "@/lib/server-payment-store";
import type { PaymentStatus } from "@/lib/types";

type FintocEvent = {
  id: string;
  type: string;
  data: {
    id?: string;
    metadata?: Record<string, string>;
    payment_resource?: {
      payment_intent?: {
        id?: string;
        status?: string;
      };
    };
  };
};

function statusForEvent(type: string): PaymentStatus | null {
  if (type === "payment_intent.succeeded") return "succeeded";
  if (type === "payment_intent.failed") return "failed";
  if (type === "payment_intent.requires_action") return "requires_action";
  if (type === "checkout_session.expired") return "expired";
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("fintoc-signature");

  if (!verifyFintocWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as FintocEvent;
  console.info("Webhook recibido", { id: event.id, type: event.type });

  if (!markWebhookProcessed(event.id)) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const paymentIntentId = event.data.payment_resource?.payment_intent?.id;
  const payment = findServerPayment({
    paymentId: event.data.metadata?.payment_id,
    checkoutSessionId: event.data.id,
    paymentIntentId,
  });

  if (!payment) return NextResponse.json({ ok: true, ignored: "payment_not_found" });

  const eventStatus =
    event.type === "checkout_session.finished"
      ? event.data.payment_resource?.payment_intent?.status === "succeeded"
        ? "succeeded"
        : null
      : statusForEvent(event.type);

  if (!eventStatus) return NextResponse.json({ ok: true, ignored: "event_not_mapped" });

  const nextPayment = updateServerPaymentStatus(payment, eventStatus, {
    fintocPaymentIntentId: paymentIntentId ?? payment.fintocPaymentIntentId,
    rawWebhookEvent: event,
  });

  if (nextPayment.status === "succeeded") console.info("Pago confirmado", { payment_id: nextPayment.id });
  if (nextPayment.status === "failed") console.info("Pago fallido", { payment_id: nextPayment.id });

  return NextResponse.json({ ok: true, payment: nextPayment });
}
