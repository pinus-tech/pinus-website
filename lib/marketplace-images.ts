/** Normalize listing images from DB: prefers `imageUrls`, falls back to legacy `imageUrl`. */

export const MAX_MARKETPLACE_IMAGES = 5;

export function normalizeListingImageUrls(item: {
  imageUrls?: unknown;
  imageUrl?: string | null;
}): { imageUrls: string[]; imageUrl?: string } {
  const fromArray = Array.isArray(item.imageUrls)
    ? item.imageUrls.filter(
        (u): u is string => typeof u === "string" && u.trim().length > 0
      )
    : [];
  const capped = fromArray.slice(0, MAX_MARKETPLACE_IMAGES);
  if (capped.length > 0) {
    return { imageUrls: capped, imageUrl: capped[0] };
  }
  if (item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.trim()) {
    const u = item.imageUrl.trim();
    return { imageUrls: [u], imageUrl: u };
  }
  return { imageUrls: [] };
}

function assertHttpsUrl(u: string): boolean {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}

/** Validate client-provided image URLs (Firebase HTTPS download URLs). */
export function parseIncomingImageUrls(input: {
  imageUrls?: unknown;
  imageUrl?: unknown;
}):
  | { ok: true; imageUrls: string[]; imageUrl?: string }
  | { ok: false; error: string } {
  if (input.imageUrls !== undefined) {
    if (!Array.isArray(input.imageUrls)) {
      return { ok: false, error: "imageUrls must be an array" };
    }
    const urls = input.imageUrls
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(0, MAX_MARKETPLACE_IMAGES);
    for (const u of urls) {
      if (!assertHttpsUrl(u)) {
        return { ok: false, error: "Each image URL must be a valid HTTPS URL" };
      }
    }
    return {
      ok: true,
      imageUrls: urls,
      imageUrl: urls[0],
    };
  }
  if (input.imageUrl !== undefined && input.imageUrl !== null) {
    if (typeof input.imageUrl !== "string") {
      return { ok: false, error: "imageUrl must be a string" };
    }
    const u = input.imageUrl.trim();
    if (!u) {
      return { ok: true, imageUrls: [] };
    }
    if (!assertHttpsUrl(u)) {
      return { ok: false, error: "Image URL must be a valid HTTPS URL" };
    }
    return { ok: true, imageUrls: [u], imageUrl: u };
  }
  return { ok: true, imageUrls: [] };
}

export function marketplaceImageApiFields(item: {
  imageUrls?: unknown;
  imageUrl?: string | null;
}) {
  return normalizeListingImageUrls(item);
}

/** First image for cards / thumbnails (supports API + legacy items). */
export function primaryMarketplaceImageUrl(item: {
  imageUrls?: string[] | null;
  imageUrl?: string | null;
}): string | undefined {
  const { imageUrls, imageUrl } = normalizeListingImageUrls(item);
  return imageUrls[0] ?? imageUrl;
}

/** Ordered list of images for detail gallery. */
export function galleryImageUrls(item: {
  imageUrls?: string[] | null;
  imageUrl?: string | null;
}): string[] {
  return normalizeListingImageUrls(item).imageUrls;
}
