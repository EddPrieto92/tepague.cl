"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentSetup } from "@/components/PaymentSetup";
import { AppShell, Button, TopBar } from "@/components/ui";
import { calculateMesaCobradaServiceFee } from "@/lib/calculations";
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
  const profile = bill.paymentProfile;
  const hasReceiverAccount =
    profile?.authorized &&
    profile.holderName.trim() &&
    profile.holderId.trim() &&
    profile.institutionId.trim() &&
    profile.accountType.trim() &&
    profile.accountNumber.trim();
  const serviceFeeTotal = calculateMesaCobradaServiceFee(bill.participants.length);

  return (
    <AppShell>
      <TopBar title="Cobro" href="/create/review" />
      <div className="space-y-4">
        <PaymentSetup bill={bill} onChange={(nextBill) => setBill(upsertBill(nextBill))} />
        <p className="rounded-lg bg-paper p-3 text-sm font-bold text-ink/70">
          Servicio Mesa Cobrada estimado: {serviceFeeTotal === 0 ? "$0" : `$${serviceFeeTotal.toLocaleString("es-CL")}`}. Se divide entre quienes pagan.
        </p>
        <Button
          className="w-full"
          disabled={!hasReceiverAccount}
          onClick={() => {
            const nextBill = upsertBill({ ...bill, status: "open", serviceFeeTotal });
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
