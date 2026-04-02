import type { Block, ExtendedRecordMap } from "notion-types";

/**
 * Notion occasionally returns block.value as { role, value: inner } where the
 * real block (with `type`) is nested. react-notion-x expects value to be the
 * inner block and logs "Unsupported block type undefined" otherwise.
 */
function unwrapBlockValue(raw: unknown): Block | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  let v = raw as Record<string, unknown>;
  while (
    typeof v.type !== "string" &&
    v.value != null &&
    typeof v.value === "object" &&
    typeof (v.value as { type?: unknown }).type === "string"
  ) {
    v = v.value as Record<string, unknown>;
  }
  return v as unknown as Block;
}

/** Ensures uuidToId(block.id) never receives undefined (react-notion-x). */
function ensureBlockIds(blockMap: ExtendedRecordMap["block"]) {
  if (!blockMap) return;
  for (const key of Object.keys(blockMap)) {
    const entry = blockMap[key];
    if (!entry?.value) continue;
    const value = entry.value as Block;
    if (!value.id) {
      (value as Block & { id: string }).id = key;
    }
  }
}

/** Mutates recordMap in place for react-notion-x. Safe for SSR-fetched maps. */
export function prepareNotionRecordMap(
  recordMap: ExtendedRecordMap
): ExtendedRecordMap {
  const blockMap = recordMap.block;
  if (!blockMap) return recordMap;

  for (const key of Object.keys(blockMap)) {
    const entry = blockMap[key];
    if (!entry) continue;
    const unwrapped = unwrapBlockValue(entry.value);
    if (unwrapped) {
      entry.value = unwrapped;
    }
  }

  ensureBlockIds(blockMap);
  return recordMap;
}
