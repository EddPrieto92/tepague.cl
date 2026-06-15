"use client";

import type { Bill } from "@/lib/types";
import { calculateBillTotal, formatCLP } from "@/lib/calculations";
import { Card, Input, Label } from "./ui";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

export function BillTotalsEditor({ bill, onChange }: Props) {
  function update(patch: Partial<Bill>) {
    const next = { ...bill, ...patch };
    onChange({
      ...next,
      total: calculateBillTotal({
        subtotal: next.subtotal,
        tip: next.tip,
        serviceFee: next.serviceFee,
        discount: next.discount,
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
      </div>

      <div className="flex items-center justify-between rounded-lg bg-ink p-4 text-paper">
        <span className="text-sm font-black uppercase">Total</span>
        <span className="text-2xl font-black">{formatCLP(bill.total)}</span>
      </div>
    </Card>
  );
}
