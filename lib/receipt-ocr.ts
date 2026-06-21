"use client";

import { parseReceiptText, type ParsedReceipt } from "./receipt-parser";

export { parseReceiptText, type ParsedReceipt };

export type OcrProgress = {
  status: string;
  progress: number;
};

type ReceiptImageVariant = {
  label: string;
  url: string;
  kind: "full" | "items" | "totals";
};

export function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function contrastGray(gray: number, contrast: number, midpoint: number, lift: number) {
  return clampChannel((gray - midpoint) * contrast + lift);
}

function getReceiptCrop(image: HTMLImageElement) {
  const scanWidth = 420;
  const scanHeight = Math.round((image.height / image.width) * scanWidth);
  const canvas = document.createElement("canvas");
  canvas.width = scanWidth;
  canvas.height = scanHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { sx: 0, sy: 0, sw: image.width, sh: image.height };

  context.drawImage(image, 0, 0, scanWidth, scanHeight);
  const data = context.getImageData(0, 0, scanWidth, scanHeight).data;
  const colCounts = new Array(scanWidth).fill(0);
  const rowCounts = new Array(scanHeight).fill(0);

  for (let y = 0; y < scanHeight; y += 1) {
    for (let x = 0; x < scanWidth; x += 1) {
      const index = (y * scanWidth + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const luma = red * 0.299 + green * 0.587 + blue * 0.114;
      const saturation = max - min;

      if (luma > 86 && saturation < 138) {
        colCounts[x] += 1;
        rowCounts[y] += 1;
      }
    }
  }

  const minColCount = scanHeight * 0.035;
  const minRowCount = scanWidth * 0.045;
  const left = colCounts.findIndex((count) => count > minColCount);
  const right = colCounts.findLastIndex((count) => count > minColCount);
  const top = rowCounts.findIndex((count) => count > minRowCount);
  const bottom = rowCounts.findLastIndex((count) => count > minRowCount);

  if (left < 0 || right <= left || top < 0 || bottom <= top) {
    return { sx: 0, sy: 0, sw: image.width, sh: image.height };
  }

  const marginX = 52;
  const marginY = 24;
  const scaleX = image.width / scanWidth;
  const scaleY = image.height / scanHeight;
  const sx = Math.max(0, Math.round((left - marginX) * scaleX));
  const sy = Math.max(0, Math.round((top - marginY) * scaleY));
  const ex = Math.min(image.width, Math.round((right + marginX) * scaleX));
  const ey = Math.min(image.height, Math.round((bottom + marginY) * scaleY));

  return { sx, sy, sw: ex - sx, sh: ey - sy };
}

function drawReceiptVariant(image: HTMLImageElement, crop: ReturnType<typeof getReceiptCrop>, targetWidth: number, variant: "balanced" | "redChannel" | "threshold") {
  const scale = targetWidth / crop.sw;
  const width = Math.round(crop.sw * scale);
  const height = Math.round(crop.sh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("No se pudo preparar la imagen.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const saturation = max - min;
    const luma = red * 0.299 + green * 0.587 + blue * 0.114;
    const redDominant = red > green * 1.45 && red > blue * 1.45 && saturation > 80;

    let gray = luma;
    if (variant === "redChannel") {
      gray = redDominant ? red * 0.94 + green * 0.04 + blue * 0.02 : luma;
      gray = contrastGray(gray, redDominant ? 1.95 : 1.35, redDominant ? 132 : 122, redDominant ? 142 : 136);
    } else if (variant === "threshold") {
      const base = redDominant ? red : luma;
      const boosted = contrastGray(base, redDominant ? 2.25 : 1.55, redDominant ? 138 : 126, 142);
      gray = boosted > (redDominant ? 118 : 132) ? 255 : boosted < 72 ? 0 : boosted;
    } else {
      gray = contrastGray(luma, 1.32, 126, 138);
      gray = gray > 238 ? 255 : gray < 38 ? 0 : gray;
    }

    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
  }
  context.putImageData(imageData, 0, 0);

  return canvas;
}

function focusReceiptCrop(crop: ReturnType<typeof getReceiptCrop>, startRatio: number, endRatio: number) {
  const start = Math.max(0, Math.min(0.96, startRatio));
  const end = Math.max(start + 0.04, Math.min(1, endRatio));
  const y = crop.sy + crop.sh * start;
  const height = crop.sh * (end - start);
  return {
    sx: crop.sx,
    sy: Math.round(y),
    sw: crop.sw,
    sh: Math.round(height),
  };
}

export function prepareReceiptImage(file: File) {
  return new Promise<{ previewUrl: string; ocrUrl: string; ocrUrls: ReceiptImageVariant[] }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const crop = getReceiptCrop(image);
        const balanced = drawReceiptVariant(image, crop, 1600, "balanced");
        const redChannel = drawReceiptVariant(image, crop, 1900, "redChannel");
        const threshold = drawReceiptVariant(image, crop, 1900, "threshold");
        const zoomBody = drawReceiptVariant(image, focusReceiptCrop(crop, 0.16, 0.9), 2400, "redChannel");
        const zoomItems = drawReceiptVariant(image, focusReceiptCrop(crop, 0.22, 0.78), 2600, "redChannel");
        const zoomTotals = drawReceiptVariant(image, focusReceiptCrop(crop, 0.66, 1), 2400, "redChannel");
        const ocrUrls = [
          { label: "contraste", url: balanced.toDataURL("image/png"), kind: "full" as const },
          { label: "luz roja", url: redChannel.toDataURL("image/png"), kind: "full" as const },
          { label: "alto contraste", url: threshold.toDataURL("image/png"), kind: "full" as const },
          { label: "zoom cuerpo", url: zoomBody.toDataURL("image/png"), kind: "items" as const },
          { label: "zoom productos", url: zoomItems.toDataURL("image/png"), kind: "items" as const },
          { label: "zoom totales", url: zoomTotals.toDataURL("image/png"), kind: "totals" as const },
        ];

        resolve({
          previewUrl: balanced.toDataURL("image/jpeg", 0.72),
          ocrUrl: ocrUrls[0].url,
          ocrUrls,
        });
      } catch {
        reject(new Error("No se pudo preparar la imagen."));
      }
    };
    image.onerror = () => reject(new Error("No se pudo leer la foto."));
    image.src = URL.createObjectURL(file);
  });
}

