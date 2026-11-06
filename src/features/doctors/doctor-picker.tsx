"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import type { DoctorOption } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useDoctorLookup } from "./api";

export function DoctorPicker({
  value,
  onChange,
  id,
  invalid,
  placeholder = "Select a doctor",
  allowClear,
  className,
}: {
  value: DoctorOption | null;
  onChange: (doctor: DoctorOption | null) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
  allowClear?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const lookup = useDoctorLookup(deferredSearch.trim(), open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-between bg-card font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value ? `Dr. ${value.name}` : placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search doctors…" value={search} onValueChange={setSearch} />
          <CommandList>
            {lookup.isFetching && !lookup.data ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <CommandEmpty>No doctors found.</CommandEmpty>
            )}
            <CommandGroup>
              {allowClear && value && (
                <CommandItem
                  value="__clear"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  {allowClear}
                </CommandItem>
              )}
              {lookup.data?.map((doctor) => (
                <CommandItem
                  key={doctor.id}
                  value={doctor.id}
                  onSelect={() => {
                    onChange(doctor);
                    setOpen(false);
                  }}
                >
                  <Check className={cn(value?.id === doctor.id ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate">Dr. {doctor.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {doctor.specialization}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
