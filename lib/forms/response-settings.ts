/** Keys stored on Form.responseSettings.respondentColumns (order = display order). */
export const RESPONDENT_COLUMN_KEYS = [
  "name",
  "email",
  "phoneNumber",
  "telegram",
  "city",
  "highSchool",
  "career",
  "major",
  "intakeYear",
  "yearOfStudy",
] as const;

export type RespondentColumnKey = (typeof RESPONDENT_COLUMN_KEYS)[number];

const KEY_SET = new Set<string>(RESPONDENT_COLUMN_KEYS);

/** Shown in table headers, CSV, and settings checkboxes. */
export const RESPONDENT_COLUMN_LABELS: Record<RespondentColumnKey, string> = {
  name: "Name",
  email: "Email",
  phoneNumber: "WhatsApp",
  telegram: "Telegram",
  city: "City",
  highSchool: "High school",
  career: "Career level",
  major: "Major",
  intakeYear: "Intake year",
  yearOfStudy: "Year of study",
};

/** Default when unset in DB: name, WhatsApp, Telegram only (no email). */
export const DEFAULT_RESPONDENT_COLUMNS: RespondentColumnKey[] = [
  "name",
  "phoneNumber",
  "telegram",
];

export function normalizeRespondentColumns(
  raw: unknown
): RespondentColumnKey[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_RESPONDENT_COLUMNS];
  }
  const out: RespondentColumnKey[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const k = typeof item === "string" ? item.trim() : "";
    if (!KEY_SET.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k as RespondentColumnKey);
  }
  return out.length > 0 ? out : [...DEFAULT_RESPONDENT_COLUMNS];
}

export function validateRespondentColumnsInput(
  raw: unknown
): string | null {
  if (!Array.isArray(raw)) {
    return "responseSettings.respondentColumns must be an array of column keys";
  }
  for (const item of raw) {
    if (typeof item !== "string" || !KEY_SET.has(item.trim())) {
      return `Invalid respondent column key: ${String(item)}`;
    }
  }
  if (raw.length === 0) {
    return "Select at least one respondent column";
  }
  return null;
}

export function formatCareerLabel(c: string | undefined): string {
  if (!c) return "";
  const map: Record<string, string> = {
    undergrad: "Undergraduate",
    master: "Master's",
    phd: "PhD",
  };
  return map[c] ?? c;
}

/** Serialized respondent from API (subset of User). */
export type FormRespondentProfile = {
  name?: string;
  email?: string;
  telegram?: string;
  phoneNumber?: string;
  city?: string;
  highSchool?: string;
  major?: string;
  intakeYear?: number;
  yearOfStudy?: number;
  career?: string;
};

export function formatRespondentColumnValue(
  key: RespondentColumnKey,
  respondent: FormRespondentProfile | null | undefined
): string {
  if (!respondent) {
    if (key === "name") return "Deleted user";
    return "";
  }
  switch (key) {
    case "name":
      return respondent.name ?? "";
    case "email":
      return respondent.email ?? "";
    case "phoneNumber":
      return respondent.phoneNumber?.trim() ?? "";
    case "telegram":
      return respondent.telegram?.trim() ?? "";
    case "city":
      return respondent.city?.trim() ?? "";
    case "highSchool":
      return respondent.highSchool?.trim() ?? "";
    case "career":
      return formatCareerLabel(respondent.career);
    case "major":
      return respondent.major?.trim() ?? "";
    case "intakeYear":
      return respondent.intakeYear != null ? String(respondent.intakeYear) : "";
    case "yearOfStudy":
      return respondent.yearOfStudy != null
        ? String(respondent.yearOfStudy)
        : "";
    default:
      return "";
  }
}
