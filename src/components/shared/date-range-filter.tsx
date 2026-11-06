"use client";

import { endOfDay, format, isValid, parse, startOfDay, startOfYear, subDays } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const DAY_FORMAT = "yyyy-MM-dd";

export function parseDay(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, DAY_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

export function dayRangeToQuery(from?: string | null, to?: string | null) {
  const fromDate = parseDay(from);
  const toDate = parseDay(to);
  return {
    from: fromDate ? startOfDay(fromDate).toISOString() : undefined,
    to: toDate ? endOfDay(toDate).toISOString() : undefined,
  };
}

const PRESETS = [
  { label: "Last 7 days", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Last 90 days", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { label: "This year", range: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

export function DateRangeFilter({
  title,
  from,
  to,
  onChange,
}: {
  title: string;
  from: string | null;
  to: string | null;
  onChange: (range: { from: string | null; to: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined =
    from || to ? { from: parseDay(from), to: parseDay(to) } : undefined;

  const apply = (range: DateRange | undefined) => {
    onChange({
      from: range?.from ? format(range.from, DAY_FORMAT) : null,
      to: range?.to
        ? format(range.to, DAY_FORMAT)
        : range?.from
          ? format(range.from, DAY_FORMAT)
          : null,
    });
  };

  const label = selected?.from
    ? selected.to && format(selected.to, DAY_FORMAT) !== format(selected.from, DAY_FORMAT)
      ? `${format(selected.from, "MMM d, yyyy")} – ${format(selected.to, "MMM d, yyyy")}`
      : format(selected.from, "MMM d, yyyy")
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 border-dashed bg-card",
              label && "rounded-r-none border-r-0 border-solid",
            )}
          >
            <CalendarDays />
            {title}
            {label && (
              <>
                <Separator
                  orientation="vertical"
                  className="mx-0.5 data-vertical:h-4 data-vertical:self-center"
                />
                <span className="font-normal text-muted-foreground">{label}</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        {label && (
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-l-none bg-card"
            aria-label={`Clear ${title.toLowerCase()} filter`}
            onClick={() => onChange({ from: null, to: null })}
          >
            <X />
          </Button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-wrap gap-1 border-b p-2 sm:w-36 sm:flex-col sm:border-r sm:border-b-0">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  apply(preset.range());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={apply}
            defaultMonth={selected?.from ?? subDays(new Date(), 30)}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
            autoFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
