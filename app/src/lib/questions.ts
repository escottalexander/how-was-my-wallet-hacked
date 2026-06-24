export type AnswerMap = Record<string, string | string[]>

export interface QuestionOption {
  id: string
  label: string
  description?: string
}

export interface Question {
  id: string
  type: 'single' | 'multi' | 'date' | 'text'
  title: string
  subtitle?: string
  /** Optional longer teaching note shown as an info callout below the subtitle. */
  explainer?: string
  options?: QuestionOption[]
  showIf: (answers: AnswerMap) => boolean
  optional?: boolean
}

// Helpers used by showIf conditions
const storageInvolvesCloud = (answers: AnswerMap): boolean => {
  const method = answers.storage_method as string | undefined
  return ['cloud_storage', 'notes_app', 'screenshot', 'multiple'].includes(method ?? '')
}

const seedStored = (answers: AnswerMap): boolean => {
  const backup = answers.seed_backup as string | undefined
  return backup === 'yes' || backup === 'not_sure'
}

export const QUESTIONS: Question[] = [
  {
    id: 'wallet_type',
    type: 'single',
    title: 'What type of wallet were you using?',
    options: [
      { id: 'browser_extension', label: 'Browser Extension', description: 'MetaMask, Rabby, Coinbase Wallet, Phantom, and others' },
      { id: 'mobile', label: 'Mobile Wallet', description: 'Trust Wallet, Rainbow, Coinbase Wallet, Phantom, and others' },
      { id: 'hardware', label: 'Hardware Wallet', description: 'Ledger, Trezor, GridPlus, and others' },
      { id: 'other', label: 'Other', description: "Wallets that don't fit the categories above" },
    ],
    showIf: () => true,
  },
  {
    id: 'value_range',
    type: 'single',
    title: 'Roughly how much did you lose?',
    subtitle: 'This helps us understand the scale of these attacks across the community.',
    options: [
      { id: 'under_100', label: 'Under $100' },
      { id: 'range_100_1000', label: '$100 – $1,000' },
      { id: 'range_1000_10000', label: '$1,000 – $10,000' },
      { id: 'range_10000_100000', label: '$10,000 – $100,000' },
      { id: 'over_100000', label: 'Over $100,000' },
      { id: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
    showIf: () => true,
  },
  {
    id: 'devices_os',
    type: 'multi',
    title: 'What primary devices and operating systems do you use day-to-day?',
    subtitle: 'Select all that apply.',
    options: [
      { id: 'windows', label: 'Windows PC' },
      { id: 'mac', label: 'Mac' },
      { id: 'iphone', label: 'iPhone (iOS)' },
      { id: 'android', label: 'Android phone' },
      { id: 'linux', label: 'Linux' },
      { id: 'other', label: 'Other' },
    ],
    showIf: () => true,
  },
  {
    id: 'seeds_compromised',
    type: 'single',
    title: 'How many distinct seeds or keys were compromised?',
    subtitle: 'A seed phrase controls many keys — each distinct seed counts as one.',
    options: [
      { id: 'one', label: 'One seed / key' },
      { id: 'two_to_five', label: '2–5 seeds / keys' },
      { id: 'more_than_five', label: 'More than 5' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'wallet_generated',
    type: 'single',
    title: 'Which wallet app did you use to generate the compromised key or seed?',
    subtitle: 'This may be different from the wallet you used most recently.',
    options: [
      { id: 'metamask', label: 'MetaMask' },
      { id: 'trust_wallet', label: 'Trust Wallet' },
      { id: 'coinbase_wallet', label: 'Coinbase Wallet' },
      { id: 'phantom', label: 'Phantom' },
      { id: 'rainbow', label: 'Rainbow' },
      { id: 'ledger_live', label: 'Ledger Live' },
      { id: 'trezor_suite', label: 'Trezor Suite' },
      { id: 'other', label: 'Other / Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'key_generation_date',
    type: 'date',
    title: 'Approximately when did you generate the compromised key or seed?',
    subtitle: "An approximate date helps identify known vulnerability windows. Not sure? Choose your best estimate.",
    showIf: () => true,
  },
  {
    id: 'timing',
    type: 'single',
    title: 'When did you notice the theft?',
    options: [
      { id: 'active', label: 'While actively using my wallet', description: 'I saw the transaction happen in real time' },
      { id: 'noticed_later', label: 'I noticed it later', description: 'Funds were gone when I checked' },
      { id: 'not_sure', label: 'Not sure', description: "I'm unclear on the timing" },
    ],
    showIf: () => true,
  },
  {
    id: 'how_found_site',
    type: 'single',
    title: 'How did you find the site or app you were using?',
    subtitle: 'Think about how you first discovered it.',
    options: [
      { id: 'social_media', label: 'Social media', description: 'Twitter/X, Discord, Telegram group, etc.' },
      { id: 'google_search', label: 'Google search', description: 'I searched for it and found it' },
      { id: 'dm', label: 'Direct message', description: "Someone DM'd me the link" },
      { id: 'email', label: 'Email', description: 'I received it in an email' },
      { id: 'typed_url', label: 'I typed the URL directly', description: 'I entered the address myself' },
    ],
    showIf: (answers) => answers.timing === 'active',
  },
  {
    id: 'what_trying_to_do',
    type: 'single',
    title: 'What were you trying to do when it happened?',
    options: [
      { id: 'airdrop', label: 'Claim an airdrop', description: 'Free tokens or NFTs' },
      { id: 'nft_mint', label: 'Mint an NFT', description: 'Buy or create a new NFT' },
      { id: 'new_dapp', label: 'Try a new dApp', description: 'A decentralized app or protocol' },
      { id: 'token_transaction', label: 'Token swap or transfer', description: 'Exchange, bridge, or move tokens' },
      { id: 'other', label: 'Something else' },
    ],
    showIf: (answers) => answers.timing === 'active',
  },
  {
    id: 'seed_backup',
    type: 'single',
    title: 'Did you back up your seed phrase (recovery phrase)?',
    subtitle: 'This is the 12 or 24-word phrase shown when you created your wallet.',
    options: [
      { id: 'yes', label: 'Yes, I backed it up', description: 'I wrote it down or stored it somewhere' },
      { id: 'no', label: "No, I didn't back it up", description: 'I never saved the seed phrase' },
      { id: 'not_sure', label: 'Not sure', description: "I don't remember or don't know what this means" },
    ],
    showIf: (answers) => answers.timing !== 'active',
  },
  {
    id: 'storage_method',
    type: 'single',
    title: 'How did you store your seed phrase?',
    subtitle: 'Select the option that best describes where you kept it.',
    options: [
      { id: 'physical_secure', label: 'Physical location (paper, metal, safe)', description: 'Written down and stored securely' },
      { id: 'screenshot', label: 'Screenshot on my phone', description: 'Saved as an image in my photos' },
      { id: 'notes_app', label: 'Notes app or text file', description: 'Digital notes on my device' },
      { id: 'cloud_storage', label: 'Cloud storage (Google Drive, iCloud, Dropbox)', description: 'Saved online, accessible from anywhere' },
      { id: 'password_manager', label: 'Password manager', description: '1Password, LastPass, Bitwarden, etc.' },
      { id: 'multiple', label: 'Multiple locations', description: 'I stored it in more than one place' },
    ],
    showIf: (answers) => answers.timing !== 'active' && seedStored(answers),
  },
  {
    id: 'cloud_accounts_compromised',
    type: 'single',
    title: 'Have any of your cloud or email accounts ever been compromised?',
    subtitle: 'Google, Apple, Dropbox, iCloud, email accounts, etc.',
    options: [
      { id: 'yes', label: 'Yes', description: 'One or more have been breached' },
      { id: 'no', label: 'No', description: 'None that I know of' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: storageInvolvesCloud,
  },
  {
    id: 'storage_services',
    type: 'multi',
    title: 'Which apps or services specifically did you use to store your seed?',
    subtitle: 'Select all that apply.',
    options: [
      { id: 'google_drive', label: 'Google Drive or Google Docs' },
      { id: 'icloud', label: 'iCloud Drive or iCloud Notes' },
      { id: 'dropbox', label: 'Dropbox' },
      { id: 'notes_app', label: 'Apple Notes or Google Keep' },
      { id: 'telegram', label: 'Telegram (Saved Messages)' },
      { id: 'email_drafts', label: 'Email drafts or sent messages' },
      { id: 'password_manager', label: 'Password manager' },
      { id: 'other', label: 'Other' },
    ],
    showIf: storageInvolvesCloud,
  },
  {
    id: 'copy_paste',
    type: 'single',
    title: 'Have you ever copied and pasted your seed phrase?',
    subtitle: "Think about whether you've used copy/paste with your recovery words.",
    options: [
      { id: 'yes', label: 'Yes, I have', description: "I've copied my seed phrase to paste somewhere" },
      { id: 'no', label: 'No, never', description: "I've never copied my seed phrase" },
      { id: 'not_sure', label: 'Not sure', description: "I don't remember" },
    ],
    showIf: (answers) => answers.timing !== 'active',
  },
  {
    id: 'paste_location',
    type: 'single',
    title: 'Where did you paste your seed phrase?',
    subtitle: 'What was the purpose when you copied it?',
    options: [
      { id: 'website', label: 'A website', description: 'To recover a wallet or claim something' },
      { id: 'code_file', label: 'A code file or script', description: 'For a project or automation' },
      { id: 'between_wallets', label: 'Between wallet apps', description: 'To import into another wallet' },
      { id: 'other', label: 'Somewhere else', description: 'Another application or purpose' },
    ],
    showIf: (answers) => answers.copy_paste === 'yes',
  },
  {
    id: 'downloaded_files',
    type: 'single',
    title: 'Have you downloaded any files or apps recently?',
    subtitle: 'Especially anything related to crypto, NFTs, or from someone you met online.',
    options: [
      { id: 'yes', label: 'Yes, I have', description: 'I downloaded files or apps recently' },
      { id: 'no', label: 'No, not recently', description: "I haven't downloaded anything unusual" },
      { id: 'not_sure', label: 'Not sure', description: "I don't remember" },
    ],
    showIf: () => true,
  },
  {
    id: 'file_type',
    type: 'single',
    title: 'What type of file did you download?',
    subtitle: 'Select the type that best matches.',
    options: [
      { id: 'extension', label: 'A browser extension', description: 'Chrome, Brave, or Firefox extension' },
      { id: 'executable', label: 'An app or executable', description: '.exe, .app, .dmg, or similar' },
      { id: 'document', label: 'A document or PDF', description: '.pdf, .doc, .xls, or similar' },
      { id: 'other', label: 'Something else' },
    ],
    showIf: (answers) => answers.downloaded_files === 'yes',
  },
  {
    id: 'file_source',
    type: 'single',
    title: 'Where did this file come from?',
    subtitle: 'How did you find or receive it?',
    options: [
      { id: 'discord_telegram', label: 'Discord or Telegram', description: 'Someone sent it in a DM or channel' },
      { id: 'email', label: 'Email', description: 'It came as an attachment or link' },
      { id: 'website', label: 'A website', description: 'I downloaded it from a site' },
      { id: 'job_application', label: 'Job application or interview', description: 'As part of a hiring process' },
      { id: 'other', label: 'Somewhere else' },
    ],
    showIf: (answers) => answers.downloaded_files === 'yes',
  },
  {
    id: 'wallet_setup',
    type: 'single',
    title: 'How was your wallet originally set up?',
    subtitle: 'Think back to when you first created this wallet.',
    options: [
      { id: 'someone_helped', label: 'Someone helped me set it up', description: 'A friend, family member, or stranger helped' },
      { id: 'bought_wallet', label: 'I bought it secondhand or pre-configured', description: 'The wallet came already set up' },
      { id: 'self_setup', label: 'I set it up myself', description: 'I created the wallet on my own' },
    ],
    showIf: (answers) => answers.timing !== 'active',
  },
  {
    id: 'physical_access',
    type: 'single',
    title: 'Could someone else have had physical access to where you stored your seed phrase?',
    subtitle: 'Consider roommates, family members, visitors, or anyone who could have seen it.',
    options: [
      { id: 'yes', label: 'Yes, possibly', description: 'Someone else could have accessed where I stored it' },
      { id: 'no', label: 'No, only me', description: 'No one else has access to my storage' },
      { id: 'not_sure', label: 'Not sure', description: "I haven't thought about this" },
    ],
    showIf: (answers) => answers.timing !== 'active' && seedStored(answers),
  },
  {
    id: 'uncompromised_keys',
    type: 'single',
    title: 'Did you have keys that were not compromised?',
    subtitle: 'If yes — were those keys under the same seed phrase as the ones that were compromised?',
    explainer:
      'What counts as the "same seed"? Your seed phrase (the 12 or 24 recovery words) isn\'t tied to one wallet — it can generate a virtually unlimited number of addresses, all derived from that single phrase. Anyone who has your seed phrase can reach every address under it. So "same seed" means those untouched keys came from the same recovery phrase as the ones that were drained.',
    options: [
      { id: 'yes_same_seed', label: "Yes — same seed, but those keys weren't touched", description: 'Some addresses from the same seed were spared' },
      { id: 'yes_different_seed', label: 'Yes — under a different seed or wallet', description: 'Separate wallets or seeds were unaffected' },
      { id: 'no_all_compromised', label: 'No — everything was compromised' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'prior_hacks',
    type: 'single',
    title: 'Have you had other crypto wallets compromised before?',
    options: [
      { id: 'yes', label: 'Yes', description: "I've had wallets drained or compromised before" },
      { id: 'no', label: 'No, this is the first time' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'suspected_malware',
    type: 'single',
    title: 'Have you ever suspected any of your devices were infected with malware?',
    subtitle: 'In the last couple of years — unusual behavior, pop-ups, slowdowns, etc.',
    options: [
      { id: 'yes', label: "Yes, I've suspected it", description: 'Something felt off with one of my devices' },
      { id: 'no', label: 'No, nothing like that' },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'malware_scan',
    type: 'single',
    title: 'Have you run a comprehensive malware scan on your computer?',
    options: [
      { id: 'yes_before', label: 'Yes — before the theft', description: 'I scanned and it was clean' },
      { id: 'yes_after', label: 'Yes — after the theft', description: "I ran a scan once I knew I'd been hacked" },
      { id: 'no', label: "No, I haven't run one" },
      { id: 'not_sure', label: 'Not sure' },
    ],
    showIf: () => true,
  },
  {
    id: 'other_ioc',
    type: 'multi',
    title: 'Any other indicators of compromise?',
    subtitle: 'Select all that apply.',
    options: [
      { id: 'credit_card_fraud', label: 'Credit card fraud or unauthorized charges' },
      { id: 'cex_login_attempts', label: 'Attempted logins to my exchange (CEX) accounts' },
      { id: 'email_account_breach', label: 'Email account breach or suspicious activity' },
      { id: 'social_media_takeover', label: 'Social media account takeover' },
      { id: 'none', label: 'None of the above' },
      { id: 'other', label: 'Something else' },
    ],
    showIf: () => true,
  },
  {
    id: 'free_text',
    type: 'text',
    title: 'Is there anything else you think is important for people to know about your situation?',
    subtitle: 'Optional — any context that does not fit the questions above.',
    optional: true,
    showIf: () => true,
  },
]

// Returns only the questions whose showIf condition is true for the given answers
export function getVisibleQuestions(answers: AnswerMap): Question[] {
  return QUESTIONS.filter((q) => q.showIf(answers))
}