function scoreReceipt(receipt: ParsedReceipt) {
  const metrics = getReceiptMetrics(receipt);
  return (
    metrics.saneItems * 4
    + (receipt.subtotal > 0 ? 3 : 0)
    + (receipt.total > 0 ? 3 : 0)
    + (receipt.tip > 0 ? 1 : 0)
    + metrics.receiptWords
    + (metrics.closeToTotal ? 5 : 0)
    + Math.min(4, Math.floor(metrics.textLines / 6))
  );
}

function getReceiptMetrics(receipt: ParsedReceipt) {
  const textLines = receipt.rawText.split(/\r?\n/).filter((line) => line.trim().length >= 4).length;
  const receiptWords = ["total", "propina", "producto", "consumo", "mesa"].filter((word) => receipt.rawText.toLowerCase().includes(word)).length;
  const saneItems = receipt.items.filter((item) => item.quantity >= 1 && item.quantity <= 20 && item.unitPrice >= 100 && item.unitPrice <= 80000).length;
  const itemTotal = receipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalTarget = receipt.subtotal || receipt.total;
  const closeToTotal = totalTarget > 0 && itemTotal > totalTarget * 0.55 && itemTotal < totalTarget * 1.25;

  return { closeToTotal, itemTotal, receiptWords, saneItems, textLines };
}

function totalsScore(receipt: ParsedReceipt) {
  return (receipt.subtotal > 0 ? 4 : 0) + (receipt.total > 0 ? 4 : 0) + (receipt.tip > 0 ? 2 : 0);
}

function isPlausibleAgainstReceiptTotal(receipt: ParsedReceipt, targetTotal: number) {
  if (targetTotal <= 0) return true;
  const itemTotal = getReceiptMetrics(receipt).itemTotal;
  if (itemTotal <= 0) return false;
  return itemTotal <= Math.round(targetTotal * 1.12);
}

