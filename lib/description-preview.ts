/** Short plain-text preview for listing cards (strips common Markdown syntax). */
export function descriptionCardPreview(
  text: string,
  isMarkdown: boolean
): string {
  const t = text.trim();
  if (!t) return "";
  let s = t;
  if (isMarkdown) {
    s = t
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\s+/g, " ");
  }
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
}
