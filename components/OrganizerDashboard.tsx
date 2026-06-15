import { Check, Clock, UsersRound } from "lucide-react";
import type { Bill } from "@/lib/types";
import { calculateDashboard, formatCLP } from "@/lib/calculations";
import { Card } from "./ui";

export function OrganizerDashboard({ bill }: { bill: Bill }) {
  const dashboard = calculateDashboard(bill);

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
        <h2 className="text-lg font-black">Participantes</h2>
        <div className="mt-3 divide-y-2 divide-ink/10">
          {dashboard.participants.length === 0 ? (
            <p className="py-5 text-center text-sm font-bold text-ink/60">Todavia nadie ha entrado.</p>
          ) : (
            dashboard.participants.map((participant) => (
              <div className="flex items-center justify-between gap-3 py-3" key={participant.id}>
                <div>
                  <p className="font-black">{participant.name}</p>
                  <p className="text-xs font-bold uppercase text-ink/55">{participant.status}</p>
                </div>
                <p className="font-black">{formatCLP(participant.totalAmount)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
