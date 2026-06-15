"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ItemClaimList } from "@/components/ItemClaimList";
import { ParticipantEntry } from "@/components/ParticipantEntry";
import { AppShell, TopBar } from "@/components/ui";
import { getBillByShareId, getRememberedParticipant } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function JoinPage() {
  const params = useParams<{ shareId: string }>();
  const searchParams = useSearchParams();
  const [bill, setBill] = useState<Bill | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const nextBill = getBillByShareId(params.shareId) ?? null;
    setBill(nextBill);
    setParticipantId(searchParams.get("participantId") ?? getRememberedParticipant(params.shareId));
  }, [params.shareId, searchParams]);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Participante" href={`/bill/${bill.shareId}`} />
      {participantId && bill.participants.some((participant) => participant.id === participantId) ? (
        <ItemClaimList bill={bill} participantId={participantId} />
      ) : (
        <ParticipantEntry bill={bill} />
      )}
    </AppShell>
  );
}
