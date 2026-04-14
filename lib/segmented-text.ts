/** Split user path-style input for display and CSV export */

export function splitSegments(raw: string, delimiter: string): string[] {
  const sep = delimiter?.length ? delimiter : "/";
  if (!raw.trim()) return [];
  return raw.split(sep).map((s) => s.trim());
}

/** Non-empty lines (e.g. one path per line). */
export function splitSegmentInputLines(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Template like `name/stay/phone` using the same delimiter as the field. */
export function parseSegmentPathTemplate(
  template: string | undefined,
  delimiter: string
): string[] {
  if (!template?.trim()) return [];
  const sep = delimiter?.length ? delimiter : "/";
  return template
    .split(sep)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function maxSegmentCount(
  values: Array<string | null | undefined>,
  delimiter: string
): number {
  let max = 0;
  for (const v of values) {
    if (v == null || v === "") continue;
    const lines = splitSegmentInputLines(String(v));
    for (const line of lines) {
      const n = splitSegments(line, delimiter).length;
      if (n > max) max = n;
    }
  }
  return max;
}

/** Part `partIndex` for path line `subRowIndex` (0-based). */
export function segmentPartAtLine(
  raw: string,
  delimiter: string,
  partIndex: number,
  subRowIndex: number
): string {
  const lines = splitSegmentInputLines(raw);
  const line = lines[subRowIndex] ?? "";
  if (!line) return "";
  const parts = splitSegments(line, delimiter);
  return parts[partIndex] ?? "";
}

/** How many display rows one submission needs (multi-line paths). */
export function subRowsForResponse(
  response: {
    responses: Array<{ fieldLabel: string; value: unknown }>;
  },
  dataFields: Array<{ type: string; label: string }>
): number {
  let max = 1;
  for (const f of dataFields) {
    if (f.type !== "segmented_text") continue;
    const fr = response.responses.find((r) => r.fieldLabel === f.label);
    const raw = fr ? String(fr.value ?? "") : "";
    const n = Math.max(1, splitSegmentInputLines(raw).length);
    max = Math.max(max, n);
  }
  return max;
}
