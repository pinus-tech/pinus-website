"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import type { DateFieldMode } from "@/lib/form-field-types";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/app/components/lib/utils";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

function parseYmd(value: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const d = new Date(value + "T12:00:00");
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function ymdFromDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
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
      <Input
        id={id}
        type="time"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="max-w-xs"
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
      <Input
        type="time"
        value={timePart}
        onChange={(e) => {
          const t = e.target.value;
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
        className="max-w-xs"
      />
    </div>
  );
}
