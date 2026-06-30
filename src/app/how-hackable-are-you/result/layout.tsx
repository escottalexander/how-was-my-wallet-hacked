import type { Metadata } from "next";

// Session-specific result — no stable indexable content.
export const metadata: Metadata = {
  title: "Your Security Score",
  robots: { index: false, follow: true },
  alternates: { canonical: "/how-hackable-are-you" },
};

export default function RiskResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
