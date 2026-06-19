import { describe, expect, it } from "vitest";
import { calculateDashboard, calculateParticipantBreakdown } from "../lib/calculations";
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

  it("C: splits a shared dish among claimants", () => {
    const products = [item("papas", { totalPrice: 8000, unitPrice: 8000, splitMode: "shared_by_claimants", isShared: true })];
    const people = [1, 2, 3, 4].map((id) => participant(`p${id}`, [{ id: `c${id}`, participantId: `p${id}`, billItemId: "papas", quantity: 1, amount: 8000 }]));
    const bill = billFixture(products, people);
    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(2000);
  });

  it("D: charges an invited product only to the selected payer", () => {
    const products = [item("pizza", { totalPrice: 10000, unitPrice: 10000, splitMode: "invited_by", paidByParticipantId: "p1" })];
    const bill = billFixture(products, [participant("p1"), participant("p2")]);
    expect(calculateParticipantBreakdown(bill, "p1").consumption).toBe(10000);
    expect(calculateParticipantBreakdown(bill, "p2").consumption).toBe(0);
  });
});
