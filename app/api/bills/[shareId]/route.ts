import { NextResponse } from "next/server";
import { getPublicBill, PublicBillStoreError, savePublicBill } from "@/lib/public-bill-store";
import type { Bill } from "@/lib/types";

export async function GET(_request: Request, context: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await context.params;
    const bill = await getPublicBill(shareId);
    if (!bill) return NextResponse.json({ error: "bill_not_found" }, { status: 404 });
    return NextResponse.json({ bill });
  } catch (error) {
    if (error instanceof PublicBillStoreError) return NextResponse.json({ error: "public_bill_load_failed" }, { status: 503 });
    return NextResponse.json({ error: "bill_load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ shareId: string }> }) {
  try {
    const { shareId } = await context.params;
    const bill = (await request.json()) as Bill;
    if (!bill?.id || (bill.shareId !== shareId && bill.id !== shareId)) return NextResponse.json({ error: "invalid_bill" }, { status: 400 });
    const saved = await savePublicBill(bill);
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof PublicBillStoreError) return NextResponse.json({ error: "public_bill_save_failed" }, { status: 503 });
    return NextResponse.json({ error: "bill_save_failed" }, { status: 500 });
  }
}
