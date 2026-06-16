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
