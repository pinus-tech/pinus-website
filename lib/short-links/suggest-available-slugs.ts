import ShortLink from "@/lib/models/ShortLink";
import { normalizeShortLinkSlug } from "./normalize-short-slug";

const MAX_LEN = 80;

/**
 * Finds up to `maxSuggestions` slugs of the form `{base}-{n}` that are not taken
 * and pass normalization (e.g. `signup-1`, `signup-2`).
 */
export async function suggestAvailableNumericSlugs(
  baseSlug: string,
  maxSuggestions: number
): Promise<string[]> {
  const base = baseSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN);
  if (base.length < 1) return [];

  const out: string[] = [];
  for (let i = 1; i <= 500 && out.length < maxSuggestions; i++) {
    const suffix = `-${i}`;
    let trimmed = base;
    if (trimmed.length + suffix.length > MAX_LEN) {
      trimmed = trimmed.slice(0, Math.max(1, MAX_LEN - suffix.length));
    }
    const raw = `${trimmed}${suffix}`;
    const candidate = normalizeShortLinkSlug(raw);
    if (!candidate) continue;
    const taken = await ShortLink.exists({ slug: candidate });
    if (!taken) out.push(candidate);
  }
  return out;
}
