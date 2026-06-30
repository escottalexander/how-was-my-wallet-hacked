import type { Question, QuestionOption } from '@/lib/questions';
import { holdsSelfCustody, walletLabel, type WalletEntry } from '@/lib/wallet-portfolio';

// Builds the prevention question path from the user's wallet portfolio.
//
// Risk lives on specific wallets, and each wallet type has a different threat
// surface, so we ask only the questions that actually apply:
//   - browser extension: keys are software on a general computer -> ask that
//     computer's malware habits + where the seed lives.
//   - mobile: the OS sandboxes the key from other apps -> ask seed storage, app
//     source, and OS; skip the "do you download stuff" surface.
//   - hardware: keys are offline -> ask seed-backup hygiene + who set it up.
//   - multisig: a single compromised signer is below threshold -> ask how many
//     signer devices are exposed, plus backup hygiene.
//   - exchange: no keys you hold -> account-hardening only.
// A handful of behaviour questions are about the person, not a wallet, so
// they're asked once at the end.

const SEED_OPTIONS: QuestionOption[] = [
  { id: 'offline', label: 'On paper or metal, offline', description: 'Never typed into a device' },
  { id: 'cloud', label: 'Cloud storage', description: 'iCloud, Drive, Dropbox, a synced note' },
  { id: 'phone_photo', label: 'A photo or screenshot' },
  { id: 'file', label: 'A file or notes app' },
  { id: 'password_manager', label: 'A password manager' },
  { id: 'in_code', label: 'In code or a .env file' },
  { id: 'someone_has_copy', label: 'Someone else has a copy' },
];

// Namespaced id so each wallet's answers stay separate: w0__seed_locations, etc.
export const wkey = (index: number, key: string): string => `w${index}__${key}`;

function seedQuestion(index: number, label: string, backup = false): Question {
  return {
    id: wkey(index, 'seed_locations'),
    type: 'multi',
    title: backup
      ? `Where do you keep the recovery backup for ${label}?`
      : `Where does the recovery phrase for ${label} live?`,
    subtitle: 'Select every place that applies.',
    options: SEED_OPTIONS,
    showIf: () => true,
  };
}

function extensionQuestions(index: number, label: string): Question[] {
  return [
    seedQuestion(index, label),
    {
      id: wkey(index, 'device_habits'),
      type: 'multi',
      title: `On the computer where ${label} lives, do you also do any of these?`,
      subtitle: 'This is the device an attacker would need to reach. Select all that apply.',
      options: [
        { id: 'download_crypto_apps', label: 'Download crypto apps or tools' },
        { id: 'run_code_or_dev', label: 'Run code or do dev work' },
        { id: 'install_extensions', label: 'Install other browser extensions' },
        { id: 'open_files_from_people', label: 'Open files people send me' },
        { id: 'use_cracked_software', label: 'Use cracked or "free" paid software' },
        { id: 'none', label: 'None of these — it stays clean' },
      ],
      showIf: () => true,
    },
  ];
}

function mobileQuestions(index: number, label: string): Question[] {
  return [
    {
      id: wkey(index, 'phone_os'),
      type: 'single',
      title: `What phone is ${label} on?`,
      options: [
        { id: 'ios', label: 'iPhone (iOS)' },
        { id: 'android', label: 'Android' },
        { id: 'other', label: 'Other / not sure' },
      ],
      showIf: () => true,
    },
    {
      id: wkey(index, 'app_source'),
      type: 'single',
      title: `How did you install ${label}?`,
      subtitle: 'Fake wallet apps are a common way mobile users get drained.',
      options: [
        { id: 'official_store', label: 'From the official app store', description: 'App Store or Google Play' },
        { id: 'sideloaded', label: 'Sideloaded / downloaded an APK', description: 'Outside the official store' },
        { id: 'not_sure', label: 'Not sure' },
      ],
      showIf: () => true,
    },
    seedQuestion(index, label),
  ];
}

