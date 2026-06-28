"use client";

import { Check, Clock, UsersRound } from "lucide-react";
import { useState } from "react";
import type { Bill } from "@/lib/types";
import { calculateDashboard, calculateItemClaimSummary, formatCLP } from "@/lib/calculations";
import { Card } from "./ui";

export function OrganizerDashboard({ bill }: { bill: Bill }) {
  const [productTab, setProductTab] = useState<"pending" | "paid">("pending");
  const dashboard = calculateDashboard(bill);
  const accountTotal = bill.total || (bill.receiptSubtotal ?? bill.subtotal) + bill.tip;
  const totalMissing = Math.max(0, accountTotal - dashboard.paidTotal);
  const claimedItems = bill.items
    .map((item) => ({ item, summary: calculateItemClaimSummary(bill, item) }))
    .filter(({ summary }) => summary.claimedAmount > 0);
  const statusLabels = {
    selecting: "Seleccionando",
    confirmed: "Confirmado",
    payment_pending: "Pago pendiente",
    paid: "Pagado",
    failed: "Falló",
    expired: "Expiró",
  } as const;

  function participantNamesForItem(itemId: string) {
    const names = bill.participants
      .filter((participant) => participant.items.some((claim) => claim.billItemId === itemId))
      .map((participant) => participant.name);
    return names.length ? names.join(", ") : "Sin reclamar";
  }

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
          <p className="mt-2 text-xl font-black">{formatCLP(totalMissing)}</p>
          <p className="text-[11px] font-bold uppercase text-ink/55">Faltante</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-black">Estado de la cuenta</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Consumo</dt><dd className="font-black">{formatCLP(bill.receiptSubtotal ?? bill.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Propina</dt><dd className="font-black">{formatCLP(bill.tip)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Total con propina</dt><dd className="font-black">{formatCLP(accountTotal)}</dd></div>
          <div className="flex justify-between"><dt className="font-bold text-ink/60">Consumo pagado</dt><dd className="font-black">{formatCLP(dashboard.paidTotal)}</dd></div>
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Productos</h2>
          <div className="grid grid-cols-2 rounded-lg border-2 border-ink bg-white p-1 text-xs font-black">
            <button
              className={productTab === "pending" ? "rounded-md bg-ink px-3 py-2 text-paper" : "rounded-md px-3 py-2 text-ink"}
              onClick={() => setProductTab("pending")}
              type="button"
            >
              Faltante
            </button>
            <button
              className={productTab === "paid" ? "rounded-md bg-ink px-3 py-2 text-paper" : "rounded-md px-3 py-2 text-ink"}
              onClick={() => setProductTab("paid")}
              type="button"
            >
              Pagado
            </button>
          </div>
        </div>
        <div className="mt-3 divide-y-2 divide-ink/10">
          {productTab === "pending" ? (
            dashboard.missingItems.length === 0 ? (
              <p className="py-4 text-sm font-bold text-ink/60">Todos los productos están cubiertos.</p>
            ) : dashboard.missingItems.map((item) => (
              <div className="flex items-center justify-between gap-3 py-3" key={item.itemId}>
                <div><p className="font-black">{item.name}</p><p className="text-xs font-bold text-ink/55">Cantidad faltante: {Number(item.remainingQuantity.toFixed(2))}</p></div>
                <p className="font-black text-tomato">{formatCLP(item.remainingAmount)}</p>
              </div>
            ))
          ) : (
            claimedItems.length === 0 ? (
              <p className="py-4 text-sm font-bold text-ink/60">Aún no hay productos pagados.</p>
            ) : claimedItems.map(({ item, summary }) => (
              <div className="flex items-center justify-between gap-3 py-3" key={item.id}>
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-xs font-bold text-ink/55">
                    Reclamado: {Number(summary.claimedQuantity.toFixed(2))} por {participantNamesForItem(item.id)}
                  </p>
                </div>
                <p className="font-black">{formatCLP(summary.claimedAmount)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
