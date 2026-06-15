"use client";

import type { BillItem } from "./types";

export type OcrProgress = {
  status: string;
  progress: number;
};

export type ParsedReceipt = {
  items: Omit<BillItem, "id" | "billId">[];
  subtotal: number;
  tip: number;
  total: number;
  rawText: string;
};

const PRICE_PATTERN = /[$§]?\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,7})(?:\s*(?:clp|pesos)?)?$/i;
const QUANTITY_PATTERN = /(?:^|[\s|])([1-9]\d?)\s*[xX]\s+/;
const TOTAL_WORDS = ["total", "subtotal", "propina", "iva", "neto", "descuento", "vuelto", "efectivo", "tarjeta", "debito", "credito"];
const IGNORE_WORDS = ["comentario", "comment", "agrandar", "mesero", "mesa", "fecha", "cuenta", "boleta", "puedes", "experiencia"];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[|_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value: string) {
  const normalized = value.replace(/\s/g, "");
  const shortThousands = normalized.match(/(\d{1,3})[.,](\d{2})$/);
  if (shortThousands) return Number(`${shortThousands[1]}${shortThousands[2]}0`);

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

function looksLikeTotalLine(name: string) {
  const normalized = normalizeText(name).toLowerCase();
  return (
    normalized.startsWith("tot") ||
    normalized.includes("prop") ||
    normalized.includes("fprop") ||
    TOTAL_WORDS.some((word) => normalized.includes(word))
  );
}

function looksLikeIgnoredLine(name: string) {
  const normalized = normalizeText(name).toLowerCase();
  return IGNORE_WORDS.some((word) => normalized.includes(word));
}

function cleanProductName(value: string) {
  return normalizeText(value)
    .replace(/^.*?(\d+\s*[xX]\s+)/, "$1")
    .replace(/^\d+\s*[xX]\s+/, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N})\]]+$/u, "")
    .slice(0, 52);
}

function parseQuantity(value: string) {
  const match = normalizeText(value).match(QUANTITY_PATTERN);
  return match ? Number(match[1]) : 1;
}

type ParsedLine = {
  index: number;
  line: string;
  leftSide: string;
  name: string;
  price: number;
  quantity: number;
  hasQuantity: boolean;
};

function inferReceiptTotals(lines: ParsedLine[]) {
  let subtotal = 0;
  let tip = 0;
  let total = 0;

  for (const parsedLine of lines) {
    const normalized = normalizeText(parsedLine.line).toLowerCase();
    if (normalized.includes("propina") && !normalized.includes("c/prop")) {
      tip = Math.max(tip, parsedLine.price);
      continue;
    }
    if (normalized.includes("c/prop") || (normalized.includes("propina") && normalized.includes("total"))) {
      total = Math.max(total, parsedLine.price);
      continue;
    }
    if (normalized.startsWith("tot") || normalized.includes("subtotal")) {
      subtotal = Math.max(subtotal, parsedLine.price);
    }
  }

  const noQuantityBottomLines = lines
    .filter((line) => !line.hasQuantity && line.price >= 1000)
    .slice(-7);
  const noQuantityBottomPrices = noQuantityBottomLines.map((line) => line.price);

  const largeBottomPrices = noQuantityBottomPrices.filter((price) => price >= 50000);
  if (!subtotal && largeBottomPrices.length >= 1) subtotal = largeBottomPrices[0];
  if (!total && largeBottomPrices.length >= 2) total = largeBottomPrices.at(-1) ?? 0;

  if (!tip && subtotal > 0) {
    const subtotalIndex = noQuantityBottomPrices.findIndex((price) => price === subtotal);
    const totalIndex = total > 0 ? noQuantityBottomPrices.findLastIndex((price) => price === total) : -1;
    const betweenFinalTotals =
      subtotalIndex >= 0 && totalIndex > subtotalIndex
        ? noQuantityBottomPrices.slice(subtotalIndex + 1, totalIndex)
        : noQuantityBottomPrices;
    const likelyTip = betweenFinalTotals.find((price) => price >= Math.round(subtotal * 0.05) && price <= Math.round(subtotal * 0.2));
    if (likelyTip) tip = likelyTip;
  }

  if (subtotal > 0 && tip > 0) {
    const expectedTotal = subtotal + tip;
    if (!total) {
      total = expectedTotal;
    }
  }

  return { subtotal, tip, total };
}

