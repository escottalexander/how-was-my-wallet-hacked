# Question Pipeline Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the buggy adaptive branching tree (PathAQuestions/PathBQuestions) with a flat conditional question pipeline that asks all applicable questions in sequence, then computes a diagnosis using the probability engine.

**Architecture:** A single ordered `QUESTIONS` array in `questions.ts` — each question declares a `showIf(answers)` condition. `QuestionPipeline.tsx` walks the visible subset, renders each question, and calls `onComplete(answers)` when done. The probability engine scores the full answer map to produce a diagnosis. No more path branching, no more sessionStorage-driven routing between question pages.

**Tech Stack:** Next.js 16.1.5, React 19, TypeScript, better-sqlite3, Tailwind CSS v4

## Global Constraints

- No new npm dependencies
- All new question IDs use `snake_case`
- Multi-select answers stored as JSON array strings: `'["option_a","option_b"]'`
- Key generation date stored as `"YYYY-QN"` (e.g. `"2022-Q3"`) or `"unknown"`
- No PII stored — no names, emails, wallet addresses
- All Tailwind uses CSS variable tokens: `var(--foreground)`, `var(--primary)`, `var(--border)`, `var(--card-bg)`, `var(--text-muted)`, `var(--primary-hover)`
- TypeScript strict mode — no `any` casts

---

## File Structure

**New files:**
- `app/src/lib/questions.ts` — 26-question array with AnswerMap type, Question interface, showIf conditions
- `app/src/components/ProgressBar.tsx` — thin progress bar component
- `app/src/components/QuestionPipeline.tsx` — pipeline engine: walks questions, renders current, tracks history

**Modified files:**
- `app/src/lib/types.ts` — add `ClusterStat` type, update `PathAttempt` with `completed_at`
- `app/src/lib/db.ts` — add `completed_at` column to `path_attempts`, add `question_id` index on `path_steps`
- `app/src/lib/session.ts` — add `completePathAttempt()`, `getClusterStats()`
- `app/src/lib/probability.ts` — rename `how_found`/`what_doing` keys, add new question multipliers, handle JSON array answers
- `app/src/app/api/path/route.ts` — handle `complete: true` in PATCH to set `completed_at`
- `app/src/app/api/analytics/route.ts` — add `clusters` case
- `app/src/app/diagnostic/page.tsx` — full rewrite: render QuestionPipeline, compute diagnosis, navigate
- `app/src/app/diagnostic/diagnosis/page.tsx` — simplify rejection flow to client-side next-best diagnosis
- `app/src/app/page.tsx` — add "~15–20 questions" copy

**Deleted files (Task 9):**
- `app/src/components/PathAQuestions.tsx`
- `app/src/components/PathBQuestions.tsx`
- `app/src/components/WalletSelection.tsx`
- `app/src/components/ValueRangeSelection.tsx`
- `app/src/components/TimingSelection.tsx`
- `app/src/app/diagnostic/path-a/page.tsx`
- `app/src/app/diagnostic/path-b/page.tsx`
- `app/src/app/diagnostic/timing/page.tsx`
- `app/src/app/diagnostic/value/page.tsx`

---

## Task 1: DB Schema + Types + Session Helpers

**Files:**
- Modify: `app/src/lib/db.ts`
- Modify: `app/src/lib/types.ts`
- Modify: `app/src/lib/session.ts`

**Interfaces:**
- Produces: `completePathAttempt(id: string): void`
- Produces: `getClusterStats(): ClusterStat[]`
- Produces: `ClusterStat` type
- Produces: `PathAttempt` with `completed_at: string | null`

- [ ] **Step 1: Add `completed_at` to the `PathAttempt` type and add `ClusterStat` type in `types.ts`**

Open `app/src/lib/types.ts`. Replace the `PathAttempt` interface and add `ClusterStat` at the bottom:

```typescript
export interface PathAttempt {
  id: string;
  session_id: string;
  attempt_number: number;
  created_at: string;
  completed_at: string | null;
}

export interface ClusterStat {
  wallet: string;
  generation_period: string;
  diagnosis: string;
  count: number;
  first_seen: string;
  last_seen: string;
}
```

- [ ] **Step 2: Add DB migration in `db.ts`**

Open `app/src/lib/db.ts`. At the end of `initializeSchema`, after the existing `idx_diagnoses_type` index creation, add:

```typescript
  // Add completed_at to path_attempts if it doesn't exist (idempotent migration)
  const columns = database
    .prepare("PRAGMA table_info(path_attempts)")
    .all() as Array<{ name: string }>;
  if (!columns.some((c) => c.name === 'completed_at')) {
    database.exec(`ALTER TABLE path_attempts ADD COLUMN completed_at TEXT`);
  }

  // Index for analytics queries on path_steps by question
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_path_steps_question ON path_steps(question_id)
  `);
