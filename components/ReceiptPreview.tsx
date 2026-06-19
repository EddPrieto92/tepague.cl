"use client";

import { ReceiptText, X } from "lucide-react";
import { useState } from "react";
import { SecondaryButton } from "./ui";

export function ReceiptPreview({ imageUrl }: { imageUrl?: string }) {
  const [open, setOpen] = useState(false);
  if (!imageUrl) return null;

  return (
    <>
      <SecondaryButton className="w-full" onClick={() => setOpen(true)} type="button">
        <ReceiptText size={18} /> Ver boleta
      </SecondaryButton>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/70 p-3" role="dialog" aria-modal="true" aria-label="Vista de la boleta">
          <div className="mx-auto max-h-[92svh] w-full max-w-md overflow-auto rounded-t-2xl border-2 border-ink bg-paper p-4 shadow-soft">
            <div className="sticky top-0 mb-3 flex items-center justify-between bg-paper py-1">
              <h2 className="text-xl font-black">Boleta original</h2>
              <button className="grid size-10 place-items-center rounded-lg border-2 border-ink bg-white" onClick={() => setOpen(false)} type="button" aria-label="Cerrar boleta">
                <X size={20} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Boleta original" className="h-auto w-full rounded-lg border-2 border-ink bg-white object-contain" src={imageUrl} />
          </div>
        </div>
      ) : null}
    </>
  );
}
