import type { Bill, Payment, PaymentStatus } from "./types";
import { supabaseAdmin } from "./supabase";

export class SupabasePaymentStoreError extends Error {
  constructor(
    message: string,
    readonly detail: string,
  ) {
    super(message);
    this.name = "SupabasePaymentStoreError";
  }
}

type ServerPaymentState = {
  bills: Map<string, Bill>;
  payments: Map<string, Payment>;
  processedWebhookEvents: Set<string>;
};

declare global {
  // eslint-disable-next-line no-var
  var mesaCobradaPaymentState: ServerPaymentState | undefined;
}

function state() {
  globalThis.mesaCobradaPaymentState ??= {
    bills: new Map<string, Bill>(),
    payments: new Map<string, Payment>(),
    processedWebhookEvents: new Set<string>(),
  };
  return globalThis.mesaCobradaPaymentState;
}

export function syncBillSnapshot(bill: Bill) {
  state().bills.set(bill.id, bill);
  state().bills.set(bill.shareId, bill);
  return bill;
}

export function getServerBill(id: string) {
  return state().bills.get(id) ?? null;
}

function paymentToRow(payment: Payment) {
  return {
    id: payment.id,
    bill_id: payment.billId,
    participant_id: payment.participantId,
    amount: payment.amount,
    service_fee_amount: payment.serviceFeeAmount,
    total_amount: payment.totalAmount,
    status: payment.status,
    fintoc_checkout_session_id: payment.fintocCheckoutSessionId ?? null,
    fintoc_payment_intent_id: payment.fintocPaymentIntentId ?? null,
    fintoc_redirect_url: payment.fintocRedirectUrl ?? null,
    raw_webhook_event: payment.rawWebhookEvent ?? null,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}

type PaymentRow = ReturnType<typeof paymentToRow>;

function rowToPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    billId: row.bill_id,
    participantId: row.participant_id,
    amount: row.amount,
    serviceFeeAmount: row.service_fee_amount,
    totalAmount: row.total_amount,
    status: row.status as PaymentStatus,
    fintocCheckoutSessionId: row.fintoc_checkout_session_id ?? undefined,
    fintocPaymentIntentId: row.fintoc_payment_intent_id ?? undefined,
    fintocRedirectUrl: row.fintoc_redirect_url ?? undefined,
    rawWebhookEvent: row.raw_webhook_event ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveServerPayment(payment: Payment) {
  state().payments.set(payment.id, payment);
  if (payment.fintocCheckoutSessionId) state().payments.set(payment.fintocCheckoutSessionId, payment);
  if (payment.fintocPaymentIntentId) state().payments.set(payment.fintocPaymentIntentId, payment);

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from("payments").upsert(paymentToRow(payment));
    if (error) {
      console.error("Supabase payment upsert failed", { payment_id: payment.id, error });
      throw new SupabasePaymentStoreError("payment_persistence_failed", error.message);
    }
  }

  return payment;
}

export async function getServerPayment(id: string) {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`id.eq.${id},fintoc_checkout_session_id.eq.${id},fintoc_payment_intent_id.eq.${id}`)
      .maybeSingle();

    if (error) {
      console.error("Supabase payment lookup failed", { id, error });
      throw new SupabasePaymentStoreError("payment_lookup_failed", error.message);
    }
    if (data) return rowToPayment(data as PaymentRow);
  }

  return state().payments.get(id) ?? null;
}

export async function findServerPayment(input: { paymentId?: string; checkoutSessionId?: string; paymentIntentId?: string }) {
  return input.paymentId
    ? await getServerPayment(input.paymentId)
    : input.paymentIntentId
      ? await getServerPayment(input.paymentIntentId)
      : input.checkoutSessionId
        ? await getServerPayment(input.checkoutSessionId)
        : null;
}

export async function updateServerPaymentStatus(payment: Payment, status: PaymentStatus, patch: Partial<Payment> = {}) {
  return await saveServerPayment({
    ...payment,
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function markWebhookProcessed(eventId: string, type = "unknown", rawEvent: unknown = {}) {
  const processed = state().processedWebhookEvents;
  if (processed.has(eventId)) return false;
  processed.add(eventId);

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from("fintoc_webhook_events").insert({
      id: eventId,
      type,
      raw_event: rawEvent,
    });

    if (error) {
      if (error.code === "23505") return false;
      console.error("Supabase webhook insert failed", { event_id: eventId, error });
      throw new SupabasePaymentStoreError("webhook_persistence_failed", error.message);
    }
  }

  return true;
}