```

- [ ] **Step 3: Add `completePathAttempt` and `getClusterStats` to `session.ts`**

Open `app/src/lib/session.ts`. Add these two functions at the end of the file (before the closing, after existing analytics functions):

```typescript
// Mark a path attempt as completed
export function completePathAttempt(id: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE path_attempts SET completed_at = datetime('now') WHERE id = ?
  `);
  stmt.run(id);
}

// Get cluster stats: diagnoses grouped by wallet + generation period
export function getClusterStats(): ClusterStat[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      ps_wallet.answer_selected AS wallet,
      ps_date.answer_selected   AS generation_period,
      d.diagnosis_type          AS diagnosis,
      COUNT(*)                  AS count,
      MIN(pa.created_at)        AS first_seen,
      MAX(pa.created_at)        AS last_seen
    FROM path_attempts pa
    JOIN path_steps ps_wallet ON ps_wallet.path_attempt_id = pa.id
      AND ps_wallet.question_id = 'wallet_generated'
    JOIN path_steps ps_date ON ps_date.path_attempt_id = pa.id
      AND ps_date.question_id = 'key_generation_date'
    JOIN diagnoses d ON d.path_attempt_id = pa.id
    WHERE pa.completed_at IS NOT NULL
      AND ps_date.answer_selected != 'unknown'
    GROUP BY wallet, generation_period, diagnosis
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  return stmt.all() as ClusterStat[];
}
```

Add `ClusterStat` to the import at the top of `session.ts`:

```typescript
import type { Session, PathAttempt, PathStep, Diagnosis, WalletType, ValueRange, ClusterStat } from './types';
```

- [ ] **Step 4: Update `/api/path` PATCH to support `complete: true`**

Open `app/src/app/api/path/route.ts`. Import `completePathAttempt` in the imports at the top:

```typescript
import {
  createPathAttempt,
  createPathStep,
  completePathAttempt,
  getLatestPathAttempt,
  getPathAttempt,
  getPathSteps,
  getSession,
} from '@/lib/session';
```

Replace the PATCH handler body with:

```typescript
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathAttemptId, questionId, answerSelected, complete } = body;

    if (!pathAttemptId) {
      return NextResponse.json(
        { error: 'Path attempt ID is required' },
        { status: 400 }
      );
    }

    const pathAttempt = getPathAttempt(pathAttemptId);
    if (!pathAttempt) {
      return NextResponse.json(
        { error: 'Path attempt not found' },
        { status: 404 }
      );
    }

    // Mark the attempt as completed
    if (complete === true) {
      completePathAttempt(pathAttemptId);
      return NextResponse.json({ completed: true });
    }

    if (!questionId || !answerSelected) {
      return NextResponse.json(
        { error: 'question ID and answer are required' },
        { status: 400 }
      );
    }

    const pathStep = createPathStep(pathAttemptId, questionId, answerSelected);
    return NextResponse.json({ pathStep });
  } catch (error) {
    console.error('Error in path PATCH:', error);
    return NextResponse.json(
      { error: 'Failed to update path attempt' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Add `clusters` case to analytics route**

Open `app/src/app/api/analytics/route.ts`. Add `getClusterStats` to the import:

```typescript
import {
  getDiagnosisByWalletType,
  getDiagnosisByValueRange,
  getPathAttemptStats,
  getDropOffPoints,
  getEngagementStats,
  getDiagnosisTrends,
  getRepeatVisitorStats,
  getSessionPaths,
  getClusterStats,
} from '@/lib/session';
```

Add the `clusters` case inside the `switch(type)` in the GET handler, before the `case 'all':` line:

```typescript
      case 'clusters':
        return NextResponse.json({
          clusters: getClusterStats(),
        });
```

- [ ] **Step 6: Support `walletSpecific`-only updates in the session PATCH route**

Open `app/src/app/api/session/route.ts`. Replace the `// Update wallet information if provided` block:

```typescript
    // Update wallet information if provided
    if (walletType) {
      updateSessionWallet(sessionId, walletType as WalletType, walletSpecific ?? null);
    } else if (walletSpecific !== undefined) {
      // wallet_generated question: update specific wallet app without changing wallet type
      const current = getSession(sessionId);
      if (current?.wallet_type) {
        updateSessionWallet(sessionId, current.wallet_type, walletSpecific);
      }
    }
```

- [ ] **Step 7: Verify the app still compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npm run build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing type errors, none new).

- [ ] **Step 8: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/lib/types.ts app/src/lib/db.ts app/src/lib/session.ts app/src/app/api/path/route.ts app/src/app/api/analytics/route.ts && git commit -m "feat: add completed_at tracking, question_id index, cluster analytics"
```

---

## Task 2: Question Definitions (`questions.ts`)

**Files:**
- Create: `app/src/lib/questions.ts`

**Interfaces:**
- Produces: `AnswerMap = Record<string, string | string[]>`
- Produces: `Question` interface
- Produces: `QuestionOption` interface
- Produces: `QUESTIONS: Question[]` (26 items)
- Produces: `getVisibleQuestions(answers: AnswerMap): Question[]`

- [ ] **Step 1: Create `app/src/lib/questions.ts`**

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `questions.ts`.

- [ ] **Step 3: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/lib/questions.ts && git commit -m "feat: add flat question pipeline definitions (26 questions)"
```

---

## Task 3: ProgressBar Component

**Files:**
- Create: `app/src/components/ProgressBar.tsx`

