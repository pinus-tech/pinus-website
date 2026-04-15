export function validateAndNormalizeTargetUrl(
  raw: unknown
): { ok: true; url: string } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: false, error: "Target URL is required" };
  }
  const s = String(raw).trim();
  if (!s) {
    return { ok: false, error: "Target URL is required" };
  }
  if (s.length > 2048) {
    return { ok: false, error: "Target URL is too long" };
  }
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, error: "Enter a valid URL (include https://)" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, error: "URL must start with http:// or https://" };
  }
  return { ok: true, url: u.toString() };
}
