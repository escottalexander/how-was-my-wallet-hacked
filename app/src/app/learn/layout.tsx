import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const TITLE = "Crypto Wallet Security: Best Practices to Avoid Getting Hacked";
const DESCRIPTION =
  "Learn how to protect your crypto wallet: seed phrase security, spotting scams, token approvals, verifying what you sign, hot/cold wallets, multisig, and what to do after being hacked.";

export const metadata: Metadata = {
  title: "Learn Best Practices",
  description: DESCRIPTION,
  alternates: { canonical: "/learn" },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/learn`,
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Article structured data — the educational content is the page's primary value.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "en",
  mainEntityOfPage: `${SITE_URL}/learn`,
  publisher: { "@id": `${SITE_URL}/#organization` },
  about: [
    "Seed phrase security",
    "Crypto scams",
    "Token approvals",
    "Transaction signing",
    "Hardware wallets",
    "Multisig wallets",
    "Wallet hack recovery",
  ],
  isPartOf: { "@id": `${SITE_URL}/#website` },
  author: { "@type": "Organization", name: SITE_NAME },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
