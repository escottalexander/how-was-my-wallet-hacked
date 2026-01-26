import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "How Was I Hacked?",
  description: "Understand how your crypto wallet was compromised and learn to protect yourself going forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/80">
          <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              How Was I Hacked?
            </Link>
            <Link
              href="/learn"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
            >
              Learn Best Practices
            </Link>
          </nav>
        </header>
        <SessionProvider>
          <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