function uniqueTextSections(sections: string[]) {
  const seen = new Set<string>();
  return sections.filter((section) => {
    const key = section.replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueOcrLines(texts: string[]) {
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const text of texts) {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      const key = trimmed
        .toLowerCase()
        .replace(/[^\p{L}\p{N}$]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (key.length < 4 || seen.has(key)) continue;
      seen.add(key);
      lines.push(trimmed);
    }
  }

  return lines;
}

function mergeBestReceiptParts(baseReceipt: ParsedReceipt | null, itemReceipt: ParsedReceipt | null, totalsReceipt: ParsedReceipt | null) {
  if (!baseReceipt) return parseReceiptText("");
  if (!itemReceipt || !totalsReceipt) return baseReceipt;

  const baseMetrics = getReceiptMetrics(baseReceipt);
  const itemMetrics = getReceiptMetrics(itemReceipt);
  const hasBetterTotals = totalsScore(totalsReceipt) >= totalsScore(baseReceipt);
  const targetTotal = totalsReceipt.subtotal || totalsReceipt.total || baseReceipt.subtotal || baseReceipt.total;
  const zoomItemsArePlausible = isPlausibleAgainstReceiptTotal(itemReceipt, targetTotal);
  const shouldUseZoomItems =
    zoomItemsArePlausible &&
    (itemMetrics.saneItems > baseMetrics.saneItems || (itemReceipt.items.length >= baseReceipt.items.length && itemMetrics.itemTotal > baseMetrics.itemTotal));

  if (!shouldUseZoomItems && !hasBetterTotals) return baseReceipt;

  return {
    ...baseReceipt,
    items: shouldUseZoomItems ? itemReceipt.items : baseReceipt.items,
    subtotal: hasBetterTotals ? totalsReceipt.subtotal : baseReceipt.subtotal,
    tip: hasBetterTotals ? totalsReceipt.tip : baseReceipt.tip,
    total: hasBetterTotals ? totalsReceipt.total : baseReceipt.total,
    rawText: uniqueTextSections([baseReceipt.rawText, itemReceipt.rawText, totalsReceipt.rawText]).join("\n\n--- zoom ---\n\n"),
  };
}

export async function recognizeReceiptImage(imageInput: string | ReceiptImageVariant[], onProgress: (progress: OcrProgress) => void) {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng", 1, {
    corePath: "/ocr/core",
    workerBlobURL: false,
    workerPath: "/ocr/worker/worker.min.js",
    logger: (message) => {
      const progress = typeof message.progress === "number" ? message.progress : 0;
      onProgress({ status: message.status ?? "Leyendo boleta", progress });
    },
  });

  try {
    const imageVariants = Array.isArray(imageInput) ? imageInput : [{ label: "contraste", url: imageInput, kind: "full" as const }];
    const rawTexts: string[] = [];
    const attempts = [
      { mode: Tesseract.PSM.SINGLE_COLUMN, label: "Leyendo boleta" },
      { mode: Tesseract.PSM.SPARSE_TEXT, label: "Reintentando lectura" },
    ];
    let bestReceipt: ParsedReceipt | null = null;
    let bestItemsReceipt: ParsedReceipt | null = null;
    let bestTotalsReceipt: ParsedReceipt | null = null;
    const receiptCandidates: ParsedReceipt[] = [];
    let bestScore = -1;
    let bestItemScore = -1;
    let bestTotalsScore = -1;
    const totalAttempts = imageVariants.length * attempts.length;
    let attemptIndex = 0;

    for (const variant of imageVariants) {
      for (const attempt of attempts) {
        await worker.setParameters({
          tessedit_pageseg_mode: attempt.mode,
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789$.,:-/% xX",
          preserve_interword_spaces: "1",
        });
        const baseProgress = 0.18 + (attemptIndex / totalAttempts) * 0.72;
        onProgress({ status: `${attempt.label}: ${variant.label}`, progress: baseProgress });
        const result = await worker.recognize(variant.url);
        rawTexts.push(result.data.text);
        const receipt = parseReceiptText(result.data.text, { preserveLineItems: true });
        receiptCandidates.push(receipt);
        const score = scoreReceipt(receipt);
        const itemScore = getReceiptMetrics(receipt).saneItems * 4 + Math.min(8, receipt.items.length * 2);
        const currentTotalsScore = totalsScore(receipt);
        if (score > bestScore) {
          bestReceipt = receipt;
          bestScore = score;
        }
        if (variant.kind !== "totals" && itemScore > bestItemScore) {
          bestItemsReceipt = receipt;
          bestItemScore = itemScore;
        }
        if (variant.kind !== "items" && currentTotalsScore > bestTotalsScore) {
          bestTotalsReceipt = receipt;
          bestTotalsScore = currentTotalsScore;
        }
        attemptIndex += 1;
      }
    }

    const targetTotal = bestTotalsReceipt?.subtotal || bestTotalsReceipt?.total || bestReceipt?.subtotal || bestReceipt?.total || 0;
    const plausibleBestReceipt = receiptCandidates
      .filter((receipt) => isPlausibleAgainstReceiptTotal(receipt, targetTotal))
      .reduce((best, receipt) => {
        if (!best) return receipt;
        return scoreReceipt(receipt) > scoreReceipt(best) ? receipt : best;
      }, null as ParsedReceipt | null);
    if (plausibleBestReceipt) bestReceipt = plausibleBestReceipt;

    const lineUnionReceipt = parseReceiptText(uniqueOcrLines(rawTexts).join("\n"), { preserveLineItems: true });
    if (isPlausibleAgainstReceiptTotal(lineUnionReceipt, targetTotal) && scoreReceipt(lineUnionReceipt) > scoreReceipt(bestReceipt ?? parseReceiptText(""))) {
      bestReceipt = lineUnionReceipt;
    }

    return mergeBestReceiptParts(bestReceipt, bestItemsReceipt, bestTotalsReceipt);
  } finally {
    await worker.terminate();
  }
}
