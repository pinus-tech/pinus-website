/** Form builder field types - kept in sync with lib/models/Form.ts */

export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "dropdown"
  | "multiple_choice"
  | "section"
  | "segmented_text"
  | "file_upload";

export type DateFieldMode = "date" | "datetime" | "time";

export type SectionDisplayMode = "both" | "title_only" | "description_only";

export interface FormFieldDefinition {
  label: string;
  type: FormFieldType;
  required: boolean;
  /** Optional helper text under the label (like Google Forms description). */
  description?: string;
  options?: string[];
  /** Used when type === "date" */
  dateMode?: DateFieldMode;
  /** Used when type === "section" */
  sectionTitle?: string;
  sectionDescription?: string;
  sectionDisplay?: SectionDisplayMode;
  /** Used when type === "segmented_text" - delimiter for splitting (e.g. / or -) */
  segmentDelimiter?: string;
  /** When type === "multiple_choice": minimum number of options to select (default 0). */
  minSelections?: number;
  /** When type === "multiple_choice": maximum number of options (omit = unlimited). */
  maxSelections?: number;
  /** When type === "text" or "segmented_text": minimum character length (inclusive). */
  minLength?: number;
  /** When type === "text" or "segmented_text": maximum character length (inclusive). */
  maxLength?: number;
  /**
   * When type === "file_upload": which extensions to allow (jpeg, png, gif, webp, pdf).
   * Empty/omitted means all types.
   */
  acceptedFileTypes?: string[];
}

export const FORM_FIELD_TYPES: FormFieldType[] = [
  "text",
  "number",
  "date",
  "checkbox",
  "dropdown",
  "multiple_choice",
  "section",
  "segmented_text",
  "file_upload",
];

export function isDataField(field: Pick<FormFieldDefinition, "type">): boolean {
  return field.type !== "section";
}
