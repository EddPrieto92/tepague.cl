"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BillItemEditor } from "@/components/BillItemEditor";
import { BillTotalsEditor } from "@/components/BillTotalsEditor";
import { AppShell, Button, TopBar } from "@/components/ui";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { getBillByShareId, updateBillItems, upsertBill } from "@/lib/storage";
import { persistPublicBill } from "@/lib/public-bills";
import { trackEvent } from "@/lib/analytics";
import type { Bill } from "@/lib/types";

export default function ReviewPage() {
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const shareId = window.sessionStorage.getItem("mesa-cobrada:active-bill") ?? "mesa-viernes";
    setBill(getBillByShareId(shareId) ?? null);
  }, []);

  useEffect(() => {
    if (!bill) return;
    const timeout = window.setTimeout(() => {
      void persistPublicBill(bill).catch((saveError) => setError(saveError instanceof Error ? saveError.message : "No pudimos guardar los cambios."));
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [bill]);

  if (!bill) return null;

  return (
    <AppShell>
      <TopBar title="Productos" href="/create" />
      <div className="space-y-4">
        <BillItemEditor bill={bill} onChange={(items) => setBill(updateBillItems(bill, items))} />
        <BillTotalsEditor bill={bill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <ReceiptPreview imageUrl={bill.imageUrl} />
        {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}
        <Button className="w-full" onClick={async () => {
          setError("");
          try {
            await persistPublicBill(bill);
            trackEvent("bill_reviewed", { missing_amount: bill.missingAmount });
            router.push("/create/payment");
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "No pudimos guardar la revisión.");
          }
        }} type="button">
          Configurar cobro
        </Button>
      </div>
    </AppShell>
  );
}
