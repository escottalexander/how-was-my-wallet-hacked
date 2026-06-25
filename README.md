# How Was My Wallet Hacked?

A free tool that helps people who've had crypto stolen understand the most likely way their
wallet was compromised — and learn the practices that prevent it from happening again.

**Live:** https://howwasmywallethacked.com

There's no wallet connection and no personal data: you answer a series of questions, and a
transparent probability model suggests the most likely attack vector (phishing, malicious
token approvals, seed-phrase exposure, malware, fake apps, and more). The guidance is grounded
in the [Security Alliance Wallet Security framework](https://frameworks.securityalliance.org/wallet-security/).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4
- [Cloudflare Workers](https://workers.cloudflare.com) via [OpenNext](https://opennext.js.org/cloudflare)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for anonymized, aggregate analytics

## Project structure

```
src/
  app/              Routes (App Router)
    how/[slug]/     Attack-vector explainer pages (one per diagnosis type)
    learn/          Best-practices hub + /learn/[slug] topic pages
    diagnostic/     The guided question flow
    about/          About / methodology / privacy
    api/            Route handlers (session, path, diagnosis, analytics)
    sitemap.ts      robots.ts  opengraph-image.png
  components/       UI components (QuestionPipeline, DiagnosisScreen, …)
  content/          Single source of truth for page content
    diagnoses.ts        Diagnosis copy + /how page metadata
    learn-topics.tsx    Learn topic content + metadata
  lib/              Probability model, questions, D1 access, site config
migrations/         D1 schema migrations
```

Page content lives in `src/content/` so the interactive diagnostic flow and the static SEO
pages render from the same data and never drift.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 (local D1 binding via OpenNext)
```

## Deploy

Deploys to Cloudflare Workers via OpenNext:

```bash
npm run deploy       # opennextjs-cloudflare build && deploy
npm run preview      # build and preview the Worker locally
```

Configuration lives in `wrangler.jsonc` (Worker name, D1 binding, assets). Regenerate the
Cloudflare type bindings with `npm run cf-typegen`.

## Database (Cloudflare D1)

```bash
npx wrangler d1 migrations apply howwasihacked --remote   # apply migrations to prod
npx wrangler d1 migrations apply howwasihacked --local    # apply to local dev DB
```

## Privacy

The app never asks for a seed phrase, private key, or any personal information, and there's no
wallet connection. Only anonymized, aggregate analytics about which diagnoses are common are
stored.

## Author

Built by [Elliott Alexander](https://elliottalexander.xyz) —
[GitHub](https://github.com/escottalexander) · [X](https://x.com/escottalexander).
