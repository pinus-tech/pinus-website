"use client";

import * as React from "react";
import { format, parse, parseISO } from "date-fns";
import type { DateFieldMode } from "@/lib/form-field-types";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/components/lib/utils";
import { Button } from "@/app/components/ui/button";

function parseYmd(value: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value + "T12:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function ymdFromDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function isValidHm(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

interface TimePickerFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}

/** Shadcn-style time control: popover + hour/minute selects (matches date picker trigger). */
function TimePickerField({
  value,
  onChange,
  disabled,
  id,
  required,
}: TimePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const hourStr =
    value && isValidHm(value) ? value.slice(0, 2) : "12";
  const minuteStr =
    value && isValidHm(value) ? value.slice(3, 5) : "00";

  const label =
    value && isValidHm(value)
      ? format(parse(value, "HH:mm", new Date()), "p")
      : "Pick a time";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="black"
          outline
          disabled={disabled}
          rounding="md"
          aria-required={required}
          className={cn(
            "w-full max-w-md justify-start font-normal text-left h-auto py-2 px-3 text-sm",
            !value && "text-gray-500"
          )}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex items-center justify-center gap-2">
          <Select
            value={hourStr}
            onValueChange={(h) => {
              onChange(`${h}:${minuteStr}`);
            }}
            disabled={disabled}
          >
            <SelectTrigger
              variant="black"
              outline
              size="sm"
              rounding="md"
              className="w-[5.25rem]"
            >
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent variant="black" outline position="popper">
              {HOURS.map((h) => (
                <SelectItem key={h} value={h} variant="blue">
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500 tabular-nums">:</span>
          <Select
            value={minuteStr}
            onValueChange={(m) => {
              onChange(`${hourStr}:${m}`);
            }}
            disabled={disabled}
          >
            <SelectTrigger
              variant="black"
              outline
              size="sm"
              rounding="md"
              className="w-[5.25rem]"
            >
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent variant="black" outline position="popper">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m} variant="blue">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FormDateFieldProps {
  mode: DateFieldMode;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

export function FormDateField({
  mode,
  value,
  onChange,
  required,
  disabled,
  id,
}: FormDateFieldProps) {
  const [open, setOpen] = React.useState(false);

  const timePart = React.useMemo(() => {
    if (mode !== "datetime" || !value) return "12:00";
    try {
      const d = parseISO(value);
      if (Number.isNaN(d.getTime())) return "12:00";
      return format(d, "HH:mm");
    } catch {
      return "12:00";
    }
  }, [mode, value]);

  const datePart = React.useMemo(() => {
    if (mode !== "datetime" || !value) return undefined;
    try {
      const d = parseISO(value);
      return Number.isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [mode, value]);

  if (mode === "time") {
    return (
      <TimePickerField
        id={id}
        value={value || ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
      />
    );
  }

  if (mode === "date") {
    const selected = parseYmd(value);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="black"
            outline
            disabled={disabled}
            rounding="md"
            className={cn(
              "w-full max-w-md justify-start font-normal text-left h-auto py-2 px-3",
              !value && "text-gray-500"
            )}
          >
            {value
              ? format(parseYmd(value)!, "PPP")
              : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) onChange(ymdFromDate(d));
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  // datetime
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="black"
            outline
            disabled={disabled}
            rounding="md"
            className={cn(
              "w-full max-w-md justify-start font-normal text-left h-auto py-2 px-3 text-sm",
              !datePart && "text-gray-500"
            )}
          >
            {datePart
              ? format(datePart, "PPP")
              : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={datePart}
            onSelect={(d) => {
              if (!d) return;
              const [h, m] = timePart.split(":").map(Number);
              const combined = new Date(d);
              combined.setHours(h || 0, m || 0, 0, 0);
              onChange(combined.toISOString());
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      <TimePickerField
        value={timePart}
        onChange={(t) => {
          if (!datePart) {
            const base = new Date();
            base.setHours(0, 0, 0, 0);
            const [h, m] = t.split(":").map(Number);
            base.setHours(h || 0, m || 0, 0, 0);
            onChange(base.toISOString());
            return;
          }
          const [h, m] = t.split(":").map(Number);
          const next = new Date(datePart);
          next.setHours(h || 0, m || 0, 0, 0);
          onChange(next.toISOString());
        }}
        disabled={disabled}
      />
    </div>
  );
}
