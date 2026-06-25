import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "@/components/SessionProvider";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Organization + WebSite structured data for Knowledge Graph and AI-search grounding.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/80">
          <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              How Was My Wallet Hacked?
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
