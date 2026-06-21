"use client";

import { Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Bill } from "@/lib/types";
import { Card, SecondaryButton } from "./ui";
import { WhatsAppShareButton } from "./WhatsAppShareButton";

export function ShareBill({ bill }: { bill: Bill }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = `${origin}/bill/${bill.shareId}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4 pb-40">
      <Card>
        <p className="text-sm font-black uppercase text-ink/60">Link de la mesa</p>
        <p className="mt-2 break-all rounded-lg bg-paper p-3 text-sm font-bold">{link}</p>
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-md gap-3">
          <SecondaryButton onClick={copy} type="button">
            <Copy size={18} /> {copied ? "Copiado" : "Copiar link"}
          </SecondaryButton>
          <WhatsAppShareButton bill={bill} />
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold"
            href={`/bill/${bill.shareId}`}
          >
            <ExternalLink size={18} /> Abrir link
          </Link>
        </div>
      </div>
    </div>
  );
}
