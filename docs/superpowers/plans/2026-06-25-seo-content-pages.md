# SEO Content Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the site's existing vetted security copy into 25 indexable content pages (16 `/how/<slug>` attack-vector pages + 9 `/learn/<slug>` topic pages) plus an `/about` page, with enriched trust schema, driven by shared content modules.

**Architecture:** Extract the in-component content (`DIAGNOSIS_CONTENT`, `TOPICS`) into shared modules under `src/content/`. Render the new pages from those modules via two App Router dynamic routes (`/how/[slug]`, `/learn/[slug]`) using `generateStaticParams`/`generateMetadata`. The diagnostic flow and the `/learn` hub consume the same modules — no duplicated copy. Add `/about`, enrich `Organization` JSON-LD, add a footer, and extend the sitemap.

**Tech Stack:** Next.js 16 App Router (server components, file-based metadata + JSON-LD), TypeScript, Tailwind v4, OpenNext/Cloudflare. No new dependencies.

**Verification model:** No unit-test framework exists; verification is `npm run build` + SSR content greps (`curl … | grep`) + `validate_schema.py` from the Agentic-SEO-Skill. Each task ends with explicit verification commands and expected output.

---

## File Structure

- `src/content/learn-topics.tsx` (Create) — `TopicId` type, `LearnTopic` interface, `LEARN_TOPICS` array (moved from `learn/page.tsx`, plus `slug`/`summary`/`seoTitle`/`seoDescription`/`relatedHow`). Contains JSX → `.tsx`.
- `src/content/diagnoses.ts` (Create) — `DiagnosisContent` interface, `DIAGNOSES` record (moved from `DiagnosisScreen.tsx`, plus optional `page` block), slug helpers. Plain strings → `.ts`.
- `src/components/DiagnosisScreen.tsx` (Modify) — import `DIAGNOSES` from the module; add "Read more about this" link to `/how/<slug>`.
- `src/app/how/[slug]/page.tsx` (Create) — attack-vector page.
- `src/app/learn/page.tsx` (Modify) — convert from accordion to summary index (server component).
- `src/app/learn/[slug]/page.tsx` (Create) — learn topic page.
- `src/app/learn/layout.tsx` (Delete) — its hub-level Article JSON-LD would wrongly apply to spokes; metadata moves onto each page.
- `src/app/about/page.tsx` (Create) — About / E-E-A-T page.
- `src/app/layout.tsx` (Modify) — enrich `Organization` JSON-LD (`logo`, `founder`, `sameAs`); add footer.
- `src/app/sitemap.ts` (Modify) — add `/how/*`, `/learn/*`, `/about`, derived from the content modules.

---

## Task 1: Extract learn topics into a shared module

**Files:**
- Create: `src/content/learn-topics.tsx`
- Modify: `src/app/learn/page.tsx` (temporarily still imports the data; full hub rewrite is Task 6)

- [ ] **Step 1: Create `src/content/learn-topics.tsx`**

Move the `TopicId` type and the entire `TOPICS` array out of `src/app/learn/page.tsx` into this module. Rename the export to `LEARN_TOPICS`. Add the new fields to each topic. Interface:

```tsx
import type { DiagnosisType } from "@/lib/probability";

export type TopicId =
  | "seed-phrase" | "scams" | "browsing" | "approvals" | "signing"
  | "hot-cold" | "multisig" | "after-hacked" | "checklist";

export interface LearnTopic {
  id: TopicId;
  slug: string;            // /learn/<slug>
  title: string;           // existing
  summary: string;         // NEW — 1-2 sentences for hub cards + meta description fallback
  seoTitle: string;        // NEW
  seoDescription: string;  // NEW
  content: React.ReactNode; // existing JSX
  relatedHow: DiagnosisType[]; // NEW — links to /how pages
}

export const LEARN_TOPICS: LearnTopic[] = [ /* moved + extended */ ];

export const getTopicBySlug = (slug: string) =>
  LEARN_TOPICS.find((t) => t.slug === slug);
```

Slug map: `seed-phrase`→`seed-phrase-security`, `scams`→`recognizing-scams`, `browsing`→`safe-browsing`, `approvals`→`token-approvals`, `signing`→`verify-before-signing`, `hot-cold`→`hot-and-cold-wallets`, `multisig`→`multisig-wallets`, `after-hacked`→`what-to-do-after-being-hacked`, `checklist`→`security-checklist`.

