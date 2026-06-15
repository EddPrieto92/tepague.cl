"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FunSummaryCard } from "@/components/FunSummaryCard";
import { OrganizerDashboard } from "@/components/OrganizerDashboard";
import { AppShell, Card, TopBar } from "@/components/ui";
import { formatCLP } from "@/lib/calculations";
import { getBillByShareId, getRememberedParticipant } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function BillPage() {
  const params = useParams<{ shareId: string }>();
  const [bill, setBill] = useState<Bill | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const nextBill = getBillByShareId(params.shareId) ?? null;
    setBill(nextBill);
    setParticipantId(getRememberedParticipant(params.shareId));
  }, [params.shareId]);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Mesa" />
      <div className="space-y-4">
        <Card className="bg-ink text-paper">
          <p className="text-sm font-bold text-paper/70">Cuenta abierta</p>
          <h1 className="mt-2 text-4xl font-black leading-none">{bill.title}</h1>
          <p className="mt-3 text-2xl font-black">{formatCLP(bill.total)}</p>
        </Card>

        <Link
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515]"
          href={participantId ? `/bill/${bill.shareId}/join?participantId=${participantId}` : `/bill/${bill.shareId}/join`}
        >
          Reclamar consumos
        </Link>

        <OrganizerDashboard bill={bill} />
        <FunSummaryCard bill={bill} />
      </div>
    </AppShell>
  );
}
