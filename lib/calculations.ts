import type {
  Bill,
  BillItem,
  Dashboard,
  FunSummary,
  ParticipantItem,
} from "./types";

export function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

export function calculateBillTotal(input: {
  subtotal: number;
  tip: number;
  serviceFee: number;
  discount: number;
}) {
  return Math.max(0, input.subtotal + input.tip + input.serviceFee - input.discount);
}

export function calculateSharedItemSplit(item: BillItem, participantCount: number) {
  if (!item.isShared || participantCount <= 0) return 0;
  return item.totalPrice / participantCount;
}

export function calculateParticipantFinalAmount(
  bill: Bill,
  participantItems: ParticipantItem[],
  participantCountForSharedItems: Record<string, number>,
) {
  const directItemsAmount = participantItems.reduce((sum, participantItem) => {
    const item = bill.items.find((candidate) => candidate.id === participantItem.billItemId);
    if (!item) return sum;
    if (item.isShared) {
      return sum + calculateSharedItemSplit(item, participantCountForSharedItems[item.id] ?? 0);
    }
    return sum + item.unitPrice * participantItem.quantity;
  }, 0);

  if (bill.subtotal <= 0 || directItemsAmount <= 0) return directItemsAmount;

  const share = directItemsAmount / bill.subtotal;
  return directItemsAmount + bill.tip * share + bill.serviceFee * share - bill.discount * share;
}

export function calculateParticipantTotals(bill: Bill) {
  const sharedClaims = bill.items.reduce<Record<string, number>>((acc, item) => {
    if (!item.isShared) return acc;
    acc[item.id] = bill.participants.filter((participant) =>
      participant.items.some((participantItem) => participantItem.billItemId === item.id),
    ).length;
    return acc;
  }, {});

  return bill.participants.map((participant) => ({
    ...participant,
    totalAmount: calculateParticipantFinalAmount(bill, participant.items, sharedClaims),
  }));
}

export function calculateDashboard(bill: Bill): Dashboard {
  const participants = calculateParticipantTotals(bill).map((participant) => ({
    id: participant.id,
    name: participant.name,
    totalAmount: participant.totalAmount,
    status: participant.status,
    paidAt: participant.paidAt,
  }));

  const confirmedTotal = participants
    .filter((participant) => participant.status === "confirmed" || participant.status === "paid")
    .reduce((sum, participant) => sum + participant.totalAmount, 0);
  const paidTotal = participants
    .filter((participant) => participant.status === "paid")
    .reduce((sum, participant) => sum + participant.totalAmount, 0);

  return {
    expectedTotal: bill.total,
    confirmedTotal,
    paidTotal,
    pendingTotal: Math.max(0, confirmedTotal - paidTotal),
    participants,
  };
}

export function calculateFunSummary(bill: Bill): FunSummary {
  const dashboard = calculateDashboard(bill);
  const confirmed = dashboard.participants.filter((participant) => participant.totalAmount > 0);
  const paid = dashboard.participants.filter((participant) => participant.status === "paid");
  const pending = dashboard.participants.filter((participant) => participant.status !== "paid");

  const claimedCounts = bill.items.map((item) => ({
    item,
    count: bill.participants.filter((participant) =>
      participant.items.some((participantItem) => participantItem.billItemId === item.id),
    ).length,
  }));

  return {
    kingOfSpend: confirmed.toSorted((a, b) => b.totalAmount - a.totalAmount)[0],
    mostChill: confirmed.toSorted((a, b) => a.totalAmount - b.totalAmount)[0],
    firstPaid: paid.toSorted((a, b) => (a.paidAt ?? "").localeCompare(b.paidAt ?? ""))[0],
    lastPending: pending.toSorted((a, b) => b.totalAmount - a.totalAmount)[0],
    mostSharedItem: claimedCounts
      .filter(({ item }) => item.isShared)
      .toSorted((a, b) => b.count - a.count)[0]?.item,
    starProduct: bill.items.toSorted((a, b) => b.totalPrice - a.totalPrice)[0],
  };
}

export function generateWhatsAppShareText(bill: Bill, publicUrl: string) {
  return encodeURIComponent(
    `Mesa Cobrada: ${bill.title}\n\nReclama lo que consumiste y ve cuanto debes aca:\n${publicUrl}/bill/${bill.shareId}`,
  );
}
