import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, ReceiptText, XCircle } from "lucide-react";
import { AppShell, Card } from "@/components/ui";
import { formatCLP } from "@/lib/calculations";
import { getReceiptLabData } from "@/lib/receipt-lab";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <p className="text-xs font-black uppercase text-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </Card>
  );
}

export default function ReceiptLabPage() {
  const lab = getReceiptLabData();
  const itemRate = lab.totals.expectedItems > 0 ? lab.totals.matchedItems / lab.totals.expectedItems : 0;
  const subtotalRate = lab.totals.receipts > 0 ? lab.totals.subtotalOk / lab.totals.receipts : 0;
  const tipRate = lab.totals.receipts > 0 ? lab.totals.tipOk / lab.totals.receipts : 0;
  const totalRate = lab.totals.receipts > 0 ? lab.totals.totalOk / lab.totals.receipts : 0;

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-ink/70" href="/create">
          <ArrowLeft size={16} /> Crear
        </Link>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">Receipt lab</span>
      </header>

      <section className="space-y-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-aqua px-3 py-1 text-xs font-black text-ink">
            <Activity size={14} /> Dataset local
          </div>
          <h1 className="text-4xl font-black leading-none">Boletas probadas</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Casos" value={String(lab.totals.receipts)} />
          <Metric label="Productos" value={`${lab.totals.matchedItems}/${lab.totals.expectedItems}`} />
          <Metric label="Items OK" value={percent(itemRate)} />
          <Metric label="Total OK" value={percent(totalRate)} />
          <Metric label="Subtotal OK" value={percent(subtotalRate)} />
          <Metric label="Propina OK" value={percent(tipRate)} />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-ink/55">Monto esperado</p>
              <p className="text-xl font-black">{formatCLP(lab.totals.expectedAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase text-ink/55">Monto parseado</p>
              <p className="text-xl font-black">{formatCLP(lab.totals.parsedAmount)}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {lab.cases.map((receiptCase) => (
            <Card key={receiptCase.id}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-paper px-2 py-1 text-xs font-black text-ink">
                    <ReceiptText size={13} /> {receiptCase.source}
                  </div>
                  <h2 className="text-xl font-black">{receiptCase.id}</h2>
                  <p className="mt-1 text-sm font-bold text-ink/65">{receiptCase.description}</p>
                </div>
                {receiptCase.passed ? <CheckCircle2 className="shrink-0 text-aqua" /> : <XCircle className="shrink-0 text-tomato" />}
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-paper p-2">
                  <p className="text-[11px] font-black uppercase text-ink/55">Subtotal</p>
                  <p className="text-sm font-black">{formatCLP(receiptCase.parsed.subtotal)}</p>
                </div>
                <div className="rounded-lg bg-paper p-2">
                  <p className="text-[11px] font-black uppercase text-ink/55">Propina</p>
                  <p className="text-sm font-black">{formatCLP(receiptCase.parsed.tip)}</p>
                </div>
                <div className="rounded-lg bg-paper p-2">
                  <p className="text-[11px] font-black uppercase text-ink/55">Total</p>
                  <p className="text-sm font-black">{formatCLP(receiptCase.parsed.total)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {receiptCase.itemMatches.map((match) => (
                  <div className="rounded-lg border-2 border-ink/10 bg-white p-3" key={`${receiptCase.id}-${match.expected.name}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{match.expected.name}</p>
                        <p className="text-xs font-bold text-ink/60">
                          Esperado {match.expected.quantity}x · {formatCLP(match.expected.totalPrice)}
                        </p>
                        <p className="text-xs font-bold text-ink/60">
                          Detectado {match.actual ? `${match.actual.quantity}x · ${formatCLP(match.actual.totalPrice)}` : "sin match"}
                        </p>
                      </div>
                      {match.ok ? <CheckCircle2 className="shrink-0 text-aqua" size={18} /> : <XCircle className="shrink-0 text-tomato" size={18} />}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
