"use client";

import { useEffect, useState } from "react";
import { fetchPublicBill, persistPublicBill } from "./public-bills";
import { getBillByShareId } from "./storage";
import type { Bill } from "./types";

export function usePublicBill(shareId?: string, refreshMs = 0) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(shareId));

  useEffect(() => {
    if (!shareId) return;
    let active = true;
    let loadingRequest = false;
    async function load() {
      if (loadingRequest) return;
      loadingRequest = true;
      try {
        let nextBill = await fetchPublicBill(shareId as string);
        const cachedBill = getBillByShareId(shareId as string);
        if (!nextBill && cachedBill) nextBill = await persistPublicBill(cachedBill);
        if (!active) return;
        setBill(nextBill);
        setError(nextBill ? "" : "Esta cuenta no existe o ya no está disponible.");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "No pudimos cargar la cuenta.");
      } finally {
        loadingRequest = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = refreshMs > 0 ? window.setInterval(() => void load(), refreshMs) : undefined;
    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
    };
  }, [shareId, refreshMs]);

  return { bill, setBill, error, loading };
}