**Interfaces:**
- Produces: `<ProgressBar progress={number} />` where `progress` is `0`–`1`

- [ ] **Step 1: Create `app/src/components/ProgressBar.tsx`**

```typescript
interface ProgressBarProps {
  progress: number // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1 w-full bg-[var(--border)]"
    >
      <div
        className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/components/ProgressBar.tsx && git commit -m "feat: add ProgressBar component"
```

---

## Task 4: QuestionPipeline Component

**Files:**
- Create: `app/src/components/QuestionPipeline.tsx`

**Interfaces:**
- Consumes: `QUESTIONS`, `getVisibleQuestions`, `AnswerMap`, `Question` from `@/lib/questions`
- Consumes: `ProgressBar` from `@/components/ProgressBar`
- Produces: `<QuestionPipeline onAnswer? onComplete initialAnswers? />`
  - `onAnswer?: (questionId: string, answer: string | string[]) => void` — called immediately when each question is answered (for progressive DB recording)
  - `onComplete: (answers: AnswerMap) => void` — called when all questions are answered
  - `initialAnswers?: AnswerMap` — pre-populate answers (unused in V1, reserved)

- [ ] **Step 1: Create `app/src/components/QuestionPipeline.tsx`**

```typescript
'use client';

import { useEffect, useMemo, useState } from 'react';
import { QUESTIONS, getVisibleQuestions, type AnswerMap, type Question } from '@/lib/questions';
import { ProgressBar } from '@/components/ProgressBar';

interface QuestionPipelineProps {
  onAnswer?: (questionId: string, answer: string | string[]) => void;
  onComplete: (answers: AnswerMap) => void;
  initialAnswers?: AnswerMap;
}

interface OptionButtonProps {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

function OptionButton({ label, description, selected, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        min-h-[72px] w-full rounded-xl border-2 px-5 py-4 text-left
        transition-all duration-200
        ${selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
          : 'border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--primary)]/50'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
    >
      <span className="block font-medium text-[var(--foreground)]">{label}</span>
      {description && (
        <span className="mt-1 block text-sm text-[var(--text-muted)]">{description}</span>
      )}
    </button>
  );
}

function QuestionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h1>
      {subtitle && <p className="mt-2 text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}

// Renders a single-choice question; auto-advances on selection
function SingleQuestion({
  question,
  selected,
  onSelect,
  disabled,
}: {
  question: Question;
  selected: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-1 gap-4">
        {(question.options ?? []).map((opt) => (
          <OptionButton
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected === opt.id}
            onClick={() => onSelect(opt.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Renders a multi-select question with a Continue button
function MultiQuestion({
  question,
  selected,
  onSelect,
  onContinue,
  disabled,
}: {
  question: Question;
  selected: string[];
  onSelect: (ids: string[]) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const toggle = (id: string) => {
    if (id === 'none') {
      onSelect(['none']);
      return;
    }
    const without = selected.filter((s) => s !== 'none');
    onSelect(
      without.includes(id) ? without.filter((s) => s !== id) : [...without, id]
    );
  };

  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-1 gap-4">
        {(question.options ?? []).map((opt) => (
          <OptionButton
            key={opt.id}
            label={opt.label}
            description={opt.description}
            selected={selected.includes(opt.id)}
            onClick={() => toggle(opt.id)}
            disabled={disabled}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled || selected.length === 0}
        className={`
          w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
          transition-colors duration-200 hover:bg-[var(--primary-hover)]
          ${disabled || selected.length === 0 ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        Continue
      </button>
    </div>
  );
}

const YEARS = Array.from({ length: 13 }, (_, i) => 2013 + i).reverse(); // 2025 down to 2013
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

