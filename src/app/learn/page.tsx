import type { Metadata } from "next";
import Link from "next/link";
import { LEARN_TOPICS } from "@/content/learn-topics";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crypto Wallet Security: Best Practices to Avoid Getting Hacked",
  description:
    "Learn how to protect your crypto wallet: seed phrase security, spotting scams, token approvals, verifying what you sign, hot/cold wallets, multisig, and recovery.",
  alternates: { canonical: "/learn" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Crypto Wallet Security Best Practices",
  url: `${SITE_URL}/learn`,
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Learn Best Practices
        </h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Protect yourself going forward with these essential security practices.
        </p>
      </div>

      <div className="space-y-4">
        {LEARN_TOPICS.map((t) => (
          <Link
            key={t.id}
            href={`/learn/${t.slug}`}
            className="block rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--primary)] transition-colors"
          >
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h2>
            <p className="mt-2 text-[var(--text-muted)]">{t.summary}</p>
          </Link>
        ))}
      </div>

      <p className="text-center text-[var(--text-muted)]">
        To read more, visit the{" "}
        <a
          href="https://frameworks.securityalliance.org/wallet-security/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] hover:underline font-medium"
        >
          Security Alliance Wallet Security framework
        </a>
        .
      </p>

      <div className="mt-8 p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-center">
        <p className="text-[var(--text-muted)] mb-4">
          Need help recovering assets from a compromised wallet?
        </p>
        <a
          href="https://hackedwalletrecovery.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl border-2 border-[var(--primary)] px-6 py-3 text-[var(--primary)] font-medium transition-colors hover:bg-[var(--primary)]/10"
        >
          Visit HackedWalletRecovery.com →
        </a>
      </div>
    </div>
  );
}
