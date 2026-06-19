"use client";

import { UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import type { Bill } from "@/lib/types";
import { addParticipant } from "@/lib/storage";
import { persistPublicBill } from "@/lib/public-bills";
import { trackEvent } from "@/lib/analytics";
import { Button, Card, Input, Label } from "./ui";

export function ParticipantEntry({ bill }: { bill: Bill }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const nextBill = addParticipant(bill, name.trim() || "Invitado");
      const participant = nextBill.participants.at(-1);
      if (participant) {
        await persistPublicBill(nextBill, participant.id);
        trackEvent("participant_started", { bill_share_id: bill.shareId });
        window.location.href = `/bill/${bill.shareId}/join?participantId=${participant.id}`;
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar tu acceso.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Card>
        <div className="grid size-14 place-items-center rounded-lg bg-aqua text-white">
          <UserRound size={28} />
        </div>
        <h1 className="mt-4 text-3xl font-black leading-none">{bill.title}</h1>
        <p className="mt-2 text-sm font-semibold text-ink/65">Escribe tu nombre y reclama tus consumos.</p>
        <div className="mt-5">
          <Label>Tu nombre</Label>
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nico" />
        </div>
      </Card>
      {error ? <p className="rounded-lg bg-tomato/10 p-3 text-sm font-bold text-tomato">{error}</p> : null}
      <Button className="w-full" type="submit">
        Entrar
      </Button>
    </form>
  );
}
