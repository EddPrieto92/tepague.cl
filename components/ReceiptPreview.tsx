"use client";

import { Clipboard, ReceiptText, X } from "lucide-react";
import { useState } from "react";
import { SecondaryButton } from "./ui";
import { copyTextToClipboard } from "@/lib/clipboard";

export function ReceiptPreview({ imageUrl, rawText }: { imageUrl?: string; rawText?: string }) {
  const [open, setOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const hasRawText = Boolean(rawText?.trim());
  if (!imageUrl && !hasRawText) return null;

  async function copyRawText() {
    if (!rawText) return;
    const copied = await copyTextToClipboard(rawText);
    setCopiedText(copied);
  }

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
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Boleta original" className="h-auto w-full rounded-lg border-2 border-ink bg-white object-contain" src={imageUrl} />
            ) : null}
            {hasRawText ? (
              <details className="mt-4 rounded-lg border-2 border-ink bg-white p-3">
                <summary className="cursor-pointer text-sm font-black">Texto OCR</summary>
                <button
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-ink bg-paper px-3 text-sm font-black"
                  type="button"
                  onClick={copyRawText}
                >
                  <Clipboard size={16} /> {copiedText ? "Texto copiado" : "Copiar texto OCR"}
                </button>
                {!copiedText ? <p className="mt-2 text-xs font-bold text-ink/60">Si el copiado falla, selecciona el texto de abajo.</p> : null}
                <textarea
                  className="mt-3 max-h-56 min-h-36 w-full resize-y rounded-lg border-2 border-ink bg-paper p-3 text-xs font-bold text-ink/75"
                  readOnly
                  value={rawText}
                />
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
