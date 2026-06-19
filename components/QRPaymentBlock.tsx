"use client";

import Image from "next/image";
import { QrCode, X } from "lucide-react";
import { useState } from "react";
import { SecondaryButton } from "./ui";

export function QRPaymentBlock({ url }: { url?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SecondaryButton className="w-full" onClick={() => setOpen(true)} type="button"><QrCode size={18} /> Ver QR</SecondaryButton>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/70 p-3" role="dialog" aria-modal="true" aria-label="Código QR de pago">
          <div className="mx-auto w-full max-w-md rounded-t-2xl border-2 border-ink bg-white p-5 text-center">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">QR de pago</h2><button className="grid size-10 place-items-center rounded-lg border-2 border-ink" onClick={() => setOpen(false)} type="button" aria-label="Cerrar QR"><X size={20} /></button></div>
            {url ? <Image alt="QR de pago" className="mx-auto rounded-lg border-2 border-ink" height={220} src={url} width={220} /> : <div className="mx-auto grid size-52 place-items-center rounded-lg border-2 border-dashed border-ink bg-paper"><QrCode size={72} /></div>}
            <p className="mt-3 text-sm font-bold text-ink/65">{url ? "Escanea para pagar" : "QR pendiente de cargar"}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
