"use client";

import { AlertTriangle, RotateCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon = <SearchX />,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("rounded-xl border border-dashed bg-card/50 py-14", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Couldn't load this data",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <EmptyState
      className={cn("border-destructive/30", className)}
      icon={<AlertTriangle className="text-destructive" />}
      title={title}
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RotateCw /> Try again
          </Button>
        )
      }
    />
  );
}
