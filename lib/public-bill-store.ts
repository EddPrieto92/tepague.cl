import type { Bill, ParticipantStatus } from "./types";
import { supabaseAdmin } from "./supabase";
import { publicBillPayload } from "./public-bill-payload";

export class PublicBillStoreError extends Error {
  reason: "not_configured" | "schema_missing" | "unavailable";

  constructor(message: string, reason: "not_configured" | "schema_missing" | "unavailable" = "unavailable") {
    super(message);
    this.name = "PublicBillStoreError";
    this.reason = reason;
  }
}

function logPublicBillStoreError(context: string, error: { code?: string; message?: string; details?: string; hint?: string } | null) {
  if (!error) return;
  console.error("[public-bills]", context, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var mesaCobradaPublicBills: Map<string, Bill> | undefined;
}

function memoryBills() {
  globalThis.mesaCobradaPublicBills ??= new Map<string, Bill>();
  return globalThis.mesaCobradaPublicBills;
}

function remember(bill: Bill) {
  memoryBills().set(bill.id, bill);
  memoryBills().set(bill.shareId, bill);
}

function billRow(bill: Bill) {
  const publicBill = publicBillPayload(bill);
  return {
    id: bill.id,
    share_id: bill.shareId,
    title: bill.title,
    status: bill.status,
    expected_participant_count: bill.expectedParticipantCount,
    receipt_total: bill.receiptTotal ?? null,
    entered_total: bill.enteredTotal,
    missing_amount: bill.missingAmount,
    snapshot: publicBill,
    created_at: bill.createdAt,
    updated_at: bill.updatedAt,
  };
}

function isMissingPublicSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return error.code === "42P01"
    || error.code === "PGRST205"
    || message.includes("schema cache")
    || message.includes("relation")
    || message.includes("does not exist");
}

export async function savePublicBill(bill: Bill, options: { requirePublicStorage?: boolean } = {}) {
  remember(bill);
  if (!supabaseAdmin) {
    if (options.requirePublicStorage) {
      throw new PublicBillStoreError("La persistencia pública no está configurada.", "not_configured");
    }
    return { bill, storage: "memory" as const, warning: "public_storage_unavailable" as const };
  }

  const { error: billError } = await supabaseAdmin.from("bills").upsert(billRow(bill));
  if (billError) {
    logPublicBillStoreError("bills_upsert_failed", billError);
    if (options.requirePublicStorage) {
      throw new PublicBillStoreError(
        "No se pudo guardar la cuenta pública.",
        isMissingPublicSchema(billError) ? "schema_missing" : "unavailable",
      );
    }
    return { bill, storage: "memory" as const, warning: "public_storage_unavailable" as const };
  }

  const itemRows = bill.items.map((item) => ({
    id: item.id,
    bill_id: bill.id,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    split_mode: item.splitMode,
    paid_by_participant_id: item.paidByParticipantId ?? null,
    updated_at: bill.updatedAt,
  }));
  const participantRows = bill.participants.map((participant) => ({
    id: participant.id,
    bill_id: bill.id,
    name: participant.name,
    status: participant.status,
    include_tip: participant.includeTip !== false,
    total_amount: participant.totalAmount,
    paid_at: participant.paidAt ?? null,
    updated_at: bill.updatedAt,
  }));
  const claimRows = bill.participants.flatMap((participant) =>
    participant.items.map((item) => ({
      id: item.id,
      participant_id: participant.id,
      bill_item_id: item.billItemId,
      quantity: item.quantity,
      amount: item.amount,
      updated_at: bill.updatedAt,
    })),
  );

  const parentOperations: Array<PromiseLike<{ error: { code?: string; message?: string; details?: string; hint?: string } | null }>> = [];
  if (itemRows.length) parentOperations.push(supabaseAdmin.from("bill_items").upsert(itemRows));
  if (participantRows.length) parentOperations.push(supabaseAdmin.from("participants").upsert(participantRows));
  if (bill.paymentProfile) {
    parentOperations.push(supabaseAdmin.from("payment_profiles").upsert({
      id: bill.paymentProfile.id,
      bill_id: bill.id,
      holder_name: bill.paymentProfile.holderName,
      holder_id: bill.paymentProfile.holderId,
      institution_id: bill.paymentProfile.institutionId,
      account_type: bill.paymentProfile.accountType,
      account_number: bill.paymentProfile.accountNumber,
      authorized: bill.paymentProfile.authorized,
      updated_at: bill.updatedAt,
    }));
  }

  const parentResults = await Promise.all(parentOperations);
  parentResults.forEach((result, index) => logPublicBillStoreError(`detail_upsert_failed_${index}`, result.error));
  const detailWarning = parentResults.some((result) => result.error);
  if (claimRows.length) {
    const { error: claimError } = await supabaseAdmin.from("participant_items").upsert(claimRows);
    if (claimError) {
      logPublicBillStoreError("participant_items_upsert_failed", claimError);
      return { bill, storage: "supabase" as const, warning: "public_detail_sync_failed" as const };
    }
  }
  return detailWarning
    ? { bill, storage: "supabase" as const, warning: "public_detail_sync_failed" as const }
    : { bill, storage: "supabase" as const };
}

export async function getPublicBill(identifier: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(identifier)) return null;
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("bills")
      .select("snapshot")
      .or(`id.eq.${identifier},share_id.eq.${identifier}`)
      .maybeSingle();
    if (error) {
      if (isMissingPublicSchema(error)) return memoryBills().get(identifier) ?? null;
      throw new PublicBillStoreError("No se pudo cargar la cuenta pública.");
    }
    if (data?.snapshot) {
      const bill = data.snapshot as Bill;
      remember(bill);
      return bill;
    }
  }
  return memoryBills().get(identifier) ?? null;
}

export async function updatePublicParticipantStatus(billId: string, participantId: string, status: ParticipantStatus) {
  const bill = await getPublicBill(billId);
  if (!bill) return null;
  const nextBill: Bill = {
    ...bill,
    participants: bill.participants.map((participant) =>
      participant.id === participantId
        ? { ...participant, status, paidAt: status === "paid" ? new Date().toISOString() : participant.paidAt }
        : participant,
    ),
    updatedAt: new Date().toISOString(),
  };
  await savePublicBill(nextBill);
  return nextBill;
}
