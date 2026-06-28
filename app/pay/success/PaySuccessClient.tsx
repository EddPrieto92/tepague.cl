"use client";

import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/ui";
import { applyPaymentStatusLocally, getBills } from "@/lib/storage";
import type { Payment } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

export function PaySuccessClient() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");
  const mock = searchParams.get("mock");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [billShareId, setBillShareId] = useState("");

  useEffect(() => {
    if (!paymentId) return;

    let cancelled = false;
    async function poll() {
      const response = await fetch(`/api/payments/status?payment_id=${paymentId}${mock ? "&mock=1" : ""}`);
      const data = await response.json();
      if (cancelled || !data.payment) return;
      setPayment(data.payment);
      setBillShareId(data.bill_share_id ?? data.payment.billShareId ?? "");
      if (data.payment.status === "succeeded") {
        trackEvent("payment_succeeded", { payment_id: data.payment.id });
        const bill = getBills().find((candidate) => candidate.id === data.payment.billId);
        if (bill) applyPaymentStatusLocally(bill, data.payment);
        return;
      }
      if (data.payment.status === "failed" || data.payment.status === "expired") {
        trackEvent("payment_failed", { payment_id: data.payment.id, status: data.payment.status });
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
  const isFailed = payment?.status === "failed" || payment?.status === "expired";

  return (
    <AppShell>
      <Card className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-aqua text-white">
          {isSucceeded ? <CheckCircle2 size={30} /> : isFailed ? <span className="text-2xl font-black">!</span> : <Loader2 className="animate-spin" size={30} />}
        </div>
        <div>
          <h1 className="text-3xl font-black leading-none">
            {isSucceeded ? "Pago confirmado" : isFailed ? "No pudimos confirmar el pago" : "Estamos confirmando tu pago..."}
          </h1>
          <p className="mt-2 text-sm font-bold text-ink/65">
            {isSucceeded ? "La mesa se actualizo automaticamente." : isFailed ? "Vuelve a la cuenta para intentarlo nuevamente." : "Esto puede tardar unos segundos mientras llega Fintoc."}
          </p>
        </div>
        {payment ? (
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515]"
            href={billShareId ? `/bill/${billShareId}` : "/"}
          >
            Volver a la cuenta
          </Link>
        ) : null}
      </Card>
    </AppShell>
  );
}
