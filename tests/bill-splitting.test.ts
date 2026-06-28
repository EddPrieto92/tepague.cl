import { describe, expect, it } from "vitest";
import { calculateBillValidation, calculateDashboard, calculateParticipantBreakdown } from "../lib/calculations";
import { billFixture, fixtureBuilders } from "./fixtures/bills";

const { item, participant } = fixtureBuilders;

describe("real bill splitting scenarios", () => {
  it("A: closes a simple bill when every unit is claimed", () => {
    const products = [item("pizza", { quantity: 3, unitPrice: 4000, totalPrice: 12000 })];
    const people = [1, 2, 3].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "pizza", quantity: 1, amount: 4000 }]));
    expect(calculateDashboard(billFixture(products, people)).missingClaimAmount).toBe(0);
  });

  it("B: exposes one missing unit without blocking an individual amount", () => {
    const products = [item("sprite", { quantity: 3, unitPrice: 2300, totalPrice: 6900 })];
    const people = [1, 2].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "sprite", quantity: 1, amount: 2300 }]));
    const bill = billFixture(products, people, 3);
    expect(calculateDashboard(bill).missingItems[0]).toMatchObject({ remainingQuantity: 1, remainingAmount: 2300 });
    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(2300);
  });

  it("C: splits a shared dish by the organizer-defined count", () => {
    const products = [item("papas", { totalPrice: 9000, unitPrice: 9000, splitMode: "shared_by_claimants", isShared: true, sharedCount: 3, sharedPrice: 3000 })];
    const people = [1, 2, 3].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "papas", quantity: 1, amount: 3000 }]));
    const bill = billFixture(products, people);
    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(3000);
  });

  it("C2: keeps a fixed shared amount and exposes missing claimants", () => {
    const products = [item("pizza", { totalPrice: 15000, unitPrice: 15000, splitMode: "shared_by_claimants", isShared: true, sharedCount: 3, sharedPrice: 5000 })];
    const people = [1, 2].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "pizza", quantity: 1, amount: 5000 }]));
    const bill = billFixture(products, people, 3);
    const dashboard = calculateDashboard(bill);

    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(5000);
    expect(dashboard.missingItems[0]).toMatchObject({ remainingQuantity: 1, remainingAmount: 5000 });
    expect(dashboard.claimedTotal).toBe(10000);
  });

  it("C3: closes a fixed shared item when all shares are claimed", () => {
    const products = [item("pizza", { totalPrice: 15000, unitPrice: 15000, splitMode: "shared_by_claimants", isShared: true, sharedCount: 3, sharedPrice: 5000 })];
    const people = [1, 2, 3].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "pizza", quantity: 1, amount: 5000 }]));
    const bill = billFixture(products, people, 3);

    expect(calculateDashboard(bill).missingClaimAmount).toBe(0);
    expect(people.reduce((sum, person) => sum + calculateParticipantBreakdown(bill, person.id).consumption, 0)).toBe(15000);
  });

  it("D: charges an invited product only to the selected payer", () => {
    const products = [item("pizza", { totalPrice: 10000, unitPrice: 10000, splitMode: "invited_by", paidByParticipantId: "p1" })];
    const bill = billFixture(products, [participant("p1"), participant("p2")]);
    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(10000);
    expect(calculateParticipantBreakdown(bill, "p2").consumption).toBe(0);
  });

  it("E: validates products against receipt subtotal even when tip is included in final total", () => {
    const products = [item("elkika", { quantity: 1, unitPrice: 78000, totalPrice: 78000 })];
    const bill = {
      ...billFixture(products, [participant("p1")]),
      receiptSubtotal: 78000,
      receiptTip: 7800,
      receiptTotal: 85800,
      tip: 7800,
      total: 85800,
      includeTipInTotal: true,
    };

    expect(calculateBillValidation(bill)).toMatchObject({
      enteredSubtotal: 78000,
      enteredTip: 7800,
      enteredTotal: 85800,
      missingAmount: 0,
    });
  });

  it("F: treats organizer own consumption as already claimed and paid", () => {
    const organizer = participant("organizer_bill_fixture", [
      { id: "own_claim", participantId: "organizer_bill_fixture", billItemId: "crudo", quantity: 1, amount: 10400 },
    ]);
    const products = [
      item("crudo", { quantity: 1, unitPrice: 10400, totalPrice: 10400, splitMode: "invited_by", paidByParticipantId: organizer.id }),
      item("bebida", { quantity: 1, unitPrice: 2500, totalPrice: 2500 }),
    ];
    const bill = {
      ...billFixture(products, [{ ...organizer, status: "paid" }]),
      tip: 1290,
      total: 14190,
    };
    const dashboard = calculateDashboard(bill);

    expect(dashboard.claimedTotal).toBe(10400);
    expect(dashboard.missingClaimAmount).toBe(2500);
    expect(dashboard.paidTotal).toBeGreaterThan(10400);
  });
});
