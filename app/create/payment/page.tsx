"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentSetup } from "@/components/PaymentSetup";
import { AppShell, Button, TopBar } from "@/components/ui";
import { getBillByShareId, upsertBill } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function PaymentPage() {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Cobro" href="/create/review" />
      <div className="space-y-4">
        <PaymentSetup bill={bill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <Button
          className="w-full"
          onClick={() => {
            const nextBill = upsertBill({ ...bill, status: "open" });
            window.sessionStorage.setItem("mesa-cobrada:active-bill", nextBill.shareId);
            router.push("/create/share");
          }}
          type="button"
        >
          Generar link
        </Button>
      </div>
    </AppShell>
  );
}
