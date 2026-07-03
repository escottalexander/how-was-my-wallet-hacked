import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How Secure Is My Wallet? Crypto Wallet Security Score",
  description:
    "Map your wallets and answer a few quick questions to get a 0–100 crypto wallet security score — with the exact weak spots to fix. No wallet connection, no balances shared.",
  alternates: { canonical: "/how-secure-is-my-wallet" },
  openGraph: {
    type: "website",
    title: "How Secure Is My Wallet? Crypto Wallet Security Score",
    description:
      "Get your crypto wallet security score and find out exactly where you're exposed.",
    url: `${SITE_URL}/how-secure-is-my-wallet`,
  },
};

export default function HowHackableLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
