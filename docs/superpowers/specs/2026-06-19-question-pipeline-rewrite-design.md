# Question Pipeline Rewrite — Design Spec
_Date: 2026-06-19_

## Overview

Replace the current stateful adaptive branching tree (PathAQuestions / PathBQuestions) with a flat conditional question pipeline. All questions live in a single ordered array; each question declares a `showIf(answers)` condition. The probability engine scores answers at the end to produce a diagnosis. Twelve new epidemiological questions are woven in to support cross-victim pattern detection.

---

## Problem

The existing adaptive tree has flawed branching logic. The bugs stem from the stateful paradigm: `getNextStep`, `resolveToApplicable`, `isApplicable`, and `getSkipTarget` interact in complex ways across multiple components, making it difficult to trace execution paths or verify correctness. The retry/rejection flow compounds this.

---

## Architecture

### Core Change

Replace `PathAQuestions.tsx` and `PathBQuestions.tsx` with:

- **`src/lib/questions.ts`** — the full ordered question array with `showIf` conditions
- **`src/components/QuestionPipeline.tsx`** — stateless engine that walks the array, renders the current question, tracks answers, and reports completion

The distinction between "Path A" (seed phrase) and "Path B" (malicious transaction) becomes `showIf` conditions on individual questions rather than a hard fork. No more separate page routes for path-a and path-b.

### Files Removed
- `src/components/PathAQuestions.tsx`
- `src/components/PathBQuestions.tsx`
- `src/app/diagnostic/path-a/page.tsx`
- `src/app/diagnostic/path-b/page.tsx`

