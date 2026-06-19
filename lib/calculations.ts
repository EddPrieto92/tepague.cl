import type {
  Bill,
  BillItem,
  Dashboard,
  FunSummary,
  ItemClaimSummary,
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
  includeTip?: boolean;
}) {
  return Math.max(0, input.subtotal + (input.includeTip === false ? 0 : input.tip) + input.serviceFee - input.discount);
}

export function calculateSharedItemSplit(item: BillItem, participantCount: number) {
  if ((item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit")) !== "shared_by_claimants" || participantCount <= 0) return 0;
  return item.totalPrice / participantCount;
}

export function effectiveParticipantCount(bill: Bill) {
  const confirmedOrPaying = bill.participants.filter((participant) => participant.status !== "selecting").length;
  return Math.max(1, bill.expectedParticipantCount || 1, confirmedOrPaying);
}

export function calculateBillValidation(bill: Bill) {
  const enteredSubtotal = bill.items
    .filter((item) => (item.splitMode ?? "unit") !== "excluded")
    .reduce((sum, item) => sum + item.totalPrice, 0);
  const enteredTip = bill.tip || 0;
  const enteredTotal = calculateBillTotal({
    subtotal: enteredSubtotal,
    tip: enteredTip,
    serviceFee: bill.serviceFee,
    discount: bill.discount,
    includeTip: bill.includeTipInTotal !== false,
  });
  const receiptTotal = bill.receiptTotal || bill.total || enteredTotal;
  return {
    enteredSubtotal,
    enteredTip,
    enteredTotal,
    missingAmount: receiptTotal - enteredTotal,
  };
}

export function calculateItemClaimSummary(bill: Bill, item: BillItem): ItemClaimSummary {
  const splitMode = item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit");
  const claims = bill.participants.flatMap((participant) =>
    participant.items.filter((participantItem) => participantItem.billItemId === item.id),
  );
  const rawClaimedQuantity = claims.reduce((sum, claim) => sum + claim.quantity, 0);
  let claimedQuantity = rawClaimedQuantity;
  let claimedAmount = Math.min(item.totalPrice, rawClaimedQuantity * item.unitPrice);

  if (splitMode === "excluded") {
    return {
      itemId: item.id,
      name: item.name,
      claimedQuantity: 0,
      remainingQuantity: 0,
      claimedAmount: 0,
      remainingAmount: 0,
      claimStatus: "excluded",
    };
  }

  if (splitMode === "shared_by_claimants") {
    claimedQuantity = claims.length > 0 ? item.quantity : 0;
    claimedAmount = claims.length > 0 ? item.totalPrice : 0;
  }
  if (splitMode === "split_all") {
    claimedQuantity = Math.min(item.quantity, (bill.participants.length / effectiveParticipantCount(bill)) * item.quantity);
    claimedAmount = Math.min(item.totalPrice, (bill.participants.length / effectiveParticipantCount(bill)) * item.totalPrice);
  }
  if (splitMode === "invited_by") {
    claimedQuantity = item.paidByParticipantId ? item.quantity : 0;
    claimedAmount = item.paidByParticipantId ? item.totalPrice : 0;
  }

  const remainingQuantity = Math.max(0, item.quantity - claimedQuantity);
  const remainingAmount = Math.max(0, item.totalPrice - claimedAmount);
  const claimStatus = rawClaimedQuantity > item.quantity
    ? "overclaimed"
    : remainingAmount <= 0
      ? "complete"
      : claimedAmount > 0
        ? "partial"
        : "unclaimed";

  return { itemId: item.id, name: item.name, claimedQuantity, remainingQuantity, claimedAmount, remainingAmount, claimStatus };
}

export function calculateParticipantBreakdown(bill: Bill, participantId: string) {
  const participant = bill.participants.find((candidate) => candidate.id === participantId);
  if (!participant) return { consumption: 0, tip: 0, adjustments: 0, total: 0 };
  const participantCount = effectiveParticipantCount(bill);
  let consumption = 0;

  for (const item of bill.items) {
    const splitMode = item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit");
    const claim = participant.items.find((candidate) => candidate.billItemId === item.id);
    if (splitMode === "unit") consumption += item.unitPrice * (claim?.quantity ?? 0);
    if (splitMode === "shared_by_claimants" && claim) {
      const claimantCount = bill.participants.filter((candidate) => candidate.items.some((candidateItem) => candidateItem.billItemId === item.id)).length;
      consumption += calculateSharedItemSplit(item, claimantCount);
    }
    if (splitMode === "split_all") consumption += item.totalPrice / participantCount;
    if (splitMode === "invited_by" && item.paidByParticipantId === participantId) consumption += item.totalPrice;
  }

  const chargeableSubtotal = bill.items
    .filter((item) => (item.splitMode ?? "unit") !== "excluded")
    .reduce((sum, item) => sum + item.totalPrice, 0);
  const tip = participant.includeTip === false || chargeableSubtotal <= 0 ? 0 : (bill.tip * consumption) / chargeableSubtotal;
  const adjustments = participant.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
  return { consumption, tip, adjustments, total: consumption + tip + adjustments };
}

export function calculateParticipantFinalAmount(
  bill: Bill,
  participantItems: ParticipantItem[],
  participantCountForSharedItems: Record<string, number>,
) {
  const participantId = participantItems[0]?.participantId;
  if (participantId && bill.participants.some((participant) => participant.id === participantId)) {
    return calculateParticipantBreakdown(bill, participantId).total;
  }
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
  return bill.participants.map((participant) => ({
    ...participant,
    totalAmount: calculateParticipantBreakdown(bill, participant.id).total,
  }));
}

export function calculateMesaCobradaServiceFee(participantCount: number) {
  if (participantCount <= 5) return 0;
  if (participantCount <= 10) return 990;
  if (participantCount <= 20) return 1990;
  return 2990;
}

export function calculatePaymentSummary(bill: Bill, participantId: string) {
  const participant = calculateDashboard(bill).participants.find((candidate) => candidate.id === participantId);
  const payerCount = effectiveParticipantCount(bill);
  const serviceFeeTotal = calculateMesaCobradaServiceFee(payerCount);
  const serviceFeePerParticipant = Math.round(serviceFeeTotal / payerCount);
  const breakdown = calculateParticipantBreakdown(bill, participantId);
  const amount = Math.round(breakdown.consumption + breakdown.tip + breakdown.adjustments);

  return {
    participant,
    consumptionAmount: Math.round(breakdown.consumption + breakdown.adjustments),
    tipAmount: Math.round(breakdown.tip),
    amount,
    serviceFeeTotal,
    serviceFeePerParticipant,
    totalAmount: amount + serviceFeePerParticipant,
  };
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
    .filter((participant) => participant.status !== "selecting")
    .reduce((sum, participant) => sum + participant.totalAmount, 0);
  const paidTotal = participants
    .filter((participant) => participant.status === "paid")
    .reduce((sum, participant) => sum + participant.totalAmount, 0);

  const itemClaims = bill.items.map((item) => calculateItemClaimSummary(bill, item));
  const claimedTotal = itemClaims.reduce((sum, item) => sum + item.claimedAmount, 0);
  const missingItems = itemClaims.filter((item) => item.remainingAmount > 0 && item.claimStatus !== "excluded");

  return {
    expectedTotal: bill.total,
    claimedTotal,
    missingClaimAmount: missingItems.reduce((sum, item) => sum + item.remainingAmount, 0),
    confirmedTotal,
    paidTotal,
    pendingTotal: Math.max(0, confirmedTotal - paidTotal),
    participants,
    missingItems,
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
      .filter(({ item }) => (item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit")) === "shared_by_claimants")
      .toSorted((a, b) => b.count - a.count)[0]?.item,
    starProduct: bill.items.toSorted((a, b) => b.totalPrice - a.totalPrice)[0],
  };
}

export function generateWhatsAppShareText(bill: Bill, publicUrl: string) {
  return encodeURIComponent(
    `Mesa Cobrada: ${bill.title}\n\nReclama lo que consumiste y ve cuanto debes aca:\n${publicUrl}/bill/${bill.shareId}`,
  );
}
