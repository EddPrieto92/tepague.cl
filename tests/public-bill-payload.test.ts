import { describe, expect, it } from "vitest";
import { demoBill } from "../lib/mock-data";
import { publicBillPayload } from "../lib/public-bill-payload";

describe("publicBillPayload", () => {
  it("does not send a local receipt data URL to the public API", () => {
    const bill = { ...demoBill, imageUrl: `data:image/jpeg;base64,${"a".repeat(450_000)}` };
    const payload = publicBillPayload(bill);

    expect(payload.imageUrl).toBeUndefined();
    expect(JSON.stringify(payload).length).toBeLessThan(50_000);
    expect(bill.imageUrl).toContain("data:image/jpeg");
  });

  it("keeps a durable remote receipt URL", () => {
    const bill = { ...demoBill, imageUrl: "https://cdn.example.com/receipt.jpg" };

    expect(publicBillPayload(bill).imageUrl).toBe(bill.imageUrl);
  });
});
