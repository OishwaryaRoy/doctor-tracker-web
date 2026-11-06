import { Badge } from "@/components/ui/badge";
import type { PatientCondition } from "@/lib/api/types";
import { CONDITION_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function ConditionBadge({
  condition,
  className,
}: {
  condition: PatientCondition;
  className?: string;
}) {
  const meta = CONDITION_META[condition];
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", meta.badge, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}
