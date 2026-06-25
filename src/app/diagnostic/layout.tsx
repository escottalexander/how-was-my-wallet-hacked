import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnose How Your Wallet Was Hacked",
  description:
    "Answer a few quick questions to find the most likely way your crypto wallet was compromised — from phishing and approvals to seed-phrase exposure and malware.",
  alternates: { canonical: "/diagnostic" },
};

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
