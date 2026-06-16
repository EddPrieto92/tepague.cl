import { describe, expect, it } from "vitest";
import { calculateMesaCobradaServiceFee } from "../lib/calculations";

describe("calculateMesaCobradaServiceFee", () => {
  it("does not charge for one to five participants", () => {
    expect(calculateMesaCobradaServiceFee(1)).toBe(0);
    expect(calculateMesaCobradaServiceFee(5)).toBe(0);
  });

  it("charges tiered MVP fees", () => {
    expect(calculateMesaCobradaServiceFee(6)).toBe(990);
    expect(calculateMesaCobradaServiceFee(10)).toBe(990);
    expect(calculateMesaCobradaServiceFee(11)).toBe(1990);
    expect(calculateMesaCobradaServiceFee(20)).toBe(1990);
    expect(calculateMesaCobradaServiceFee(21)).toBe(2990);
  });
});
