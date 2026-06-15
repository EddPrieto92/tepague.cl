"use client";

import { AlertCircle, Camera, ReceiptText, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card, Input, Label } from "./ui";
import { createBillFromTitle } from "@/lib/storage";
import { prepareReceiptImage, recognizeReceiptImage, type OcrProgress, type ParsedReceipt } from "@/lib/receipt-ocr";

export function BillUpload() {
  const router = useRouter();
  const [title, setTitle] = useState("Mesa viernes");
  const [imageName, setImageName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  async function scanFile(file: File) {
    setError("");
    setParsedReceipt(null);
    setOcrText("");
    setImageName(file.name);
    setIsScanning(true);
    setOcrProgress({ status: "Mejorando foto", progress: 0.08 });

    try {
      const prepared = await prepareReceiptImage(file);
      setPreviewUrl(prepared.previewUrl);
      setOcrProgress({ status: "Leyendo texto", progress: 0.18 });
      const receipt = await recognizeReceiptImage(prepared.ocrUrl, setOcrProgress);
      setParsedReceipt(receipt);
      setOcrText(receipt.rawText);
      if (receipt.items.length === 0) {
        setError("No encontre productos claros. Puedes crear la mesa igual y cargarlos manualmente.");
      }
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "No se pudo escanear la boleta.");
    } finally {
      setIsScanning(false);
      setOcrProgress(null);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const bill = createBillFromTitle(title.trim() || "Mesa sin nombre", imageName, parsedReceipt?.items ?? [], parsedReceipt ?? undefined);
      window.sessionStorage.setItem("mesa-cobrada:active-bill", bill.shareId);
      router.push("/create/review");
    } catch {
      setError("No pude guardar la mesa. Prueba con una foto mas liviana o continua sin guardar la imagen.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-tomato text-white">
            <ReceiptText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black leading-none">Sube la cuenta</h1>
            <p className="mt-1 text-sm font-semibold text-ink/65">Despues cada uno reclama lo suyo.</p>
          </div>
        </div>

        <Label>Nombre mesa</Label>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Cumple Nico" />

        <div className="mt-4">
          <Label>Foto boleta</Label>
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink bg-paper px-4 text-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mb-3 max-h-44 w-full rounded-md object-contain" src={previewUrl} alt="Boleta cargada" />
            ) : (
              <Camera size={24} />
            )}
            <span className="mt-2 text-sm font-bold">{imageName || "Tomar foto o cargar imagen"}</span>
            <span className="mt-1 text-xs font-bold text-ink/55">La lectura se hace en tu navegador.</span>
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isScanning}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void scanFile(file);
              }}
            />
          </label>
        </div>

        {isScanning && ocrProgress ? (
          <div className="mt-4 rounded-lg border-2 border-ink bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-black">
              <span className="inline-flex items-center gap-2">
                <ScanLine size={16} /> {ocrProgress.status}
              </span>
              <span>{Math.round(ocrProgress.progress * 100)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-paper">
              <div className="h-full bg-aqua" style={{ width: `${Math.max(8, Math.round(ocrProgress.progress * 100))}%` }} />
            </div>
          </div>
        ) : null}

        {!isScanning && parsedReceipt && parsedReceipt.items.length > 0 ? (
          <div className="mt-4 rounded-lg border-2 border-ink bg-limewash p-3">
            <p className="text-sm font-black">Detecte {parsedReceipt.items.length} productos.</p>
            <p className="mt-1 text-xs font-bold text-ink/65">Los vas a poder corregir antes de compartir la cuenta.</p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 flex gap-2 rounded-lg border-2 border-ink bg-white p-3 text-sm font-bold text-ink/75">
            <AlertCircle className="mt-0.5 shrink-0 text-tomato" size={18} />
            <p>{error}</p>
          </div>
        ) : null}

        {ocrText ? (
          <details className="mt-4 rounded-lg border-2 border-ink bg-paper p-3">
            <summary className="cursor-pointer text-sm font-black">Texto detectado</summary>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs font-bold text-ink/70">{ocrText}</pre>
          </details>
        ) : null}
      </Card>

      <Button className="w-full" disabled={isScanning} type="submit">
        {isScanning ? "Escaneando" : parsedReceipt && parsedReceipt.items.length > 0 ? "Revisar productos" : "Crear mesa manual"}
      </Button>
    </form>
  );
}
