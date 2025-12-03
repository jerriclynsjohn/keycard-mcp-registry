"use client";

import { Button } from "@/components/ui/button";
import { KeycardLogo } from "@/components/keycard-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <KeycardLogo />
        </div>
        <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}