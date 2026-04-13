/** Tokens stored on form fields for file_upload — keep in sync with editor checkboxes. */

export const DEFAULT_ACCEPTED_FILE_TOKENS = [
  "jpeg",
  "png",
  "gif",
  "webp",
  "pdf",
] as const;

export type AcceptedFileToken = (typeof DEFAULT_ACCEPTED_FILE_TOKENS)[number];

export const ACCEPTED_FILE_LABELS: Record<AcceptedFileToken, string> = {
  jpeg: "JPEG",
  png: "PNG",
  gif: "GIF",
  webp: "WebP",
  pdf: "PDF",
};

export function normalizeAcceptedFileTypes(
  input?: string[] | null
): AcceptedFileToken[] {
  if (input === null || input === undefined) {
    return [...DEFAULT_ACCEPTED_FILE_TOKENS];
  }
  if (input.length === 0) {
    return [];
  }
  const out = new Set<AcceptedFileToken>();
  for (const raw of input) {
    const t = String(raw).toLowerCase().trim();
    if (t === "jpg") {
      out.add("jpeg");
      continue;
    }
    if ((DEFAULT_ACCEPTED_FILE_TOKENS as readonly string[]).includes(t)) {
      out.add(t as AcceptedFileToken);
    }
  }
  if (out.size === 0) return [];
  return Array.from(out);
}

export function fileToAcceptedToken(file: File): AcceptedFileToken | null {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return "pdf";
  }
  const m = (file.type || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpeg";
  if (m === "image/png") return "png";
  if (m === "image/gif") return "gif";
  if (m === "image/webp") return "webp";
  return null;
}

export function isFileAccepted(
  file: File,
  acceptedTokens?: string[] | null
): boolean {
  const allowed = new Set(normalizeAcceptedFileTypes(acceptedTokens));
  if (allowed.size === 0) return false;
  const tok = fileToAcceptedToken(file);
  return tok !== null && allowed.has(tok);
}

export function buildAcceptHtmlAttribute(acceptedTokens?: string[] | null): string {
  const tokens = normalizeAcceptedFileTypes(acceptedTokens);
  const mimes: string[] = [];
  if (tokens.includes("jpeg")) mimes.push("image/jpeg");
  if (tokens.includes("png")) mimes.push("image/png");
  if (tokens.includes("gif")) mimes.push("image/gif");
  if (tokens.includes("webp")) mimes.push("image/webp");
  if (tokens.includes("pdf")) mimes.push("application/pdf");
  return (
    mimes.join(",") ||
    "image/jpeg,image/png,image/gif,image/webp,application/pdf"
  );
}

export function acceptedTypesSummary(acceptedTokens?: string[] | null): string {
  const tokens = normalizeAcceptedFileTypes(acceptedTokens);
  return tokens.map((t) => ACCEPTED_FILE_LABELS[t]).join(", ");
}
