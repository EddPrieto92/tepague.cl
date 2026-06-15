import Image from "next/image";
import { QrCode } from "lucide-react";
import { Card } from "./ui";

export function QRPaymentBlock({ url }: { url?: string }) {
  return (
    <Card className="text-center">
      {url ? (
        <Image alt="QR de pago" className="mx-auto rounded-lg border-2 border-ink" height={180} src={url} width={180} />
      ) : (
        <div className="mx-auto grid size-44 place-items-center rounded-lg border-2 border-dashed border-ink bg-paper">
          <QrCode size={72} />
        </div>
      )}
      <p className="mt-3 text-sm font-bold text-ink/65">{url ? "Escanea para pagar" : "QR pendiente de cargar"}</p>
    </Card>
  );
}
