import type { Bill } from "@/lib/types";
import { calculateFunSummary, formatCLP } from "@/lib/calculations";
import { Card } from "./ui";

export function FunSummaryCard({ bill }: { bill: Bill }) {
  const summary = calculateFunSummary(bill);
  const rows = [
    ["Rey del gasto", summary.kingOfSpend ? `${summary.kingOfSpend.name} (${formatCLP(summary.kingOfSpend.totalAmount)})` : "Pendiente"],
    ["El mas piola", summary.mostChill ? `${summary.mostChill.name} (${formatCLP(summary.mostChill.totalAmount)})` : "Pendiente"],
    ["Primero en pagar", summary.firstPaid?.name ?? "Pendiente"],
    ["Ultimo pendiente", summary.lastPending?.name ?? "Pendiente"],
    ["Mas compartido", summary.mostSharedItem?.name ?? "Pendiente"],
    ["Producto estrella", summary.starProduct?.name ?? "Pendiente"],
  ];

  return (
    <Card>
      <h2 className="text-lg font-black">Resumen final</h2>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-paper p-3" key={label}>
            <span className="text-sm font-black">{label}</span>
            <span className="text-right text-sm font-bold text-ink/70">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
