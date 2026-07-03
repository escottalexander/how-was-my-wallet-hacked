import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Error 404
      </p>
      <h1 className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-md text-[var(--text-muted)]">
        The link may be broken or the page may have moved. Here&apos;s where to
        pick things back up.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Back to home
        </Link>
        <Link
          href="/how-secure-is-my-wallet"
          className="inline-flex h-11 items-center justify-center rounded-full border-2 border-[var(--border)] px-6 font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]"
        >
          How secure is my wallet?
        </Link>
      </div>
    </div>
  );
}
