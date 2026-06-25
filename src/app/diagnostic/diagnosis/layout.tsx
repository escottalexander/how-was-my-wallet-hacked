import type { Metadata } from "next";

// Session-specific result page — no stable indexable content.
export const metadata: Metadata = {
  title: "Your Diagnosis",
  robots: { index: false, follow: true },
  alternates: { canonical: "/diagnostic" },
};

export default function DiagnosisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
