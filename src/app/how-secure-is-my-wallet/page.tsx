import { PreventionFlow } from '@/components/PreventionFlow';

// Server-rendered so crawlers get a real <h1> and value-prop copy in the initial
// HTML (the interactive flow below is client-rendered). This is the page's only
// <h1>; the wallet-builder step headings are <h2>.
export default function HowSecureIsMyWalletPage() {
  return (
    <div className="space-y-8">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          How secure is my wallet?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--text-muted)]">
          Map your wallets and answer a few quick questions to get a 0–100 crypto wallet
          security score, with the exact weak spots to fix.
        </p>
      </header>
      <PreventionFlow />
    </div>
  );
}
