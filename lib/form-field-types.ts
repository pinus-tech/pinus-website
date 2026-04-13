/** Form builder field types — kept in sync with lib/models/Form.ts */

export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "checkbox"
  | "dropdown"
  | "multiple_choice"
  | "section"
  | "segmented_text";

export type DateFieldMode = "date" | "datetime" | "time";

export type SectionDisplayMode = "both" | "title_only" | "description_only";

export interface FormFieldDefinition {
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  /** Used when type === "date" */
  dateMode?: DateFieldMode;
  /** Used when type === "section" */
  sectionTitle?: string;
  sectionDescription?: string;
  sectionDisplay?: SectionDisplayMode;
  /** Used when type === "segmented_text" — delimiter for splitting (e.g. / or -) */
  segmentDelimiter?: string;
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
];

export function isDataField(field: Pick<FormFieldDefinition, "type">): boolean {
  return field.type !== "section";
}
