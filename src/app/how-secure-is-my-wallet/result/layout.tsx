import type { Metadata } from "next";

// Session-specific result — no stable indexable content.
export const metadata: Metadata = {
  title: "Your Security Score",
  robots: { index: false, follow: true },
  alternates: { canonical: "/how-secure-is-my-wallet" },
};

export default function RiskResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
