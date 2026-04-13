import type { FormFieldDefinition } from "@/lib/form-field-types";
import { FORM_FIELD_TYPES } from "@/lib/form-field-types";

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
      break;
    default:
      break;
  }

  return null;
}
