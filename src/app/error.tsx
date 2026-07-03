"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Something went wrong
      </p>
      <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
        This page hit an unexpected error
      </h1>
      <p className="max-w-md text-[var(--text-muted)]">
        It&apos;s on our end, not yours. Try again, and if it keeps happening
        head back to the home page.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border-2 border-[var(--border)] px-6 font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
