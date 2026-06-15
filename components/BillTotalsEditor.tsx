"use client";

import type { Bill } from "@/lib/types";
import { calculateBillTotal, formatCLP } from "@/lib/calculations";
import { Card, Input, Label } from "./ui";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

export function BillTotalsEditor({ bill, onChange }: Props) {
  const itemsSubtotal = bill.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const includeTipInTotal = bill.includeTipInTotal !== false;
  const calculatedTotal = calculateBillTotal({
    subtotal: bill.subtotal,
    tip: bill.tip,
    serviceFee: bill.serviceFee,
    discount: bill.discount,
    includeTip: includeTipInTotal,
  });
  const subtotalDelta = bill.subtotal - itemsSubtotal;
  const totalsDelta = bill.total - calculatedTotal;

  function update(patch: Partial<Bill>) {
    const nextBill = { ...bill, ...patch };
    const nextIncludeTip = nextBill.includeTipInTotal !== false;
    onChange({
      ...nextBill,
      total: calculateBillTotal({
        subtotal: nextBill.subtotal,
        tip: nextBill.tip,
        serviceFee: nextBill.serviceFee,
        discount: nextBill.discount,
        includeTip: nextIncludeTip,
      }),
    });
  }

  return (
    <Card className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Subtotal</Label>
          <Input type="number" value={bill.subtotal} onChange={(event) => update({ subtotal: Number(event.target.value) || 0 })} />
        </div>
        <div>
          <Label>Propina</Label>
          <Input type="number" value={bill.tip} onChange={(event) => update({ tip: Number(event.target.value) || 0 })} />
        </div>
        <div>
          <Label>Descuento</Label>
          <Input type="number" value={bill.discount} onChange={(event) => update({ discount: Number(event.target.value) || 0 })} />
        </div>
        <div>
          <Label>Servicio</Label>
          <Input
            type="number"
            value={bill.serviceFee}
            onChange={(event) => update({ serviceFee: Number(event.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2">
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border-2 border-ink bg-paper px-3 text-sm font-black">
            <span>Incluir propina en total</span>
            <input
              checked={includeTipInTotal}
              className="size-5 accent-ink"
              type="checkbox"
              onChange={(event) => update({ includeTipInTotal: event.target.checked })}
            />
          </label>
        </div>
        <div className="col-span-2">
          <Label>{includeTipInTotal ? "Total con propina" : "Total sin propina"}</Label>
          <Input readOnly type="number" value={calculatedTotal} />
        </div>
      </div>

      <div className="rounded-lg bg-paper p-3 text-sm font-bold text-ink/70">
        <p className="mb-3 text-xs font-black uppercase text-ink/55">Validacion contra boleta</p>
        <div className="flex justify-between gap-3">
          <span>Productos detectados</span>
          <span className="text-right font-black text-ink">{formatCLP(itemsSubtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Productos vs subtotal</span>
          <span className="text-right font-black text-ink">{formatCLP(subtotalDelta)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>{includeTipInTotal ? "Subtotal + propina vs total" : "Subtotal vs total"}</span>
          <span className="text-right font-black text-ink">{formatCLP(totalsDelta)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-ink p-4 text-paper">
        <span className="text-sm font-black uppercase">{includeTipInTotal ? "Total con propina" : "Total sin propina"}</span>
        <span className="text-2xl font-black">{formatCLP(calculatedTotal)}</span>
      </div>
    </Card>
  );
}
