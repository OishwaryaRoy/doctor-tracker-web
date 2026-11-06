"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect } from "react";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<AlertTriangle className="text-destructive" />}
      title="Something went wrong"
      description="An unexpected error occurred while showing this page."
      action={
        <Button variant="outline" onClick={reset}>
          <RotateCw /> Try again
        </Button>
      }
    />
  );
}
