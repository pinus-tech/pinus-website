/** Client-only: compress images over 1 MB (when ≤3 MB source) so uploads stay ≤1 MB. */

import {
  isFileAccepted,
  normalizeAcceptedFileTypes,
} from "@/lib/forms/file-accepted";

export const FORM_FILE_MAX_BYTES = 1024 * 1024;
export const FORM_FILE_MAX_SOURCE_BYTES = 3 * 1024 * 1024;

const IMAGE_TYPES = /^image\/(jpeg|png|gif|webp)$/i;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("Canvas not available"));
  }
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      quality
    );
  });
}

async function compressImageToMaxBytes(
  file: File,
  maxBytes: number
): Promise<{ blob: Blob; filename: string; contentType: string }> {
  const img = await loadImageElement(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const maxDim = 2400;
  if (width > maxDim || height > maxDim) {
    const scale = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  let quality = 0.9;
  let blob: Blob | null = null;

  for (let round = 0; round < 18; round++) {
    blob = await canvasToJpegBlob(img, width, height, quality);
    if (blob.size <= maxBytes) {
      const base = file.name.replace(/\.[^.]+$/, "") || "upload";
      return {
        blob,
        filename: `${base}.jpg`,
        contentType: "image/jpeg",
      };
    }
    if (quality > 0.42) {
      quality -= 0.06;
    } else {
      width = Math.max(320, Math.round(width * 0.88));
      height = Math.max(320, Math.round(height * 0.88));
      quality = 0.82;
    }
  }

  throw new Error(
    "Could not compress image below 1 MB. Use a smaller or lower-resolution image."
  );
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export type PrepareFormFileOptions = {
  /** Subset of jpeg | png | gif | webp | pdf. Empty/undefined = all types. */
  acceptedTypes?: string[] | null;
};

/**
 * Returns a blob ready to upload (≤ FORM_FILE_MAX_BYTES when possible).
 * PDFs over 1 MB are rejected (no client compression).
 */
export async function prepareFormFileForUpload(
  file: File,
  options?: PrepareFormFileOptions
): Promise<{
  blob: Blob;
  filename: string;
  contentType: string;
}> {
  const accepted = normalizeAcceptedFileTypes(options?.acceptedTypes);
  if (accepted.length === 0) {
    throw new Error("No file types are allowed for this question.");
  }

  if (file.size > FORM_FILE_MAX_SOURCE_BYTES) {
    throw new Error("File must be 3 MB or smaller.");
  }

  if (!isFileAccepted(file, accepted)) {
    throw new Error("This file type is not allowed for this question.");
  }

  if (isPdfFile(file)) {
    if (file.size > FORM_FILE_MAX_BYTES) {
      throw new Error("PDF must be 1 MB or smaller.");
    }
    return {
      blob: file,
      filename: file.name,
      contentType: file.type || "application/pdf",
    };
  }

  if (!IMAGE_TYPES.test(file.type || "")) {
    throw new Error("Unsupported image format.");
  }

  if (file.size <= FORM_FILE_MAX_BYTES) {
    return {
      blob: file,
      filename: file.name,
      contentType: file.type || "image/jpeg",
    };
  }

  return compressImageToMaxBytes(file, FORM_FILE_MAX_BYTES);
}

/** Marketplace listing images only - same size rules as form uploads. */
export async function prepareMarketplaceListingImage(file: File) {
  return prepareFormFileForUpload(file, {
    acceptedTypes: ["jpeg", "png", "gif", "webp"],
  });
}
