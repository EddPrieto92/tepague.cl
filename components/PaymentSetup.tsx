"use client";

import type { Bill, PaymentMethod } from "@/lib/types";
import { Card, Input, Label } from "./ui";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

export function PaymentSetup({ bill, onChange }: Props) {
  function update(patch: Partial<Bill>) {
    onChange({ ...bill, ...patch });
  }

  return (
    <Card className="space-y-4">
      <div>
        <Label>Metodo</Label>
        <select
          className="min-h-12 w-full rounded-lg border-2 border-ink bg-white px-3 font-bold"
          value={bill.paymentMethod}
          onChange={(event) => update({ paymentMethod: event.target.value as PaymentMethod })}
        >
          <option value="mixed">Todo disponible</option>
          <option value="link">Link de pago</option>
          <option value="qr">QR</option>
          <option value="transfer">Transferencia</option>
        </select>
      </div>

      <div>
        <Label>Link de pago</Label>
        <Input value={bill.paymentLink ?? ""} onChange={(event) => update({ paymentLink: event.target.value })} />
      </div>

      <div>
        <Label>QR imagen URL</Label>
        <Input value={bill.paymentQrUrl ?? ""} onChange={(event) => update({ paymentQrUrl: event.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre</Label>
          <Input value={bill.receiverName ?? ""} onChange={(event) => update({ receiverName: event.target.value })} />
        </div>
        <div>
          <Label>Banco</Label>
          <Input value={bill.bankName ?? ""} onChange={(event) => update({ bankName: event.target.value })} />
        </div>
        <div>
          <Label>Tipo cuenta</Label>
          <Input value={bill.accountType ?? ""} onChange={(event) => update({ accountType: event.target.value })} />
        </div>
        <div>
          <Label>Numero</Label>
          <Input value={bill.accountNumber ?? ""} onChange={(event) => update({ accountNumber: event.target.value })} />
        </div>
      </div>

      <div>
        <Label>Identificador</Label>
        <Input value={bill.receiverIdentifier ?? ""} onChange={(event) => update({ receiverIdentifier: event.target.value })} />
      </div>
      <div>
        <Label>Nota</Label>
        <Input value={bill.paymentNote ?? ""} onChange={(event) => update({ paymentNote: event.target.value })} />
      </div>
    </Card>
  );
}
