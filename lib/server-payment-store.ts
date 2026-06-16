import type { Bill, Payment, PaymentStatus } from "./types";

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

export function saveServerPayment(payment: Payment) {
  state().payments.set(payment.id, payment);
  if (payment.fintocCheckoutSessionId) state().payments.set(payment.fintocCheckoutSessionId, payment);
  if (payment.fintocPaymentIntentId) state().payments.set(payment.fintocPaymentIntentId, payment);
  return payment;
}

export function getServerPayment(id: string) {
  return state().payments.get(id) ?? null;
}

export function findServerPayment(input: { paymentId?: string; checkoutSessionId?: string; paymentIntentId?: string }) {
  return input.paymentId
    ? getServerPayment(input.paymentId)
    : input.paymentIntentId
      ? getServerPayment(input.paymentIntentId)
      : input.checkoutSessionId
        ? getServerPayment(input.checkoutSessionId)
        : null;
}

export function updateServerPaymentStatus(payment: Payment, status: PaymentStatus, patch: Partial<Payment> = {}) {
  return saveServerPayment({
    ...payment,
    ...patch,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function markWebhookProcessed(eventId: string) {
  const processed = state().processedWebhookEvents;
  if (processed.has(eventId)) return false;
  processed.add(eventId);
  return true;
}
