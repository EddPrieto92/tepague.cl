"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { Bill, BillItem } from "@/lib/types";
import { formatCLP } from "@/lib/calculations";
import { Card, Input, Label, SecondaryButton } from "./ui";

type Props = {
  bill: Bill;
  onChange: (items: BillItem[]) => void;
};

function uid() {
  return `item_${Math.random().toString(36).slice(2, 9)}`;
}

function sharedPrice(totalPrice: number, sharedCount: number) {
  return totalPrice / Math.max(2, sharedCount);
}

export function BillItemEditor({ bill, onChange }: Props) {
  function updateItem(itemId: string, patch: Partial<BillItem>) {
    onChange(
      bill.items.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, ...patch };
        const totalPrice = next.quantity * next.unitPrice;
        const isShared = next.splitMode === "shared_by_claimants";
        const nextSharedCount = isShared ? Math.max(2, next.sharedCount ?? 2) : undefined;
        return {
          ...next,
          totalPrice,
          isShared,
          splitMode: isShared ? "shared_by_claimants" : "unit",
          paidByParticipantId: undefined,
          sharedCount: nextSharedCount,
          sharedPrice: nextSharedCount ? sharedPrice(totalPrice, nextSharedCount) : undefined,
        };
      }),
    );
  }

  function setMode(item: BillItem, isShared: boolean) {
    updateItem(item.id, {
      splitMode: isShared ? "shared_by_claimants" : "unit",
      isShared,
      sharedCount: isShared ? item.sharedCount ?? 2 : undefined,
      sharedPrice: isShared ? sharedPrice(item.totalPrice, item.sharedCount ?? 2) : undefined,
      paidByParticipantId: undefined,
    });
  }

  function updateSharedCount(item: BillItem, nextCount: number) {
    const sharedCount = Math.max(2, Math.min(99, Math.floor(nextCount || 2)));
    updateItem(item.id, { sharedCount, sharedPrice: sharedPrice(item.totalPrice, sharedCount) });
  }

  function addItem() {
    onChange([
      ...bill.items,
      { id: uid(), billId: bill.id, name: "Nuevo producto", quantity: 1, unitPrice: 0, totalPrice: 0, isShared: false, splitMode: "unit" },
    ]);
  }

  return (
    <div className="space-y-3">
      {bill.items.map((item) => {
        const isShared = (item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit")) === "shared_by_claimants";
        const parts = item.sharedCount ?? 2;

        return (
          <Card key={item.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Label>Producto</Label>
                <Input value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} />
              </div>
              <button
                className="mt-7 grid size-11 place-items-center rounded-lg border-2 border-ink bg-white"
                onClick={() => onChange(bill.items.filter((candidate) => candidate.id !== item.id))}
                type="button"
                aria-label="Eliminar producto"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad</Label>
                <Input
                  min={1}
                  type="number"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Precio unitario</Label>
                <Input
                  min={0}
                  type="number"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="rounded-lg bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase text-ink/60">Tipo</span>
                <span className="text-sm font-black">{formatCLP(item.totalPrice)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  className={`min-h-11 rounded-lg border-2 border-ink px-3 text-sm font-black ${isShared ? "bg-white" : "bg-limewash"}`}
                  onClick={() => setMode(item, false)}
                  type="button"
                  aria-pressed={!isShared}
                >
                  Individual
                </button>
                <button
                  className={`min-h-11 rounded-lg border-2 border-ink px-3 text-sm font-black ${isShared ? "bg-limewash" : "bg-white"}`}
                  onClick={() => setMode(item, true)}
                  type="button"
                  aria-pressed={isShared}
                >
                  Compartido
                </button>
              </div>

              {isShared ? (
                <div className="mt-3 rounded-lg border-2 border-ink/10 bg-white p-3">
                  <Label>Cantidad de partes</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      aria-label="Restar parte"
                      className="grid size-11 place-items-center rounded-lg border-2 border-ink bg-white disabled:opacity-40"
                      disabled={parts <= 2}
                      onClick={() => updateSharedCount(item, parts - 1)}
                      type="button"
                    >
                      <Minus size={18} />
                    </button>
                    <Input
                      className="text-center font-black"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="text"
                      value={parts}
                      onChange={(event) => updateSharedCount(item, Number(event.target.value.replace(/[^\d]/g, "")) || 2)}
                    />
                    <button
                      aria-label="Sumar parte"
                      className="grid size-11 place-items-center rounded-lg border-2 border-ink bg-white"
                      onClick={() => updateSharedCount(item, parts + 1)}
                      type="button"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="mt-2 rounded-lg bg-limewash p-2 text-sm font-black">
                    Cada parte pagara {formatCLP(sharedPrice(item.totalPrice, parts))}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        );
      })}

      <SecondaryButton className="w-full" onClick={addItem} type="button">
        <Plus size={18} /> Agregar producto
      </SecondaryButton>
    </div>
  );
}
