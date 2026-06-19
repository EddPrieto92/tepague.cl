"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell, Card } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";

function PayCancelContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const [shareId, setShareId] = useState(searchParams.get("bill_share_id") ?? "");
  const [participantId, setParticipantId] = useState(searchParams.get("participant_id") ?? "");
  const retryHref = shareId && participantId ? `/bill/${shareId}/pay/${participantId}` : shareId ? `/bill/${shareId}` : "/";

  useEffect(() => {
    trackEvent("payment_cancelled", { bill_share_id: shareId, participant_id: participantId });
  }, [participantId, shareId]);

  useEffect(() => {
    if (!paymentId || (shareId && participantId)) return;
    void fetch(`/api/payments/status?payment_id=${paymentId}`).then((response) => response.json()).then((data) => {
      setShareId(data.bill_share_id ?? "");
      setParticipantId(data.participant_id ?? "");
    }).catch(() => undefined);
  }, [participantId, paymentId, shareId]);

  return (
    <AppShell>
      <Card className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-tomato text-white">
          <XCircle size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-black leading-none">Pago cancelado</h1>
          <p className="mt-2 text-sm font-bold text-ink/65">Puedes intentarlo nuevamente desde el resumen de pago.</p>
        </div>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-black text-ink"
          href={retryHref}
        >
          Intentar de nuevo
        </Link>
      </Card>
    </AppShell>
  );
}

export default function PayCancelPage() {
  return <Suspense fallback={<AppShell><Card className="text-center font-black">Pago cancelado</Card></AppShell>}><PayCancelContent /></Suspense>;
}
