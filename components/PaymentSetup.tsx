"use client";

import type { Bill, PaymentMethod } from "@/lib/types";
import { updatePaymentProfile } from "@/lib/storage";
import { Card, Input, Label } from "./ui";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

export function PaymentSetup({ bill, onChange }: Props) {
  function update(patch: Partial<Bill>) {
    onChange({ ...bill, ...patch });
  }

  const profile = bill.paymentProfile ?? {
    holderName: bill.receiverName ?? "",
    holderId: bill.receiverIdentifier ?? "",
    institutionId: bill.bankName ?? "",
    accountType: bill.accountType ?? "",
    accountNumber: bill.accountNumber ?? "",
    authorized: false,
  };

  function updateProfile(patch: Partial<typeof profile>) {
    onChange(updatePaymentProfile(bill, { ...profile, ...patch }));
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

      {bill.paymentMethod === "link" || bill.paymentMethod === "mixed" ? (
        <div>
          <Label>Link de pago externo</Label>
          <Input value={bill.paymentLink ?? ""} onChange={(event) => update({ paymentLink: event.target.value })} />
        </div>
      ) : null}

      {bill.paymentMethod === "qr" || bill.paymentMethod === "mixed" ? (
        <div>
          <Label>QR imagen URL</Label>
          <Input value={bill.paymentQrUrl ?? ""} onChange={(event) => update({ paymentQrUrl: event.target.value })} />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre titular</Label>
          <Input value={profile.holderName} onChange={(event) => updateProfile({ holderName: event.target.value })} />
        </div>
        <div>
          <Label>RUT</Label>
          <Input value={profile.holderId} onChange={(event) => updateProfile({ holderId: event.target.value })} />
        </div>
        <div>
          <Label>Banco</Label>
          <Input value={profile.institutionId} onChange={(event) => updateProfile({ institutionId: event.target.value })} />
        </div>
        <div>
          <Label>Tipo cuenta</Label>
          <Input value={profile.accountType} onChange={(event) => updateProfile({ accountType: event.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Numero</Label>
          <Input value={profile.accountNumber} onChange={(event) => updateProfile({ accountNumber: event.target.value })} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border-2 border-ink/10 bg-paper p-3 text-sm font-bold">
        <input
          checked={profile.authorized}
          className="mt-1 size-5 accent-ink"
          type="checkbox"
          onChange={(event) => updateProfile({ authorized: event.target.checked })}
        />
        Declaro ser titular o estar autorizado para recibir fondos en esta cuenta.
      </label>

      <div>
        <Label>Nota</Label>
        <Input value={bill.paymentNote ?? ""} onChange={(event) => update({ paymentNote: event.target.value })} />
      </div>
    </Card>
  );
}
