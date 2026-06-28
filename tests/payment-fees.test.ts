import { describe, expect, it } from "vitest";
import { calculateMesaCobradaServiceFee, calculatePaymentSummary } from "../lib/calculations";
import { billFixture, fixtureBuilders } from "./fixtures/bills";

describe("calculateMesaCobradaServiceFee", () => {
  it("does not charge for one to five participants", () => {
    expect(calculateMesaCobradaServiceFee(1)).toBe(0);
    expect(calculateMesaCobradaServiceFee(5)).toBe(0);
  });

  it("uses expected people before every participant has joined", () => {
    const product = fixtureBuilders.item("cover", { totalPrice: 8000, unitPrice: 1000, quantity: 8, splitMode: "split_all" });
    const person = fixtureBuilders.participant("p1");
    const summary = calculatePaymentSummary(billFixture([product], [person], 8), "p1");
    expect(summary.serviceFeeTotal).toBe(0);
    expect(summary.serviceFeePerParticipant).toBe(0);
  });

  it("does not charge tiered MVP fees in this iteration", () => {
    expect(calculateMesaCobradaServiceFee(6)).toBe(0);
    expect(calculateMesaCobradaServiceFee(10)).toBe(0);
    expect(calculateMesaCobradaServiceFee(11)).toBe(0);
    expect(calculateMesaCobradaServiceFee(20)).toBe(0);
    expect(calculateMesaCobradaServiceFee(21)).toBe(0);
  });
});
