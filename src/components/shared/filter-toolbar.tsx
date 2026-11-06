import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOrder } from "@/lib/api/types";
import { SORT_LABELS } from "@/lib/labels";

export function FilterToolbar({
  search,
  children,
  activeCount,
  onReset,
  end,
}: {
  search: React.ReactNode;
  children?: React.ReactNode;
  activeCount: number;
  onReset: () => void;
  end?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start">
      <div className="w-full lg:max-w-xs">{search}</div>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {children}
        {activeCount > 0 && (
          <Button variant="ghost" className="h-9 px-2.5 text-muted-foreground" onClick={onReset}>
            Reset
            <X />
          </Button>
        )}
        {end && <div className="ml-auto">{end}</div>}
      </div>
    </div>
  );
}

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as SortOrder)}>
      <SelectTrigger className="h-9 w-38 bg-card" aria-label="Sort by">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