Worked example (seed-phrase entry — keep existing `content` JSX verbatim):

```tsx
{
  id: "seed-phrase",
  slug: "seed-phrase-security",
  title: "Seed Phrase Security",
  summary:
    "Your seed phrase is the master key to your wallet. Here's how to store it so no one — malware, cloud sync, or a thief — can ever reach it.",
  seoTitle: "Seed Phrase Security: How to Store Your Recovery Phrase Safely",
  seoDescription:
    "Your seed phrase controls your entire wallet. Learn the simple rules for storing it offline so it can never be stolen, copied, or synced to the cloud.",
  content: ( /* existing JSX unchanged */ ),
  relatedHow: ["cloud_storage", "phone_storage", "digital_storage", "exposed_in_code"],
},
```

Author `summary`/`seoTitle`/`seoDescription` for the other 8 topics following this pattern (accurate, unique, ≤60-char titles where possible, ≤155-char descriptions). Set `relatedHow` per topic using the `DiagnosisType` literals.

- [ ] **Step 2: Update `src/app/learn/page.tsx` to import from the module**

Replace the inline `TopicId` type and `TOPICS` array with `import { LEARN_TOPICS, type TopicId } from "@/content/learn-topics";` and use `LEARN_TOPICS` in the existing accordion render (leave the accordion as-is for now; it's rewritten in Task 6).

- [ ] **Step 3: Verify build + hub unchanged**

Run: `cd app && npm run build`
Expected: compiles, TypeScript passes, `/learn` listed.
Run: `find .next -name 'learn.html' -path '*app*' | head -1 | xargs grep -c "Whoever has your seed phrase"`
Expected: `1` (content still SSR'd).

- [ ] **Step 4: Commit**

```bash
git add app/src/content/learn-topics.tsx app/src/app/learn/page.tsx
git commit -m "refactor: extract learn topics into shared content module"
```

---

## Task 2: Extract diagnosis content into a shared module

**Files:**
- Create: `src/content/diagnoses.ts`
- Modify: `src/components/DiagnosisScreen.tsx`

- [ ] **Step 1: Create `src/content/diagnoses.ts`**

Move `DIAGNOSIS_CONTENT` out of `DiagnosisScreen.tsx` into this module as `DIAGNOSES`. Keep all existing fields. Add an optional `page` block (present for all 16 real vectors; omitted for `unknown`).

```ts
import type { DiagnosisType } from "@/lib/probability";
import type { TopicId } from "@/content/learn-topics";

export interface DiagnosisPage {
  slug: string;
  h1: string;              // answer-framed headline for /how/<slug>
  seoTitle: string;
  seoDescription: string;
  howItWorks: string[];    // NEW unique depth, ~3-5 paras
  warningSigns: string[];  // NEW bullet list
  relatedLearn: TopicId[];
  relatedDiagnoses: DiagnosisType[]; // 3-4 for internal linking
}

export interface DiagnosisContent {
  title: string;
  mainCopy: string[];
  empathy: string;
  actionItems: string[];
  externalLinks?: { label: string; url: string }[];
  page?: DiagnosisPage;
}

export const DIAGNOSES: Record<DiagnosisType, DiagnosisContent> = { /* moved + extended */ };

// Ordered list of indexable /how pages (excludes `unknown`, which has no `page`).
export const HOW_PAGES = (Object.entries(DIAGNOSES) as [DiagnosisType, DiagnosisContent][])
  .filter(([, d]) => d.page)
  .map(([type, d]) => ({ type, ...d.page! }));

export const getDiagnosisBySlug = (slug: string) =>
  HOW_PAGES.find((p) => p.slug === slug);
```

Slug map (provisional, finalize here): `malicious_transaction`→`malicious-transaction`, `clipboard_compromise`→`clipboard-malware`, `cloud_storage`→`seed-phrase-in-cloud-storage`, `phone_storage`→`seed-phrase-on-your-phone`, `digital_storage`→`seed-phrase-in-a-file`, `exposed_in_code`→`private-key-in-code`, `password_reuse`→`password-reuse`, `phishing_fake_site`→`fake-website-phishing`, `phishing_email`→`phishing-email-attachment`, `malicious_download`→`malicious-download`, `malicious_extension`→`malicious-browser-extension`, `social_engineering_file`→`malware-from-discord-or-telegram`, `fake_job_scam`→`fake-job-scam`, `compromised_setup`→`someone-else-set-up-your-wallet`, `purchased_wallet_scam`→`pre-loaded-wallet-scam`, `compromised_hardware`→`tampered-hardware-wallet`.

Worked example (`malicious_transaction` — existing fields kept, `page` added):

```ts
malicious_transaction: {
  title: "You signed a malicious transaction.",
  mainCopy: [
    "When you connect your wallet to a site and approve a transaction, you're trusting that site to do what it claims. Malicious sites create transactions that look legitimate but actually drain your wallet or grant unlimited access to your tokens.",
  ],
  empathy: "",
  actionItems: [
    "Be extremely skeptical of any \"opportunity\"",
    "Verify sites independently before connecting your wallet",
    "Use a separate \"hot wallet\" with small amounts for risky activities",
    "Consider hardware wallets for significant holdings",
  ],
  externalLinks: [{ label: "Revoke token approvals", url: "https://revoke.cash" }],
  page: {
    slug: "malicious-transaction",
    h1: "Your wallet was drained by a malicious transaction",
    seoTitle: "Wallet Drained After Signing a Transaction? Here's What Happened",
    seoDescription:
      "If your crypto vanished right after you approved a transaction or token approval, you likely signed a malicious request. Here's how it works and what to do now.",
    howItWorks: [
      "Most drainer attacks don't need your seed phrase at all. They trick you into signing a transaction or token approval that hands the attacker permission to move your assets — then a bot sweeps them out, often within seconds.",
      "The dangerous signatures usually fall into a few buckets: an ERC-20 `approve` (or `Permit`/`Permit2`) granting an unlimited spending allowance; a `setApprovalForAll` that signs away an entire NFT collection; or an outright transfer disguised behind a friendly-looking 'Claim' or 'Connect' button.",
      "Because the website controls what it shows you, the button can say 'Claim airdrop' while the actual transaction grants spending rights. The transaction — not the website — is the truth.",
    ],
    warningSigns: [
      "Funds left moments after you clicked 'Confirm', 'Claim', or 'Connect' on a site.",
      "You approved a token or signed a message you didn't fully understand.",
      "The site created urgency ('mint closes in 5 minutes', 'claim before it's gone').",
      "Your wallet asked to 'blind sign' an unreadable string of data.",
    ],
    relatedLearn: ["approvals", "signing", "scams"],
    relatedDiagnoses: ["phishing_fake_site", "malicious_extension", "fake_job_scam"],
  },
},
```

Author the `page` block for the other 15 vectors. **Quality bar:** `howItWorks` = 2-4 short paragraphs of accurate, vector-specific mechanics (no padding, no repetition across pages); `warningSigns` = 3-5 concrete bullets; titles ≤~60 chars, descriptions ≤~155 chars; set `relatedLearn`/`relatedDiagnoses` using valid literals. Base the prose on each entry's existing `mainCopy`/`actionItems`, expanded with correct security detail.

- [ ] **Step 2: Update `DiagnosisScreen.tsx` to import the module**

Remove the inline `DIAGNOSIS_CONTENT` definition. Add `import { DIAGNOSES } from "@/content/diagnoses";` and change `const content = DIAGNOSIS_CONTENT[diagnosisType];` → `const content = DIAGNOSES[diagnosisType];`. Leave `MALICIOUS_TX_CONTEXT` in `DiagnosisScreen.tsx` (flow-specific).

- [ ] **Step 3: Verify build + diagnostic flow intact**

Run: `cd app && npm run build`
Expected: compiles, TypeScript passes.
Run: `find .next -name '*.html' -path '*diagnosis*'` then confirm the diagnosis route still builds (it's client-rendered; build success is the gate).
Manual: `npm run dev`, open `/diagnostic`, complete a path, confirm a diagnosis renders with title + action items.

- [ ] **Step 4: Commit**

```bash
git add app/src/content/diagnoses.ts app/src/components/DiagnosisScreen.tsx
git commit -m "refactor: extract diagnosis content into shared module + page metadata"
```

---

## Task 3: Attack-vector pages `/how/[slug]`

**Files:**
- Create: `src/app/how/[slug]/page.tsx`

- [ ] **Step 1: Create the route**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DIAGNOSES, HOW_PAGES, getDiagnosisBySlug } from "@/content/diagnoses";
import { getTopicBySlug, LEARN_TOPICS } from "@/content/learn-topics";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return HOW_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getDiagnosisBySlug(params.slug);
  if (!p) return {};
  return {
    title: p.seoTitle,
    description: p.seoDescription,
    alternates: { canonical: `/how/${p.slug}` },
    openGraph: { type: "article", title: p.seoTitle, description: p.seoDescription, url: `${SITE_URL}/how/${p.slug}` },
    twitter: { title: p.seoTitle, description: p.seoDescription },
  };
}

export default async function HowPage({ params }: { params: Promise<{ slug: string }> }) {
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
          { "@type": "ListItem", position: 2, name: page.h1, item: `${SITE_URL}/how/${page.slug}` },
        ],
      },
    ],
  };

  return (
    <article className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">{page.h1}</h1>
      </header>

      <section className="space-y-4 text-[var(--text-muted)]">
        {d.mainCopy.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">How this attack works</h2>
        {page.howItWorks.map((p, i) => <p key={i} className="text-[var(--text-muted)]">{p}</p>)}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Warning signs</h2>
        <ul className="space-y-2">
          {page.warningSigns.map((s, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]"><span className="text-[var(--primary)] flex-shrink-0">•</span><span>{s}</span></li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">What to do right now</h2>
        <ul className="space-y-3">
          {d.actionItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]"><span className="text-[var(--primary)] flex-shrink-0">•</span><span>{item}</span></li>
          ))}
        </ul>
        {d.externalLinks?.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline block">{l.label} →</a>
        ))}
      </section>

      <div className="rounded-xl bg-[var(--primary)]/10 p-6 text-center">
        <p className="text-[var(--foreground)] mb-4">Not sure this is what happened to you?</p>
        <Link href="/diagnostic" className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] px-6 text-white font-medium hover:bg-[var(--primary-hover)] transition-colors">Run the 2-minute diagnostic</Link>
      </div>

      {page.relatedLearn.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Learn how to prevent this</h2>
          <ul className="space-y-2">
            {page.relatedLearn.map((id) => {
              const t = LEARN_TOPICS.find((x) => x.id === id);
              return t ? <li key={id}><Link href={`/learn/${t.slug}`} className="text-[var(--primary)] hover:underline">{t.title} →</Link></li> : null;
            })}
          </ul>
        </section>
      )}

      {page.relatedDiagnoses.length > 0 && (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Other ways wallets get compromised</h2>
          <ul className="space-y-2">
            {page.relatedDiagnoses.map((type) => {
              const rp = DIAGNOSES[type].page;
              return rp ? <li key={type}><Link href={`/how/${rp.slug}`} className="text-[var(--primary)] hover:underline">{rp.h1} →</Link></li> : null;
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
```

> Note: confirm the `params` shape against the installed Next version (Next 16 awaits `params`). `generateMetadata` may also need `await params` — adjust both to match (await in both, or neither) so the build passes.

- [ ] **Step 2: Verify build, SSR content, metadata**

Run: `cd app && npm run build`
Expected: 16 `/how/<slug>` entries prerendered as static (`●`/`○`).
Run: `find .next -path '*how*' -name 'malicious-transaction.html' | head -1 | xargs grep -c "drained"`
Expected: `≥1` (body content SSR'd).
Run (after deploy, Task 10) the validator.

- [ ] **Step 3: Commit**

```bash
git add app/src/app/how
git commit -m "feat: add /how/<slug> attack-vector pages"
```

---

## Task 4: Link diagnostic result → matching `/how` page

**Files:**
- Modify: `src/components/DiagnosisScreen.tsx`

- [ ] **Step 1: Add a "Read more" link**

In `DiagnosisScreen`, after the action-items card, render a link to the matching page when one exists:

```tsx
{content.page && (
  <Link href={`/how/${content.page.slug}`} className="text-[var(--primary)] hover:underline block text-center">
    Read more about this attack →
  </Link>
)}
```

(`Link` is already imported in this file.)

- [ ] **Step 2: Verify build**

Run: `cd app && npm run build` → Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/DiagnosisScreen.tsx
git commit -m "feat: link diagnosis result to its /how explainer page"
```

---

## Task 5: Learn topic pages `/learn/[slug]`

**Files:**
- Create: `src/app/learn/[slug]/page.tsx`
- Delete: `src/app/learn/layout.tsx`

- [ ] **Step 1: Delete `src/app/learn/layout.tsx`**

Its hub-level Article JSON-LD and metadata would wrongly apply to every `/learn/*` page. Hub metadata moves to `learn/page.tsx` (Task 6); spoke metadata is per-page below.

```bash
git rm app/src/app/learn/layout.tsx
```

- [ ] **Step 2: Create `src/app/learn/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LEARN_TOPICS, getTopicBySlug } from "@/content/learn-topics";
import { DIAGNOSES } from "@/content/diagnoses";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export function generateStaticParams() {
  return LEARN_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTopicBySlug(slug);
  if (!t) return {};
  return {
    title: t.seoTitle,
    description: t.seoDescription,
    alternates: { canonical: `/learn/${t.slug}` },
    openGraph: { type: "article", title: t.seoTitle, description: t.seoDescription, url: `${SITE_URL}/learn/${t.slug}` },
    twitter: { title: t.seoTitle, description: t.seoDescription },
  };
}

export default async function LearnTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTopicBySlug(slug);
  if (!t) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: t.seoTitle, description: t.seoDescription, mainEntityOfPage: `${SITE_URL}/learn/${t.slug}`, inLanguage: "en", author: { "@type": "Organization", name: SITE_NAME }, publisher: { "@id": `${SITE_URL}/#organization` }, isPartOf: { "@id": `${SITE_URL}/#website` } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Learn", item: `${SITE_URL}/learn` },
        { "@type": "ListItem", position: 3, name: t.title, item: `${SITE_URL}/learn/${t.slug}` },
      ] },
    ],
  };

  return (
    <article className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header><h1 className="text-2xl font-semibold text-[var(--foreground)]">{t.title}</h1></header>
      <div>{t.content}</div>
      {t.relatedHow.length > 0 && (
        <section className="space-y-3 border-t border-[var(--border)] pt-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Related ways wallets get hacked</h2>
          <ul className="space-y-2">
            {t.relatedHow.map((type) => {
              const rp = DIAGNOSES[type].page;
              return rp ? <li key={type}><Link href={`/how/${rp.slug}`} className="text-[var(--primary)] hover:underline">{rp.h1} →</Link></li> : null;
            })}
          </ul>
        </section>
      )}
      <p><Link href="/learn" className="text-[var(--primary)] hover:underline">← All best practices</Link></p>
    </article>
  );
}
```

- [ ] **Step 3: Verify build + SSR content**

Run: `cd app && npm run build`
Expected: 9 `/learn/<slug>` static entries.
Run: `find .next -path '*learn*' -name 'seed-phrase-security.html' | head -1 | xargs grep -c "Whoever has your seed phrase"`
Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add app/src/app/learn
git commit -m "feat: add /learn/<slug> topic pages"
```

