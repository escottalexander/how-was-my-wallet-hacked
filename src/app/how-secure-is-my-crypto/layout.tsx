import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

const TITLE = "How secure is my crypto? Wallet security score";
const DESCRIPTION =
  "Get your crypto wallet security score and find out exactly where you're exposed.";

export const metadata: Metadata = {
  // `absolute` drops the "· How was my wallet hacked?" template suffix so the
  // composed title stays short enough to avoid SERP truncation (~52 chars).
  title: { absolute: TITLE },
  description:
    "Map your wallets and answer a few quick questions to get a 0-100 crypto wallet security score, with the exact weak spots to fix.",
  alternates: { canonical: "/how-secure-is-my-crypto" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/how-secure-is-my-crypto`,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function HowSecureIsMyCryptoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
