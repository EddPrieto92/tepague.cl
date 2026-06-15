import Link from "next/link";
import { ArrowRight, ReceiptText, UsersRound, WalletCards } from "lucide-react";
import { AppShell, Card } from "@/components/ui";

export default function HomePage() {
  return (
    <AppShell>
      <section className="flex flex-1 flex-col justify-between gap-8 py-6">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-black text-paper">
            <ReceiptText size={14} /> Mesa Cobrada
          </div>
          <h1 className="text-5xl font-black leading-[0.95]">Sube la cuenta. Cada uno paga lo suyo.</h1>
          <p className="mt-4 text-lg font-semibold leading-snug text-ink/70">
            Divide consumos reales, comparte un link y deja de perseguir pagos por WhatsApp.
          </p>
        </div>

        <div className="grid gap-3">
          <Card className="flex items-center gap-3">
            <ReceiptText className="text-tomato" size={24} />
            <p className="text-sm font-black">Foto o carga manual de productos.</p>
          </Card>
          <Card className="flex items-center gap-3">
            <UsersRound className="text-aqua" size={24} />
            <p className="text-sm font-black">Cada invitado reclama consumos en menos de 30 segundos.</p>
          </Card>
          <Card className="flex items-center gap-3">
            <WalletCards className="text-plum" size={24} />
            <p className="text-sm font-black">Pago externo por link, QR o transferencia.</p>
          </Card>
        </div>

        <Link
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-4 py-3 text-base font-black text-ink shadow-[4px_4px_0_#151515]"
          href="/create"
        >
          Crear mesa <ArrowRight size={20} />
        </Link>
      </section>
    </AppShell>
  );
}
