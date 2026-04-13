import type { FormFieldDefinition } from "@/lib/form-field-types";

export type FormTheme = "blue" | "red" | "yellow";

export interface FormPageDefinition {
  id: string;
  title?: string;
  description?: string;
  order: number;
}

export function newPageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `p-${crypto.randomUUID().slice(0, 10)}`;
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPage(): FormPageDefinition {
  return { id: newPageId(), title: "Page 1", order: 0 };
}

export function normalizePagesInput(raw: unknown): FormPageDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [createDefaultPage()];
  }
  const out: FormPageDefinition[] = raw.map((p, i) => {
    const o = p as Record<string, unknown>;
    const id =
      typeof o.id === "string" && o.id.trim().length > 0
        ? o.id.trim()
        : `p-${i}`;
    return {
      id,
      title: typeof o.title === "string" ? o.title : "",
      description: typeof o.description === "string" ? o.description : "",
      order: typeof o.order === "number" && Number.isFinite(o.order) ? o.order : i,
    };
  });
  out.sort((a, b) => a.order - b.order);
  return out;
}

/** Assign missing pageId on fields to first page (legacy / migration). */
export function ensureFieldPageIds(
  fields: FormFieldDefinition[],
  firstPageId: string
): FormFieldDefinition[] {
  return fields.map((f) =>
    f.pageId && String(f.pageId).trim()
      ? f
      : { ...f, pageId: firstPageId }
  );
}

export function fieldsOnPage(
  fields: FormFieldDefinition[],
  pageId: string
): FormFieldDefinition[] {
  return fields.filter((f) => (f.pageId ?? "") === pageId);
}

/** `_next` = go to next page in order; otherwise jump to page id. */
export function resolveNextPageIndex(
  pages: FormPageDefinition[],
  currentIndex: number,
  pageFields: FormFieldDefinition[],
  responseByLabel: Map<string, unknown>
): number {
  const branching = pageFields.filter(
    (f) =>
      (f.type === "dropdown" ||
        (f.type === "multiple_choice" &&
          (f.maxSelections ?? 999) <= 1)) &&
      f.optionGoToPageId &&
      Object.keys(f.optionGoToPageId).length > 0
  );
  for (let i = branching.length - 1; i >= 0; i--) {
    const f = branching[i];
    const raw = responseByLabel.get(f.label);
    let selected: string | undefined;
    if (f.type === "dropdown") {
      selected = typeof raw === "string" ? raw : undefined;
    } else if (f.type === "multiple_choice") {
      const arr = raw as string[];
      if (Array.isArray(arr) && arr.length === 1) selected = arr[0];
    }
    if (!selected) continue;
    const target = f.optionGoToPageId?.[selected];
    if (!target || target === "_next") break;
    const idx = pages.findIndex((p) => p.id === target);
    if (idx >= 0) return idx;
  }
  return Math.min(currentIndex + 1, Math.max(0, pages.length - 1));
}

export const FORM_THEMES: { value: FormTheme; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
];
