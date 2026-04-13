/** Split user path-style input for display and CSV export */

export function splitSegments(raw: string, delimiter: string): string[] {
  const sep = delimiter?.length ? delimiter : "/";
  if (!raw.trim()) return [];
  return raw.split(sep).map((s) => s.trim());
}

export function maxSegmentCount(
  values: Array<string | null | undefined>,
  delimiter: string
): number {
  let max = 0;
  for (const v of values) {
    if (v == null || v === "") continue;
    const n = splitSegments(String(v), delimiter).length;
    if (n > max) max = n;
  }
  return max;
}
