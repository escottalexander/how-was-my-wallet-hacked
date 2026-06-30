import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DIAGNOSES, HOW_PAGES, getDiagnosisBySlug } from "@/content/diagnoses";
import { LEARN_TOPICS } from "@/content/learn-topics";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return HOW_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getDiagnosisBySlug(slug);
  if (!p) return {};
  return {
    title: p.seoTitle,
    description: p.seoDescription,
    alternates: { canonical: `/how/${p.slug}` },
    openGraph: {
      type: "article",
      title: p.seoTitle,
      description: p.seoDescription,
      url: `${SITE_URL}/how/${p.slug}`,
    },
    twitter: { title: p.seoTitle, description: p.seoDescription },
  };
}

export default async function HowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getDiagnosisBySlug(slug);
  if (!page) notFound();
  const d = DIAGNOSES[page.type];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: page.h1,
        description: page.seoDescription,
        mainEntityOfPage: `${SITE_URL}/how/${page.slug}`,
        inLanguage: "en",
        author: { "@type": "Organization", name: SITE_NAME },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: page.h1,
            item: `${SITE_URL}/how/${page.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <article className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header>
        <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
          {page.h1}
        </h1>
      </header>

      <section className="space-y-4 text-[var(--text-muted)]">
        {d.mainCopy.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">
          How this attack works
        </h2>
        {page.howItWorks.map((p, i) => (
          <p key={i} className="text-[var(--text-muted)]">
            {p}
          </p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Warning signs</h2>
        <ul className="space-y-2">
          {page.warningSigns.map((s, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          What to do right now
        </h2>
        <ul className="space-y-3">
          {d.actionItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {d.externalLinks && d.externalLinks.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            {d.externalLinks.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] hover:underline block"
              >
                {l.label} →
              </a>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl bg-[var(--primary)]/10 p-6 text-center">
        <p className="text-[var(--foreground)] mb-4">
          Not sure this is what happened to you?
        </p>
        <Link
          href="/diagnostic"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-white font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          Run the 2-minute diagnostic
        </Link>
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Not been hacked yet?{" "}
          <Link href="/how-hackable-are-you" className="text-[var(--primary)] hover:underline">
            Check how exposed you are →
          </Link>
        </p>
      </div>

      {page.relatedLearn.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Learn how to prevent this
          </h2>
          <ul className="space-y-2">
            {page.relatedLearn.map((id) => {
              const t = LEARN_TOPICS.find((x) => x.id === id);
              return t ? (
                <li key={id}>
                  <Link
                    href={`/learn/${t.slug}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {t.title} →
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}

      {page.relatedDiagnoses.length > 0 && (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Other ways wallets get compromised
          </h2>
          <ul className="space-y-2">
            {page.relatedDiagnoses.map((type) => {
              const rp = DIAGNOSES[type].page;
              return rp ? (
                <li key={type}>
                  <Link
                    href={`/how/${rp.slug}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {rp.h1} →
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
