import type { FormFieldDefinition } from "@/lib/form-field-types";
import {
  normalizePagesInput,
  ensureFieldPageIds,
  type FormPageDefinition,
  type FormTheme,
} from "@/lib/forms/form-pages";

export function serializeFormFieldsAndPages(
  fieldsRaw: unknown,
  pagesRaw: unknown
): { pages: FormPageDefinition[]; fields: FormFieldDefinition[] } {
  const pages = normalizePagesInput(pagesRaw);
  const first = pages[0]?.id ?? "";
  const fields = ensureFieldPageIds(
    (Array.isArray(fieldsRaw) ? fieldsRaw : []) as FormFieldDefinition[],
    first
  );
  return { pages, fields };
}

export function themeOrDefault(t: unknown): FormTheme {
  return t === "red" || t === "yellow" || t === "blue" ? t : "blue";
}

export function assertOptionalHttpsUrl(
  label: string,
  u: unknown
): string | null {
  if (u === undefined || u === null || u === "") return null;
  if (typeof u !== "string") return `${label} must be a string`;
  try {
    if (new URL(u).protocol !== "https:") {
      return `${label} must use HTTPS`;
    }
  } catch {
    return `${label} must be a valid URL`;
  }
  return null;
}
