"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Bill, BillItem, SplitMode } from "@/lib/types";
import { formatCLP } from "@/lib/calculations";
import { Card, Input, Label, SecondaryButton } from "./ui";

type Props = {
  bill: Bill;
  onChange: (items: BillItem[]) => void;
};

function uid() {
  return `item_${Math.random().toString(36).slice(2, 9)}`;
}

export function BillItemEditor({ bill, onChange }: Props) {
  function updateItem(itemId: string, patch: Partial<BillItem>) {
    onChange(
      bill.items.map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, ...patch };
        return { ...next, totalPrice: next.quantity * next.unitPrice };
      }),
    );
  }

  function addItem() {
    onChange([
      ...bill.items,
      { id: uid(), billId: bill.id, name: "Nuevo producto", quantity: 1, unitPrice: 0, totalPrice: 0, isShared: false, splitMode: "unit" },
    ]);
  }

  return (
    <div className="space-y-3">
      {bill.items.map((item) => (
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
              <span className="text-xs font-black uppercase text-ink/60">Modo de reparto</span>
              <span className="text-sm font-black">{formatCLP(item.totalPrice)}</span>
            </div>
            <select
              className="mt-2 min-h-11 w-full rounded-lg border-2 border-ink bg-white px-3 text-sm font-bold"
              value={item.splitMode ?? (item.isShared ? "shared_by_claimants" : "unit")}
              onChange={(event) => {
                const splitMode = event.target.value as SplitMode;
                updateItem(item.id, { splitMode, isShared: splitMode === "shared_by_claimants", paidByParticipantId: splitMode === "invited_by" ? item.paidByParticipantId : undefined });
              }}
            >
              <option value="unit">Por unidad</option>
              <option value="shared_by_claimants">Compartido entre quienes lo marcan</option>
              <option value="split_all">Dividir entre todos</option>
              <option value="invited_by">Lo paga otra persona</option>
              <option value="excluded">Excluir del cobro</option>
            </select>
            {(item.splitMode ?? "unit") === "invited_by" ? (
              <select
                className="mt-2 min-h-11 w-full rounded-lg border-2 border-ink bg-white px-3 text-sm font-bold"
                value={item.paidByParticipantId ?? ""}
                onChange={(event) => updateItem(item.id, { paidByParticipantId: event.target.value || undefined })}
              >
                <option value="">Elegir quién invita</option>
                {bill.participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
              </select>
            ) : null}
          </div>
        </Card>
      ))}

      <SecondaryButton className="w-full" onClick={addItem} type="button">
        <Plus size={18} /> Agregar producto
      </SecondaryButton>
    </div>
  );
}