function hardwareQuestions(index: number, label: string): Question[] {
  return [
    seedQuestion(index, label, true),
    {
      id: wkey(index, 'seed_seen'),
      type: 'single',
      title: `Has anyone else seen or set up ${label} or its backup?`,
      options: [
        { id: 'no_only_me', label: 'No, only me' },
        { id: 'helped_by_someone', label: 'A friend or family member helped' },
        { id: 'professional_or_stranger', label: 'A "helper", support agent, or stranger' },
        { id: 'not_sure', label: 'Not sure' },
      ],
      showIf: () => true,
    },
  ];
}

function multisigQuestions(index: number, label: string): Question[] {
  return [
    {
      id: wkey(index, 'signer_exposure'),
      type: 'single',
      title: `Are any of the signer devices for ${label} also used for everyday browsing or downloads?`,
      subtitle: 'A single compromised signer is below threshold, but several is a different story.',
      options: [
        { id: 'none', label: 'No, signers stay separate', description: 'Dedicated or air-gapped' },
        { id: 'one', label: 'One of them is', description: 'Still below threshold' },
        { id: 'several', label: 'Several are', description: 'Used for daily activity' },
        { id: 'not_sure', label: 'Not sure' },
      ],
      showIf: () => true,
    },
    {
      id: wkey(index, 'seed_locations'),
      type: 'multi',
      title: `Where are the backups for ${label}'s signer keys kept?`,
      subtitle: 'Each signer is its own wallet with its own recovery phrase. Select every place those backups live.',
      options: SEED_OPTIONS,
      showIf: () => true,
    },
  ];
}

function exchangeQuestions(index: number, label: string): Question[] {
  return [
    {
      id: wkey(index, 'withdrawal_whitelist'),
      type: 'single',
      title: `On ${label}, is withdrawal address allowlisting turned on?`,
      subtitle: 'It stops funds leaving to an address you never approved.',
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' },
        { id: 'not_sure', label: "Not sure / don't know what that is" },
      ],
      showIf: () => true,
    },
  ];
}

// Usage + signing care vary per wallet (people are casual with a throwaway hot
// wallet but meticulous with a hardware wallet holding real money), so these are
// asked for each wallet you actually sign transactions with.
function signingQuestions(index: number, label: string): Question[] {
  return [
    {
      id: wkey(index, 'usage'),
      type: 'single',
      title: `What do you mainly use ${label} for?`,
      options: [
        { id: 'hold', label: 'Holding', description: 'Rarely transact' },
        { id: 'swap_transfer', label: 'Swaps and transfers' },
        { id: 'defi_yield', label: 'DeFi and yield', description: 'Lending, LPing, staking' },
        { id: 'mint_airdrops', label: 'Minting and airdrops', description: 'Lots of new approvals' },
        { id: 'try_new_experimental', label: 'New and experimental dApps', description: 'Early to unaudited projects' },
      ],
      showIf: () => true,
    },
    {
      id: wkey(index, 'signing_care'),
      type: 'single',
      title: `When you approve a transaction with ${label}, how carefully do you check it?`,
      options: [
        { id: 'always_verify', label: 'I always read and verify it', description: 'Decode it, confirm on the device screen' },
        { id: 'usually_verify', label: 'Usually, for anything meaningful' },
        { id: 'sometimes_confirm', label: 'Sometimes I just confirm' },
        { id: 'often_blind', label: 'I often just approve or blind-sign' },
      ],
      showIf: () => true,
    },
  ];
}

function perWalletQuestions(w: WalletEntry, index: number, total: number): Question[] {
  const label = walletLabel(w);
  let questions: Question[];
  switch (w.type) {
    case 'browser_extension':
      questions = [...extensionQuestions(index, label), ...signingQuestions(index, label)];
      break;
    case 'mobile':
      questions = [...mobileQuestions(index, label), ...signingQuestions(index, label)];
      break;
    case 'hardware':
      questions = [...hardwareQuestions(index, label), ...signingQuestions(index, label)];
      break;
    case 'multisig':
      questions = [...multisigQuestions(index, label), ...signingQuestions(index, label)];
      break;
    case 'exchange':
      questions = exchangeQuestions(index, label); // no on-chain signing
      break;
    default:
      questions = [seedQuestion(index, label), ...signingQuestions(index, label)];
  }
  // Tag every question with the wallet phrase to highlight in its title (the
  // type label without the leading "your"), plus an index for per-wallet colour.
  const name = label.replace(/^your /i, '');
  return questions.map((q) => ({ ...q, walletContext: { name, index, total } }));
}

