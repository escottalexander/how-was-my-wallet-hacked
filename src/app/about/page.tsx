import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who's behind How Was My Wallet Hacked?, how the diagnostic works, and our privacy stance: no wallet connection and no personal data.",
  alternates: { canonical: "/about" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE_URL}/about`,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  mainEntity: {
    "@type": "Person",
    name: "Elliott Alexander",
    url: "https://elliottalexander.xyz",
    sameAs: [
      "https://github.com/escottalexander",
      "https://x.com/escottalexander",
    ],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        About {SITE_NAME}
      </h1>
      <div className="space-y-4 text-[var(--text-muted)]">
        <p>
          <strong className="text-[var(--foreground)]">{SITE_NAME}</strong>{" "}
          is a free tool that helps people who&apos;ve had crypto stolen understand the most likely
          way their wallet was compromised, and learn the practices that prevent it from
          happening again.
        </p>
        <p>
          It was built by{" "}
          <a
            href="https://elliottalexander.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            Elliott Alexander
          </a>
          , a software developer working in the Ethereum ecosystem. You can find him
          on{" "}
          <a
            href="https://github.com/escottalexander"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            GitHub
          </a>{" "}
          and{" "}
          <a
            href="https://x.com/escottalexander"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            X
          </a>
          .
        </p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">
          How the diagnostic works
        </h2>
        <p>
          The tool asks a series of questions about what happened and uses a transparent
          probability model to suggest the most likely attack vector. The guidance is
          grounded in the{" "}
          <a
            href="https://frameworks.securityalliance.org/wallet-security/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            Security Alliance Wallet Security framework
          </a>
          .
        </p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">
          Your privacy
        </h2>
        <p>
          There&apos;s no wallet connection, and we never ask for your seed phrase, private
          key, or any personal information. The tool only stores anonymized, aggregate
          analytics about which diagnoses are common, never anything that identifies you.
        </p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">
          Need to recover assets stuck in a wallet?
        </h2>
        <p>
          If you need to rescue assets from a compromised wallet, see{" "}
          <a
            href="https://hackedwalletrecovery.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            HackedWalletRecovery.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
