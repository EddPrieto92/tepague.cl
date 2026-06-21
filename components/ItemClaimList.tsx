"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Bill, ParticipantItem } from "@/lib/types";
import { calculateItemClaimSummary, calculateParticipantBreakdown, formatCLP } from "@/lib/calculations";
import { getOrganizerParticipantId, makeParticipantItem, updateParticipantItems } from "@/lib/storage";
import { persistPublicBill } from "@/lib/public-bills";
import { trackEvent } from "@/lib/analytics";
import { Button, Card, SecondaryButton } from "./ui";
import { QuantitySelector } from "./QuantitySelector";
import { SharedItemToggle } from "./SharedItemToggle";

type Props = {
  bill: Bill;
  participantId: string;
};

export function ItemClaimList({ bill, participantId }: Props) {
  const router = useRouter();
  const [currentBill, setCurrentBill] = useState(bill);
  const currentBillRef = useRef(currentBill);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const participant = currentBill.participants.find((candidate) => candidate.id === participantId);
  const items = participant?.items ?? [];
  const organizerParticipantId = getOrganizerParticipantId(currentBill);
  const [error, setError] = useState("");

  const breakdown = calculateParticipantBreakdown(currentBill, participantId);
  const total = breakdown.total;
  const consumptionTotal = Math.round(breakdown.consumption + breakdown.adjustments);
  const tipTotal = Math.round(breakdown.tip);
  const claimableItems = currentBill.items.filter((item) => (item.splitMode ?? "unit") !== "excluded" && item.paidByParticipantId !== organizerParticipantId);

  useEffect(() => {
    currentBillRef.current = currentBill;
  }, [currentBill]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  function queueSave(nextBill: Bill, fallbackMessage: string) {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = undefined;
      void persistPublicBill(nextBill, participantId).catch((saveError) =>
        setError(saveError instanceof Error ? saveError.message : fallbackMessage),
      );
    }, 800);
  }

  function setItem(itemId: string, quantity: number) {
    const workingBill = currentBillRef.current;
    const participantItems = workingBill.participants.find((candidate) => candidate.id === participantId)?.items ?? [];
    const item = workingBill.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const claimedByOthers = workingBill.participants
      .flatMap((candidate) => (candidate.id === participantId ? [] : candidate.items))
      .filter((claim) => claim.billItemId === itemId)
      .reduce((sum, claim) => sum + claim.quantity, 0);
    const maxForParticipant = Math.max(0, item.quantity - claimedByOthers);
    const safeQuantity = Math.min(maxForParticipant, Math.max(0, Math.floor(quantity)));
    const next = participantItems.filter((candidate) => candidate.billItemId !== itemId);
    if (safeQuantity > 0) {
      const claimQuantity = item.isShared ? 1 : safeQuantity;
      next.push(makeParticipantItem(participantId, itemId, claimQuantity, item.unitPrice * claimQuantity));
    }
    const nextBill = updateParticipantItems(workingBill, participantId, next);
    currentBillRef.current = nextBill;
    setCurrentBill(nextBill);
    trackEvent("participant_claimed_item", { bill_item_id: itemId, quantity: safeQuantity });
    queueSave(nextBill, "No pudimos guardar tu selección.");
  }

  function claimedQuantity(itemId: string) {
    return items.find((item) => item.billItemId === itemId)?.quantity ?? 0;
  }

  function setInvitedPayer(itemId: string, enabled: boolean) {
    const workingBill = currentBillRef.current;
    const nextBill = {
      ...workingBill,
      items: workingBill.items.map((item) => item.id === itemId ? { ...item, paidByParticipantId: enabled ? participantId : undefined } : item),
    };
    currentBillRef.current = nextBill;
    setCurrentBill(nextBill);
    queueSave(nextBill, "No pudimos guardar quién invita.");
  }

  function remainingStock(itemId: string, quantity: number) {
    const claimedByOthers = currentBill.participants
      .flatMap((candidate) => (candidate.id === participantId ? [] : candidate.items))
      .filter((item) => item.billItemId === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, quantity - claimedByOthers);
  }

  async function confirm() {
    setError("");
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = undefined;
    }
    const latestBill = currentBillRef.current;
    const latestItems = latestBill.participants.find((candidate) => candidate.id === participantId)?.items ?? [];
    const nextBill = updateParticipantItems(latestBill, participantId, latestItems as ParticipantItem[], true);
    try {
      await persistPublicBill(nextBill, participantId);
      trackEvent("participant_confirmed", { amount: Math.round(total) });
      router.push(`/bill/${nextBill.shareId}/pay/${participantId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos confirmar tu selección.");
    }
  }

  if (!participant) return null;

  return (
    <div className="flex min-h-[calc(100svh-6rem)] flex-col">
      <div className="sticky top-[4.25rem] z-30 -mx-1 bg-paper/95 px-1 pb-3 pt-1 backdrop-blur">
        <Card>
          <p className="text-sm font-bold text-ink/60">Hola, {participant.name}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <h1 className="text-3xl font-black">Tu parte</h1>
            <span className="text-2xl font-black">{formatCLP(total)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-paper p-3">
              <p className="font-bold text-ink/55">Consumo</p>
              <p className="mt-1 font-black">{formatCLP(consumptionTotal)}</p>
            </div>
            <div className="rounded-lg bg-paper p-3">
              <p className="font-bold text-ink/55">Propina</p>
              <p className="mt-1 font-black">{formatCLP(tipTotal)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-40">
        {claimableItems.map((item) => {
          const value = claimedQuantity(item.id);
          const max = Math.max(0, remainingStock(item.id, item.quantity) + value);
          const splitMode = item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit");
          const availability = calculateItemClaimSummary(currentBill, item);
          return (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{item.name}</h2>
                  <p className="text-sm font-bold text-ink/60">{formatCLP(item.unitPrice)} c/u</p>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-xs font-black">Disponible: {Math.max(0, Math.round(availability.remainingQuantity + value))}</span>
              </div>
              <p className="mt-2 text-xs font-bold text-ink/55">Ya reclamaste: {value}</p>
              <div className="mt-3">
                {splitMode === "shared_by_claimants" ? (
                  <SharedItemToggle checked={value > 0} onChange={(checked) => setItem(item.id, checked ? 1 : 0)} />
                ) : splitMode === "split_all" ? (
                  <p className="rounded-lg bg-limewash p-3 text-sm font-black">Se divide automáticamente entre todos.</p>
                ) : splitMode === "invited_by" ? (
                  item.paidByParticipantId && item.paidByParticipantId !== participantId
                    ? <p className="rounded-lg bg-paper p-3 text-sm font-black">Este producto lo paga otra persona.</p>
                    : <SharedItemToggle checked={item.paidByParticipantId === participantId} onChange={(checked) => setInvitedPayer(item.id, checked)} label="Yo invito este producto" />
                ) : (
                  <QuantitySelector value={value} max={max} onChange={(next) => setItem(item.id, next)} />
                )}
              </div>
            </Card>
          );
        })}

        {items.length === 0 && total <= 0 ? <p className="rounded-lg bg-paper p-3 text-sm font-bold">Aún no has seleccionado productos. Selecciona lo que consumiste para calcular tu deuda.</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md gap-3">
          {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}
          <Button disabled={items.length === 0 && total <= 0} onClick={confirm} type="button">
            Confirmar seleccion
          </Button>
          <SecondaryButton onClick={() => router.push(`/bill/${bill.shareId}`)} type="button">
            Volver
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
