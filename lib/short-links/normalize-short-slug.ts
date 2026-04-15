const MAX_SLUG_LEN = 80;

/** Segments we refuse as short slugs to avoid confusion with site routes. */
const RESERVED = new Set([
  "api",
  "admin",
  "login",
  "register",
  "f",
  "forms",
  "marketplace",
  "profile",
  "guides",
  "blog",
  "faq",
  "committee",
  "events",
  "resources",
  "participate",
  "contact",
  "u",
]);

/**
 * Normalizes user input into a URL-safe slug for /u/{slug}, or null if unusable.
 */
export function normalizeShortLinkSlug(raw: unknown): string | null {
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
