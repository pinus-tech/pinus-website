import Form from "@/lib/models/Form";

const MAX_SLUG_LEN = 80;

/** Reserved path segments under /f/… that we disallow as slugs. */
const RESERVED = new Set(["api", "f", "forms", "admin", "login", "register"]);

/**
 * Normalizes user input into a URL-safe slug, or null if unusable.
 */
export function normalizeFormSlugInput(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  const slug = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LEN);
  if (slug.length < 2) return null;
  if (RESERVED.has(slug)) return null;
  return slug;
}

/**
 * Picks a unique slug: tries `base`, then `base-2`, `base-3`, …
 */
export async function assignUniqueFormSlug(
  base: string,
  excludeFormId?: string
): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const q: Record<string, unknown> = { slug: candidate };
    if (excludeFormId) {
      q._id = { $ne: excludeFormId };
    }
    const exists = await Form.exists(q);
    if (!exists) return candidate;
    const suffix = `-${n}`;
    const maxBase = MAX_SLUG_LEN - suffix.length;
    const trimmed =
      base.length > maxBase ? base.slice(0, Math.max(1, maxBase)) : base;
    candidate = `${trimmed}${suffix}`;
    n += 1;
    if (n > 1000) {
      throw new Error("Could not allocate a unique short link");
    }
  }
}
