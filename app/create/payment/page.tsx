"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentSetup } from "@/components/PaymentSetup";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { AppShell, Button, Input, Label, TopBar } from "@/components/ui";
import { calculateBillValidation, calculateMesaCobradaServiceFee, formatCLP } from "@/lib/calculations";
import { getBillByShareId, upsertBill } from "@/lib/storage";
import type { Bill } from "@/lib/types";
import { isValidPaymentProfile } from "@/lib/payment-profile";
import { persistPublicBill } from "@/lib/public-bills";
import { trackEvent } from "@/lib/analytics";

export default function PaymentPage() {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [allowMismatch, setAllowMismatch] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  if (!bill) return null;
  const hasReceiverAccount = isValidPaymentProfile(bill.paymentProfile);
  const expectedCount = Math.max(1, bill.expectedParticipantCount || 1);
  const serviceFeeTotal = calculateMesaCobradaServiceFee(expectedCount);
  const serviceFeePerParticipant = Math.round(serviceFeeTotal / expectedCount);
  const validation = calculateBillValidation(bill);
  const hasRelevantMismatch = Math.abs(validation.missingAmount) >= 100;

  return (
    <AppShell>
      <TopBar title="Cobro" href="/create/review" />
      <div className="space-y-4">
        <PaymentSetup bill={bill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <div className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft">
          <Label>¿Cuántas personas van a dividir esta cuenta?</Label>
          <Input min={1} type="number" value={expectedCount} onChange={(event) => setBill(upsertBill({ ...bill, expectedParticipantCount: Math.max(1, Number(event.target.value) || 1) }))} />
          <div className="mt-3 rounded-lg bg-paper p-3 text-sm font-bold text-ink/70">
            <p>Servicio Mesa Cobrada: <strong className="text-ink">{formatCLP(serviceFeeTotal)}</strong></p>
            <p className="mt-1">Dividido entre {expectedCount} personas: <strong className="text-ink">{formatCLP(serviceFeePerParticipant)} por persona</strong></p>
          </div>
        </div>
        <ReceiptPreview imageUrl={bill.imageUrl} />
        {hasRelevantMismatch ? (
          <label className="flex items-start gap-3 rounded-lg border-2 border-tomato bg-tomato/10 p-3 text-sm font-bold text-tomato">
            <input checked={allowMismatch} className="mt-0.5 size-5 accent-ink" type="checkbox" onChange={(event) => setAllowMismatch(event.target.checked)} />
            <span>La cuenta aún no cuadra con la boleta ({formatCLP(validation.missingAmount)}). Confirmo que quiero compartirla igualmente.</span>
          </label>
        ) : null}
        {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}
        <Button
          className="w-full"
          disabled={!hasReceiverAccount || (hasRelevantMismatch && !allowMismatch)}
          onClick={async () => {
            setError("");
            try {
              const nextBill = upsertBill({ ...bill, status: "open", serviceFeeTotal, serviceFeePerParticipant, ...validation });
              await persistPublicBill(nextBill, undefined, { requirePublicStorage: true });
              trackEvent("bill_shared", { expected_participant_count: expectedCount, missing_amount: validation.missingAmount });
              window.sessionStorage.setItem("mesa-cobrada:active-bill", nextBill.shareId);
              router.push("/create/share");
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "No pudimos generar el link público.");
            }
          }}
          type="button"
        >
          Generar link
        </Button>
      </div>
    </AppShell>
  );
}
