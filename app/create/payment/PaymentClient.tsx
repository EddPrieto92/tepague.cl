"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentSetup } from "@/components/PaymentSetup";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { AppShell, Button, TopBar } from "@/components/ui";
import { calculateBillValidation, formatCLP } from "@/lib/calculations";
import { getBillByShareId, upsertBill } from "@/lib/storage";
import type { Bill } from "@/lib/types";
import { isValidPaymentProfile } from "@/lib/payment-profile";
import { persistPublicBill } from "@/lib/public-bills";
import { trackEvent } from "@/lib/analytics";

export function PaymentClient() {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [allowMismatch, setAllowMismatch] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  if (!bill) return null;
  const currentBill = bill;
  const hasReceiverAccount = isValidPaymentProfile(currentBill.paymentProfile);
  const validation = calculateBillValidation(currentBill);
  const hasRelevantMismatch = Math.abs(validation.missingAmount) >= 100;

  return (
    <AppShell>
      <TopBar title="Cobro" href="/create/review" />
      <div className="space-y-4">
        <PaymentSetup bill={currentBill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <ReceiptPreview imageUrl={currentBill.imageUrl} />
        {hasRelevantMismatch ? (
          <label className="flex items-start gap-3 rounded-lg border-2 border-tomato bg-tomato/10 p-3 text-sm font-bold text-tomato">
            <input checked={allowMismatch} className="mt-0.5 size-5 accent-ink" type="checkbox" onChange={(event) => setAllowMismatch(event.target.checked)} />
            <span>La cuenta aun no cuadra con la boleta ({formatCLP(validation.missingAmount)}). Confirmo que quiero compartirla igualmente.</span>
          </label>
        ) : null}
        {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}
        <Button
          className="w-full"
          disabled={!hasReceiverAccount || (hasRelevantMismatch && !allowMismatch)}
          onClick={async () => {
            setError("");
            try {
              const nextBill = upsertBill({ ...currentBill, status: "open", serviceFeeTotal: 0, serviceFeePerParticipant: 0, ...validation });
              await persistPublicBill(nextBill, undefined, { requirePublicStorage: true });
              trackEvent("bill_shared", { expected_participant_count: currentBill.expectedParticipantCount, missing_amount: validation.missingAmount });
              window.sessionStorage.setItem("mesa-cobrada:active-bill", nextBill.shareId);
              router.push("/create/share");
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : "No pudimos generar el link publico.");
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
