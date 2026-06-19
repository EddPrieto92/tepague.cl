"use client";

import { calculateBillTotal, calculateBillValidation } from "./calculations";
import { demoBill } from "./mock-data";
import type { ParsedReceipt } from "./receipt-ocr";
import type { Bill, BillItem, Participant, ParticipantItem, Payment, UserPaymentProfile } from "./types";

const BILL_KEY = "mesa-cobrada:bills";
const PARTICIPANT_KEY = "mesa-cobrada:participant";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
}

export function makeEmptyBill(): Bill {
  const now = new Date().toISOString();
  return {
    ...demoBill,
    id: uid("bill"),
    shareId: `mesa-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    imageUrl: "",
    ocrStatus: "empty",
    expectedParticipantCount: 1,
    enteredSubtotal: 0,
    enteredTip: 0,
    enteredTotal: 0,
    missingAmount: 0,
    subtotal: 0,
    tip: 0,
    serviceFee: 0,
    discount: 0,
    total: 0,
    includeTipInTotal: true,
    serviceFeeTotal: 0,
    serviceFeePerParticipant: 0,
    payments: [],
    paymentMethod: "mixed",
    paymentLink: "",
    paymentQrUrl: "",
    receiverName: "",
    bankName: "",
    accountType: "",
    accountNumber: "",
    receiverIdentifier: "",
    paymentNote: "",
    paymentProfile: undefined,
    status: "draft",
    participants: [],
    createdAt: now,
    updatedAt: now,
    items: [],
  };
}

export function getBills(): Bill[] {
  if (typeof window === "undefined") return [demoBill];
  const raw = window.localStorage.getItem(BILL_KEY);
  if (!raw) {
    window.localStorage.setItem(BILL_KEY, JSON.stringify([demoBill]));
    return [demoBill];
  }
  try {
    return JSON.parse(raw) as Bill[];
  } catch {
    window.localStorage.setItem(BILL_KEY, JSON.stringify([demoBill]));
    return [demoBill];
  }
}

export function saveBills(bills: Bill[]) {
  window.localStorage.setItem(BILL_KEY, JSON.stringify(bills));
}

export function upsertBill(bill: Bill) {
  const bills = getBills();
  const itemSubtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotal = bill.subtotal || itemSubtotal;
  const includeTipInTotal = bill.includeTipInTotal !== false;
  const calculatedTotal = calculateBillTotal({
    subtotal,
    tip: bill.tip,
    serviceFee: bill.serviceFee,
    discount: bill.discount,
    includeTip: includeTipInTotal,
  });
  const normalizedItems = bill.items.map((item) => ({
    ...item,
    splitMode: item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit"),
  }));
  const validation = calculateBillValidation({ ...bill, items: normalizedItems });
  const nextBill: Bill = {
    ...bill,
    items: normalizedItems,
    expectedParticipantCount: Math.max(1, bill.expectedParticipantCount || 1),
    subtotal,
    includeTipInTotal,
    total: calculatedTotal || bill.total,
    shareId: bill.shareId || slugify(bill.title) || uid("mesa"),
    updatedAt: new Date().toISOString(),
    ...validation,
  };
  const index = bills.findIndex((candidate) => candidate.id === nextBill.id);
  const nextBills = index >= 0 ? bills.with(index, nextBill) : [nextBill, ...bills];
  saveBills(nextBills);
  return nextBill;
}

export function getBillByShareId(shareId: string) {
  return getBills().find((bill) => bill.shareId === shareId);
}

export function createBillFromTitle(
  title: string,
  imageUrl?: string,
  parsedItems: Omit<BillItem, "id" | "billId">[] = [],
  parsedReceipt?: Pick<ParsedReceipt, "subtotal" | "tip" | "total">,
  ocrStatus: Bill["ocrStatus"] = "empty",
) {
  const bill = makeEmptyBill();
  const seededItems: BillItem[] =
    parsedItems.length > 0
      ? parsedItems.map((item) => ({ ...item, id: uid("item"), billId: bill.id, splitMode: item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit") }))
      : [
          { id: uid("item"), billId: bill.id, name: "Producto 1", quantity: 1, unitPrice: 0, totalPrice: 0, isShared: false, splitMode: "unit" },
        ];
  const itemSubtotal = seededItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotal = parsedReceipt?.subtotal || itemSubtotal;
  const tip = parsedReceipt ? parsedReceipt.tip : Math.round(subtotal * 0.1);
  const includeTipInTotal = true;
  const total = calculateBillTotal({ subtotal, tip, serviceFee: 0, discount: 0, includeTip: includeTipInTotal }) || parsedReceipt?.total || 0;
  return upsertBill({
    ...bill,
    title,
    shareId: `${slugify(title) || "mesa"}-${Math.random().toString(36).slice(2, 6)}`,
    imageUrl,
    ocrStatus,
    receiptSubtotal: parsedReceipt?.subtotal || undefined,
    receiptTip: parsedReceipt?.tip || undefined,
    receiptTotal: parsedReceipt?.total || undefined,
    subtotal,
    tip,
    total,
    includeTipInTotal,
    items: seededItems,
  });
}

export function updateBillItems(bill: Bill, items: BillItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  return upsertBill({ ...bill, items, subtotal: bill.subtotal || subtotal });
}

export function addParticipant(bill: Bill, name: string) {
  const participant: Participant = {
    id: uid("participant"),
    billId: bill.id,
    name,
    totalAmount: 0,
    includeTip: true,
    status: "selecting",
    items: [],
    adjustments: [],
  };
  rememberParticipant(bill.shareId, participant.id);
  return upsertBill({ ...bill, participants: [...bill.participants, participant] });
}

export function updateParticipantTipPreference(bill: Bill, participantId: string, includeTip: boolean) {
  return upsertBill({
    ...bill,
    participants: bill.participants.map((participant) =>
      participant.id === participantId ? { ...participant, includeTip } : participant,
    ),
  });
}

export function updateParticipantItems(bill: Bill, participantId: string, items: ParticipantItem[], confirm = false) {
  return upsertBill({
    ...bill,
    participants: bill.participants.map((participant) =>
      participant.id === participantId
        ? { ...participant, status: confirm ? "confirmed" : "selecting", items }
        : participant,
    ),
  });
}

export function markParticipantPaid(bill: Bill, participantId: string) {
  return upsertBill({
    ...bill,
    participants: bill.participants.map((participant) =>
      participant.id === participantId
        ? { ...participant, status: "paid", paidAt: new Date().toISOString() }
        : participant,
    ),
  });
}

export function updatePaymentProfile(bill: Bill, profile: Omit<UserPaymentProfile, "id" | "userId" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const current = bill.paymentProfile;
  return upsertBill({
    ...bill,
    paymentProfile: {
      ...profile,
      id: current?.id ?? uid("profile"),
      userId: current?.userId ?? `organizer:${bill.id}`,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    },
    receiverName: profile.holderName,
    receiverIdentifier: profile.holderId,
    bankName: profile.institutionId,
    accountType: profile.accountType,
    accountNumber: profile.accountNumber,
  });
}

export function recordPaymentOnBill(bill: Bill, payment: Payment) {
  const payments = bill.payments ?? [];
  const index = payments.findIndex((candidate) => candidate.id === payment.id);
  const nextPayments = index >= 0 ? payments.with(index, payment) : [payment, ...payments];
  return upsertBill({ ...bill, payments: nextPayments });
}

export function applyPaymentStatusLocally(bill: Bill, payment: Payment) {
  const updatedBill = recordPaymentOnBill(bill, payment);
  if (payment.status !== "succeeded") return updatedBill;
  return markParticipantPaid(updatedBill, payment.participantId);
}

export function rememberParticipant(shareId: string, participantId: string) {
  window.localStorage.setItem(`${PARTICIPANT_KEY}:${shareId}`, participantId);
}

export function getRememberedParticipant(shareId: string) {
  return window.localStorage.getItem(`${PARTICIPANT_KEY}:${shareId}`);
}

export function makeParticipantItem(participantId: string, billItemId: string, quantity: number, amount: number): ParticipantItem {
  return {
    id: uid("participant_item"),
    participantId,
    billItemId,
    quantity,
    amount,
  };
}
