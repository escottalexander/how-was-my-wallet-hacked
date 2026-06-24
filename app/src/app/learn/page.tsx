'use client';

import { useState } from 'react';

// Topic IDs for anchoring and navigation
type TopicId = 'seed-phrase' | 'scams' | 'browsing' | 'approvals' | 'signing' | 'hot-cold' | 'multisig' | 'after-hacked' | 'checklist';

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
              <span>
                Keep more than one copy in separate physical locations, so a fire, flood, or theft in
                one place doesn&apos;t wipe out your only backup
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Store each copy somewhere physically secure (safe, safety deposit box)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never store it digitally - no photos, no cloud, no notes apps, no password managers</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never share it with anyone, for any reason</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Never enter it into any website</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Check on your backups every so often (twice a year is a good habit) to confirm they&apos;re still readable and untouched</span>
            </li>
          </ul>
        </div>
        <p className="mt-6 p-4 rounded-xl bg-[var(--primary)]/10 text-[var(--foreground)]">
          No legitimate wallet, exchange, or support team will ever ask for your seed phrase. Anyone
          who does is trying to steal from you.
        </p>
        <p className="text-[var(--text-muted)]">
          If you ever suspect your seed phrase has been seen, photographed, typed into a device, or
          copied — treat it as compromised. Generate a brand-new wallet and move everything to it.
        </p>
        <div className="mt-2 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
          <p className="font-semibold text-[var(--foreground)]">Going further (advanced)</p>
          <p className="text-[var(--text-muted)] mt-1">
            Experienced users sometimes add a BIP39 passphrase (a secret &quot;25th word&quot;) or split
            the phrase across multiple backups using Shamir&apos;s Secret Sharing. These raise the bar
            for an attacker, but they also add ways to permanently lock yourself out — only use them if
            you fully understand the recovery process.
          </p>
        </div>
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
  {
    id: 'signing',
    title: 'Verify Before You Sign',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          The transaction is the truth — not the website.
        </p>
        <p className="text-[var(--text-muted)]">
          Most drains happen the moment you click &quot;Confirm.&quot; A polished website can ask you to
          sign something completely different from what it claims. Before you approve anything, check
          what you&apos;re actually signing.
        </p>
        <div className="space-y-6 mt-6">
          <div>
            <p className="font-semibold text-[var(--foreground)]">Insist on readable transactions</p>
            <p className="text-[var(--text-muted)] mt-1">
              Good wallets translate a transaction into plain language (&quot;send 50 USDC to
              0x123…&quot;). If your wallet only shows an unreadable string of characters and asks you
              to &quot;blind sign,&quot; treat that as a red flag and stop.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Your hardware wallet screen is the final word</p>
            <p className="text-[var(--text-muted)] mt-1">
              Malware can change what your computer or phone displays. The screen on your hardware
              device can&apos;t be faked the same way. If the details on your computer don&apos;t exactly
              match the device screen, reject the transaction.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Check the recipient, amount, and network</p>
            <p className="text-[var(--text-muted)] mt-1">
              Confirm the destination address (not just the first and last few characters), the token
              and exact amount, and that you&apos;re on the chain you expect.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Verify the contract and the site</p>
            <p className="text-[var(--text-muted)] mt-1">
              Make sure the contract you&apos;re interacting with matches the official one (check the
              project&apos;s docs or a block explorer like Etherscan), and that the URL is the real site.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Simulate — but stay skeptical</p>
            <p className="text-[var(--text-muted)] mt-1">
              Tools like Rabby and Tenderly preview what a transaction will actually do before you
              sign. They&apos;re a great safety net, but a sophisticated scam can spoof a simulation too,
              so don&apos;t switch your brain off.
            </p>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
          <a
            href="https://wise-signer.cyfrin.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline font-medium"
          >
            Practice spotting dangerous transactions at Wise Signer →
          </a>
        </div>
      </div>
    ),
  },
  {
    id: 'hot-cold',
    title: 'Hot/Cold Wallet Model',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Think checking account vs. savings account.
        </p>
        <p className="text-[var(--text-muted)]">
          A hot wallet is connected to the internet—convenient for daily use, but more vulnerable. A
          cold wallet (hardware wallet) stays offline—less convenient, but much more secure.
        </p>
        <div className="mt-6 space-y-6">
          <div>
            <p className="font-semibold text-[var(--foreground)]">Hot Wallet (checking account)</p>
            <p className="text-[var(--text-muted)] mt-1">
              Keep small amounts here for regular transactions. This is what you connect to dApps.
              If compromised, you lose only what&apos;s in this wallet.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--foreground)]">Cold Wallet (savings account)</p>
            <p className="text-[var(--text-muted)] mt-1">
              Store the majority of your holdings here. Never connect it to unknown sites. Only use
              it to transfer funds to your hot wallet when needed.
            </p>
          </div>
        </div>
        <p className="mt-6 p-4 rounded-xl bg-[var(--primary)]/10 text-[var(--foreground)]">
          The goal: Even if your hot wallet is compromised, your life savings are safe in cold
          storage.
        </p>
        <div className="mt-2">
          <p className="font-semibold text-[var(--foreground)]">Buy and download from the source</p>
          <p className="text-[var(--text-muted)] mt-1">
            Only buy a hardware wallet directly from the manufacturer, and only download wallet
            software from official sites. Devices bought second-hand or from third-party marketplaces
            can arrive pre-tampered, and fake apps are a common way people get drained on day one.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'multisig',
    title: 'Multisig: The Gold Standard',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Multiple keys required = maximum security.
        </p>
        <p className="text-[var(--text-muted)]">
          A multisig (multi-signature) wallet requires multiple approvals to send funds. For
          example, a 2-of-3 multisig needs any 2 of 3 designated keys to approve a transaction.
        </p>
        <div className="mt-6">
          <p className="font-semibold text-[var(--foreground)] mb-3">Why multisig matters:</p>
          <ul className="space-y-3 text-[var(--text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>No single point of failure—one compromised key can&apos;t drain funds</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Lost key recovery—2-of-3 means you can lose one key and still access funds</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Social recovery—trusted family/friends can help in emergencies</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Used by institutions, DAOs, and serious holders worldwide</span>
            </li>
          </ul>
        </div>
        <div className="mt-6">
          <p className="font-semibold text-[var(--foreground)] mb-3">Setting one up well:</p>
          <ul className="space-y-3 text-[var(--text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Spread the keys across different devices, hardware brands, and physical locations — keeping them all in one place defeats the purpose</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Back each key with its own hardware wallet where you can</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Avoid setups where every key is required (like 2-of-2) — lose one and the funds are gone forever. A 2-of-3 lets you survive losing one</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>Verify the actual transaction details on each device before approving, just like any other signature</span>
            </li>
          </ul>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
          <a
            href="https://safe.global"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline font-medium"
          >
            Set up a multisig wallet at safe.global →
          </a>
        </div>
      </div>
    ),
  },
  {
    id: 'after-hacked',
    title: 'What To Do After Being Hacked',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Act fast, but stay calm.
        </p>
        <div className="mt-6">
          <p className="font-semibold text-[var(--foreground)] mb-3">Immediate steps:</p>
          <ol className="space-y-4 text-[var(--text-muted)]">
            <li className="flex gap-3">
              <span className="text-[var(--primary)] font-semibold flex-shrink-0">1.</span>
              <span>
                <strong className="text-[var(--foreground)]">Don&apos;t send funds to the compromised wallet.</strong>{' '}
                It&apos;s tempting to send a little ETH to cover gas so you can move your tokens out — but
                that&apos;s usually a trap. Most compromised wallets are watched by an automated
                &quot;sweeper&quot; bot that instantly steals anything that lands there, including the
                gas you just sent.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] font-semibold flex-shrink-0">2.</span>
              <span>
                <strong className="text-[var(--foreground)]">Set up a new wallet on a device you trust.</strong>{' '}
                Generate a fresh seed phrase on a clean device — ideally a hardware wallet, and not the
                one that may have been compromised. This is where you&apos;ll move anything you can rescue.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] font-semibold flex-shrink-0">3.</span>
              <span>
                <strong className="text-[var(--foreground)]">Rescue what&apos;s left — carefully.</strong>{' '}
                Because of that sweeper bot, simply &quot;sending your tokens out&quot; rarely works. The
                reliable way is a single atomic transaction that pays the gas and moves your assets in
                one bundle, so the bot can&apos;t front-run you.
                <span className="mt-3 block">
                  If you have more than $1,000 at stake, it&apos;s worth bringing in a specialist. SEAL 911
                  connects victims with volunteer security responders who can help recover larger amounts.
                  <a
                    href="https://securityalliance.org/our-work/seal-911"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline font-medium"
                  >
                    {' '}Get help from SEAL 911 →
                  </a>
                </span>
                <span className="mt-3 block">
                  For smaller amounts, tools built for exactly this can walk you through the rescue
                  yourself, without your compromised key ever leaving your machine.
                  <a
                    href="https://hackedwalletrecovery.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline font-medium"
                  >
                    {' '}Try HackedWalletRecovery.com →
                  </a>
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] font-semibold flex-shrink-0">4.</span>
              <span>
                <strong className="text-[var(--foreground)]">Assume the device may still be infected.</strong>{' '}
                If malware could have been involved — you downloaded a file, ran a &quot;test project,&quot;
                or installed a fake app — a quick antivirus scan isn&apos;t enough. The only way to be
                confident the threat is gone is a full operating-system reinstall (wipe and reload) on
                the affected device. Never enter your new seed phrase on a device you don&apos;t fully trust.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--primary)] font-semibold flex-shrink-0">5.</span>
              <span>
                <strong className="text-[var(--foreground)]">Secure your other accounts.</strong>{' '}
                From a clean device, change passwords on exchanges and crypto-related accounts and turn
                on hardware-key or app-based 2FA — attackers often go after everything they can reach.
              </span>
            </li>
          </ol>
        </div>
        <p className="mt-6 p-4 rounded-xl bg-[var(--primary)]/10 text-[var(--foreground)]">
          Remember: the compromised wallet address is now permanently unsafe. Never reuse it — not even
          for a fresh start.
        </p>
      </div>
    ),
  },
  {
    id: 'checklist',
    title: 'Security Checklist',
    content: (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-[var(--foreground)]">
          Your crypto security essentials.
        </p>
        <p className="text-[var(--text-muted)]">
          Use this checklist to audit and improve your security posture.
        </p>
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Seed Phrase Storage</p>
            <ul className="space-y-2 text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span>☐</span>
                <span>Written on paper or stamped in metal</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Stored in a secure physical location</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>No digital copies anywhere</span>
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Wallet Architecture</p>
            <ul className="space-y-2 text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span>☐</span>
                <span>Hot wallet for daily use with limited funds</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Cold wallet for savings/large holdings</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Consider multisig for significant amounts</span>
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Browsing Habits</p>
            <ul className="space-y-2 text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span>☐</span>
                <span>Official sites bookmarked</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Never click links from DMs or emails</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Verify URLs before connecting wallet</span>
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Signing &amp; Verification</p>
            <ul className="space-y-2 text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span>☐</span>
                <span>Wallet shows transactions in readable form (no blind signing)</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Recipient, amount, and contract checked before signing</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Details confirmed on the hardware wallet screen itself</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Hardware wallet bought directly from the manufacturer</span>
              </li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border)]">
            <p className="font-semibold text-[var(--foreground)] mb-2">Account Security</p>
            <ul className="space-y-2 text-[var(--text-muted)]">
              <li className="flex gap-2">
                <span>☐</span>
                <span>Unique passwords for crypto accounts</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>2FA enabled (preferably hardware key)</span>
              </li>
              <li className="flex gap-2">
                <span>☐</span>
                <span>Unused token approvals revoked regularly</span>
              </li>
            </ul>
          </div>
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

      {/* Read more / source */}
      <p className="text-center text-[var(--text-muted)]">
        To read more, visit the{' '}
        <a
          href="https://frameworks.securityalliance.org/wallet-security/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] hover:underline font-medium"
        >
          Security Alliance Wallet Security framework
        </a>
        .
      </p>

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
