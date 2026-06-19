"use client";

import { useParams } from "next/navigation";
import { PaymentInstructions } from "@/components/PaymentInstructions";
import { AppShell, Card, TopBar } from "@/components/ui";
import { usePublicBill } from "@/lib/use-public-bill";

export default function PayPage() {
  const params = useParams<{ shareId: string; participantId: string }>();
  const { bill, error, loading } = usePublicBill(params.shareId);

  if (!bill) return <AppShell><TopBar title="Pago" href={`/bill/${params.shareId}`} /><Card className="text-sm font-bold">{error || (loading ? "Cargando cuenta…" : "Cuenta no disponible.")}</Card></AppShell>;

  return (
    <AppShell>
      <TopBar title="Pago" href={`/bill/${bill.shareId}/join?participantId=${params.participantId}`} />
      <PaymentInstructions bill={bill} participantId={params.participantId} />
    </AppShell>
  );
}