### Files Added/Modified
- `src/lib/questions.ts` (new)
- `src/components/QuestionPipeline.tsx` (new)
- `src/app/diagnostic/page.tsx` (modified — remove path routing, render QuestionPipeline)
- `src/app/diagnostic/timing/page.tsx` (removed — timing becomes question #7 in pipeline)
- `src/lib/db.ts` (modified — add `completed_at` to path_attempts, add question_id index)
- `src/app/api/analytics/route.ts` (modified — add `clusters` query type)
- `src/lib/session.ts` (modified — add `getClusterStats` function)

---

## Question List

All 26 questions in order. `showIf` is a pure function over the answers map collected so far.

| # | ID | Question | showIf | Type |
|---|---|---|---|---|
| 1 | `wallet_type` | What type of wallet were you using? | always | single-choice |
| 2 | `value_range` | Roughly how much did you lose? | always | single-choice |
| 3 | `devices_os` | What primary devices/OS do you use day-to-day? | always | multi-select |
| 4 | `seeds_compromised` | How many distinct seeds/keys were compromised? | always | single-choice |
| 5 | `wallet_generated` | Which wallet app did you use to *generate* the compromised key/seed? | always | single-choice + other |
| 6 | `key_generation_date` | Approximately when did you generate the compromised key/seed? | always | year + quarter dropdowns |
| 7 | `timing` | When did you notice the theft — while actively using your wallet, or later? | always | single-choice |
| 8 | `how_found_site` | How did you find the site or app you were using? | timing = `active` | single-choice |
| 9 | `what_trying_to_do` | What were you trying to do? | timing = `active` | single-choice |
| 10 | `seed_backup` | Did you back up your seed phrase (recovery phrase)? | timing ≠ `active` | single-choice |
| 11 | `storage_method` | How did you store it? | seed_backup = `yes` or `not_sure` | single-choice |
| 12 | `cloud_accounts_compromised` | Have any of your cloud or email accounts ever been compromised? (Google, Apple, Dropbox, iCloud, etc.) | storage_method involves cloud/notes/multiple | single-choice |
| 13 | `storage_services` | Which apps or services specifically? | storage_method involves cloud/notes/multiple | multi-select |
| 14 | `copy_paste` | Have you ever copied and pasted your seed phrase? | timing ≠ `active` | single-choice |
| 15 | `paste_location` | Where did you paste it? | copy_paste = `yes` | single-choice |
| 16 | `downloaded_files` | Have you downloaded any files or apps recently? | always | single-choice |
| 17 | `file_type` | What type of file? | downloaded_files = `yes` | single-choice |
| 18 | `file_source` | Where did it come from? | downloaded_files = `yes` | single-choice |
| 19 | `wallet_setup` | How was your wallet originally set up? | timing ≠ `active` | single-choice |
| 20 | `physical_access` | Could someone else have had physical access to where you stored your seed? | seed_backup = `yes` or `not_sure` | single-choice |
| 21 | `uncompromised_keys` | Did you have keys that were *not* compromised? Were those under the same seed as the ones that were? | always | single-choice |
| 22 | `prior_hacks` | Have you had other crypto wallets compromised before? | always | single-choice |
| 23 | `suspected_malware` | Have you ever suspected any of your devices were infected with malware in the last couple of years? | always | single-choice |
| 24 | `malware_scan` | Have you run a malware scan on your computer since the theft? | always | single-choice |
| 25 | `other_ioc` | Any other indicators of compromise? | always | multi-select |
| 26 | `free_text` | Is there anything else you think is important to share? | always | free text (optional) |

### showIf: "storage involves cloud/notes/multiple"
Defined as: `storage_method` ∈ `{cloud_storage, notes_app, screenshot, multiple}`

### Removed questions (replaced or made redundant)
- `a8_who_has_access` — covered by `physical_access` + `cloud_accounts_compromised`
- `a9_shared_devices` — covered by `devices_os` + `suspected_malware`
- `a10_browser_extensions` — covered by `downloaded_files` + `file_type`
- `a11_private_key_copy_paste` — covered by `copy_paste` + `paste_location`

---

## Question Option Sets

### Q3 — devices_os (multi-select)
`windows`, `mac`, `iphone`, `android`, `linux`, `other`

### Q4 — seeds_compromised (single-choice)
`one`, `two_to_five`, `more_than_five`, `not_sure`

### Q5 — wallet_generated (single-choice + other text)
Options: MetaMask, Trust Wallet, Coinbase Wallet, Phantom, Rainbow, Ledger Live, Trezor Suite, other (free text).
Wallet type (Q1) pre-filters which options are shown (e.g. hide mobile-only wallets for hardware type).

### Q6 — key_generation_date
Two dropdowns: Year (2013–2025) and Quarter (Q1–Q4). Stored as `"YYYY-QN"` (e.g. `"2022-Q3"`). "Not sure" option sets value to `"unknown"`.

### Q13 — storage_services (multi-select)
`google_drive`, `icloud`, `dropbox`, `notes_app`, `telegram`, `email_drafts`, `password_manager`, `other`

### Q21 — uncompromised_keys (single-choice)
`yes_same_seed` (yes, under the same seed — very diagnostic for selective access attack),
`yes_different_seed` (yes, under a different seed),
`no_all_compromised`,
`not_sure`

### Q25 — other_ioc (multi-select)
`credit_card_fraud`, `cex_login_attempts`, `email_account_breach`, `social_media_takeover`, `none`, `other`

---

## QuestionPipeline Component

```
interface Question {
  id: string
  type: 'single' | 'multi' | 'date' | 'text'
  title: string
  subtitle?: string
  options?: Option[]
  showIf: (answers: AnswerMap) => boolean
  optional?: boolean  // only used for Q26 free text
}

interface AnswerMap {
  [questionId: string]: string | string[]  // string[] for multi-select
}
```

**State:** `answers: AnswerMap`, `currentIndex: number` (index into the *visible* question list, recomputed each render).

**Progress bar:** `currentIndex / visibleQuestions.length` — advances each question, occasionally jumps when several hidden questions are skipped in a sequence.

**Welcome screen addition:** Static line added — *"We'll ask you around 15–20 questions — some may not apply to you."*

**Auto-advance:** Single-choice questions advance immediately on selection (same as today). Multi-select and free-text questions show a "Continue" button.

**Back button:** Always shown. Steps back through the visible question history (not the raw array index).

---

## Data Model

### Schema Changes

**`path_attempts` table — add column:**
```sql
ALTER TABLE path_attempts ADD COLUMN completed_at TEXT;
```
Set when the user reaches the diagnosis screen. Allows distinguishing completed flows from abandoned ones.

**New index:**
```sql
CREATE INDEX IF NOT EXISTS idx_path_steps_question ON path_steps(question_id);
```
Required for analytics queries that aggregate by question_id across all sessions.

**No other schema changes.** All 26 questions store as rows in `path_steps` using the existing `{question_id, answer_selected}` structure.

**Multi-select answers:** Stored as a JSON array string in `answer_selected`, e.g. `'["google_drive","telegram"]'`.

**Key generation date:** Stored as `"2022-Q3"` or `"unknown"`.

**Free text (Q26):** Stored as raw text in `answer_selected`. SQLite TEXT has no length limit.

---

## Analytics & Segmentation

### Existing endpoints — unchanged
`by_wallet_type`, `by_value_range`, `path_attempts`, `drop_off`, `engagement`, `trends`, `repeat_visitors`

### New endpoint: `GET /api/analytics?type=clusters`

Returns diagnoses grouped by wallet + generation period + diagnosis type, sorted by count descending. This is the primary tool for detecting mass hacks with a single source.

**Response shape:**
```json
[
  {
    "wallet": "MetaMask",
    "generation_period": "2022-Q3",
    "diagnosis": "unknown",
    "count": 47,
    "first_seen": "2026-05-01",
    "last_seen": "2026-06-19"
  }
]
```

**Query logic:**
```sql
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
HAVING count > 1
ORDER BY count DESC
```

---

## UX Notes

- Progress bar: thin bar at top of question screen. No number label. Advances each question.
- Welcome screen: add *"We'll ask around 15–20 questions — some may not apply to you."*
- Question card layout: unchanged from today (title, subtitle, option buttons, Back button)
- Multi-select: same card style with checkboxes, "Continue" button instead of auto-advance
- Free text (Q26): `<textarea>` in card style, "Submit" button, explicitly marked optional
- No progress indicators on the diagnosis screen itself
