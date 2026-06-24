This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploying to Cloudflare

This app is deployed via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare) and uses a Cloudflare D1 database.

### One-time setup

```bash
# 1. Authenticate with Cloudflare
npx wrangler login

# 2. Create the D1 database
npx wrangler d1 create howwasihacked
# Copy the printed database_id and paste it into wrangler.jsonc,
# replacing the "local-placeholder-id" value.
```

### Apply migrations and deploy

```bash
# Apply migrations to the remote D1 database
npx wrangler d1 migrations apply howwasihacked --remote

# Build and deploy to Cloudflare Pages
npm run deploy
```

### Local development with D1

```bash
# Apply migrations to the local D1 database
npx wrangler d1 migrations apply howwasihacked --local

# Start the local dev server
npm run dev
```
