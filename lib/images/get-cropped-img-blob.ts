import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/** Renders the cropped region to a JPEG blob (marketplace listing photos). */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  quality = 0.92
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  canvas.width = Math.max(1, Math.floor(pixelCrop.width));
  canvas.height = Math.max(1, Math.floor(pixelCrop.height));

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
      "image/jpeg",
      quality
    );
  });
}
