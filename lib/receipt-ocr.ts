"use client";

import { parseReceiptText, type ParsedReceipt } from "./receipt-parser";

export { parseReceiptText, type ParsedReceipt };

export type OcrProgress = {
  status: string;
  progress: number;
};

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
