"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/lib/utils";

/** Sentinel for “no selection” in Radix Select (value cannot be empty string). */
export const FORM_SELECT_NONE = "__form_select_none__";

type Option = { value: string; label: string };

type FormSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  noneOptionLabel?: string;
  /** When true, first row is a selectable “none” that yields "". */
  allowNone?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

/**
 * Styled Select (shadcn/Radix) for form builder and fill flows.
 */
export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  noneOptionLabel = "Select an option",
  allowNone = false,
  disabled,
  required,
  className,
  id,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  const selectValue = allowNone
    ? !value
      ? FORM_SELECT_NONE
      : value
    : value || undefined;

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => {
        if (allowNone && v === FORM_SELECT_NONE) onValueChange("");
        else onValueChange(v);
      }}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        variant="blue"
        outline
        rounding="lg"
        className={cn("w-full bg-white", className)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent variant="blue" outline rounding="lg">
        {allowNone && (
          <SelectItem value={FORM_SELECT_NONE}>{noneOptionLabel}</SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
