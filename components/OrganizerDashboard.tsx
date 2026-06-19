import { Check, Clock, UsersRound } from "lucide-react";
import type { Bill } from "@/lib/types";
import { calculateDashboard, formatCLP } from "@/lib/calculations";
import { Card } from "./ui";

export function OrganizerDashboard({ bill }: { bill: Bill }) {
  const dashboard = calculateDashboard(bill);
  const statusLabels = {
    selecting: "Seleccionando",
    confirmed: "Confirmado",
    payment_pending: "Pago pendiente",
    paid: "Pagado",
    failed: "Falló",
    expired: "Expiró",
  } as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <UsersRound size={18} />
          <p className="mt-2 text-xl font-black">{dashboard.participants.length}</p>
          <p className="text-[11px] font-bold uppercase text-ink/55">Personas</p>
        </Card>
        <Card className="p-3">
          <Check size={18} />
          <p className="mt-2 text-xl font-black">{formatCLP(dashboard.paidTotal)}</p>
          <p className="text-[11px] font-bold uppercase text-ink/55">Pagado</p>
        </Card>
        <Card className="p-3">
          <Clock size={18} />
          <p className="mt-2 text-xl font-black">{formatCLP(dashboard.pendingTotal)}</p>
          <p className="text-[11px] font-bold uppercase text-ink/55">Pendiente</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-black">Estado de la cuenta</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Total boleta</dt><dd className="font-black">{formatCLP(bill.receiptTotal ?? bill.total)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Total reclamado</dt><dd className="font-black">{formatCLP(dashboard.claimedTotal)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Faltante</dt><dd className="font-black text-tomato">{formatCLP(dashboard.missingClaimAmount)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Pagado</dt><dd className="font-black">{formatCLP(dashboard.paidTotal)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Pendiente de pago</dt><dd className="font-black">{formatCLP(dashboard.pendingTotal)}</dd></div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Participantes</h2>
        <div className="mt-3 divide-y-2 divide-ink/10">
          {dashboard.participants.length === 0 ? (
            <p className="py-5 text-center text-sm font-bold text-ink/60">Todavia nadie ha entrado.</p>
          ) : (
            dashboard.participants.map((participant) => (
              <div className="flex items-center justify-between gap-3 py-3" key={participant.id}>
                <div>
                  <p className="font-black">{participant.name}</p>
                  <p className="text-xs font-bold uppercase text-ink/55">{statusLabels[participant.status]}</p>
                </div>
                <p className="font-black">{formatCLP(participant.totalAmount)}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black">Faltan por reclamar</h2>
        <div className="mt-3 divide-y-2 divide-ink/10">
          {dashboard.missingItems.length === 0 ? <p className="py-4 text-sm font-bold text-ink/60">Todos los productos están cubiertos.</p> : dashboard.missingItems.map((item) => (
            <div className="flex items-center justify-between gap-3 py-3" key={item.itemId}>
              <div><p className="font-black">{item.name}</p><p className="text-xs font-bold text-ink/55">Cantidad faltante: {Number(item.remainingQuantity.toFixed(2))}</p></div>
              <p className="font-black text-tomato">{formatCLP(item.remainingAmount)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
