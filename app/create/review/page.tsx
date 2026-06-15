"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BillItemEditor } from "@/components/BillItemEditor";
import { BillTotalsEditor } from "@/components/BillTotalsEditor";
import { AppShell, Button, TopBar } from "@/components/ui";
import { getBillByShareId, updateBillItems, upsertBill } from "@/lib/storage";
import type { Bill } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Productos" href="/create" />
      <div className="space-y-4">
        <BillItemEditor bill={bill} onChange={(items) => setBill(updateBillItems(bill, items))} />
        <BillTotalsEditor bill={bill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <Button className="w-full" onClick={() => router.push("/create/payment")} type="button">
          Configurar cobro
        </Button>
      </div>
    </AppShell>
  );
}
