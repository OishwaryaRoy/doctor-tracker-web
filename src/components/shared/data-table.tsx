"use client";

import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  hideBelow?: "md" | "lg" | "xl";
};

const HIDE_CLASS = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading: boolean;
  isFetching?: boolean;
  renderMobileCard: (row: T) => React.ReactNode;
  empty: React.ReactNode;
  skeletonRows?: number;
  caption: string;
};

function DataTableInner<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  isFetching,
  renderMobileCard,
  empty,
  skeletonRows = 8,
  caption,
}: DataTableProps<T>) {
  if (!isLoading && rows?.length === 0) return <>{empty}</>;

  return (
    <div
      className={cn("transition-opacity duration-200", isFetching && !isLoading && "opacity-60")}
      aria-busy={isLoading || isFetching}
    >
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <caption className="sr-only">{caption}</caption>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "h-10 text-xs font-medium tracking-wide text-muted-foreground uppercase first:pl-4 last:pr-4",
                    column.hideBelow && HIDE_CLASS[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "py-3.5 first:pl-4 last:pr-4",
                          column.hideBelow && HIDE_CLASS[column.hideBelow],
                        )}
                      >
                        <Skeleton className="h-4 w-full max-w-36" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows!.map((row) => (
                  <TableRow key={getRowId(row)}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        className={cn(
                          "py-3 first:pl-4 last:pr-4",
                          column.hideBelow && HIDE_CLASS[column.hideBelow],
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="space-y-3 rounded-xl border bg-card p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </li>
            ))
          : rows!.map((row) => <li key={getRowId(row)}>{renderMobileCard(row)}</li>)}
      </ul>
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
