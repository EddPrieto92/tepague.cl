"use client";

import type { Bill } from "./types";
import { upsertBill } from "./storage";
import { publicBillPayload } from "./public-bill-payload";

export async function fetchPublicBill(shareId: string) {
  const response = await fetch(`/api/bills/${encodeURIComponent(shareId)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No pudimos cargar esta cuenta. Intenta nuevamente.");
  const data = (await response.json()) as { bill: Bill };
  return upsertBill(data.bill);
}

export async function persistPublicBill(
  bill: Bill,
  participantId?: string,
  options: { requirePublicStorage?: boolean } = {},
) {
  const response = await fetch("/api/bills/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(participantId ? { "X-Participant-Id": participantId } : {}),
      ...(options.requirePublicStorage ? { "X-Require-Public-Storage": "true" } : {}),
    },
    body: JSON.stringify(publicBillPayload(bill)),
  });
  const data = (await response.json().catch(() => ({}))) as { bill?: Bill; error?: string };
  if (!response.ok) {
    if (data.error === "public_storage_unavailable") {
      throw new Error("No pudimos publicar la mesa porque el servicio de sincronización no está disponible. Intenta nuevamente en unos minutos.");
    }
    throw new Error("No pudimos guardar la cuenta. Revisa tu conexión e intenta nuevamente.");
  }
  return upsertBill(data.bill ? { ...data.bill, imageUrl: bill.imageUrl ?? data.bill.imageUrl } : bill);
}
