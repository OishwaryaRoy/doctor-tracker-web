"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/lib/api/types";
import { formatNumber } from "@/lib/utils";

export const PAGE_SIZES = [10, 20, 50, 100];

function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

export function PaginationBar({
  meta,
  onPageChange,
  onLimitChange,
  itemLabel = "results",
}: {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemLabel?: string;
}) {
  const { page, limit, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-3 px-1 py-3 sm:flex-row"
    >
      <p className="tabular text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{formatNumber(first)}</span>–
        <span className="font-medium text-foreground">{formatNumber(last)}</span> of{" "}
        <span className="font-medium text-foreground">{formatNumber(total)}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger size="sm" className="w-18" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>

          <span className="tabular px-2 text-sm sm:hidden">
            {page} / {totalPages}
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden>
                  …
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === page ? "default" : "ghost"}
                  size="icon-sm"
                  className="tabular"
                  onClick={() => onPageChange(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                >
                  {item}
                </Button>
              ),
            )}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