// Renders year + quarter dropdowns
function DateQuestion({
  question,
  value,
  onChange,
  onContinue,
  disabled,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const [year, setYear] = useState('');
  const [quarter, setQuarter] = useState('');

  // Sync from external value (e.g., "2022-Q3")
  useEffect(() => {
    if (value && value !== 'unknown') {
      const [y, q] = value.split('-');
      setYear(y ?? '');
      setQuarter(q ?? '');
    }
  }, [value]);

  const handleContinue = () => {
    onChange(year && quarter ? `${year}-${quarter}` : 'unknown');
    onContinue();
  };

  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-muted)]">Quarter</label>
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">Select quarter</option>
            {QUARTERS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={disabled}
        className={`
          w-full rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
          transition-colors duration-200 hover:bg-[var(--primary-hover)]
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        {year && quarter ? 'Continue' : "I'm not sure — skip"}
      </button>
    </div>
  );
}

// Renders a free-text textarea
function TextQuestion({
  question,
  value,
  onChange,
  onContinue,
  disabled,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-8">
      <QuestionHeader title={question.title} subtitle={question.subtitle} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={5}
        placeholder="Share anything you think is relevant..."
        className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className={`
            rounded-xl border-2 border-[var(--border)] px-6 py-4 text-lg font-medium text-[var(--foreground)]
            transition-colors duration-200 hover:border-[var(--primary)]
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => { onChange(value); onContinue(); }}
          disabled={disabled}
          className={`
            rounded-xl bg-[var(--primary)] px-6 py-4 text-lg font-medium text-white
            transition-colors duration-200 hover:bg-[var(--primary-hover)]
            ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          `}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function QuestionPipeline({ onAnswer, onComplete, initialAnswers }: QuestionPipelineProps) {
  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers ?? {});
  // Stack of question IDs the user has visited, in order
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  // Pending value for multi/date/text questions (not yet submitted)
  const [pendingMulti, setPendingMulti] = useState<string[]>([]);
  const [pendingText, setPendingText] = useState<string>('');

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);

  // Initialize history with the first visible question on mount
  useEffect(() => {
    if (historyIds.length === 0 && visibleQuestions.length > 0) {
      setHistoryIds([visibleQuestions[0].id]);
    }
  }, [visibleQuestions, historyIds.length]);

  const currentId = historyIds[historyIds.length - 1] ?? null;
  const currentQuestion = currentId ? QUESTIONS.find((q) => q.id === currentId) ?? null : null;
  const currentVisibleIndex = visibleQuestions.findIndex((q) => q.id === currentId);
  const progress = visibleQuestions.length > 1
    ? currentVisibleIndex / (visibleQuestions.length - 1)
    : 0;

  // Reset pending state when question changes
  useEffect(() => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'multi') {
      const existing = answers[currentQuestion.id];
      if (Array.isArray(existing)) {
        setPendingMulti(existing);
      } else {
        setPendingMulti([]);
      }
    }
    if (currentQuestion.type === 'text') {
      const existing = answers[currentQuestion.id];
      setPendingText(typeof existing === 'string' ? existing : '');
    }
  }, [currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (newAnswers: AnswerMap, answeredId: string, answer: string | string[]) => {
    onAnswer?.(answeredId, answer);
    const newVisible = getVisibleQuestions(newAnswers);
    const idx = newVisible.findIndex((q) => q.id === answeredId);
    const nextQ = newVisible[idx + 1];
    if (nextQ) {
      setHistoryIds((prev) => [...prev, nextQ.id]);
    } else {
      onComplete(newAnswers);
    }
  };

  const handleSingleSelect = (answer: string) => {
    if (!currentId) return;
    const newAnswers = { ...answers, [currentId]: answer };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, answer);
  };

  const handleMultiContinue = () => {
    if (!currentId) return;
    const answer = pendingMulti.length > 0 ? pendingMulti : ['none'];
    const newAnswers = { ...answers, [currentId]: answer };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, answer);
  };

  const handleDateContinue = (value: string) => {
    if (!currentId) return;
    const newAnswers = { ...answers, [currentId]: value };
    setAnswers(newAnswers);
    advance(newAnswers, currentId, value);
  };

  const handleTextContinue = () => {
    if (!currentId) return;
    const value = pendingText.trim();
    const newAnswers = value ? { ...answers, [currentId]: value } : answers;
    setAnswers(newAnswers);
    onComplete(newAnswers);
  };

  const handleBack = () => {
    if (historyIds.length <= 1) return;
    const leavingId = historyIds[historyIds.length - 1];
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[leavingId];
      return next;
    });
    setHistoryIds((prev) => prev.slice(0, -1));
  };

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'single':
        return (
          <SingleQuestion
            question={currentQuestion}
            selected={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : null}
            onSelect={handleSingleSelect}
          />
        );
      case 'multi':
        return (
          <MultiQuestion
            question={currentQuestion}
            selected={pendingMulti}
            onSelect={setPendingMulti}
            onContinue={handleMultiContinue}
          />
        );
      case 'date':
        return (
          <DateQuestion
            question={currentQuestion}
            value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : ''}
            onChange={() => {}}
            onContinue={(v) => handleDateContinue(v)}
          />
        );
      case 'text':
        return (
          <TextQuestion
            question={currentQuestion}
            value={pendingText}
            onChange={setPendingText}
            onContinue={handleTextContinue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <ProgressBar progress={progress} />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        {renderQuestion()}
        {currentQuestion.type !== 'text' && (
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIds.length <= 1}
            className={`
              w-full rounded-xl border-2 border-[var(--border)] px-6 py-4
              text-lg font-medium text-[var(--foreground)]
              transition-colors duration-200 hover:border-[var(--primary)]
              ${historyIds.length <= 1 ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
```

Note: the `DateQuestion` has a subtle issue with the `onContinue` prop — the value is set from internal state before calling `onContinue`. Fix: pass the value from `handleDateContinue` via the `onChange` + `onContinue` split. The component above handles this by calling `onChange` first then `onContinue`, but the parent passes `onChange: () => {}` and intercepts via `onContinue(v)`. Simplify by removing `onChange` from `DateQuestion` and having it produce the value in `onContinue`:

Replace the `DateQuestion` call in `renderQuestion` with:
```typescript
      case 'date':
        return (
          <DateQuestion
            question={currentQuestion}
            value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : ''}
            onContinue={handleDateContinue}
          />
        );
```

And update `DateQuestion` props interface to remove `onChange` and change `onContinue` to `onContinue: (value: string) => void`:

```typescript
function DateQuestion({
  question,
  value,
  onContinue,
  disabled,
}: {
  question: Question;
  value: string;
  onContinue: (value: string) => void;
  disabled?: boolean;
}) {
  // ...same body but handleContinue calls onContinue(year && quarter ? `${year}-${quarter}` : 'unknown')
  const handleContinue = () => {
    onContinue(year && quarter ? `${year}-${quarter}` : 'unknown');
  };
  // remove the onChange call
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `QuestionPipeline.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/components/QuestionPipeline.tsx app/src/components/ProgressBar.tsx && git commit -m "feat: QuestionPipeline and ProgressBar components"
```

---

## Task 5: Update Probability Engine

**Files:**
- Modify: `app/src/lib/probability.ts`

**What changes:**
1. Rename `how_found` → `how_found_site` and `what_doing` → `what_trying_to_do` in `ANSWER_MULTIPLIERS`
2. Fix `paste_location` answer key: old `code` → new `code_file`
3. Add multipliers for 8 new question IDs
4. Update `applyAnswerAdjustment` to handle JSON array answers (multi-select)

- [ ] **Step 1: Rename keys and fix answer IDs in `ANSWER_MULTIPLIERS` in `probability.ts`**

Open `app/src/lib/probability.ts`.

Find the `how_found:` key in `ANSWER_MULTIPLIERS` and rename it to `how_found_site:`. The options inside remain unchanged (`social_media`, `google_search`, `dm`, `email`, `typed_url`).

Find the `what_doing:` key and rename it to `what_trying_to_do:`. Options inside remain unchanged.

In the `paste_location:` block, rename the `code:` key to `code_file:`:
```typescript
  paste_location: {
    website: { phishing_fake_site: 10.0 },
    code_file: { exposed_in_code: 10.0 },   // was: code
    between_wallets: { clipboard_compromise: 5.0 },
    other: {},
  },
```

- [ ] **Step 2: Add multipliers for new question IDs**

After the existing `what_trying_to_do:` block (end of `ANSWER_MULTIPLIERS`), add before the closing `};`:

```typescript
  cloud_accounts_compromised: {
    yes: {
      cloud_storage: 5.0,
      digital_storage: 2.0,
    },
    no: {
      cloud_storage: 0.8,
    },
  },
  suspected_malware: {
    yes: {
      social_engineering_file: 2.0,
      malicious_download: 2.0,
      malicious_extension: 2.0,
      clipboard_compromise: 1.5,
    },
  },
  uncompromised_keys: {
    yes_same_seed: {
      // Some keys spared under same seed → suggests transaction-level or selective attack
      malicious_transaction: 2.0,
      phishing_fake_site: 2.0,
    },
    no_all_compromised: {
      // Full sweep → more consistent with seed phrase exposure
      cloud_storage: 1.3,
      phone_storage: 1.3,
      digital_storage: 1.3,
    },
  },
  seeds_compromised: {
    two_to_five: {
      // Multiple seeds → more likely systematic / shared storage vector
      cloud_storage: 1.5,
      digital_storage: 1.5,
      social_engineering_file: 1.3,
    },
    more_than_five: {
      cloud_storage: 2.0,
      digital_storage: 2.0,
    },
  },
```

- [ ] **Step 3: Update `applyAnswerAdjustment` to handle JSON array answers**

Replace the existing `applyAnswerAdjustment` function with:

```typescript
export function applyAnswerAdjustment(
  state: ProbabilityState,
  questionId: string,
  answer: string
): ProbabilityState {
  const newWeights = { ...state.weights };
  const questionMultipliers = ANSWER_MULTIPLIERS[questionId];
  if (!questionMultipliers) return state;

  // Handle JSON array strings from multi-select questions
  let answers: string[];
  if (answer.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(answer);
      answers = Array.isArray(parsed) ? parsed.map(String) : [answer];
    } catch {
      answers = [answer];
    }
  } else {
    answers = [answer];
  }

  for (const a of answers) {
    const multipliers = questionMultipliers[a];
    if (!multipliers) continue;
    for (const [diagnosis, multiplier] of Object.entries(multipliers)) {
      const key = diagnosis as DiagnosisType;
      if (newWeights[key] !== undefined) {
        newWeights[key] *= multiplier;
      }
    }
  }

  return { ...state, weights: newWeights };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/lib/probability.ts && git commit -m "fix: update probability engine for new question IDs and multi-select answers"
```

---

## Task 6: Rewrite `diagnostic/page.tsx`

**Files:**
- Modify: `app/src/app/diagnostic/page.tsx`

**What this page now does:**
1. Checks session exists (via `useSession`)
2. Creates a path attempt on mount (POST /api/path)
3. Renders `QuestionPipeline`, progressively recording each answer via PATCH /api/path
4. On pipeline complete: computes diagnosis using probability engine, marks attempt completed, stores state in sessionStorage, navigates to /diagnostic/diagnosis

**Interfaces:**
- Consumes: `QuestionPipeline` from `@/components/QuestionPipeline`
- Consumes: `createInitialProbabilities`, `applyAnswerAdjustment`, `getMostLikelyDiagnosis` from `@/lib/probability`
- Consumes: `AnswerMap` from `@/lib/questions`

- [ ] **Step 1: Rewrite `app/src/app/diagnostic/page.tsx`**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { QuestionPipeline } from '@/components/QuestionPipeline';
import type { AnswerMap } from '@/lib/questions';
import {
  createInitialProbabilities,
  applyAnswerAdjustment,
  getMostLikelyDiagnosis,
} from '@/lib/probability';
import type { WalletType } from '@/lib/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const { sessionId, isLoading, error } = useSession();
  const [pathAttemptId, setPathAttemptId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createdAttemptRef = useRef(false);

  // Create a path attempt once we have a session
  useEffect(() => {
    if (!sessionId || createdAttemptRef.current) return;
    createdAttemptRef.current = true;

    fetch('/api/path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data: { pathAttempt: { id: string } }) => {
        setPathAttemptId(data.pathAttempt.id);
        sessionStorage.setItem('howwasihacked_path_attempt_id', data.pathAttempt.id);
      })
      .catch((err) => console.error('Error creating path attempt:', err));
  }, [sessionId]);

  // Called for each question answer — record it progressively
  const handleAnswer = async (questionId: string, answer: string | string[]) => {
    if (!pathAttemptId) return;
    const answerSelected = Array.isArray(answer) ? JSON.stringify(answer) : answer;

    // Update session-level fields for wallet_type, wallet_generated, and value_range
    if (questionId === 'wallet_type' && sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletType: answer as WalletType, walletSpecific: null }),
      }).catch(() => {});
    }
    if (questionId === 'wallet_generated' && sessionId) {
      // Record the specific wallet app used to generate the key into session.wallet_specific
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletSpecific: Array.isArray(answer) ? answer[0] : answer }),
      }).catch(() => {});
    }
    if (questionId === 'value_range' && sessionId) {
      await fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, valueRange: answer }),
      }).catch(() => {});
    }

    await fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, questionId, answerSelected }),
    }).catch(() => {});
  };

  // Called when all questions are answered
  const handleComplete = async (answers: AnswerMap) => {
    if (!pathAttemptId || isSubmitting) return;
    setIsSubmitting(true);

    // Compute diagnosis using probability engine
    const walletType = answers.wallet_type as WalletType | undefined;
    let probState = createInitialProbabilities(walletType ?? null);

    for (const [questionId, answer] of Object.entries(answers)) {
      const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : answer;
      probState = applyAnswerAdjustment(probState, questionId, answerStr);
    }

    const diagnosisType = getMostLikelyDiagnosis(probState);

    // Context for malicious_transaction diagnosis display
    const context =
      answers.timing === 'active'
        ? {
            howFound: typeof answers.how_found_site === 'string' ? answers.how_found_site : undefined,
            whatDoing: typeof answers.what_trying_to_do === 'string' ? answers.what_trying_to_do : undefined,
          }
        : null;

    // Store answers and diagnosis for the diagnosis page
    sessionStorage.setItem('howwasihacked_diagnosis_type', diagnosisType);
    sessionStorage.setItem('howwasihacked_answers', JSON.stringify(answers));
    if (context) {
      sessionStorage.setItem('howwasihacked_diagnosis_context', JSON.stringify(context));
    } else {
      sessionStorage.removeItem('howwasihacked_diagnosis_context');
    }

    // Mark path attempt as completed
    await fetch('/api/path', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathAttemptId, complete: true }),
    }).catch(() => {});

    router.push('/diagnostic/diagnosis');
  };

  if (isLoading || (!pathAttemptId && !error)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-red-500">Something went wrong. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <QuestionPipeline
      onAnswer={handleAnswer}
      onComplete={handleComplete}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in `diagnostic/page.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/app/diagnostic/page.tsx && git commit -m "feat: rewrite diagnostic page with flat QuestionPipeline"
```

---

## Task 7: Simplify `diagnostic/diagnosis/page.tsx`

**Files:**
- Modify: `app/src/app/diagnostic/diagnosis/page.tsx`

**What changes:** Remove the complex fork-point/path-routing retry flow. On rejection, re-run the probability engine client-side with the rejected diagnosis penalized, pick the next best, create a new diagnosis record — all without navigating away or creating a new path attempt.

- [ ] **Step 1: Rewrite `app/src/app/diagnostic/diagnosis/page.tsx`**

```typescript
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import { DiagnosisScreen } from '@/components/DiagnosisScreen';
import type { DiagnosisType } from '@/lib/probability';
import {
  createInitialProbabilities,
  applyAnswerAdjustment,
  rejectDiagnosis,
  getMostLikelyDiagnosis,
} from '@/lib/probability';
import type { AnswerMap } from '@/lib/questions';
import type { WalletType } from '@/lib/types';

interface StoredDiagnosisState {
  pathAttemptId: string;
  diagnosisType: DiagnosisType;
  context: { howFound?: string; whatDoing?: string } | null;
  answers: AnswerMap;
}

function useStoredDiagnosisState(): StoredDiagnosisState | null {
  const cacheRef = useRef<{ raw: string; value: StoredDiagnosisState | null } | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    void onStoreChange;
    return () => {};
  }, []);

  const getSnapshot = useCallback((): StoredDiagnosisState | null => {
    if (typeof window === 'undefined') return null;

    const pathAttemptId = sessionStorage.getItem('howwasihacked_path_attempt_id');
    const diagnosisType = sessionStorage.getItem('howwasihacked_diagnosis_type');
    const context = sessionStorage.getItem('howwasihacked_diagnosis_context');
    const answersRaw = sessionStorage.getItem('howwasihacked_answers');

    const raw = `${pathAttemptId ?? ''}::${diagnosisType ?? ''}::${context ?? ''}::${answersRaw ?? ''}`;
    if (cacheRef.current?.raw === raw) return cacheRef.current.value;

    if (!pathAttemptId || !diagnosisType) {
      cacheRef.current = { raw, value: null };
      return null;
    }

    let parsedContext: StoredDiagnosisState['context'] = null;
    if (context) {
      try { parsedContext = JSON.parse(context); } catch { /* ignore */ }
    }

    let parsedAnswers: AnswerMap = {};
    if (answersRaw) {
      try { parsedAnswers = JSON.parse(answersRaw); } catch { /* ignore */ }
    }

    const value: StoredDiagnosisState = {
      pathAttemptId,
      diagnosisType: diagnosisType as DiagnosisType,
      context: parsedContext,
      answers: parsedAnswers,
    };

    cacheRef.current = { raw, value };
    return value;
  }, []);

  const getServerSnapshot = (): StoredDiagnosisState | null => null;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function DiagnosisPage() {
  const router = useRouter();
  const { isLoading, error } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  // Track rejected diagnoses for client-side re-scoring
  const [rejectedDiagnoses, setRejectedDiagnoses] = useState<DiagnosisType[]>([]);
  // Current displayed diagnosis (may change after rejection)
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisType | null>(null);
  const [currentContext, setCurrentContext] = useState<{ howFound?: string; whatDoing?: string } | null>(null);

  const diagnosisCreatedRef = useRef(false);
  const storedState = useStoredDiagnosisState();

  // Initialize from stored state
  useEffect(() => {
    if (!storedState || diagnosisCreatedRef.current) return;
    setCurrentDiagnosis(storedState.diagnosisType);
    setCurrentContext(storedState.context);
  }, [storedState]);

  // Create the initial diagnosis record
  useEffect(() => {
    if (!currentDiagnosis || !storedState || diagnosisCreatedRef.current) return;
    diagnosisCreatedRef.current = true;

    fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathAttemptId: storedState.pathAttemptId,
        diagnosisType: currentDiagnosis,
      }),
    })
      .then((r) => r.json())
      .then((data: { diagnosis: { id: string } }) => setDiagnosisId(data.diagnosis.id))
      .catch((err) => console.error('Error creating diagnosis record:', err));
  }, [currentDiagnosis, storedState]);

  const handleAccept = async () => {
    if (!diagnosisId) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId, accepted: true }),
      });
      // Clear session state
      ['howwasihacked_path_attempt_id', 'howwasihacked_diagnosis_type',
       'howwasihacked_diagnosis_context', 'howwasihacked_answers'].forEach((k) =>
        sessionStorage.removeItem(k)
      );
      router.push('/learn');
    } catch (err) {
      console.error('Error accepting diagnosis:', err);
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!diagnosisId || !storedState || !currentDiagnosis) return;
    setIsSubmitting(true);

    try {
      // Mark current diagnosis rejected
      await fetch('/api/diagnosis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosisId, accepted: false }),
      });

      const newRejected = [...rejectedDiagnoses, currentDiagnosis];
      setRejectedDiagnoses(newRejected);

      // Re-score client-side with all rejected diagnoses penalized
      const walletType = storedState.answers.wallet_type as WalletType | undefined;
      let probState = createInitialProbabilities(walletType ?? null);

      for (const [questionId, answer] of Object.entries(storedState.answers)) {
        const answerStr = Array.isArray(answer) ? JSON.stringify(answer) : answer;
        probState = applyAnswerAdjustment(probState, questionId, answerStr);
      }
      for (const rejected of newRejected) {
        probState = rejectDiagnosis(probState, rejected);
      }

      const nextDiagnosis = getMostLikelyDiagnosis(probState);
      setCurrentDiagnosis(nextDiagnosis);

      const nextContext =
        storedState.answers.timing === 'active'
          ? {
              howFound: typeof storedState.answers.how_found_site === 'string' ? storedState.answers.how_found_site : undefined,
              whatDoing: typeof storedState.answers.what_trying_to_do === 'string' ? storedState.answers.what_trying_to_do : undefined,
            }
          : null;
      setCurrentContext(nextContext);

      // Create a new diagnosis record for the next suggestion
      diagnosisCreatedRef.current = false;
      setDiagnosisId(null);
    } catch (err) {
      console.error('Error rejecting diagnosis:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Re-create diagnosis record when currentDiagnosis changes after rejection
  useEffect(() => {
    if (!currentDiagnosis || !storedState || diagnosisCreatedRef.current) return;
    diagnosisCreatedRef.current = true;

    fetch('/api/diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathAttemptId: storedState.pathAttemptId,
        diagnosisType: currentDiagnosis,
      }),
    })
      .then((r) => r.json())
      .then((data: { diagnosis: { id: string } }) => setDiagnosisId(data.diagnosis.id))
      .catch((err) => console.error('Error creating diagnosis record:', err));
  }, [currentDiagnosis, storedState]);

  const handleLearnClick = async () => {
    if (!diagnosisId) return;
    await fetch('/api/diagnosis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId, clickedLearn: true }),
    }).catch(() => {});
  };

  const handleHwrClick = async () => {
    if (!diagnosisId) return;
    await fetch('/api/diagnosis', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisId, clickedHwr: true }),
    }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-red-500">Something went wrong. Please refresh the page.</p>
      </div>
    );
  }

  if (!currentDiagnosis) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-[var(--text-muted)]">Loading your diagnosis...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DiagnosisScreen
        diagnosisType={currentDiagnosis}
        context={currentContext ?? undefined}
        onReject={handleReject}
        onAccept={handleAccept}
        onLearnClick={handleLearnClick}
        onHwrClick={handleHwrClick}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/app/diagnostic/diagnosis/page.tsx && git commit -m "feat: simplify diagnosis page — client-side rejection re-scoring, no more path routing"
