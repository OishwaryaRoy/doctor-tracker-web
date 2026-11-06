import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompact(value: number) {
  return value < 10_000 ? value.toLocaleString("en-US") : compact.format(value);
}

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  footnote,
  isLoading,
  tone = "default",
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  delta?: { pct: number | null; period: string };
  footnote?: React.ReactNode;
  isLoading: boolean;
  tone?: "default" | "critical";
}) {
  return (
    <Card className="gap-2 p-4 sm:gap-3 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex",
            tone === "critical"
              ? "bg-condition-critical/10 text-condition-critical"
              : "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
      </div>
      {isLoading || value === undefined ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{formatCompact(value)}</p>
      )}
      <div className="min-h-5 text-xs text-muted-foreground sm:text-sm">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : delta ? (
          <Delta pct={delta.pct} period={delta.period} />
        ) : (
          footnote
        )}
      </div>
    </Card>
  );
}

function Delta({ pct, period }: { pct: number | null; period: string }) {
  if (pct === null) return <span>New activity vs {period}</span>;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
        <Icon className="size-4" aria-hidden />
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>
      vs {period}
    </span>
  );
}
