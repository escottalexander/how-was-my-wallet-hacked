# SEO Full Audit — How Was I Hacked?

**Audited URL:** https://how-was-i-hacked.escottalexander.workers.dev/
**Date:** 2026-06-25
**Method:** LLM-first audit (Agentic-SEO-Skill) + source-code inspection + script-backed evidence
**Overall Score: 42 / 100 — Poor**

> The site has genuinely excellent, trustworthy security content and clean performance fundamentals — but almost none of it is discoverable. The single highest-value page (`/learn`) is invisible to crawlers, every page shares one title/description, and there is no social, canonical, sitemap, or structured-data infrastructure. These are high-impact, low-effort fixes.

## Score by Category

| Category | Weight | Score | Rating |
|----------|:------:|:-----:|--------|
| Technical SEO | 25% | 50 | Needs Improvement |
| Content Quality | 20% | 40 | Poor (content hidden) |
| On-Page SEO | 15% | 35 | Poor |
| Schema / Structured Data | 15% | 0 | Critical |
| Performance (CWV) | 10% | ~75 (hypothesis) | Good* |
| Image Optimization | 10% | 80 | Good |
| AI Search Readiness (GEO) | 5% | 20 | Poor |

\* PageSpeed Insights API was rate-limited during the audit (environment limitation). Score is a hypothesis based on the static OpenNext/Cloudflare delivery, minimal JS, and `next/font` self-hosting. Re-run `pagespeed.py` with an API key to confirm.

---

## 🔴 Critical Findings

### C1 — `/learn` content is completely hidden from crawlers
- **Evidence:** `src/app/learn/page.tsx` is a `'use client'` component rendering each topic body only when `expandedTopic === topic.id`. Default state is `null`, so the server-rendered HTML contains **none** of the body content. Verified: a body sentence ("Whoever has your seed phrase…") returns **0 matches** in the fetched HTML; only the accordion **titles** (9) are present.
- **Impact:** The most valuable, keyword-rich content on the entire site (seed-phrase security, scams, approvals, signing, multisig, post-hack steps) cannot be indexed by Google or read by AI crawlers. This page should be the primary organic-traffic and AI-citation driver and currently ranks for nothing.
- **Fix:** Render all topic content in the initial HTML; make the accordion progressive enhancement (CSS `<details>`/`<summary>`, or render content always-present and toggle visibility), or convert `/learn` to a server component with collapsible client islands. Content must exist in SSR HTML regardless of expanded state.

### C2 — No per-page metadata (duplicate titles & descriptions sitewide)
- **Evidence:** Only `src/app/layout.tsx` defines `metadata` (`title: "How Was I Hacked?"`, one description). `/`, `/learn`, `/diagnostic`, `/diagnostic/diagnosis`, `/analytics` all inherit the identical title and description. Client pages (`/learn`, `/diagnostic`) can't currently export metadata at all.
- **Impact:** Duplicate titles/descriptions are a classic on-page weakness — Google can't differentiate pages, and SERP snippets are generic. `/learn` should target "crypto wallet security" queries with its own title.
- **Fix:** Add a `title.template` in the root layout and unique `title`/`description` per route. For client pages, split a server `page.tsx` (exports `metadata`) wrapping a client component, or move interactivity into child client components.

### C3 — No structured data (JSON-LD)
- **Evidence:** No `<script type="application/ld+json">` in any rendered HTML.
- **Impact:** No `Organization`/`WebSite` entity for Google's Knowledge Graph, no rich-result eligibility, weaker AI-search grounding (GEO). This is 15% of the audit weight at 0.
- **Fix:** Add `WebSite` + `Organization` JSON-LD in the root layout. Add `Article`-style structured data to `/learn` topics once they're SSR-rendered. **Do not** use `FAQPage` (restricted to gov/health authority sites since Aug 2023) or `HowTo` (rich results removed Sept 2023).

### C4 — No sitemap.xml
- **Evidence:** `GET /sitemap.xml` → **404**. No `sitemap.ts` in `src/app/`.
- **Impact:** No machine-readable index of canonical pages for crawlers.
- **Fix:** Add `src/app/sitemap.ts` (Next.js native) listing `/`, `/learn`, `/diagnostic`, and reference it from robots.

### C5 — No Open Graph / Twitter Card tags
- **Evidence:** `social_meta.py` → **Score 0/100**. All required OG tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and `twitter:card` missing.
- **Impact:** This is a tool people share with a friend who was *just* hacked — in DMs, Telegram, X. With no OG image/title, every shared link renders as a bare grey URL, killing click-through exactly when it matters most.
- **Fix:** Add `openGraph` and `twitter` blocks to metadata + a 1200×630 OG image (Next.js `opengraph-image.tsx` can generate one).

---

## ⚠️ Warnings

### W1 — `metadataBase` / canonical URLs not set
- No `metadataBase`, no `alternates.canonical`. OG/canonical URLs will be relative/incorrect once a real domain is live. Set `metadataBase` to the production domain and add canonicals per page.

