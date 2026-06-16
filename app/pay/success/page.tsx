"use client";

import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell, Card } from "@/components/ui";
import { applyPaymentStatusLocally, getBills } from "@/lib/storage";
import type { Payment } from "@/lib/types";

function PaySuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const mock = searchParams.get("mock");
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    let cancelled = false;
    async function poll() {
      const response = await fetch(`/api/payments/status?payment_id=${paymentId}${mock ? "&mock=1" : ""}`);
      const data = await response.json();
      if (cancelled || !data.payment) return;
      setPayment(data.payment);
      if (data.payment.status === "succeeded") {
        const bill = getBills().find((candidate) => candidate.id === data.payment.billId);
        if (bill) applyPaymentStatusLocally(bill, data.payment);
        return;
      }
      window.setTimeout(poll, 1800);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId, mock]);

  const isSucceeded = payment?.status === "succeeded";

  return (
    <AppShell>
      <Card className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-aqua text-white">
          {isSucceeded ? <CheckCircle2 size={30} /> : <Loader2 className="animate-spin" size={30} />}
        </div>
        <div>
          <h1 className="text-3xl font-black leading-none">
            {isSucceeded ? "Pago confirmado" : "Estamos confirmando tu pago..."}
          </h1>
          <p className="mt-2 text-sm font-bold text-ink/65">
            {isSucceeded ? "La mesa se actualizo automaticamente." : "Esto puede tardar unos segundos mientras llega Fintoc."}
          </p>
        </div>
        {payment ? (
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515]"
            href="/"
          >
            Volver a Mesa Cobrada
          </Link>
        ) : null}
      </Card>
    </AppShell>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <Card className="space-y-4 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-lg bg-aqua text-white">
              <Loader2 className="animate-spin" size={30} />
            </div>
            <h1 className="text-3xl font-black leading-none">Estamos confirmando tu pago...</h1>
          </Card>
        </AppShell>
      }
    >
      <PaySuccessContent />
    </Suspense>
  );
}
