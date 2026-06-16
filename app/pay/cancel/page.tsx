"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { AppShell, Card } from "@/components/ui";

export default function PayCancelPage() {
  return (
    <AppShell>
      <Card className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-lg bg-tomato text-white">
          <XCircle size={30} />
        </div>
        <div>
          <h1 className="text-3xl font-black leading-none">Pago cancelado</h1>
          <p className="mt-2 text-sm font-bold text-ink/65">Puedes intentarlo nuevamente desde el resumen de pago.</p>
        </div>
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-black text-ink"
          href="/"
        >
          Volver
        </Link>
      </Card>
    </AppShell>
  );
}
