import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LEARN_TOPICS, getTopicBySlug } from "@/content/learn-topics";
import { DIAGNOSES } from "@/content/diagnoses";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return LEARN_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = getTopicBySlug(slug);
  if (!t) return {};
  return {
    title: t.seoTitle,
    description: t.seoDescription,
    alternates: { canonical: `/learn/${t.slug}` },
    openGraph: {
      type: "article",
      title: t.seoTitle,
      description: t.seoDescription,
      url: `${SITE_URL}/learn/${t.slug}`,
    },
    twitter: { title: t.seoTitle, description: t.seoDescription },
  };
}

export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = getTopicBySlug(slug);
  if (!t) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: t.seoTitle,
        description: t.seoDescription,
        mainEntityOfPage: `${SITE_URL}/learn/${t.slug}`,
        inLanguage: "en",
        author: { "@type": "Organization", name: SITE_NAME },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_URL}/learn` },
          {
            "@type": "ListItem",
            position: 3,
            name: t.title,
            item: `${SITE_URL}/learn/${t.slug}`,
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
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{t.title}</h1>
      </header>
      <div>{t.content}</div>

      {t.relatedHow.length > 0 && (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Related ways wallets get hacked
          </h2>
          <ul className="space-y-2">
            {t.relatedHow.map((type) => {
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

      <p>
        <Link href="/learn" className="text-[var(--primary)] hover:underline">
          ← All best practices
        </Link>
      </p>
    </article>
  );
}
