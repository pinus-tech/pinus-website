import type { FormFieldDefinition } from "@/lib/form-field-types";
import {
  parseSegmentPathTemplate,
  splitSegmentInputLines,
  splitSegments,
} from "@/lib/segmented-text";

function isValidYmd(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00`));
}

function isValidTime(v: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
}

export function validateFieldValue(
  field: FormFieldDefinition,
  value: unknown
): string | null {
  switch (field.type) {
    case "section":
      return "Section fields cannot have values";
    case "number":
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value !== "number" && typeof value !== "string") {
        return "Expected a number";
      }
      if (Number.isNaN(Number(value))) return "Invalid number";
      return null;
    case "date": {
      const mode = field.dateMode ?? "date";
      const s = String(value ?? "");
      if (!s.trim()) return null;
      if (mode === "date" && !isValidYmd(s)) return "Invalid date";
      if (mode === "time" && !isValidTime(s)) return "Invalid time";
      if (mode === "datetime" && Number.isNaN(Date.parse(s)))
        return "Invalid date and time";
      return null;
    }
    case "checkbox":
      if (typeof value !== "boolean") return "Expected yes/no";
      return null;
    case "dropdown": {
      const s = typeof value === "string" ? value : String(value);
      if (!s.trim()) return null;
      if (!field.options?.includes(s)) return "Invalid option";
      return null;
    }
    case "multiple_choice": {
      if (!Array.isArray(value)) return "Expected a list of options";
      const arr = value as string[];
      if (arr.length === 0) return null;
      const seen = new Set<string>();
      for (const v of arr) {
        if (typeof v !== "string" || !field.options?.includes(v)) {
          return "Invalid option in selection";
        }
        if (seen.has(v)) return "Each option can only be selected once";
        seen.add(v);
      }
      const min = field.minSelections ?? 0;
      const max = field.maxSelections;
      if (min > 0 && arr.length < min) {
        return `Select at least ${min} option(s)`;
      }
      if (max !== undefined && arr.length > max) {
        return `Select at most ${max} option(s)`;
      }
      return null;
    }
    case "segmented_text": {
      if (typeof value !== "string") return "Expected text";
      const s = value;
      if (s.trim() === "") return null;
      const delim = field.segmentDelimiter ?? "/";
      const templateParts = parseSegmentPathTemplate(
        field.segmentPathTemplate,
        delim
      );
      const expected = templateParts.length;
      const lines = splitSegmentInputLines(s);
      const min = field.minLength ?? 0;
      const max = field.maxLength;
      if (min > 0 && s.length < min) {
        return `Enter at least ${min} character(s)`;
      }
      if (max !== undefined && s.length > max) {
        return `Enter at most ${max} character(s)`;
      }
      if (expected > 0) {
        for (let i = 0; i < lines.length; i++) {
          const parts = splitSegments(lines[i]!, delim);
          if (parts.length < expected) {
            const need = expected - parts.length;
            return `Line ${i + 1}: needs ${need} more segment${need === 1 ? "" : "s"} (use "${delim}" between ${expected} parts: ${templateParts.join(` ${delim} `)})`;
          }
          if (parts.length > expected) {
            return `Line ${i + 1}: too many segments (expected ${expected} parts)`;
          }
        }
      }
      return null;
    }
    case "text": {
      if (typeof value !== "string") return "Expected text";
      const s = value;
      if (s.trim() === "") return null;
      const min = field.minLength ?? 0;
      const max = field.maxLength;
      if (min > 0 && s.length < min) {
        return `Enter at least ${min} character(s)`;
      }
      if (max !== undefined && s.length > max) {
        return `Enter at most ${max} character(s)`;
      }
      return null;
    }
    case "file_upload": {
      if (typeof value !== "string") return "Invalid attachment";
      const s = value.trim();
      if (s === "") return null;
      try {
        const u = new URL(s);
        if (u.protocol !== "https:") return "Invalid file link";
        if (!u.hostname.includes("firebasestorage.googleapis.com")) {
          return "Invalid file link";
        }
      } catch {
        return "Invalid file link";
      }
      return null;
    }
    default:
      if (typeof value !== "string") return "Expected text";
      return null;
  }
}

export function isEmptyValue(
  field: FormFieldDefinition,
  value: unknown
): boolean {
  if (value === null || value === undefined) return true;
  switch (field.type) {
    case "checkbox":
      return value === false;
    case "multiple_choice":
      return Array.isArray(value) && value.length === 0;
    case "number":
      return String(value).trim() === "";
    default:
      return String(value).trim() === "";
  }
}
