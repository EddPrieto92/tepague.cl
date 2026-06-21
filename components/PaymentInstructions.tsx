"use client";

import { CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Bill } from "@/lib/types";
import { calculatePaymentSummary, formatCLP } from "@/lib/calculations";
import { markParticipantPaid, recordPaymentOnBill } from "@/lib/storage";
import { Button, Card } from "./ui";
import { QRPaymentBlock } from "./QRPaymentBlock";
import { trackEvent } from "@/lib/analytics";
import { persistPublicBill } from "@/lib/public-bills";

export function PaymentInstructions({ bill, participantId }: { bill: Bill; participantId: string }) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const summary = calculatePaymentSummary(bill, participantId);
  const participant = summary.participant;
  const manualFallbackEnabled = process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAID_FALLBACK === "true";
  const [copied, setCopied] = useState(false);

  async function paid() {
    setError("");
    try {
      const nextBill = markParticipantPaid(bill, participantId);
      await persistPublicBill(nextBill);
      router.push(`/bill/${bill.shareId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos marcar el pago.");
    }
  }

  async function payWithFintoc() {
    setError("");
    setIsPaying(true);
    trackEvent("payment_started", { bill_share_id: bill.shareId, participant_id: participantId, amount: summary.totalAmount });
    try {
      await fetch("/api/bills/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bill),
      });
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bill_id: bill.id,
          participant_id: participantId,
          bill_snapshot: bill,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.error ?? "checkout_failed");
      if (data.payment) {
        recordPaymentOnBill(
          {
            ...bill,
            serviceFeeTotal: data.service_fee_total,
            serviceFeePerParticipant: data.service_fee_per_participant,
          },
          data.payment,
        );
      }
      window.location.href = data.redirect_url;
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : "";
      setError(message ? `No se pudo iniciar el pago: ${message}` : "No se pudo iniciar el pago. Revisa la cuenta receptora e intenta nuevamente.");
      setIsPaying(false);
    }
  }

  async function copyTransferData() {
    const text = [
      `Nombre: ${bill.receiverName || ""}`,
      `RUT: ${bill.receiverIdentifier || ""}`,
      `Banco: ${bill.bankName || ""}`,
      `Tipo cuenta: ${bill.accountType || ""}`,
      `Número: ${bill.accountNumber || ""}`,
      `Monto: ${formatCLP(summary.totalAmount)}`,
      `Nota: ${bill.paymentNote || bill.title}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  if (!participant) return null;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold text-ink/60">Total a pagar</p>
        <h1 className="mt-2 text-4xl font-black">{formatCLP(summary.totalAmount)}</h1>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Resumen</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Consumo</dt>
            <dd className="font-black">{formatCLP(summary.consumptionAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Propina</dt>
            <dd className="font-black">{formatCLP(summary.tipAmount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Servicio</dt>
            <dd className="font-black">{formatCLP(summary.serviceFeePerParticipant)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t-2 border-ink/10 pt-2">
            <dt className="font-bold text-ink/60">Total</dt>
            <dd className="font-black">{formatCLP(summary.totalAmount)}</dd>
          </div>
        </dl>
      </Card>

      <Button className="w-full" disabled={isPaying || !bill.paymentProfile?.authorized} onClick={payWithFintoc} type="button">
        {isPaying ? <Loader2 className="animate-spin" size={18} /> : <ExternalLink size={18} />} Pagar ahora
      </Button>
      {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}

      <details className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft">
        <summary className="cursor-pointer text-lg font-black">Otros métodos</summary>
        <div className="mt-4 grid gap-3">
          {bill.paymentLink ? <a className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-black text-ink" href={bill.paymentLink} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Abrir link de pago</a> : null}
          <QRPaymentBlock url={bill.paymentQrUrl} />
        </div>
        <h2 className="mt-4 text-lg font-black">Transferencia</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Nombre</dt>
            <dd className="text-right font-black">{bill.receiverName || "Sin datos"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Banco</dt>
            <dd className="text-right font-black">{bill.bankName || "Sin datos"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Cuenta</dt>
            <dd className="text-right font-black">{bill.accountType || "Sin datos"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Numero</dt>
            <dd className="text-right font-black">{bill.accountNumber || "Sin datos"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">ID</dt>
            <dd className="text-right font-black">{bill.receiverIdentifier || "Sin datos"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-bold text-ink/60">Nota</dt>
            <dd className="text-right font-black">{bill.paymentNote || bill.title}</dd>
          </div>
        </dl>
        <button className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-paper px-4 text-sm font-black" onClick={copyTransferData} type="button"><Copy size={18} /> {copied ? "Datos copiados" : "Copiar datos"}</button>
      </details>

      {manualFallbackEnabled ? <Button className="w-full" onClick={paid} type="button"><CheckCircle2 size={18} /> Ya transferí (fallback)</Button> : null}
    </div>
  );
}