function reconcileLikelyChileanPrices(items: Omit<BillItem, "id" | "billId">[], subtotal: number) {
  const currentTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  let missing = subtotal - currentTotal;
  if (subtotal <= 0 || missing <= 0 || missing > 1200 || missing % 10 !== 0) return items;

  const corrected = items.map((item) => ({ ...item }));
  const candidates = corrected.filter((item) => item.quantity === 1 && item.totalPrice % 1000 === 930);
  for (const item of candidates) {
    if (missing < 60) break;
    item.totalPrice += 60;
    item.unitPrice += 60;
    missing -= 60;
  }

  return missing === 0 ? corrected : items;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 4);

  const parsedLines: ParsedLine[] = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(PRICE_PATTERN);
    if (!match) continue;

    const priceFragment = line.slice(match.index ?? 0);
    const hasCurrencyMarker = /[$§]/.test(priceFragment);
    if (!hasCurrencyMarker && !QUANTITY_PATTERN.test(line)) continue;

    const price = parsePrice(match[1]);
    if (price < 100 || price > 9999999) continue;

    const leftSide = line.slice(0, match.index);
    const quantity = parseQuantity(leftSide);
    const hasQuantity = QUANTITY_PATTERN.test(normalizeText(leftSide));
    const name = cleanProductName(leftSide);
    parsedLines.push({ index, line, leftSide, name, price, quantity, hasQuantity });
  }

  const totals = inferReceiptTotals(parsedLines);
  const items: Omit<BillItem, "id" | "billId">[] = [];

  for (const parsedLine of parsedLines) {
    const { name, price, quantity, hasQuantity } = parsedLine;
    if (!name || looksLikeTotalLine(name) || looksLikeIgnoredLine(name)) continue;
    if (!hasQuantity && totals.subtotal > 0 && price >= Math.round(totals.subtotal * 0.75)) continue;
    if (!hasQuantity && totals.total > 0 && price >= Math.round(totals.total * 0.75)) continue;

    items.push({
      name,
      quantity,
      unitPrice: Math.round(price / quantity),
      totalPrice: price,
      isShared: false,
    });
  }

  const deduped = items.filter((item, index, candidates) => {
    const key = `${item.name.toLowerCase()}:${item.totalPrice}`;
    return candidates.findIndex((candidate) => `${candidate.name.toLowerCase()}:${candidate.totalPrice}` === key) === index;
  });

  return {
    items: reconcileLikelyChileanPrices(deduped, totals.subtotal).slice(0, 30),
    subtotal: totals.subtotal,
    tip: totals.tip,
    total: totals.total,
    rawText: text,
  };
}

export function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

export function prepareReceiptImage(file: File) {
  return new Promise<{ previewUrl: string; ocrUrl: string }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const crop = getReceiptCrop(image);
      const targetWidth = 1500;
      const scale = targetWidth / crop.sw;
      const width = Math.round(crop.sw * scale);
      const height = Math.round(crop.sh * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("No se pudo preparar la imagen."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);

      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let index = 0; index < data.length; index += 4) {
        const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
        const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.22 + 138));
        const sharpened = contrasted > 235 ? 255 : contrasted < 42 ? 0 : contrasted;
        data[index] = sharpened;
        data[index + 1] = sharpened;
        data[index + 2] = sharpened;
      }
      context.putImageData(imageData, 0, 0);

      resolve({
        previewUrl: canvas.toDataURL("image/jpeg", 0.72),
        ocrUrl: canvas.toDataURL("image/png"),
      });
    };
    image.onerror = () => reject(new Error("No se pudo leer la foto."));
    image.src = URL.createObjectURL(file);
  });
}

export async function recognizeReceiptImage(imageUrl: string, onProgress: (progress: OcrProgress) => void) {
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
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÜÑáéíóúüñ0123456789$.,:-/ xX",
      preserve_interword_spaces: "1",
    });
    const result = await worker.recognize(imageUrl);
    return parseReceiptText(result.data.text);
  } finally {
    await worker.terminate();
  }
}
