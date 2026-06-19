import { NextResponse } from "next/server";
import { getServerPayment, updateServerPaymentStatus } from "@/lib/server-payment-store";
import { updatePublicParticipantStatus } from "@/lib/public-bill-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get("payment_id");
  const mock = url.searchParams.get("mock") === "1";
  if (!paymentId) return NextResponse.json({ error: "payment_id_required" }, { status: 400 });

  const payment = await getServerPayment(paymentId);
  if (!payment) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  const nextPayment = mock && payment.status !== "succeeded" ? await updateServerPaymentStatus(payment, "succeeded") : payment;
  if (mock && nextPayment.status === "succeeded") await updatePublicParticipantStatus(nextPayment.billId, nextPayment.participantId, "paid");
  if (mock) console.info("Pago confirmado", { payment_id: paymentId, mode: "mock_test" });

  return NextResponse.json({
    payment: nextPayment,
    bill_share_id: nextPayment.billShareId,
    participant_id: nextPayment.participantId,
  });
}
