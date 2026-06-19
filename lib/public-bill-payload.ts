import type { Bill } from "./types";

export function publicBillPayload(bill: Bill): Bill {
  const imageUrl = bill.imageUrl?.trim();
  if (!imageUrl || imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    const publicBill = { ...bill };
    delete publicBill.imageUrl;
    return publicBill;
  }
  return bill;
}
