"use client";

import { BarChart3, Table2 } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ChartTableData = {
  columns: { label: string; numeric?: boolean }[];
  rows: (string | number)[][];
};

export function ChartCard({
  title,
  description,
  table,
  isLoading,
  className,
  children,
}: {
  title: string;
  description?: string;
  table?: ChartTableData;
  isLoading: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {table && (
          <CardAction>
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={view}
              onValueChange={(next) => next && setView(next as "chart" | "table")}
              aria-label={`${title} view`}
            >
              <ToggleGroupItem value="chart" aria-label="Chart view">
                <BarChart3 />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <Table2 />
              </ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : view === "table" && table ? (
          <div className="max-h-72 overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  {table.columns.map((column) => (
                    <TableHead key={column.label} className={cn(column.numeric && "text-right")}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.map((row, index) => (
                  <TableRow key={index}>
                    {row.map((cell, cellIndex) => (
                      <TableCell
                        key={cellIndex}
                        className={cn(table.columns[cellIndex]?.numeric && "tabular text-right")}
                      >
                        {typeof cell === "number" ? cell.toLocaleString() : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
