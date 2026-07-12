"use client";

import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="alert" aria-live="assertive">
      <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground">
        {error.digest ?? "An unexpected error occurred."}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => Sentry.captureException(error)} variant="outline">
          Report Error
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
