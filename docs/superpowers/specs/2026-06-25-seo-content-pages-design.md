# SEO Content Expansion — Design Spec

**Date:** 2026-06-25
**Site:** howwasmywallethacked.com (Next.js App Router on OpenNext/Cloudflare)
**Goal:** Convert the site's existing, vetted security content into deep topical coverage that ranks for high-intent post-hack queries, and add the trust (E-E-A-T) signals Google weighs heavily for security content.

## Background

The app already contains high-quality, vetted copy that is currently invisible to search:
- **16 attack-vector definitions** in `DiagnosisScreen.tsx` (`DIAGNOSIS_CONTENT`) — only ever shown on the `noindex`'d session result page.
- **9 learn topics** in `learn/page.tsx` (`TOPICS`) — shown in one accordion hub.

This spec turns that content into 25 indexable content pages (16 attack-vector + 9 learn) plus an About page — 26 new pages total — with no duplicated source copy.

## Principles

- **Single source of truth.** Extract content data into shared modules; the diagnostic flow and the new pages both consume them. No copy is duplicated in two places.
- **No thin/programmatic filler.** Each page covers a genuinely distinct vector/topic and is expanded to be substantive (~150–250 words of unique, accurate depth beyond the existing copy). 26 new pages is under the SEO thin-content thresholds, and the pages are legitimately distinct.
- **Follow existing patterns.** Reuse the current layout, CSS variables, and Next App Router conventions (`generateStaticParams`, `metadata`, file-based routing). No new dependencies.

## Architecture

### Content modules (the refactor)
- `src/content/diagnoses.ts` — move `DIAGNOSIS_CONTENT` here. Extend each entry with:
  - `slug` (used at `/how/<slug>`)
  - `seoTitle`, `seoDescription`
  - `howItWorks: string[]` — expanded unique detail (the new depth)
  - `warningSigns: string[]`
  - `relatedLearn: TopicId[]` — links to relevant learn topics
  - `relatedDiagnoses: DiagnosisType[]` — 3–4 related vectors for internal linking
  - (existing fields retained: `title`, `mainCopy`, `empathy`, `actionItems`, `externalLinks`)
- `src/content/learn-topics.ts` — move `TOPICS` here, add `slug`, `seoTitle`, `seoDescription`, `summary` (for the hub index card), `relatedHow: DiagnosisType[]`.
- `DiagnosisScreen.tsx` and `learn/page.tsx` are updated to import from these modules. The `MALICIOUS_TX_CONTEXT` map stays with the diagnostic flow (it's flow-specific, not page content).

### A. Attack-vector pages — `/how/<slug>` (16 pages)
- Route: `src/app/how/[slug]/page.tsx` — server component, `generateStaticParams()` over all slugs (excluding `unknown`), `generateMetadata()` per slug.
- Page sections: H1 (answer-framed) → *What happened* → *How this attack works* → *Warning signs* → *What to do right now* (action items + external tools) → "Not sure this is it? Run the 2-minute diagnostic" CTA → related `/learn` topic links → related `/how` vectors.
- Structured data: `Article` + `BreadcrumbList` JSON-LD.
- Slugs (provisional; final at implementation):
  | DiagnosisType | slug |
  |---|---|
  | malicious_transaction | malicious-transaction |
  | clipboard_compromise | clipboard-malware |
  | cloud_storage | seed-phrase-in-cloud-storage |
  | phone_storage | seed-phrase-on-your-phone |
  | digital_storage | seed-phrase-in-a-file |
  | exposed_in_code | private-key-in-code |
  | password_reuse | password-reuse |
  | phishing_fake_site | fake-website-phishing |
  | phishing_email | phishing-email-attachment |
  | malicious_download | malicious-download |
  | malicious_extension | malicious-browser-extension |
  | social_engineering_file | malware-from-discord-or-telegram |
  | fake_job_scam | fake-job-scam |
  | compromised_setup | someone-else-set-up-your-wallet |
  | purchased_wallet_scam | pre-loaded-wallet-scam |
  | compromised_hardware | tampered-hardware-wallet |
- `unknown` is excluded (not a real vector; would be thin).
- The diagnostic result screen (`DiagnosisScreen`) gains a "Read more about this →" link to the matching `/how/<slug>` page, connecting the `noindex` flow to indexable content.

### B. `/learn` hub + spokes (9 topic pages)
- `/learn` becomes an **index**: a short summary card per topic linking to its page (replaces the all-in-one accordion). This removes duplicate content between hub and spokes.
- `src/app/learn/[slug]/page.tsx` — full topic content, SSR, `generateStaticParams()`, `generateMetadata()`, `Article` + `BreadcrumbList` schema, cross-links to related topics and related `/how` pages.
- Topic slugs: `seed-phrase-security`, `recognizing-scams`, `safe-browsing`, `token-approvals`, `verify-before-signing`, `hot-and-cold-wallets`, `multisig-wallets`, `what-to-do-after-being-hacked`, `security-checklist`.

### C. Trust / E-E-A-T
- `src/app/about/page.tsx` — server component. Content:
  - Who: built by **Elliott Alexander** (GitHub https://github.com/escottalexander, X https://x.com/escottalexander, site https://elliottalexander.xyz).
  - Bio: modest, non-fabricated (e.g., "a software developer working in the crypto/Ethereum space"). **← user to confirm/edit wording.**
  - Methodology: guidance is based on the Security Alliance wallet-security framework.
  - Privacy stance: no wallet connection, no personal data collected, anonymized analytics only.
  - Companion to HackedWalletRecovery.com.
  - `ProfilePage`/`AboutPage` + `Person` JSON-LD.
- **Enrich `Organization` schema** (root layout `jsonLd`): add `logo` (use `/icon.svg` or the existing PNG), `founder` (Person: Elliott Alexander), and `sameAs`: [GitHub, X, personal site, https://hackedwalletrecovery.com].
- **Footer** (new, in `layout.tsx`): minimal — About · Learn · GitHub. Currently there is no footer; this strengthens site-wide internal linking and trust.

### Sitemap & submission
- `sitemap.ts` updated to include all 16 `/how/*`, all 9 `/learn/*`, `/about`. (`/learn` hub and `/diagnostic` remain.)
- After deploy, submit the new URLs to IndexNow (Bing/Yandex) using the existing key.

## Out of scope
- Core Web Vitals measurement (separate follow-up).
- Off-page/backlink outreach (user-driven).
- Any change to the diagnostic question logic or probability model.

## Success criteria
- 26 new pages return 200 with unique `<title>`, unique `<meta description>`, and their body content present in SSR HTML.
- Valid `Article`/`BreadcrumbList`/`Person` JSON-LD on the respective pages.
- `/learn` hub no longer duplicates full topic content (index of summaries).
- Diagnostic result links to the matching `/how/<slug>`.
- All new URLs present in `sitemap.xml` and submitted to IndexNow.
- `npm run build` clean; existing diagnostic flow unchanged in behavior.
