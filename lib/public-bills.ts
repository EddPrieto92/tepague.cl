"use client";

import type { Bill } from "./types";
import { upsertBill } from "./storage";

export async function fetchPublicBill(shareId: string) {
  const response = await fetch(`/api/bills/${encodeURIComponent(shareId)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No pudimos cargar esta cuenta. Intenta nuevamente.");
  const data = (await response.json()) as { bill: Bill };
  return upsertBill(data.bill);
}

export async function persistPublicBill(bill: Bill, participantId?: string) {
  const response = await fetch("/api/bills/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(participantId ? { "X-Participant-Id": participantId } : {}) },
    body: JSON.stringify(bill),
  });
  if (!response.ok) throw new Error("No pudimos guardar la cuenta. Revisa tu conexión e intenta nuevamente.");
  const data = (await response.json()) as { bill?: Bill };
  return upsertBill(data.bill ?? bill);
}
