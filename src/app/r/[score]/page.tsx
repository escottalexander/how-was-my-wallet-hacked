import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

// Rendered on demand: OpenNext/Cloudflare doesn't reliably serve prerendered
// HTML for this nested dynamic route, so we render per request and clamp the
// score (any value 0-100 is valid; anything else is coerced into range).
export const dynamic = "force-dynamic";

const clampScore = (raw: string): number => Math.max(0, Math.min(100, parseInt(raw, 10) || 0));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ score: string }>;
}): Promise<Metadata> {
  const { score } = await params;
  const s = clampScore(score);
  const title = "Find out how hackable you are";
  const description = `Someone scored ${s}/100 on their crypto wallet security check. How hackable are you?`;
  return {
    title,
    description,
    // The score-specific landing isn't worth indexing; crawlers still read OG.
    robots: { index: false, follow: true },
    alternates: { canonical: "/how-hackable-are-you" },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/r/${s}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ShareLanding({
  params,
}: {
  params: Promise<{ score: string }>;
}) {
  const { score } = await params;
  const s = clampScore(score);

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="max-w-lg space-y-7 px-4">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Someone just scored {s}/100
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
          How hackable are you?
        </h1>
        <p className="text-lg text-[var(--text-muted)] leading-relaxed">
          Map your wallets, answer a few quick questions, and get a security score with the exact
          weak spots to fix. No wallet connection, no balances shared.
        </p>
        <Link
          href="/how-hackable-are-you"
          className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-[var(--primary)] px-8 text-base font-medium text-white shadow-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          Check my wallet
        </Link>
        <p className="text-sm text-[var(--text-muted)]">
          Already been hacked?{" "}
          <Link href="/diagnostic" className="text-[var(--primary)] hover:underline">
            Find out how →
          </Link>
        </p>
      </div>
    </div>
  );
}