---

## Task 6: Convert `/learn` hub into a summary index

**Files:**
- Modify: `src/app/learn/page.tsx` (rewrite as server component)

- [ ] **Step 1: Rewrite the hub**

Replace the entire client accordion with a server component that lists topic summary cards linking to the spokes (no full content → no duplication). Export metadata directly.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { LEARN_TOPICS } from "@/content/learn-topics";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Crypto Wallet Security: Best Practices to Avoid Getting Hacked",
  description:
    "Learn how to protect your crypto wallet: seed phrase security, spotting scams, token approvals, verifying what you sign, hot/cold wallets, multisig, and recovery.",
  alternates: { canonical: "/learn" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Crypto Wallet Security Best Practices",
  url: `${SITE_URL}/learn`,
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Learn Best Practices</h1>
        <p className="mt-3 text-[var(--text-muted)]">Protect yourself going forward with these essential security practices.</p>
      </div>
      <div className="space-y-4">
        {LEARN_TOPICS.map((t) => (
          <Link key={t.id} href={`/learn/${t.slug}`} className="block rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--primary)] transition-colors">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.title}</h2>
            <p className="mt-2 text-[var(--text-muted)]">{t.summary}</p>
          </Link>
        ))}
      </div>
      <p className="text-center text-[var(--text-muted)]">
        To read more, visit the{" "}
        <a href="https://frameworks.securityalliance.org/wallet-security/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-medium">Security Alliance Wallet Security framework</a>.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify hub no longer duplicates full content**

