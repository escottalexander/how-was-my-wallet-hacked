'use client';

import Link from 'next/link';
import type { DiagnosisType } from '@/lib/probability';

// All diagnosis content per PRD
const DIAGNOSIS_CONTENT: Record<
  DiagnosisType,
  {
    title: string;
    mainCopy: string[];
    empathy: string;
    actionItems: string[];
    externalLinks?: { label: string; url: string }[];
  }
> = {
  cloud_storage: {
    title: 'Your seed phrase was likely stolen from cloud storage.',
    mainCopy: [
      'When you store your seed phrase in Google Drive, iCloud, Dropbox, or similar services, anyone who compromises your cloud account has full access to your wallet. Hackers specifically target cloud accounts knowing that people store sensitive information there.',
    ],
    empathy: "This happens to a lot of people. You're not alone, and now you know better.",
    actionItems: [
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal - never store it digitally',
      'Keep it somewhere physically secure that only you can access',
    ],
  },
  phone_storage: {
    title: 'Your seed phrase was likely stolen from your phone.',
    mainCopy: [
      'Screenshots and photos are automatically backed up to cloud services, synced across devices, and accessible to apps with photo permissions. Hackers know this and specifically look for seed phrase photos.',
      'Many people make this mistake thinking it\'s a quick, convenient backup. Unfortunately, it\'s one of the easiest ways to lose your funds.',
    ],
    empathy: '',
    actionItems: [
      'Delete any photos of seed phrases from your phone AND cloud backups',
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal only',
      'Store it somewhere physically secure',
    ],
  },
  digital_storage: {
    title: 'Your seed phrase was likely stolen from a file on your computer.',
    mainCopy: [
      'Text files, notes apps, and documents on your computer can be accessed by malware, synced to cloud services without you realizing, or found if someone gains access to your machine. Hackers use automated tools to scan computers for anything that looks like a seed phrase.',
    ],
    empathy: 'This is an easy mistake to make. Now you know to do better.',
    actionItems: [
      'Delete any digital copies of seed phrases',
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal only',
      'Never store seed phrases on any digital device',
    ],
  },
  password_reuse: {
    title: 'Your wallet was likely compromised through password reuse.',
    mainCopy: [
      'When you use the same password across multiple sites, a breach on any one of those sites exposes all your accounts. Hackers buy leaked password databases and automatically try those credentials everywhere - including password managers and crypto-related services.',
      'This is extremely common. Billions of passwords have been leaked over the years.',
    ],
    empathy: '',
    actionItems: [
      'Use a unique, randomly-generated password for every account',
      'Use a reputable password manager with a very strong master password',
      'Enable 2FA everywhere possible (preferably not SMS-based)',
      'Create a brand new wallet with a fresh seed phrase',
    ],
    externalLinks: [
      { label: 'Check if your passwords have been leaked', url: 'https://haveibeenpwned.com' },
    ],
  },
  phishing_fake_site: {
    title: 'You likely entered your seed phrase into a fake website.',
    mainCopy: [
      'Scammers create convincing copies of legitimate wallet sites, exchanges, and dApps. They use similar domain names, identical designs, and urgent messaging to trick you into entering your seed phrase. The moment you enter it, they have full access to your wallet.',
      'No legitimate service will ever ask for your seed phrase. Ever.',
    ],
    empathy: '',
    actionItems: [
      'Never enter your seed phrase into any website',
      'Bookmark official sites and only use those bookmarks',
      'Be extremely suspicious of any site asking for your seed phrase',
      'Create a brand new wallet with a fresh seed phrase',
    ],
  },
  exposed_in_code: {
    title: 'Your private key or seed phrase was likely exposed in code or configuration files.',
    mainCopy: [
      'Developers sometimes paste private keys into .env files, config files, or code during development. If this code is ever pushed to GitHub, shared with others, or your computer is compromised, that key is exposed. Hackers actively scan public repositories and compromised machines for exposed keys.',
    ],
    empathy: 'This is a common mistake, especially for developers new to crypto.',
    actionItems: [
      'Never put real private keys in code, even temporarily',
      'Use hardware wallets or separate development wallets for testing',
      'Add sensitive files to .gitignore before creating them',
      'Assume any key that touched a code file is compromised',
      'Create a brand new wallet for real funds',
    ],
  },
  clipboard_compromise: {
    title: 'Your seed phrase or private key was likely stolen via clipboard.',
    mainCopy: [
      'When you copy your seed phrase, it sits in your clipboard where malware can read it. Some malware specifically monitors for crypto-related data being copied. Other malware even replaces wallet addresses in your clipboard with the attacker\'s address.',
      'If you\'ve ever copied and pasted your seed phrase, especially on a computer that might have malware, consider it compromised.',
    ],
    empathy: '',
    actionItems: [
      'Never copy/paste seed phrases or private keys',
      'Run antivirus/malware scans on your devices',
      'Create a brand new wallet with a fresh seed phrase',
      'Type seed phrases manually when absolutely necessary',
    ],
  },
  social_engineering_file: {
    title: 'You likely installed malware sent to you on Discord or Telegram.',
    mainCopy: [
      'Scammers pose as friendly community members, potential business partners, or even "support staff" and send files that contain malware. This malware can steal seed phrases, monitor your clipboard, or take control of your browser extensions.',
      'This is one of the most common attack vectors in crypto. The person who sent you that file was not who they claimed to be.',
    ],
    empathy: '',
    actionItems: [
      'Never download files from people you don\'t know personally',
      'Be suspicious even of files from "friends" (their accounts may be compromised)',
      'Assume anyone offering unsolicited help is a scammer',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  phishing_email: {
    title: 'You likely opened a malicious email attachment.',
    mainCopy: [
      'Phishing emails often contain attachments disguised as invoices, documents, or important files. These can install malware that steals your seed phrase, logs your keystrokes, or monitors your crypto activity.',
      'Email phishing has been around for decades, and crypto users are now prime targets.',
    ],
    empathy: '',
    actionItems: [
      'Never open attachments from unknown senders',
      'Be suspicious of unexpected attachments, even from known contacts',
      'Verify with the sender through a different channel if unsure',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  malicious_download: {
    title: 'You likely downloaded malware from a website.',
    mainCopy: [
      'Fake download sites, compromised legitimate sites, and malicious ads can all serve malware disguised as legitimate software. This malware then steals your seed phrase, monitors your activity, or takes control of your wallet.',
      'Always verify you\'re downloading from official sources.',
    ],
    empathy: '',
    actionItems: [
      'Only download software from official websites',
      'Verify URLs carefully before downloading anything',
      'Be suspicious of "cracked" or free versions of paid software',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  fake_job_scam: {
    title: 'You were targeted by a fake job or freelance scam.',
    mainCopy: [
      'Scammers pose as recruiters or clients and send "test projects," "onboarding documents," or "required software" that contains malware. This is an increasingly common attack targeting developers and freelancers in the crypto space.',
      'The job offer was never real. It was a sophisticated social engineering attack.',
    ],
    empathy: '',
    actionItems: [
      'Research companies thoroughly before opening any files',
      'Never run code or install software from unknown sources',
      'Be suspicious of unsolicited job offers, especially in DMs',
      'Use virtual machines for reviewing suspicious projects',
      'Run antivirus scans and consider reinstalling your OS',
      'Create a brand new wallet on a clean device',
    ],
  },
  malicious_extension: {
    title: 'You likely installed a malicious browser extension.',
    mainCopy: [
      'Fake wallet extensions, compromised extensions, or extensions with excessive permissions can steal your seed phrase, modify transactions, or inject malicious code into websites you visit.',
      'Browser extensions have significant access to your browser activity.',
    ],
    empathy: '',
    actionItems: [
      'Only install extensions from official sources',
      'Verify extension publishers carefully',
      'Regularly review and remove extensions you don\'t use',
      'Use a separate browser profile for crypto activities',
      'Create a brand new wallet after removing suspicious extensions',
    ],
  },
  compromised_setup: {
    title: 'The person who helped set up your wallet may have kept your seed phrase.',
    mainCopy: [
      'When someone else sees your seed phrase - even someone you trust - they have full access to your wallet forever. They may have written it down, photographed it, or memorized it.',
      'Unfortunately, even well-meaning helpers can later decide to steal funds, or their own security practices may expose your seed phrase.',
    ],
    empathy: '',
    actionItems: [
      'Always set up wallets yourself, in private',
      'Never let anyone else see your seed phrase',
      'Your seed phrase is yours alone - no exceptions',
      'Create a brand new wallet that only you control',
    ],
  },
  purchased_wallet_scam: {
    title: "You can't actually buy a wallet. This was a scam.",
    mainCopy: [
      'When someone "sells" you a wallet with funds in it, they still know the seed phrase. They will always be able to access that wallet. The "stuck funds" or "locked tokens" were bait to get you to pay them.',
      'No free lunch in crypto, just like everywhere else. If something sounds too good to be true, it probably is.',
    ],
    empathy: '',
    actionItems: [
      'Never buy, accept, or use a wallet someone else created',
      'Always create your own wallet from scratch',
      'Remember: whoever knows the seed phrase controls the wallet',
      'If it seems too good to be true, it is',
    ],
  },
  compromised_hardware: {
    title: 'Your hardware wallet may have been pre-compromised.',
    mainCopy: [
      'Hardware wallets bought from unofficial sources (Amazon third-party sellers, eBay, secondhand) may have been tampered with. Scammers buy devices, extract or pre-generate seed phrases, then resell them as "new."',
      'Always buy hardware wallets directly from the manufacturer.',
    ],
    empathy: '',
    actionItems: [
      'Only buy hardware wallets from official manufacturer websites',
      'Never use a hardware wallet that came with a pre-filled seed phrase',
      'When setting up, the device should generate a new seed phrase',
      'Consider your current hardware wallet compromised',
    ],
  },
  malicious_transaction: {
    title: 'You signed a malicious transaction.',
    mainCopy: [
      'When you connect your wallet to a site and approve a transaction, you\'re trusting that site to do what it claims. Malicious sites create transactions that look legitimate but actually drain your wallet or grant unlimited access to your tokens.',
    ],
    empathy: '',
    actionItems: [
      'Be extremely skeptical of any "opportunity"',
      'Verify sites independently before connecting your wallet',
      'Use a separate "hot wallet" with small amounts for risky activities',
      'Consider hardware wallets for significant holdings',
    ],
    externalLinks: [
      { label: 'Revoke token approvals', url: 'https://revoke.cash' },
    ],
  },
  unknown: {
    title: "We weren't able to pinpoint exactly how this happened.",
    mainCopy: [
      'The most common causes are:',
      '• Seed phrase stored digitally somewhere you may have forgotten',
      '• Clipboard malware capturing copy/paste',
      '• A malicious site or app you don\'t remember interacting with',
    ],
    empathy: 'The good news: You can still protect yourself going forward.',
    actionItems: [
      'Create a brand new wallet with a fresh seed phrase',
      'Write it down on paper or metal - never store it digitally',
      'Keep it somewhere physically secure',
      'Be extremely cautious about sites you connect your wallet to',
    ],
  },
};

// Context-specific additions for malicious_transaction based on how they found the site
const MALICIOUS_TX_CONTEXT: Record<string, string> = {
  social_media:
    'Scammers constantly post fake opportunities on Twitter, Discord, and Telegram. They create urgency with "limited time" offers and use bot accounts to make things look popular.',
  google_search:
    'Scammers pay for ads that appear above legitimate search results. They also use SEO techniques to rank fake sites highly. Always verify you\'re on the official site.',
  dm: 'Anyone who DMs you about a crypto opportunity is almost certainly a scammer. Legitimate projects don\'t recruit through unsolicited messages. This is one of the most common attack vectors.',
  email:
    'Phishing emails impersonate legitimate projects and exchanges. Always navigate to sites directly rather than clicking email links.',
  typed_url:
    'You may have made a typo and landed on a lookalike domain (typosquatting), or the legitimate site itself was compromised. Bookmark official sites and use only those bookmarks.',
};

interface DiagnosisScreenProps {
  diagnosisType: DiagnosisType;
  context?: {
    howFound?: string;
    whatDoing?: string;
  };
  onReject: () => void;
  onAccept: () => void;
  onLearnClick: () => void;
  onHwrClick: () => void;
  isSubmitting?: boolean;
}

export function DiagnosisScreen({
  diagnosisType,
  context,
  onReject,
  onAccept,
  onLearnClick,
  onHwrClick,
  isSubmitting,
}: DiagnosisScreenProps) {
  const content = DIAGNOSIS_CONTENT[diagnosisType];

  if (!content) {
    // Fallback to unknown if diagnosis type not found
    return (
      <DiagnosisScreen
        diagnosisType="unknown"
        onReject={onReject}
        onAccept={onAccept}
        onLearnClick={onLearnClick}
        onHwrClick={onHwrClick}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Get context-specific copy for malicious transaction
  const contextCopy =
    diagnosisType === 'malicious_transaction' && context?.howFound
      ? MALICIOUS_TX_CONTEXT[context.howFound]
      : null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Main diagnosis title */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{content.title}</h1>
      </div>

      {/* Explanation copy */}
      <div className="space-y-4 text-[var(--text-muted)]">
        {content.mainCopy.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}

        {/* Add context-specific copy for malicious transactions */}
        {contextCopy && <p className="mt-4">{contextCopy}</p>}
      </div>

      {/* Empathy message if present */}
      {content.empathy && (
        <p className="text-[var(--foreground)] font-medium">{content.empathy}</p>
      )}

      {/* Action items */}
      <div className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Protect yourself going forward:
        </h2>
        <ul className="space-y-3">
          {content.actionItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span className="text-[var(--primary)] flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* External links if present */}
        {content.externalLinks && content.externalLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            {content.externalLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={link.url.includes('haveibeenpwned') ? undefined : onHwrClick}
                className="text-[var(--primary)] hover:underline block"
              >
                {link.label} →
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Primary action buttons */}
      <div className="flex flex-col gap-3">
        <Link
          href="/learn"
          onClick={onLearnClick}
          className="w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white text-center transition-colors duration-200 hover:bg-[var(--primary-hover)]"
        >
          Learn Best Practices
        </Link>
        <a
          href="https://hackedwalletrecovery.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onHwrClick}
          className="w-full rounded-xl border-2 border-[var(--primary)] px-6 py-4 text-lg font-medium text-[var(--primary)] text-center transition-colors duration-200 hover:bg-[var(--primary)]/10"
        >
          HackedWalletRecovery.com
        </a>
      </div>

      {/* Accept/Reject buttons */}
      <div className="pt-4 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--text-muted)] text-center mb-4">
          Does this sound like what happened?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={isSubmitting}
            className={`flex-1 rounded-xl border-2 border-[var(--border)] px-4 py-3 text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--primary)] ${
              isSubmitting ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Yes, this makes sense'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className={`flex-1 rounded-xl border-2 border-[var(--border)] px-4 py-3 text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--primary)] ${
              isSubmitting ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            This doesn&apos;t seem right
          </button>
        </div>
      </div>
    </div>
  );
}
