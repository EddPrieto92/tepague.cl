import { NextResponse } from "next/server";
import { syncBillSnapshot } from "@/lib/server-payment-store";
import type { Bill } from "@/lib/types";

export async function POST(request: Request) {
  const bill = (await request.json()) as Bill;
  if (!bill?.id || !bill?.shareId) {
    return NextResponse.json({ error: "bill_required" }, { status: 400 });
  }

  syncBillSnapshot(bill);
  return NextResponse.json({ ok: true });
}