Run: `cd app && npm run build`
Run: `find .next -name 'learn.html' -path '*app*' | head -1 | xargs grep -c "Whoever has your seed phrase"`
Expected: `0` (full content now only on spokes; hub shows summaries).
Run: `find .next -name 'learn.html' -path '*app*' | head -1 | xargs grep -c "Seed Phrase Security"`
Expected: `1` (card title + link present).

- [ ] **Step 3: Commit**

```bash
git add app/src/app/learn/page.tsx
git commit -m "feat: convert /learn hub to summary index linking topic pages"
```

---

## Task 7: About page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who's behind How Was My Wallet Hacked?, how the diagnostic works, and our privacy stance — no wallet connection and no personal data.",
  alternates: { canonical: "/about" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${SITE_URL}/about`,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
  mainEntity: {
    "@type": "Person",
    name: "Elliott Alexander",
    url: "https://elliottalexander.xyz",
    sameAs: ["https://github.com/escottalexander", "https://x.com/escottalexander"],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">About {SITE_NAME}</h1>
      <div className="space-y-4 text-[var(--text-muted)]">
        <p><strong className="text-[var(--foreground)]">{SITE_NAME}</strong> is a free tool that helps people who've had crypto stolen understand the most likely way their wallet was compromised — and learn the practices that prevent it from happening again.</p>
        <p>It was built by <a href="https://elliottalexander.xyz" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Elliott Alexander</a>, a software developer working in the crypto/Ethereum space. {/* USER: confirm/edit this one-line bio */} You can find him on <a href="https://github.com/escottalexander" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">GitHub</a> and <a href="https://x.com/escottalexander" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">X</a>.</p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">How the diagnostic works</h2>
        <p>The tool asks a series of questions about what happened and uses a transparent probability model to suggest the most likely attack vector. Guidance is grounded in the <a href="https://frameworks.securityalliance.org/wallet-security/" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Security Alliance Wallet Security framework</a>.</p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">Your privacy</h2>
        <p>There's no wallet connection and we never ask for your seed phrase, private key, or any personal information. The tool only stores anonymized, aggregate analytics about which diagnoses are common — never anything that identifies you.</p>
        <h2 className="text-lg font-semibold text-[var(--foreground)] pt-2">Already hacked?</h2>
        <p>If you need to rescue assets from a compromised wallet, see <a href="https://hackedwalletrecovery.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">HackedWalletRecovery.com</a>.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build** — Run: `cd app && npm run build` → `/about` static.

- [ ] **Step 3: Commit**

```bash
git add app/src/app/about
git commit -m "feat: add About page with Person/AboutPage schema"
```

---

## Task 8: Enrich Organization schema + add footer

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Enrich the `Organization` node**

In the `jsonLd` `@graph`, extend the `Organization` object with:

```ts
logo: `${SITE_URL}/icon.svg`,
founder: {
  "@type": "Person",
  name: "Elliott Alexander",
  url: "https://elliottalexander.xyz",
  sameAs: ["https://github.com/escottalexander", "https://x.com/escottalexander"],
},
sameAs: [
  "https://github.com/escottalexander",
  "https://x.com/escottalexander",
  "https://elliottalexander.xyz",
  "https://hackedwalletrecovery.com",
],
```

- [ ] **Step 2: Add a footer** before `</body>`, after `</SessionProvider>`:

```tsx
<footer className="mx-auto max-w-3xl px-4 sm:px-6 py-8 border-t border-[var(--border)] text-sm text-[var(--text-muted)]">
  <nav className="flex flex-wrap gap-x-6 gap-y-2">
    <Link href="/about" className="hover:text-[var(--primary)] transition-colors">About</Link>
    <Link href="/learn" className="hover:text-[var(--primary)] transition-colors">Learn</Link>
    <Link href="/diagnostic" className="hover:text-[var(--primary)] transition-colors">Diagnostic</Link>
    <a href="https://github.com/escottalexander" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--primary)] transition-colors">GitHub</a>
  </nav>
