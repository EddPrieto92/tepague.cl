"use client";

import { useEffect, useState } from "react";
import { FunSummaryCard } from "@/components/FunSummaryCard";
import { OrganizerDashboard } from "@/components/OrganizerDashboard";
import { ShareBill } from "@/components/ShareBill";
import { AppShell, Card, TopBar } from "@/components/ui";
import { usePublicBill } from "@/lib/use-public-bill";
import { ReceiptPreview } from "@/components/ReceiptPreview";

export default function SharePage() {
  const [shareId, setShareId] = useState("");
  const { bill, error } = usePublicBill(shareId, 3000);

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setShareId(shareId);
  }, []);

  if (!bill) return <AppShell><TopBar title="Compartir" href="/create/payment" />{error ? <Card className="text-sm font-bold text-tomato">{error}</Card> : null}</AppShell>;

  return (
    <AppShell>
      <TopBar title="Compartir" href="/create/payment" />
      <div className="space-y-4">
        <ShareBill bill={bill} />
        <OrganizerDashboard bill={bill} />
        <ReceiptPreview imageUrl={bill.imageUrl} />
        <FunSummaryCard bill={bill} />
      </div>
    </AppShell>
  );
}
