import type { FormTheme } from "@/lib/forms/form-pages";

/** CSS variables + class names for form presentation (logo-inspired palette). */
export function formThemeClass(theme: FormTheme | undefined): string {
  switch (theme) {
    case "red":
      return "pinus-form-theme-red";
    case "yellow":
      return "pinus-form-theme-yellow";
    case "blue":
    default:
      return "pinus-form-theme-blue";
  }
}
