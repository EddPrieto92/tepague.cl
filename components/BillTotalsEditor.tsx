"use client";

import type { Bill } from "@/lib/types";
import { calculateBillTotal, calculateBillValidation, calculateMesaCobradaServiceFee, formatCLP } from "@/lib/calculations";
import { Card, Input, Label } from "./ui";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

export function BillTotalsEditor({ bill, onChange }: Props) {
  const calculatedTotal = calculateBillTotal({
    subtotal: bill.subtotal,
    tip: bill.tip,
    serviceFee: bill.serviceFee,
    discount: bill.discount,
    includeTip: true,
  });
  const validation = calculateBillValidation(bill);
  const serviceFee = calculateMesaCobradaServiceFee(bill.expectedParticipantCount || 1);

  function update(patch: Partial<Bill>) {
    const nextBill = { ...bill, ...patch };
    onChange({
      ...nextBill,
      includeTipInTotal: true,
      total: calculateBillTotal({
        subtotal: nextBill.subtotal,
        tip: nextBill.tip,
        serviceFee: nextBill.serviceFee,
        discount: nextBill.discount,
        includeTip: true,
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
          <Label>Total con propina</Label>
          <Input readOnly type="number" value={calculatedTotal} />
        </div>
      </div>

      <div className="rounded-lg bg-paper p-3 text-sm font-bold text-ink/70">
        <p className="mb-3 text-xs font-black uppercase text-ink/55">Validación contra boleta</p>
        <div className="flex justify-between gap-3">
          <span>Total boleta</span>
          <span className="text-right font-black text-ink">{formatCLP(bill.receiptTotal ?? bill.total)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Total ingresado</span>
          <span className="text-right font-black text-ink">{formatCLP(validation.enteredTotal)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Faltante</span>
          <span className="text-right font-black text-ink">{formatCLP(validation.missingAmount)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Propina</span>
          <span className="text-right font-black text-ink">{formatCLP(bill.tip)}</span>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Servicio estimado</span>
          <span className="text-right font-black text-ink">{formatCLP(serviceFee)}</span>
        </div>
      </div>

      {Math.abs(validation.missingAmount) >= 100 ? (
        <div className="rounded-lg border-2 border-tomato bg-tomato/10 p-3 text-sm font-bold text-tomato">
          La cuenta aún no cuadra con la boleta. {validation.missingAmount > 0 ? `Faltan ${formatCLP(validation.missingAmount)} por ingresar o ajustar.` : `Hay ${formatCLP(Math.abs(validation.missingAmount))} ingresados de más.`}
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-lg bg-ink p-4 text-paper">
        <span className="text-sm font-black uppercase">Total con propina</span>
        <span className="text-2xl font-black">{formatCLP(calculatedTotal)}</span>
      </div>
    </Card>
  );
}
