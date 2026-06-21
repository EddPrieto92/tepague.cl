import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReceiptText } from "../lib/receipt-parser";

type ExpectedItem = {
  name: string;
  quantity: number;
  totalPrice: number;
};

type ReceiptFixture = {
  id: string;
  description: string;
  rawText: string;
  expected: {
    items: ExpectedItem[];
    subtotal: number;
    tip: number;
    total: number;
  };
};

const fixturesDir = join(process.cwd(), "tests/fixtures/receipts");
const fixtures = readdirSync(fixturesDir)
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) => JSON.parse(readFileSync(join(fixturesDir, fileName), "utf8")) as ReceiptFixture);

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function findMatchingItem(items: ReturnType<typeof parseReceiptText>["items"], expected: ExpectedItem) {
  const expectedName = normalizeName(expected.name);
  return items.find((item) => {
    const itemName = normalizeName(item.name);
    return itemName.includes(expectedName) || expectedName.includes(itemName);
  });
}

function scoreFixture(fixture: ReceiptFixture) {
  const parsed = parseReceiptText(fixture.rawText);
  const itemMatches = fixture.expected.items.map((expectedItem) => {
    const actual = findMatchingItem(parsed.items, expectedItem);
    return {
      expected: expectedItem,
      actual,
      matchedName: Boolean(actual),
      matchedQuantity: actual?.quantity === expectedItem.quantity,
      matchedTotal: actual?.totalPrice === expectedItem.totalPrice,
    };
  });

  const passedItems = itemMatches.filter((match) => match.matchedName && match.matchedQuantity && match.matchedTotal).length;

  return {
    parsed,
    itemMatches,
    itemScore: passedItems / fixture.expected.items.length,
    totals: {
      subtotal: parsed.subtotal === fixture.expected.subtotal,
      tip: parsed.tip === fixture.expected.tip,
      total: parsed.total === fixture.expected.total,
    },
  };
}

describe("receipt parser fixtures", () => {
  for (const fixture of fixtures) {
    it(`${fixture.id}: ${fixture.description}`, () => {
      const score = scoreFixture(fixture);

      expect(score.itemScore, JSON.stringify(score.itemMatches, null, 2)).toBe(1);
      expect(score.totals.subtotal, `subtotal parsed as ${score.parsed.subtotal}`).toBe(true);
      expect(score.totals.tip, `tip parsed as ${score.parsed.tip}`).toBe(true);
      expect(score.totals.total, `total parsed as ${score.parsed.total}`).toBe(true);
    });
  }
});

describe("receipt parser total lines", () => {
  it("does not read total c/propina as the tip amount", () => {
    const parsed = parseReceiptText(`Social Beerlab
1 Corona Zero $3.990
1 Michelada tomate tajin $1.790
Total General Mesa $103.300
Consumo Cliente $103.300
Propina Sugerida $10.330
Total c/propina $113.630`);

    expect(parsed.subtotal).toBe(103300);
    expect(parsed.tip).toBe(10330);
    expect(parsed.total).toBe(113630);
  });

  it("recovers fuzzy red-light receipt totals and obvious repeated-item outliers", () => {
    const parsed = parseReceiptText(`1 Michelada tomate tajin $1.790
1 Good Veggie $8.4999
1 Michelada tomate tajil 31.790
ctal General Mesa $103, 306
Consumn Cliente $103. 300
otal /propina $113.630`);

    const micheladas = parsed.items.filter((item) => item.name.toLowerCase().includes("michelada"));
    expect(parsed.subtotal).toBe(103300);
    expect(parsed.tip).toBe(10330);
    expect(parsed.total).toBe(113630);
    expect(micheladas.every((item) => item.unitPrice === 1790)).toBe(true);
  });

  it("keeps right-edge red-light product prices before filtering rows", () => {
    const parsed = parseReceiptText(
      `Michelada tajin          471,396
Chelaga                  19960
Raw n exy tartar         $1.990
1 SUN CLUB                $8 .490
1 Light Blood             $6 990
1 Corona Zerc             93,990
1 schop Loa Entre fNubes  95.499
Total General Mesa        $40.330
Propina Sugerida          $4.033
Total c/propina           $44.363`,
      { preserveLineItems: true },
    );

    expect(parsed.items.map((item) => item.unitPrice)).toEqual([1390, 990, 12990, 8490, 6990, 3990, 5490]);
    expect(parsed.subtotal).toBe(40330);
    expect(parsed.tip).toBe(4033);
    expect(parsed.total).toBe(44363);
  });
});