```

---

## Task 8: Update Welcome Screen Copy

**Files:**
- Modify: `app/src/app/page.tsx`

- [ ] **Step 1: Add "~15–20 questions" line to the welcome screen**

Open `app/src/app/page.tsx`. Find the paragraph that says `"This tool will help you understand..."` and update it:

```typescript
          <p>
            This tool will help you understand what likely happened so you can protect yourself going forward. We&apos;ll ask around 15&ndash;20 questions &mdash; some may not apply to you.
          </p>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add app/src/app/page.tsx && git commit -m "feat: add question count estimate to welcome screen"
```

---

## Task 9: Delete Old Files

**Files to delete:**
- `app/src/components/PathAQuestions.tsx`
- `app/src/components/PathBQuestions.tsx`
- `app/src/components/WalletSelection.tsx`
- `app/src/components/ValueRangeSelection.tsx`
- `app/src/components/TimingSelection.tsx`
- `app/src/app/diagnostic/path-a/page.tsx`
- `app/src/app/diagnostic/path-b/page.tsx`
- `app/src/app/diagnostic/timing/page.tsx`
- `app/src/app/diagnostic/value/page.tsx`

- [ ] **Step 1: Delete old component and page files**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && rm src/components/PathAQuestions.tsx src/components/PathBQuestions.tsx src/components/WalletSelection.tsx src/components/ValueRangeSelection.tsx src/components/TimingSelection.tsx src/app/diagnostic/path-a/page.tsx src/app/diagnostic/path-b/page.tsx src/app/diagnostic/timing/page.tsx src/app/diagnostic/value/page.tsx
```

