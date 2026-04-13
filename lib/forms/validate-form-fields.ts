import type { FormFieldDefinition } from "@/lib/form-field-types";
import { FORM_FIELD_TYPES } from "@/lib/form-field-types";
import { normalizePagesInput } from "@/lib/forms/form-pages";
import {
  DEFAULT_ACCEPTED_FILE_TOKENS,
  normalizeAcceptedFileTypes,
} from "@/lib/forms/file-accepted";

function validateLengthBounds(
  minLength: number | undefined,
  maxLength: number | undefined
): string | null {
  if (minLength !== undefined) {
    if (!Number.isInteger(minLength) || minLength < 0) {
      return "Minimum length must be a non-negative integer";
    }
  }
  if (maxLength !== undefined) {
    if (!Number.isInteger(maxLength) || maxLength < 0) {
      return "Maximum length must be a non-negative integer";
    }
  }
  if (
    minLength !== undefined &&
    maxLength !== undefined &&
    minLength > maxLength
  ) {
    return "Minimum length cannot exceed maximum length";
  }
  return null;
}

export function validateFormFieldsArray(fields: unknown): string | null {
  if (!Array.isArray(fields)) return "Fields must be an array";

  for (const raw of fields) {
    const err = validateOneFormField(raw);
    if (err) return err;
  }
  return null;
}

function validateOneFormField(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return "Invalid field entry";
  const field = raw as Partial<FormFieldDefinition>;

  if (!field.type || typeof field.type !== "string") {
    return "Each field must have a type";
  }
  if (!FORM_FIELD_TYPES.includes(field.type as FormFieldDefinition["type"])) {
    return `Invalid field type: ${field.type}`;
  }

  if (field.type === "section") {
    const mode = field.sectionDisplay ?? "both";
    if (!["both", "title_only", "description_only"].includes(mode)) {
      return "Invalid section display mode";
    }
    const title = (field.sectionTitle ?? "").trim();
    const desc = (field.sectionDescription ?? "").trim();
    if (mode === "title_only" && !title) {
      return "Section (title only) needs a section title";
    }
    if (mode === "description_only" && !desc) {
      return "Section (description only) needs a section description";
    }
    if (mode === "both" && !title && !desc) {
      return "Section needs a title and/or description";
    }
    if (!field.label?.trim()) {
      return "Each field must have a label (used as an internal name for this block)";
    }
    return null;
  }

  if (!field.label?.trim()) {
    return "Each field must have a label";
  }

  switch (field.type) {
    case "dropdown":
    case "multiple_choice":
      if (!field.options?.length) {
        return `${field.type} fields must have at least one option`;
      }
      if (field.type === "multiple_choice") {
        const min = field.minSelections ?? 0;
        const max = field.maxSelections;
        if (min < 0 || (max !== undefined && max < 0)) {
          return "Selection limits must be non-negative";
        }
        if (max !== undefined && max < min) {
          return "Maximum selections must be at least the minimum";
        }
        if (max !== undefined && field.options && max > field.options.length) {
          return "Maximum selections cannot exceed the number of options";
        }
      }
      break;
    case "date":
      if (
        field.dateMode &&
        !["date", "datetime", "time"].includes(field.dateMode)
      ) {
        return "Invalid date mode";
      }
      break;
    case "segmented_text":
      if (
        field.segmentDelimiter !== undefined &&
        field.segmentDelimiter !== "" &&
        field.segmentDelimiter.length > 8
      ) {
        return "Path delimiter must be at most 8 characters";
      }
      {
        const lenErr = validateLengthBounds(field.minLength, field.maxLength);
        if (lenErr) return lenErr;
      }
      break;
    case "text": {
      const lenErr = validateLengthBounds(field.minLength, field.maxLength);
      if (lenErr) return lenErr;
      break;
    }
    case "file_upload": {
      const acc = normalizeAcceptedFileTypes(field.acceptedFileTypes);
      if (acc.length === 0) {
        return "File upload must allow at least one file type";
      }
      for (const t of acc) {
        if (
          !(DEFAULT_ACCEPTED_FILE_TOKENS as readonly string[]).includes(t)
        ) {
          return "Invalid accepted file type";
        }
      }
      break;
    }
    default:
      break;
  }

  return null;
}

/** Validates fields plus multi-page / branching rules. */
export function validateFormWithPages(
  pagesRaw: unknown,
  fieldsRaw: unknown
): string | null {
  const fieldsErr = validateFormFieldsArray(fieldsRaw);
  if (fieldsErr) return fieldsErr;

  const pages = normalizePagesInput(pagesRaw);
  const pageIds = new Set(pages.map((p) => p.id));
  if (pageIds.size !== pages.length) {
    return "Each page must have a unique id";
  }

  const fields = fieldsRaw as FormFieldDefinition[];
  for (const f of fields) {
    if (f.pageId && !pageIds.has(f.pageId)) {
      return `Field "${f.label}" is assigned to an unknown page`;
    }
    if (f.optionGoToPageId && typeof f.optionGoToPageId === "object") {
      for (const [, pid] of Object.entries(f.optionGoToPageId)) {
        if (pid !== "_next" && !pageIds.has(String(pid))) {
          return `Field "${f.label}" has branching to an unknown page`;
        }
      }
    }
  }
  return null;
}
