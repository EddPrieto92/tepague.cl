"use client";

import { useEffect, useState } from "react";
import { FunSummaryCard } from "@/components/FunSummaryCard";
import { OrganizerDashboard } from "@/components/OrganizerDashboard";
import { ShareBill } from "@/components/ShareBill";
import { AppShell, TopBar } from "@/components/ui";
import { getBillByShareId } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function SharePage() {
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Compartir" href="/create/payment" />
      <div className="space-y-4">
        <ShareBill bill={bill} />
        <OrganizerDashboard bill={bill} />
        <FunSummaryCard bill={bill} />
      </div>
    </AppShell>
  );
}
