import type { Bill, BillItem, Participant } from "../../lib/types";

function participant(id: string, items: Participant["items"] = []): Participant {
  return {
    id,
    billId: "bill_fixture",
    name: `Persona ${id}`,
    totalAmount: 0,
    includeTip: true,
    status: "confirmed",
    items,
    adjustments: [],
  };
}

function item(id: string, patch: Partial<BillItem> = {}): BillItem {
  return {
    id,
    billId: "bill_fixture",
    name: id,
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    isShared: false,
    splitMode: "unit",
    ...patch,
  };
}

export function billFixture(items: BillItem[], participants: Participant[], expectedParticipantCount = participants.length): Bill {
  const subtotal = items.reduce((sum, candidate) => sum + candidate.totalPrice, 0);
  const now = "2026-06-19T12:00:00.000Z";
  return {
    id: "bill_fixture",
    shareId: "fixture",
    title: "Fixture",
    expectedParticipantCount,
    subtotal,
    tip: 0,
    serviceFee: 0,
    discount: 0,
    total: subtotal,
    enteredSubtotal: subtotal,
    enteredTip: 0,
    enteredTotal: subtotal,
    missingAmount: 0,
    status: "open",
    paymentMethod: "mixed",
    items,
    participants,
    createdAt: now,
    updatedAt: now,
  };
}

export const fixtureBuilders = { item, participant };
