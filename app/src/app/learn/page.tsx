'use client';

import { useState } from 'react';

// Topic IDs for anchoring and navigation
type TopicId = 'seed-phrase' | 'scams' | 'browsing' | 'approvals';

interface TopicSection {
  id: TopicId;
  title: string;
  content: React.ReactNode;
}

const TOPICS: TopicSection[] = [
  {
    id: 'seed-phrase',
    title: 'Seed Phrase Security',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Your seed phrase is everything.
        </p>
        <p className="text-[var(--text-muted)]">
          Whoever has your seed phrase has complete control of your wallet. There&apos;s no &quot;forgot
          password&quot; option, no customer support to call, no way to recover funds if someone else
          gets it.
        </p>
        <div className="mt-6">
          <p className="font-semibold text-[var(--foreground)] mb-3">The rules are simple:</p>
          <ul className="space-y-3 text-[var(--text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Write it down on paper or stamp it in metal</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Store it somewhere physically secure (safe, safety deposit box)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never store it digitally - no photos, no cloud, no notes apps</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never share it with anyone, for any reason</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never enter it into any website</span>
            </li>
          </ul>
        </div>
        <p className="mt-6 p-4 rounded-xl bg-[var(--primary)]/10 text-[var(--foreground)]">
          No legitimate wallet, exchange, or support team will ever ask for your seed phrase. Anyone
          who does is trying to steal from you.
        </p>
      </div>
    ),
  },
  {
    id: 'scams',
    title: 'Recognizing Scams',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          If it sounds too good to be true, it is.
        </p>
        <p className="text-[var(--text-muted)]">
          Scammers are creative and persistent. Common tactics include:
        </p>
        <div className="space-y-6 mt-6">
          <div>
            <p className="font-semibold text-[var(--foreground)]">Fake airdrops and giveaways</p>
            <p className="text-[var(--text-muted)] mt-1">
              &quot;Send 0.1 ETH to receive 1 ETH back&quot; - This is always a scam. Always.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Urgent opportunities</p>
            <p className="text-[var(--text-muted)] mt-1">
              &quot;Mint closes in 10 minutes!&quot; - Artificial urgency is designed to make you act
              without thinking.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Unsolicited DMs</p>
            <p className="text-[var(--text-muted)] mt-1">
              Anyone messaging you about a crypto opportunity is a scammer. Block and move on.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              &quot;Support&quot; reaching out to you
            </p>
            <p className="text-[var(--text-muted)] mt-1">
              Real support teams don&apos;t DM first. If someone claims to be support and contacts
              you, it&apos;s a scam.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">
              Purchased wallets or &quot;stuck funds&quot;
            </p>
            <p className="text-[var(--text-muted)] mt-1">
              You can&apos;t buy a wallet. The seller will always have the seed phrase.
            </p>
          </div>
        </div>
        <p className="mt-6 p-4 rounded-xl bg-[var(--primary)]/10 text-[var(--foreground)]">
          No free lunch in crypto, just like everywhere else.
        </p>
      </div>
    ),
  },
  {
    id: 'browsing',
    title: 'Safe Browsing Habits',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          How you navigate matters.
        </p>
        <div className="space-y-6 mt-6">
          <div>
            <p className="font-semibold text-[var(--foreground)]">Bookmark everything</p>
            <p className="text-[var(--text-muted)] mt-1">
              Save official URLs and only use your bookmarks. Never click links from DMs, emails, or
              social media.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Verify before connecting</p>
            <p className="text-[var(--text-muted)] mt-1">
              Before connecting your wallet to any site, verify you&apos;re on the real site. Check
              the URL character by character.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Watch out for ads</p>
            <p className="text-[var(--text-muted)] mt-1">
              Scammers buy Google ads for fake versions of popular sites. Scroll past ads to organic
              results, or use your bookmarks.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Be careful what you download</p>
            <p className="text-[var(--text-muted)] mt-1">
              Never download files from strangers. Be suspicious of unexpected attachments.
              &quot;Test projects&quot; from recruiters are a common attack vector.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'approvals',
    title: 'Understanding Approvals',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Token approvals can drain your wallet.
        </p>
        <p className="text-[var(--text-muted)]">
          When you approve a token on a dApp, you&apos;re often giving that contract permission to
          move your tokens. Malicious contracts ask for unlimited approvals and then drain
          everything.
        </p>
        <div className="mt-6">
          <p className="font-semibold text-[var(--foreground)] mb-3">Best practices:</p>
          <ul className="space-y-3 text-[var(--text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Revoke unused approvals regularly</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Read what you&apos;re signing (or use tools that translate it)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Be suspicious of unlimited approval requests</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Use a separate wallet for risky activities</span>
            </li>
          </ul>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
          <a
            href="https://revoke.cash"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline font-medium"
          >
            Check and revoke your token approvals at revoke.cash →
          </a>
        </div>
      </div>
    ),
  },
];

export default function LearnPage() {
  const [expandedTopic, setExpandedTopic] = useState<TopicId | null>(null);

  const toggleTopic = (topicId: TopicId) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Learn Best Practices</h1>
        <p className="mt-3 text-[var(--text-muted)]">
          Protect yourself going forward with these essential security practices.
        </p>
      </div>

      {/* Topics */}
      <div className="space-y-4">
        {TOPICS.map((topic) => (
          <div
            key={topic.id}
            id={topic.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleTopic(topic.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--background)] transition-colors"
            >
              <span className="text-lg font-semibold text-[var(--foreground)]">{topic.title}</span>
              <span
                className={`text-[var(--text-muted)] transition-transform duration-200 ${
                  expandedTopic === topic.id ? 'rotate-180' : ''
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {expandedTopic === topic.id && (
              <div className="px-5 pb-5 animate-fadeIn">{topic.content}</div>
            )}
          </div>
        ))}
      </div>

      {/* HackedWalletRecovery callout */}
      <div className="mt-8 p-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-center">
        <p className="text-[var(--text-muted)] mb-4">
          Need help recovering assets from a compromised wallet?
        </p>
        <a
          href="https://hackedwalletrecovery.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-xl border-2 border-[var(--primary)] px-6 py-3 text-[var(--primary)] font-medium transition-colors hover:bg-[var(--primary)]/10"
        >
          Visit HackedWalletRecovery.com →
        </a>
      </div>
    </div>
  );
}
