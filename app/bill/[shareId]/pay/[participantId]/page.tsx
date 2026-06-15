"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentInstructions } from "@/components/PaymentInstructions";
import { AppShell, TopBar } from "@/components/ui";
import { getBillByShareId } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function PayPage() {
  const params = useParams<{ shareId: string; participantId: string }>();
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    setBill(getBillByShareId(params.shareId) ?? null);
  }, [params.shareId]);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Pago" href={`/bill/${bill.shareId}/join?participantId=${params.participantId}`} />
      <PaymentInstructions bill={bill} participantId={params.participantId} />
    </AppShell>
  );
}
