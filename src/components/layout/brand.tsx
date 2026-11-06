import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden
    >
      <HeartPulse className="size-4.5" strokeWidth={2.25} />
    </span>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="grid leading-tight">
        <span className="text-sm font-semibold tracking-tight">Doctor Tracker</span>
        <span className="text-xs text-muted-foreground">Admin portal</span>
      </span>
    </span>
  );
}
