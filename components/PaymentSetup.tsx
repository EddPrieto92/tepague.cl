"use client";

import { ClipboardPaste } from "lucide-react";
import { useState } from "react";
import type { Bill, PaymentMethod } from "@/lib/types";
import { updatePaymentProfile } from "@/lib/storage";
import { Card, Input, Label, SecondaryButton } from "./ui";
import { BANK_ACCOUNT_TYPES, CHILEAN_BANKS } from "@/lib/payment-profile";
import type { BankAccountType } from "@/lib/types";

type Props = {
  bill: Bill;
  onChange: (bill: Bill) => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function valueAfterLabel(text: string, labels: string[]) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const normalizedLine = normalize(line);
    const matchingLabel = labels.find((label) => normalizedLine.startsWith(label));
    if (!matchingLabel) continue;
    const [, value = ""] = line.split(/[:：-]/, 2);
    return value.trim();
  }
  return "";
}

function parseBankDetails(text: string) {
  const normalized = normalize(text);
  const institutionId = CHILEAN_BANKS.find((bank) => normalized.includes(normalize(bank.name)))?.id ?? "";
  const accountType = normalized.includes("vista")
    ? "sight_account"
    : normalized.includes("corriente")
      ? "checking_account"
      : "";
  const holderId = valueAfterLabel(text, ["rut", "run"]) || text.match(/\b\d{1,2}[.\d]*-?[\dkK]\b/)?.[0] || "";
  const accountNumber =
    valueAfterLabel(text, ["numero", "n cuenta", "cuenta", "nro", "no"]) ||
    text
      .split(/\r?\n/)
      .map((line) => line.replace(/[^\d]/g, ""))
      .find((digits) => digits.length >= 6 && !holderId.replace(/[^\d]/g, "").includes(digits)) ||
    "";
  const holderName =
    valueAfterLabel(text, ["nombre", "titular", "beneficiario"]) ||
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /[a-zA-ZÁÉÍÓÚÑáéíóúñ]{3}/.test(line) && !normalize(line).includes("banco") && !normalize(line).includes("cuenta")) ||
    "";

  return { holderName, holderId, institutionId, accountType: accountType as BankAccountType | "", accountNumber };
}

export function PaymentSetup({ bill, onChange }: Props) {
  const [pasteError, setPasteError] = useState("");

  function update(patch: Partial<Bill>) {
    onChange({ ...bill, ...patch });
  }

  const profile = bill.paymentProfile ?? {
    holderName: bill.receiverName ?? "",
    holderId: bill.receiverIdentifier ?? "",
    institutionId: bill.bankName ?? "",
    accountType: bill.accountType === "checking_account" || bill.accountType === "sight_account" ? bill.accountType : "",
    accountNumber: bill.accountNumber ?? "",
    authorized: false,
  };

  function updateProfile(patch: Partial<typeof profile>) {
    onChange(updatePaymentProfile(bill, { ...profile, ...patch }));
  }

  async function pasteBankDetails() {
    setPasteError("");
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseBankDetails(text);
      updateProfile({
        holderName: parsed.holderName || profile.holderName,
        holderId: parsed.holderId || profile.holderId,
        institutionId: parsed.institutionId || profile.institutionId,
        accountType: parsed.accountType || profile.accountType,
        accountNumber: parsed.accountNumber || profile.accountNumber,
      });
    } catch {
      setPasteError("No pudimos leer el portapapeles. Pega los datos manualmente.");
    }
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
        <div className="col-span-2">
          <SecondaryButton className="w-full" onClick={pasteBankDetails} type="button">
            <ClipboardPaste size={18} /> Pegar datos bancarios
          </SecondaryButton>
          {pasteError ? <p className="mt-2 rounded-lg bg-tomato/10 p-2 text-xs font-bold text-tomato">{pasteError}</p> : null}
        </div>
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
          <select
            className="min-h-12 w-full rounded-lg border-2 border-ink bg-white px-3 font-bold"
            value={profile.institutionId}
            onChange={(event) => updateProfile({ institutionId: event.target.value })}
          >
            <option value="">Seleccionar banco</option>
            {CHILEAN_BANKS.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Tipo cuenta</Label>
          <select
            className="min-h-12 w-full rounded-lg border-2 border-ink bg-white px-3 font-bold"
            value={profile.accountType}
            onChange={(event) => updateProfile({ accountType: event.target.value as BankAccountType })}
          >
            <option value="">Seleccionar tipo</option>
            {BANK_ACCOUNT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
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
