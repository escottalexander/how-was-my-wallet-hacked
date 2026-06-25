# SEO Action Plan — How Was I Hacked?

Prioritized by impact ÷ effort. Items P1–P5 are the high-leverage fixes; do them first.

| # | Priority | Fix | Effort | Addresses | Status |
|---|----------|-----|:------:|-----------|--------|
| P1 | 🔴 Now | SSR-render `/learn` topic content (kill the click-gated accordion for crawlers) | M | C1 | ✅ Done |
| P2 | 🔴 Now | Per-page `metadata` (unique title/description) + `title.template` | M | C2 | ✅ Done |
| P3 | 🔴 Now | Set `metadataBase` + add Open Graph & Twitter Card + OG image | S | C5, W1 | ✅ Done |
| P4 | 🔴 Now | Add `sitemap.ts` + `robots.ts` (Sitemap directive, allow AI crawlers, noindex utility pages) | S | C4, W2, W4 | ✅ Done |
| P5 | 🔴 Now | Add `WebSite` + `Organization` JSON-LD; `Article` data on `/learn` | S | C3 | ✅ Done |
| P6 | ⚠️ Soon | Add `/llms.txt` for AI-search grounding | S | W3 | ✅ Done |
| P7 | ⚠️ Soon | Add canonical URL per page (`alternates.canonical`) | S | W1 | ✅ Done |
| P8 | ⚠️ Soon | Strengthen homepage topical signal without losing the empathetic tone | S | W5 | ✅ Done via metadata (visible h1 kept by design) |
| P9 | 🟡 Decision | Wire up custom domain `howwasmywallethacked.com` | M | W6 | ⏳ Domain registered; needs DNS → Cloudflare |
| P10 | 🟡 Later | Re-run PageSpeed with API key; confirm Core Web Vitals | S | Perf | ⏳ Pending |

**Effort:** S = <30 min · M = ~1–2 h

---

## Sequencing notes
- **Domain chosen: `howwasmywallethacked.com`** (registered 2026-06-25). All absolute URLs (`metadataBase`, sitemap, canonicals, `og:url`) use a single `SITE_URL` constant in `src/lib/site.ts`, so any future domain change is one line.
- **P1 is the biggest single win** — it converts the site's best content from invisible to indexable and AI-citable.
- All fixes are native Next.js App Router APIs (`metadata`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) — no new dependencies, fully compatible with the OpenNext/Cloudflare deployment.

## Definition of done
- `curl /learn` returns the topic body text in HTML (P1 verified).
- Each route returns a unique `<title>` and `<meta name="description">`.
- `social_meta.py` score ≥ 80; `/sitemap.xml` returns 200; `robots.txt` contains a `Sitemap:` line.
- Valid JSON-LD present (verify with `validate_schema.py`).
- `/analytics` and `/diagnostic/diagnosis` return `noindex`.
