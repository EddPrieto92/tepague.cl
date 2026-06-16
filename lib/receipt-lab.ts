import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseReceiptText } from "./receipt-parser";

type ExpectedItem = {
  name: string;
  quantity: number;
  totalPrice: number;
};

type ReceiptFixture = {
  id: string;
  description: string;
  source: string;
  rawText: string;
  expected: {
    items: ExpectedItem[];
    subtotal: number;
    tip: number;
    total: number;
  };
};

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

export function getReceiptLabData() {
  const fixturesDir = join(process.cwd(), "tests/fixtures/receipts");
  const fixtures = readdirSync(fixturesDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .toSorted()
    .map((fileName) => JSON.parse(readFileSync(join(fixturesDir, fileName), "utf8")) as ReceiptFixture);

  const cases = fixtures.map((fixture) => {
    const parsed = parseReceiptText(fixture.rawText);
    const itemMatches = fixture.expected.items.map((expectedItem) => {
      const actual = findMatchingItem(parsed.items, expectedItem);
      return {
        expected: expectedItem,
        actual: actual
          ? {
              name: actual.name,
              quantity: actual.quantity,
              totalPrice: actual.totalPrice,
            }
          : null,
        ok: Boolean(actual && actual.quantity === expectedItem.quantity && actual.totalPrice === expectedItem.totalPrice),
      };
    });
    const detectedItems = parsed.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));
    const matchedItemCount = itemMatches.filter((item) => item.ok).length;
    const totalChecks = [
      parsed.subtotal === fixture.expected.subtotal,
      parsed.tip === fixture.expected.tip,
      parsed.total === fixture.expected.total,
    ];
    const matchedTotalCount = totalChecks.filter(Boolean).length;

    return {
      id: fixture.id,
      description: fixture.description,
      source: fixture.source,
      itemScore: matchedItemCount / fixture.expected.items.length,
      totalScore: matchedTotalCount / totalChecks.length,
      passed: matchedItemCount === fixture.expected.items.length && matchedTotalCount === totalChecks.length,
      expected: fixture.expected,
      parsed: {
        items: detectedItems,
        subtotal: parsed.subtotal,
        tip: parsed.tip,
        total: parsed.total,
      },
      itemMatches,
    };
  });

  const totals = cases.reduce(
    (acc, receiptCase) => {
      acc.receipts += 1;
      acc.expectedItems += receiptCase.expected.items.length;
      acc.detectedItems += receiptCase.parsed.items.length;
      acc.matchedItems += receiptCase.itemMatches.filter((item) => item.ok).length;
      acc.subtotalOk += receiptCase.parsed.subtotal === receiptCase.expected.subtotal ? 1 : 0;
      acc.tipOk += receiptCase.parsed.tip === receiptCase.expected.tip ? 1 : 0;
      acc.totalOk += receiptCase.parsed.total === receiptCase.expected.total ? 1 : 0;
      acc.expectedAmount += receiptCase.expected.total;
      acc.parsedAmount += receiptCase.parsed.total;
      return acc;
    },
    {
      receipts: 0,
      expectedItems: 0,
      detectedItems: 0,
      matchedItems: 0,
      subtotalOk: 0,
      tipOk: 0,
      totalOk: 0,
      expectedAmount: 0,
      parsedAmount: 0,
    },
  );

  return { cases, totals };
}
