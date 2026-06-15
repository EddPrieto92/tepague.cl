"use client";

import { Plus, Trash2 } from "lucide-react";
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
      { id: uid(), billId: bill.id, name: "Nuevo producto", quantity: 1, unitPrice: 0, totalPrice: 0, isShared: false },
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

          <div className="flex items-center justify-between rounded-lg bg-paper p-3">
            <label className="flex items-center gap-2 text-sm font-black">
              <input
                checked={item.isShared}
                className="size-5 accent-ink"
                type="checkbox"
                onChange={(event) => updateItem(item.id, { isShared: event.target.checked })}
              />
              Compartido
            </label>
            <span className="text-sm font-black">{formatCLP(item.totalPrice)}</span>
          </div>
        </Card>
      ))}

      <SecondaryButton className="w-full" onClick={addItem} type="button">
        <Plus size={18} /> Agregar producto
      </SecondaryButton>
    </div>
  );
}
