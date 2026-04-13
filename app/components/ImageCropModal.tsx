"use client";

import React, { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImageBlob } from "@/lib/images/get-cropped-img-blob";
import { Button } from "@/app/components/ui/button";

type ImageCropModalProps = {
  imageSrc: string | null;
  open: boolean;
  onCancel: () => void;
  onComplete: (file: File) => void;
  /** Defaults to a neutral title. */
  title?: string;
  /** Helper text under the title. */
  description?: string;
  /** Label for the primary button. */
  completeLabel?: string;
  /** Filename for the cropped JPEG File. */
  outputFileName?: string;
  /**
   * Crop frame width/height. Marketplace and form question images use 4∶3;
   * form header banners use a wider ratio (see `FORM_HEADER_IMAGE_CROP_ASPECT`).
   */
  aspect?: number;
};

export function ImageCropModal({
  imageSrc,
  open,
  onCancel,
  onComplete,
  title = "Adjust your photo",
  description = "Drag to reposition, use the slider to zoom. Larger files are compressed to fit upload limits.",
  completeLabel = "Use this photo",
  outputFileName = "image.jpg",
  aspect = 4 / 3,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_c: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx);
  }, []);

  const apply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], outputFileName, { type: "image/jpeg" });
      onComplete(file);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2
            id="image-crop-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <div
          className={`relative mx-auto w-full bg-gray-900 ${
            aspect >= 2
              ? "h-[min(380px,52vh)]"
              : "h-[min(420px,52vh)]"
          }`}
        >
          <Cropper
            key={`${imageSrc}-${aspect}`}
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            objectFit="contain"
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-blue-600"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="black" outline onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="blue" disabled={busy} onClick={apply}>
              {busy ? "Processing…" : completeLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