- [ ] **Step 2: Remove the empty route directories**

```bash
rmdir /Users/elliott/dev/how-was-i-hacked/app/src/app/diagnostic/path-a /Users/elliott/dev/how-was-i-hacked/app/src/app/diagnostic/path-b
```

- [ ] **Step 3: Verify the build passes with old files gone**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npm run build 2>&1 | tail -30
```

Expected: build succeeds. If there are import errors referencing deleted files, check `diagnostic/page.tsx` and `diagnosis/page.tsx` for any remaining imports from the deleted components.

- [ ] **Step 4: Commit**

```bash
cd /Users/elliott/dev/how-was-i-hacked && git add -A && git commit -m "chore: remove old path-a/path-b branching pages and question components"
```

---

## Task 10: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/elliott/dev/how-was-i-hacked/app && npm run dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 2: Full happy path — seed phrase user**

Walk through with these answers:
- Wallet type: Browser Extension → value: $100–$1,000 → devices: Windows + Chrome → seeds: 1 → wallet generated: MetaMask → date: 2023-Q2 → timing: **noticed later** → seed backup: yes → storage method: cloud storage → cloud accounts compromised: no → storage services: Google Drive → copy paste: yes → paste location: website → downloaded files: no → wallet setup: self → physical access: no → uncompromised keys: no, all compromised → prior hacks: no → suspected malware: no → malware scan: no → other ioc: none → free text: (skip)

Expected: progress bar advances each step, diagnosis screen shows `cloud_storage` or `phishing_fake_site`.

- [ ] **Step 3: Full happy path — malicious transaction user**

Walk through with timing: **while actively using** → verify that seed backup, storage method, copy paste, wallet setup, physical access questions do NOT appear → how found site and what trying to do DO appear.

- [ ] **Step 4: Test rejection flow**

On any diagnosis screen, click "That doesn't sound right." Verify a new (different) diagnosis appears without navigating away or re-asking questions.

- [ ] **Step 5: Test Back button**

Answer 5+ questions, hit Back twice, change an answer that affects visibility, verify subsequent questions update correctly.

- [ ] **Step 6: Test cluster analytics endpoint**

```bash
curl "http://localhost:3000/api/analytics?type=clusters"
```

Expected: `{ "clusters": [] }` (empty until there are completed flows with matching wallet + date).
