import { NextResponse } from "next/server";
import { calculatePaymentSummary } from "@/lib/calculations";
import { createFintocCheckoutSession, FintocApiError, FintocConfigError } from "@/lib/fintoc";
import { getServerBill, saveServerPayment, SupabasePaymentStoreError, syncBillSnapshot } from "@/lib/server-payment-store";
import { getPublicBill, savePublicBill } from "@/lib/public-bill-store";
import { isValidPaymentProfile, normalizeChileanHolderId } from "@/lib/payment-profile";
import type { Bill, Payment } from "@/lib/types";

type Payload = {
  bill_id?: string;
  participant_id?: string;
  bill_snapshot?: Bill;
};

function paymentId() {
  return `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    if (payload.bill_snapshot) syncBillSnapshot(payload.bill_snapshot);

    const billId = payload.bill_id;
    const participantId = payload.participant_id;
    if (!billId || !participantId) {
      return NextResponse.json({ error: "bill_id_and_participant_id_required" }, { status: 400 });
    }

    const bill = getServerBill(billId) ?? await getPublicBill(billId);
    if (!bill) return NextResponse.json({ error: "bill_not_synced" }, { status: 404 });
    if (!isValidPaymentProfile(bill.paymentProfile)) {
      return NextResponse.json({ error: "payment_profile_required" }, { status: 422 });
    }

    const summary = calculatePaymentSummary(bill, participantId);
    if (!summary.participant || summary.amount <= 0) {
      return NextResponse.json({ error: "participant_debt_required" }, { status: 422 });
    }

    const now = new Date().toISOString();
    const payment: Payment = {
      id: paymentId(),
      billId: bill.id,
      billShareId: bill.shareId,
      participantId,
      amount: summary.amount,
      serviceFeeAmount: summary.serviceFeePerParticipant,
      totalAmount: summary.totalAmount,
      status: "created",
      createdAt: now,
      updatedAt: now,
    };

    const session = await createFintocCheckoutSession({
      paymentId: payment.id,
      amount: payment.totalAmount,
      billId: bill.id,
      billShareId: bill.shareId,
      participantId,
      description: `Mesa Cobrada - ${bill.title}`,
      receiverName: bill.paymentProfile.holderName,
      recipientAccount: {
        holder_id: normalizeChileanHolderId(bill.paymentProfile.holderId),
        number: bill.paymentProfile.accountNumber,
        type: bill.paymentProfile.accountType as "checking_account" | "sight_account",
        institution_id: bill.paymentProfile.institutionId,
      },
    });

    const saved = await saveServerPayment({
      ...payment,
      status: "redirected",
      fintocCheckoutSessionId: session.id,
      fintocRedirectUrl: session.redirect_url,
      updatedAt: new Date().toISOString(),
    });
    await savePublicBill({
      ...bill,
      participants: bill.participants.map((participant) =>
        participant.id === participantId ? { ...participant, status: "payment_pending" } : participant,
      ),
      updatedAt: new Date().toISOString(),
    });

    console.info("Checkout listo", { payment_id: saved.id });

    return NextResponse.json({
      payment: saved,
      redirect_url: saved.fintocRedirectUrl,
      service_fee_total: summary.serviceFeeTotal,
      service_fee_per_participant: summary.serviceFeePerParticipant,
    });
  } catch (error) {
    console.error("create-checkout-session failed", error);
    if (error instanceof FintocApiError) {
      return NextResponse.json(
        {
          error: "fintoc_checkout_error",
          status: error.status,
          detail: error.detail,
        },
        { status: 502 },
      );
    }
    if (error instanceof FintocConfigError) {
      return NextResponse.json({ error: "fintoc_config_error" }, { status: 500 });
    }
    if (error instanceof SupabasePaymentStoreError) {
      return NextResponse.json({ error: "supabase_payment_persistence_failed" }, { status: 500 });
    }
    return NextResponse.json({ error: "checkout_session_failed" }, { status: 500 });
  }
}
