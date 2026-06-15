"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Bill } from "@/lib/types";
import { calculateDashboard, formatCLP } from "@/lib/calculations";
import { markParticipantPaid } from "@/lib/storage";
import { Button, Card } from "./ui";
import { QRPaymentBlock } from "./QRPaymentBlock";

export function PaymentInstructions({ bill, participantId }: { bill: Bill; participantId: string }) {
  const router = useRouter();
  const participant = calculateDashboard(bill).participants.find((candidate) => candidate.id === participantId);

  function paid() {
    markParticipantPaid(bill, participantId);
    router.push(`/bill/${bill.shareId}`);
  }

  if (!participant) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-ink text-paper">
        <p className="text-sm font-bold text-paper/70">Total a transferir</p>
        <h1 className="mt-2 text-4xl font-black">{formatCLP(participant.totalAmount)}</h1>
      </Card>

      {bill.paymentLink ? (
        <a
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515]"
          href={bill.paymentLink}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={18} /> Abrir link de pago
        </a>
      ) : null}

      <QRPaymentBlock url={bill.paymentQrUrl} />

      <Card>
        <h2 className="text-lg font-black">Transferencia</h2>
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
      </Card>

      <Button className="w-full" onClick={paid} type="button">
        <CheckCircle2 size={18} /> Ya transferi
      </Button>
    </div>
  );
}