</footer>
```

- [ ] **Step 3: Verify build + schema** — Run: `cd app && npm run build`; confirm `/` HTML contains `"sameAs"` and `"founder"`.

- [ ] **Step 4: Commit**

```bash
git add app/src/app/layout.tsx
git commit -m "feat: enrich Organization schema (logo, founder, sameAs) + footer"
```

---

## Task 9: Extend the sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add the new routes, derived from the content modules**

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { HOW_PAGES } from "@/content/diagnoses";
import { LEARN_TOPICS } from "@/content/learn-topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/learn`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/diagnostic`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];
  const how = HOW_PAGES.map((p) => ({ url: `${SITE_URL}/how/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 }));
  const learn = LEARN_TOPICS.map((t) => ({ url: `${SITE_URL}/learn/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.7 }));
  return [...base, ...how, ...learn];
}
```

- [ ] **Step 2: Verify** — Run: `cd app && npm run build`; `find .next -name 'sitemap.xml*'` then grep for `/how/malicious-transaction` and `/learn/seed-phrase-security`. Expected: present (≈29 URLs).

- [ ] **Step 3: Commit**

```bash
git add app/src/app/sitemap.ts
git commit -m "feat: add /how, /learn, /about routes to sitemap"
```

---

## Task 10: Deploy, verify live, submit to IndexNow

- [ ] **Step 1: Deploy** — Run: `cd app && npm run deploy`. Expected: success, version id printed.

- [ ] **Step 2: Verify live (custom domain)**

```bash
B=https://howwasmywallethacked.com
for u in how/malicious-transaction how/fake-website-phishing learn/seed-phrase-security learn/token-approvals about; do
  printf "/%-28s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "$B/$u"; done
curl -s "$B/how/malicious-transaction" | grep -c "How this attack works"   # expect 1
curl -s "$B/learn/seed-phrase-security" | grep -c "Whoever has your seed phrase" # expect 1
curl -s "$B/sitemap.xml" | grep -c "/how/"  # expect 16
```

- [ ] **Step 3: Validate schema** — Run from the skill dir:
`python3 scripts/validate_schema.py <(curl -s https://howwasmywallethacked.com/how/malicious-transaction)` (or save to a file first). Expected: valid JSON-LD, no placeholder/deprecated types.

- [ ] **Step 4: Submit new URLs to IndexNow**

```bash
KEY=6ada4bf3191a04a1f6d2d38688134a22
# Build urlList from sitemap, POST to https://api.indexnow.org/indexnow with host/key/keyLocation/urlList
```

- [ ] **Step 5: Final commit (if any verification fixups)** and update `ACTION-PLAN.md` / `FULL-AUDIT-REPORT.md` to mark content expansion done.

---

## Self-Review

- **Spec coverage:** Single source of truth → Tasks 1-2. Attack pages → Task 3. Diagnostic→/how link → Task 4. Learn spokes → Task 5. Learn hub index (no dup) → Task 6. About + Person schema → Task 7. Organization schema + footer → Task 8. Sitemap → Task 9. Deploy/IndexNow → Task 10. All spec sections covered.
- **Placeholder scan:** Content authoring in Tasks 1-2 is specified with a worked example + explicit quality bar (this is content to write, not a code placeholder). The only intentional human flag is the About bio one-liner, marked inline for user confirmation. No code TODOs.
- **Type consistency:** `DIAGNOSES`, `HOW_PAGES`, `getDiagnosisBySlug`, `DiagnosisPage.page.slug/h1`, `LEARN_TOPICS`, `getTopicBySlug`, `TopicId`, `relatedHow`/`relatedLearn`/`relatedDiagnoses` used consistently across Tasks 1-9. Next 16 `await params` flagged in Tasks 3/5.
- **Open risk:** Next 16 `params` Promise shape — Task 3 note says align `generateMetadata`/default export. Verify at first build.
