"use client";

import Link from "next/link";
import { Landmark, ShieldCheck, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AppShell, Card } from "@/components/ui";

export function MockCheckoutClient() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment_id");

  return (
    <AppShell>
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="grid size-14 place-items-center rounded-lg bg-aqua text-white">
            <Landmark size={30} />
          </div>
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-paper">Fintoc TEST mock</span>
        </div>

        <div>
          <h1 className="text-3xl font-black leading-none">Autoriza tu pago</h1>
          <p className="mt-2 text-sm font-bold text-ink/65">
            Esta pantalla simula el checkout de Fintoc en local. Con llaves TEST reales, este paso abre el checkout
            hospedado por Fintoc.
          </p>
        </div>

        <div className="rounded-lg bg-paper p-3 text-sm font-bold text-ink/70">
          ID de pago: <span className="font-black text-ink">{paymentId ?? "sin id"}</span>
        </div>

        <div className="grid gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515]"
            href={`/pay/success?payment_id=${paymentId ?? ""}&mock=1`}
          >
            <ShieldCheck size={18} /> Simular pago exitoso
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold text-ink"
            href={`/pay/cancel?payment_id=${paymentId ?? ""}`}
          >
            <XCircle size={18} /> Cancelar
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
