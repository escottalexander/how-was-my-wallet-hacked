import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  // Home uses the brand name as its title (no template suffix) and targets the core query.
  title: {
    absolute: "How Was I Hacked? Find Out How Your Crypto Wallet Was Compromised",
  },
  description:
    "Hacked or drained? Answer a few questions to understand how your crypto wallet was most likely compromised — and the steps to protect yourself going forward.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.14)-theme(spacing.8)*2)] flex-col items-center justify-center text-center">
      <div className="max-w-lg space-y-8 px-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          We&apos;re sorry you&apos;re here.
        </h1>

        <div className="space-y-4 text-lg text-[var(--text-muted)] leading-relaxed">
          <p>
            Getting hacked is one of the worst feelings in crypto. We know how much it hurts.
          </p>
          <p>
            This tool will help you understand what likely happened so you can protect yourself going forward. We&apos;ll ask around 15&ndash;20 questions &mdash; some may not apply to you.
          </p>
        </div>

        <p className="text-xl font-medium text-[var(--foreground)]">
          Let&apos;s figure this out together.
        </p>

        <Link
          href="/diagnostic"
          className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-[var(--primary)] px-8 text-base font-medium text-white shadow-sm hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
