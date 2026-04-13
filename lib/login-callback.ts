/**
 * Safe post-login redirect targets: same-site relative paths only (open redirect safe).
 */
export function getSafeRedirectPath(
  raw: string | null | undefined
): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  // Reject scheme-like paths
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(decoded)) return null;

  const pathOnly = decoded.split("?")[0].split("#")[0].toLowerCase();
  if (pathOnly === "/login" || pathOnly.startsWith("/login/")) return null;
  if (pathOnly === "/register" || pathOnly.startsWith("/register/")) return null;

  return decoded;
}

/** Current path + query from the browser (client-only). */
export function pathAndQueryFromWindow(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function buildLoginUrl(pathWithQuery: string): string {
  const safe = getSafeRedirectPath(pathWithQuery);
  if (!safe) return "/login";
  return `/login?callbackUrl=${encodeURIComponent(safe)}`;
}

export function loginUrlFromPathnameAndSearch(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString"> | null | undefined
): string {
  const q =
    searchParams && typeof searchParams.toString === "function"
      ? searchParams.toString()
      : "";
  const full = q ? `${pathname}?${q}` : pathname;
  return buildLoginUrl(full);
}