### W2 — robots.txt has no Sitemap directive and no AI-crawler policy
- **Evidence:** `robots_checker.py` — robots.txt returns 200 (Cloudflare's default "content-signals" header only), **0 user-agent groups**, **no `Sitemap:` directive**, 11 AI crawlers unmanaged.
- **Fix:** Add `src/app/robots.ts` with explicit `allow` rules, a `Sitemap:` line, and a deliberate AI-crawler stance. For an educational safety tool you almost certainly *want* GPTBot/ClaudeBot/PerplexityBot to index — so explicitly allow them (this is a GEO opportunity, not a blocking risk).

### W3 — No llms.txt (AI search readiness / GEO)
- **Evidence:** `llms_txt_checker.py` → 404. **Fix:** Add `/llms.txt` summarising the site and linking key pages, so AI assistants can ground answers about "how was my crypto wallet hacked."

### W4 — Internal/utility pages are indexable
- `/analytics` (internal stats dashboard) and `/diagnostic/diagnosis` (session-dependent result) should be `robots: { index: false }`. Only `/`, `/learn`, and the `/diagnostic` entry point belong in the index.

### W5 — Homepage `<h1>` has no topical relevance
- **Evidence:** `<h1>We're sorry you're here.</h1>` — empathetic and on-brand, but contains zero target keywords.
- **Fix:** Keep the empathetic line as visible copy, but ensure the page communicates "find out how your crypto wallet was hacked" in the `<h1>` or an SSR intro paragraph. Don't sacrifice the tone — augment it.

### W6 — On a `workers.dev` subdomain (no custom domain)
- **Evidence:** Live at `how-was-i-hacked.escottalexander.workers.dev`. **Impact:** `workers.dev` can't rank well, isn't memorable/shareable, and confers no domain authority. See the separate domain-name recommendation. This blocks W1 (canonical/OG base) until resolved.

---

## ✅ Passing / Strengths
- `<html lang="en">` set correctly.
- Responsive viewport meta present and well-formed.
- Favicon, SVG icon, and Apple touch icon all present.
- Fonts self-hosted via `next/font` (no render-blocking third-party font requests).
- Content quality (E-E-A-T) is genuinely high: specific, accurate, non-salesy wallet-security guidance with authoritative outbound references (Security Alliance, SEAL 911, revoke.cash, Safe). Once SSR-visible (C1), this is a strong ranking and AI-citation asset.
- Minimal images / no heavy media; low CLS risk.

---

## Environment Limitations
- **PageSpeed Insights API rate-limited** (no API key) — Core Web Vitals (LCP/INP/CLS) not measured. Performance score is a hypothesis. Add a `PAGESPEED_API_KEY` to `.env` and re-run for confirmed numbers.
- `social_meta.py` required `beautifulsoup4` (installed mid-audit; result above is valid).

---

## Remediation Results (2026-06-25, post-fix)

All P1–P8 fixes were implemented and deployed. Verified live on the Worker:

| Finding | Before | After |
|---------|--------|-------|
| C1 `/learn` content in SSR HTML | 0 (hidden) | ✅ Present in HTML; accordion now CSS-toggled |
| C2 Per-page titles | 1 shared title | ✅ Unique title/description per route |
| C3 Structured data | None | ✅ `Organization` + `WebSite` (root) and `Article` (`/learn`) JSON-LD |
| C4 sitemap.xml | 404 | ✅ 200 (`/`, `/learn`, `/diagnostic`) |
| C5 Social meta | 0/100 | ✅ **85/100** (full OG + Twitter + 1200×630 image) |
| W1 metadataBase/canonical | None | ✅ Set to `howwasmywallethacked.com`; canonical per page |
| W2 robots.txt | CF default, no sitemap | ✅ Explicit allow + `Sitemap:` + AI crawlers allowed |
| W3 llms.txt | 404 | ✅ 200 |
| W4 Indexable utility pages | Indexable | ✅ `/analytics` + `/diagnostic/diagnosis` set `noindex` |

**Estimated post-fix score: ~82 / 100 (Good)** — pending (a) custom domain going live so canonical/OG URLs resolve, and (b) confirmed Core Web Vitals.

### Remaining / follow-up
- **W6 (domain):** `howwasmywallethacked.com` registered but **not yet added to the Cloudflare account / pointed at the Worker**. Until DNS is wired, the site serves from `workers.dev` while canonical/OG URLs reference the custom domain. Wire the domain to remove this gap.
- **W5 (home h1):** Left as the empathetic "We're sorry you're here." by design; metadata and SSR body carry the topical keywords.
- **Perf:** Re-run `pagespeed.py` with an API key for confirmed Core Web Vitals.

## Evidence Appendix (scripts run)
- `robots_checker.py` — 200; 0 UA groups; no Sitemap; 11 AI crawlers unmanaged.
- `social_meta.py` — 0/100; all OG + Twitter tags missing.
- `llms_txt_checker.py` — llms.txt & llms-full.txt both 404.
- Direct `curl` SSR inspection — `/learn` body content absent (0 matches), titles present.
- `pagespeed.py` — rate-limited (see Environment Limitations).