// Behaviour questions about the person rather than a single wallet.
function globalQuestions(wallets: WalletEntry[]): Question[] {
  const selfCustody = holdsSelfCustody(wallets);
  const qs: Question[] = [
    {
      id: 'password_reuse',
      type: 'single',
      title: 'Do you reuse passwords on accounts tied to your crypto?',
      subtitle: 'Email, exchanges, and the cloud accounts that hold backups.',
      options: [
        { id: 'unique_all', label: 'No, unique passwords everywhere', description: 'Generated and stored in a manager' },
        { id: 'some_reuse', label: 'Some are reused' },
        { id: 'lots_reuse', label: 'Yes, I reuse a lot' },
        { id: 'not_sure', label: 'Not sure' },
      ],
      showIf: () => true,
    },
    {
      id: 'twofa',
      type: 'single',
      title: 'What protects your email and exchange logins?',
      options: [
        { id: 'hardware_key', label: 'A hardware security key', description: 'YubiKey or passkey' },
        { id: 'authenticator_app', label: 'An authenticator app' },
        { id: 'sms', label: 'Text-message codes (SMS)' },
        { id: 'none', label: 'Just a password' },
        { id: 'mixed', label: 'A mix / not sure' },
      ],
      showIf: () => true,
    },
  ];

  if (selfCustody) {
    qs.push(
      {
        id: 'dapp_discovery',
        type: 'single',
        title: 'When you use a new dApp or site, how do you get there?',
        options: [
          { id: 'bookmarks_verified', label: 'Bookmarks I trust, URL verified', description: 'I never click ads or DMs' },
          { id: 'search_then_check', label: 'Search, then check the URL' },
          { id: 'links_or_ads', label: 'Links, ads, or DMs' },
          { id: 'not_sure', label: 'Not sure' },
        ],
        showIf: () => true,
      },
      {
        id: 'approval_hygiene',
        type: 'single',
        title: "Do you review and revoke the token approvals you've granted?",
        subtitle: 'Old approvals can let a contract move your tokens long after you forget them.',
        options: [
          { id: 'regularly', label: 'Yes, I revoke unused ones', description: 'On revoke.cash or similar' },
          { id: 'occasionally', label: 'Once in a while' },
          { id: 'never', label: "No, I've never revoked any" },
          { id: 'dont_know', label: "I don't know what that means" },
        ],
        showIf: () => true,
      },
    );
  }

  qs.push({
    id: 'prior_hacks',
    type: 'single',
    title: 'Have you ever had a wallet drained or compromised before?',
    options: [
      { id: 'yes', label: 'Yes' },
      { id: 'no', label: 'No' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  });

  return qs;
}

// The full second-phase question list, generated once the portfolio is known.
export function buildPreventionQuestions(wallets: WalletEntry[]): Question[] {
  // All of a wallet's questions, in order, before moving to the next wallet.
  const perWallet = wallets.flatMap((w, i) => perWalletQuestions(w, i, wallets.length));
  return [...perWallet, ...globalQuestions(wallets)];
}

// The portfolio builder shown in phase one.
export const PORTFOLIO_QUESTION: Question = {
  id: 'wallet_portfolio',
  type: 'wallets',
  title: "Let's map out where your crypto lives.",
  subtitle:
    'Add each wallet or account you keep crypto in, and roughly how much sits in it. This drives your risk far more than your total — a large balance in a hardware or multisig wallet is much safer than a small one in a hot wallet.',
  showIf: () => true,
};
