"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ItemClaimList } from "@/components/ItemClaimList";
import { ParticipantEntry } from "@/components/ParticipantEntry";
import { AppShell, Card, TopBar } from "@/components/ui";
import { getRememberedParticipant } from "@/lib/storage";
import { usePublicBill } from "@/lib/use-public-bill";

export default function JoinPage() {
  const params = useParams<{ shareId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bill, error, loading } = usePublicBill(params.shareId);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    setParticipantId(searchParams.get("participantId") ?? getRememberedParticipant(params.shareId));
  }, [params.shareId, searchParams]);

  useEffect(() => {
    if (!bill || !participantId) return;
    const participant = bill.participants.find((candidate) => candidate.id === participantId);
    if (participant && participant.status !== "selecting") router.replace(`/bill/${bill.shareId}/pay/${participantId}`);
  }, [bill, participantId, router]);

  if (!bill) return <AppShell><TopBar title="Participante" href={`/bill/${params.shareId}`} /><Card className="text-sm font-bold">{error || (loading ? "Cargando cuenta…" : "Cuenta no disponible.")}</Card></AppShell>;

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
