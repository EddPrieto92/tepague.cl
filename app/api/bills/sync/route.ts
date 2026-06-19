import { NextResponse } from "next/server";
import { syncBillSnapshot } from "@/lib/server-payment-store";
import { getPublicBill, PublicBillStoreError, savePublicBill } from "@/lib/public-bill-store";
import type { Bill } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const bill = (await request.json()) as Bill;
    if (!bill?.id || !bill?.shareId) return NextResponse.json({ error: "bill_required" }, { status: 400 });
    const participantId = request.headers.get("x-participant-id");
    let nextBill = bill;
    if (participantId) {
      const current = await getPublicBill(bill.id);
      const participant = bill.participants.find((candidate) => candidate.id === participantId);
      if (!participant) return NextResponse.json({ error: "participant_required" }, { status: 400 });
      if (current) {
        const exists = current.participants.some((candidate) => candidate.id === participantId);
        nextBill = {
          ...current,
          items: current.items.map((currentItem) => {
            const incomingItem = bill.items.find((candidate) => candidate.id === currentItem.id);
            if (!incomingItem) return currentItem;
            const participantControlsInvitation = incomingItem.paidByParticipantId === participantId || currentItem.paidByParticipantId === participantId;
            return participantControlsInvitation ? { ...currentItem, paidByParticipantId: incomingItem.paidByParticipantId } : currentItem;
          }),
          participants: exists
            ? current.participants.map((candidate) => candidate.id === participantId ? participant : candidate)
            : [...current.participants, participant],
          updatedAt: new Date().toISOString(),
        };
      }
    }
    syncBillSnapshot(nextBill);
    const requirePublicStorage = request.headers.get("x-require-public-storage") === "true" || Boolean(participantId);
    const saved = await savePublicBill(nextBill, { requirePublicStorage });
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof PublicBillStoreError) {
      return NextResponse.json({
        error: error.reason === "schema_missing" ? "public_storage_unavailable" : "public_bill_save_failed",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "bill_save_failed" }, { status: 500 });
  }
}
