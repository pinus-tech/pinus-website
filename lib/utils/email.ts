/** Lowercase trimmed email — canonical form stored in the database. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * MongoDB query fragment for case-insensitive exact match on `email`
 * (handles legacy rows that may differ only by case).
 */
export function emailFilterCaseInsensitive(email: string) {
  const n = normalizeEmail(email);
  return {
    email: { $regex: new RegExp(`^${escapeRegExp(n)}$`, "i") },
  };
}
