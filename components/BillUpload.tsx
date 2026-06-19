"use client";

import { AlertCircle, Camera, ImagePlus, ReceiptText, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Button, Card, Input, Label } from "./ui";
import { trackEvent } from "@/lib/analytics";
import { createBillFromTitle } from "@/lib/storage";
import { persistPublicBill } from "@/lib/public-bills";
import { prepareReceiptImage, recognizeReceiptImage, type OcrProgress, type ParsedReceipt } from "@/lib/receipt-ocr";
import type { OcrStatus } from "@/lib/types";

export function BillUpload() {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("Mesa viernes");
  const [imageName, setImageName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("empty");

  async function scanFile(file: File, source: "camera" | "gallery") {
    const startedAt = performance.now();
    setError("");
    setParsedReceipt(null);
    setOcrText("");
    setImageName(file.name);
    setIsScanning(true);
    setOcrStatus("empty");
    setOcrProgress({ status: "Mejorando foto", progress: 0.08 });
    trackEvent("receipt_image_selected", {
      source,
      file_type: file.type || "unknown",
      file_size_kb: Math.round(file.size / 1024),
    });

    try {
      const prepared = await prepareReceiptImage(file);
      setPreviewUrl(prepared.previewUrl);
      setOcrProgress({ status: "Leyendo texto", progress: 0.18 });
      const receipt = await recognizeReceiptImage(prepared.ocrUrl, setOcrProgress);
      setParsedReceipt(receipt);
      setOcrText(receipt.rawText);
      const hasAnyData = receipt.items.length > 0 || receipt.subtotal > 0 || receipt.tip > 0 || receipt.total > 0 || receipt.rawText.trim().length >= 4;
      const nextStatus: OcrStatus = receipt.items.length > 0 && receipt.total > 0 ? "success" : hasAnyData ? "partial" : "empty";
      setOcrStatus(nextStatus);
      trackEvent("receipt_ocr_completed", {
        source,
        duration_ms: Math.round(performance.now() - startedAt),
        item_count: receipt.items.length,
        subtotal_detected: receipt.subtotal > 0,
        tip_detected: receipt.tip > 0,
        total_detected: receipt.total > 0,
      });
      trackEvent(nextStatus === "partial" ? "ocr_partial" : "ocr_completed", { item_count: receipt.items.length });
    } catch (scanError) {
      trackEvent("receipt_ocr_failed", {
        source,
        duration_ms: Math.round(performance.now() - startedAt),
      });
      trackEvent("ocr_failed");
      setOcrStatus("failed");
      setError(scanError instanceof Error ? scanError.message : "No pudimos leer la imagen. Prueba con otra foto o ingresa los productos manualmente.");
    } finally {
      setIsScanning(false);
      setOcrProgress(null);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, source: "camera" | "gallery") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void scanFile(file, source);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const bill = createBillFromTitle(title.trim() || "Mesa sin nombre", previewUrl, parsedReceipt?.items ?? [], parsedReceipt ?? undefined, ocrStatus);
      await persistPublicBill(bill);
      trackEvent("bill_created", {
        has_ocr: Boolean(parsedReceipt),
        item_count: parsedReceipt?.items.length ?? 0,
        subtotal_detected: Boolean(parsedReceipt?.subtotal),
        tip_detected: Boolean(parsedReceipt?.tip),
        total_detected: Boolean(parsedReceipt?.total),
      });
      window.sessionStorage.setItem("mesa-cobrada:active-bill", bill.shareId);
      router.push("/create/review");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No pudimos guardar la mesa.");
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
          <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink bg-paper px-4 py-5 text-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="mb-3 max-h-44 w-full rounded-md object-contain" src={previewUrl} alt="Boleta cargada" />
            ) : (
              <Camera size={24} />
            )}
            <span className="mt-2 text-sm font-bold">{imageName || "Agrega una foto de la boleta"}</span>
            <span className="mt-1 text-xs font-bold text-ink/55">La lectura se hace en tu navegador.</span>
            <div className="mt-4 grid w-full grid-cols-2 gap-2">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white px-3 text-sm font-black text-ink disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isScanning}
                type="button"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus size={18} /> Cargar imagen
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-3 text-sm font-black text-ink disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isScanning}
                type="button"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={18} /> Tomar foto
              </button>
            </div>
            <input
              className="sr-only"
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              disabled={isScanning}
              onChange={(event) => handleFileChange(event, "gallery")}
            />
            <input
              className="sr-only"
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={isScanning}
              onChange={(event) => handleFileChange(event, "camera")}
            />
          </div>
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

        {!isScanning && parsedReceipt && ocrStatus !== "empty" ? (
          <div className="mt-4 rounded-lg border-2 border-ink bg-limewash p-3">
            <p className="text-sm font-black">
              {ocrStatus === "success" ? `Detectamos ${parsedReceipt.items.length} productos.` : "Detectamos algunos datos, revísalos antes de compartir."}
            </p>
            <p className="mt-1 text-xs font-bold text-ink/65">Puedes corregir nombres, cantidades y precios.</p>
          </div>
        ) : null}

        {!isScanning && parsedReceipt && ocrStatus === "empty" ? (
          <div className="mt-4 rounded-lg border-2 border-ink bg-white p-3 text-sm font-bold">
            No logramos detectar productos claros. Puedes cargar la cuenta manualmente.
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
