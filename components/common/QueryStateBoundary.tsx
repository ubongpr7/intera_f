"use client";

import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import LoadingAnimation from "./LoadingAnimation";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QueryStateBoundaryProps {
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorKeys?: string[];
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function QueryStateBoundary({
  isLoading,
  isFetching,
  error,
  isEmpty,
  loadingText = "Loading records...",
  emptyTitle = "No records found",
  emptyDescription = "This area will populate once records are available.",
  errorTitle = "Unable to load this data",
  errorKeys = ["detail", "error"],
  onRetry,
  children,
  className,
}: QueryStateBoundaryProps) {
  if (isLoading) {
    return (
      <div className={cn("flex min-h-40 items-center justify-center rounded-2xl border border-border bg-card p-6 text-card-foreground", className)}>
        <LoadingAnimation text={loadingText} ringColor="#3b82f6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-2xl border border-red-200 bg-red-50/80 p-5 text-red-950 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100", className)}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-300" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{errorTitle}</p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">{extractErrorMessage(error, errorKeys)}</p>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" className="mt-4 rounded-full bg-white/80 dark:bg-red-950/40" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/35 p-6 text-center", className)}>
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-3 font-semibold text-foreground">{emptyTitle}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isFetching ? (
        <div className="absolute right-3 top-3 z-10 rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          Refreshing...
        </div>
      ) : null}
      {children}
    </div>
  );
}
