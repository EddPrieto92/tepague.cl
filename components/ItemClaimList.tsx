"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Bill, ParticipantItem } from "@/lib/types";
import { calculateParticipantFinalAmount, formatCLP } from "@/lib/calculations";
import { makeParticipantItem, updateParticipantItems, updateParticipantTipPreference } from "@/lib/storage";
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
  const participant = currentBill.participants.find((candidate) => candidate.id === participantId);
  const items = participant?.items ?? [];

  const sharedCounts = useMemo(
    () =>
      currentBill.items.reduce<Record<string, number>>((acc, item) => {
        if (!item.isShared) return acc;
        acc[item.id] = currentBill.participants.filter((candidate) =>
          candidate.items.some((participantItem) => participantItem.billItemId === item.id),
        ).length;
        return acc;
      }, {}),
    [currentBill],
  );

  const total = calculateParticipantFinalAmount(
    { ...currentBill, tip: participant?.includeTip === false ? 0 : currentBill.tip },
    items,
    sharedCounts,
  );

  function setItem(itemId: string, quantity: number) {
    const item = currentBill.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    const next = items.filter((candidate) => candidate.billItemId !== itemId);
    if (quantity > 0) {
      next.push(makeParticipantItem(participantId, itemId, item.isShared ? 1 : quantity, item.unitPrice * quantity));
    }
    setCurrentBill(updateParticipantItems(currentBill, participantId, next));
  }

  function claimedQuantity(itemId: string) {
    return items.find((item) => item.billItemId === itemId)?.quantity ?? 0;
  }

  function remainingStock(itemId: string, quantity: number) {
    const claimedByOthers = currentBill.participants
      .flatMap((candidate) => (candidate.id === participantId ? [] : candidate.items))
      .filter((item) => item.billItemId === itemId)
      .reduce((sum, item) => sum + item.quantity, 0);
    return Math.max(0, quantity - claimedByOthers);
  }

  function confirm() {
    const nextBill = updateParticipantItems(currentBill, participantId, items as ParticipantItem[], true);
    router.push(`/bill/${nextBill.shareId}/pay/${participantId}`);
  }

  if (!participant) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-ink text-paper">
        <p className="text-sm font-bold text-paper/70">Hola, {participant.name}</p>
        <div className="mt-2 flex items-end justify-between">
          <h1 className="text-3xl font-black">Tu parte</h1>
          <span className="text-2xl font-black">{formatCLP(total)}</span>
        </div>
      </Card>

      {currentBill.items.map((item) => {
        const value = claimedQuantity(item.id);
        const max = remainingStock(item.id, item.quantity) + value;
        return (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">{item.name}</h2>
                <p className="text-sm font-bold text-ink/60">{formatCLP(item.unitPrice)} c/u</p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs font-black">stock {max}</span>
            </div>
            <div className="mt-3">
              {item.isShared ? (
                <SharedItemToggle checked={value > 0} onChange={(checked) => setItem(item.id, checked ? 1 : 0)} />
              ) : (
                <QuantitySelector value={value} max={max} onChange={(next) => setItem(item.id, next)} />
              )}
            </div>
          </Card>
        );
      })}

      <Card className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-black">
          <input
            checked={participant.includeTip !== false}
            className="size-5 accent-ink"
            type="checkbox"
            onChange={(event) => setCurrentBill(updateParticipantTipPreference(currentBill, participantId, event.target.checked))}
          />
          Incluir propina
        </label>
        <span className="text-sm font-black">{formatCLP(currentBill.tip)}</span>
      </Card>

      <div className="grid gap-3">
        <Button disabled={items.length === 0} onClick={confirm} type="button">
          Confirmar seleccion
        </Button>
        <SecondaryButton onClick={() => router.push(`/bill/${bill.shareId}`)} type="button">
          Volver
        </SecondaryButton>
      </div>
    </div>
  );
}
