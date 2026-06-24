# Cloudflare D1 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `better-sqlite3` + local-file data layer with Cloudflare D1 so the app deploys as a Cloudflare Worker, with no behavior change to the API surface.

**Architecture:** D1 is SQLite-compatible but its driver is **async** and accessed through a **Worker binding** (`env.DB`) rather than a file handle. We swap `better-sqlite3` for the D1 client behind the existing `getDb()` seam, convert every `src/lib/session.ts` query function to `async`, and `await` them in the 5 API routes. The schema moves from runtime `CREATE TABLE IF NOT EXISTS` to a versioned D1 migration. The Next app is built for Workers via the `@opennextjs/cloudflare` adapter. **No existing data needs to be preserved — the database is created fresh.**

**Tech Stack:** Next.js 16.1.5 (App Router), `@opennextjs/cloudflare`, Cloudflare D1, `wrangler`, TypeScript.

## Global Constraints

- All commands run from the Next app directory: `/Users/elliott/dev/how-was-i-hacked/app` (the repo root is one level up; this app has no root `package.json`).
- Cloudflare Workers run in a V8 isolate: **no native Node addons** (`better-sqlite3` is forbidden) and **no persistent filesystem** (no `fs`, no `process.cwd()` DB path).
- D1 binding name is exactly **`DB`** everywhere (`wrangler.jsonc`, generated env type, `getDb()`).
- D1 database name is exactly **`howwasihacked`**.
- `compatibility_flags` MUST include `"nodejs_compat"` and `compatibility_date` MUST be `>= 2024-09-23` (we use `"2025-04-01"`) so `node:crypto` / `node:` builtins resolve.
- The public API contract (routes, request/response JSON shapes, status codes) MUST NOT change — only the implementation behind it.
- No new unit-test framework is introduced (the repo has none); each task is verified by `npx tsc --noEmit`, `wrangler`/`curl` integration commands, and the running app.
- After each task: `npx tsc --noEmit` must pass before committing.

## Risks / Open Questions (resolve during Task 1)

- **Next 16 support in `@opennextjs/cloudflare`.** This app is on Next `16.1.5`, which is new. Task 1 Step 2 pins the latest `@opennextjs/cloudflare` and immediately smoke-tests the adapter. **If the adapter does not yet support Next 16**, STOP and surface to the user — options are (a) wait/upgrade the adapter, or (b) pin Next to the latest 15.x the adapter supports. Do not proceed past Task 1 until the adapter builds.
- `wrangler d1 create` and `deploy` require `wrangler login` (interactive). Local dev and local migrations do **not** — they use a placeholder `database_id`. The plan keeps all verification local; the real `database_id` and deploy are a final, separately-noted step.

## File Structure

- `app/wrangler.jsonc` *(create)* — Worker name, compatibility flags, D1 binding `DB`.
- `app/open-next.config.ts` *(create)* — OpenNext Cloudflare adapter config.
- `app/next.config.ts` *(modify)* — call `initOpenNextCloudflareForDev()` so `getCloudflareContext()` works under `next dev`.
- `app/cloudflare-env.d.ts` *(generated)* — `CloudflareEnv` interface incl. `DB: D1Database`.
- `app/migrations/0001_init.sql` *(create)* — full schema (tables + indexes).
- `app/src/lib/db.ts` *(rewrite)* — `getDb()` returns the D1 binding from the Cloudflare context.
- `app/src/lib/session.ts` *(rewrite)* — every DB function becomes `async`/`Promise`-returning, using the D1 client.
- `app/src/app/api/{session,path,diagnosis,probability,analytics}/route.ts` *(modify)* — `await` all data-layer calls.
- `app/package.json` *(modify)* — remove `better-sqlite3` + `@types/better-sqlite3`; add adapter/wrangler devdeps; add `cf-typegen`/`preview`/`deploy` scripts.
- `app/.gitignore` *(modify)* — drop `/data/`, add `.wrangler/` and `.open-next/`.

---

### Task 1: Install and configure the Cloudflare adapter

**Files:**
- Modify: `app/package.json` (devDependencies + scripts)
- Create: `app/wrangler.jsonc`
- Create: `app/open-next.config.ts`
- Modify: `app/next.config.ts`
- Generated: `app/cloudflare-env.d.ts`
- Modify: `app/tsconfig.json` (add Cloudflare types)
- Modify: `app/.gitignore`

**Interfaces:**
- Produces: `getCloudflareContext()` (from `@opennextjs/cloudflare`) usable in request handlers; global type `CloudflareEnv` with field `DB: D1Database`; npm scripts `cf-typegen`, `preview`, `deploy`.

- [ ] **Step 1: Install adapter + wrangler as devDependencies**

Run (from `app/`):
```bash
npm install --save-dev @opennextjs/cloudflare@latest wrangler@latest @cloudflare/workers-types
```
Expected: installs without peer-dependency errors.

- [ ] **Step 2: Create `app/wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "how-was-i-hacked",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "howwasihacked",
      "database_id": "local-placeholder-id",
      "migrations_dir": "migrations"
    }
  ]
}
```
Note: `database_id` stays `"local-placeholder-id"` until the real DB is created for deploy (final task note). Local dev/migrations ignore it.

- [ ] **Step 3: Create `app/open-next.config.ts`**

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

- [ ] **Step 4: Wire `getCloudflareContext()` into `next dev` — modify `app/next.config.ts`**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Enable getCloudflareContext() (and local D1 bindings) during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

- [ ] **Step 5: Add scripts to `app/package.json`**

Add these entries to the `"scripts"` object (keep existing `dev`/`build`/`start`/`lint`):
```json
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
```

- [ ] **Step 6: Generate the env types**

Run (from `app/`):
```bash
npm run cf-typegen
```
Expected: creates `app/cloudflare-env.d.ts` containing an `interface CloudflareEnv` with a `DB: D1Database` member (because of the `d1_databases` binding in `wrangler.jsonc`).

- [ ] **Step 7: Ensure `D1Database` resolves — modify `app/tsconfig.json`**

In `compilerOptions`, add a `types` array (or extend it) so the workers types are loaded:
```jsonc
    "types": ["@cloudflare/workers-types"],
```
Place it alongside the other `compilerOptions`. (If a `types` array already exists, append the string instead.)

- [ ] **Step 8: Update `app/.gitignore`**

Remove the line `/data/` and add:
```gitignore
# cloudflare
.wrangler/
.open-next/
cloudflare-env.d.ts
```

- [ ] **Step 9: Verify type-check passes and the app still runs on Node**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0 (the app still uses `better-sqlite3` at this point — that's fine, dev runs on Node).

Run in a second terminal:
```bash
npm run dev
```
Then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/analytics
```
Expected: `200`. Stop the dev server after checking.

- [ ] **Step 10: Commit**

```bash
git add app/package.json app/package-lock.json app/wrangler.jsonc app/open-next.config.ts app/next.config.ts app/tsconfig.json app/.gitignore
git commit -m "chore: add Cloudflare adapter and wrangler config"
```

---

### Task 2: Create and apply the D1 schema migration

**Files:**
- Create: `app/migrations/0001_init.sql`

**Interfaces:**
- Produces: a local D1 database named `howwasihacked` with tables `sessions`, `path_attempts`, `path_steps`, `diagnoses` and their indexes. `path_attempts` includes `completed_at TEXT` directly (no separate ALTER step — fresh DB).

- [ ] **Step 1: Create `app/migrations/0001_init.sql`**

```sql
-- Sessions: anonymous user sessions (no PII; user_hash = sha256(ip + ua))
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  wallet_type TEXT,
  wallet_specific TEXT,
  value_range TEXT
);
CREATE INDEX idx_sessions_user_hash ON sessions(user_hash);

-- Path attempts: each diagnostic run within a session
CREATE TABLE path_attempts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
CREATE INDEX idx_path_attempts_session ON path_attempts(session_id);

-- Path steps: each question/answer within an attempt
CREATE TABLE path_steps (
  id TEXT PRIMARY KEY,
  path_attempt_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  answer_selected TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (path_attempt_id) REFERENCES path_attempts(id)
);
CREATE INDEX idx_path_steps_attempt ON path_steps(path_attempt_id);
CREATE INDEX idx_path_steps_question ON path_steps(question_id);

-- Diagnoses: the final diagnosis for an attempt
CREATE TABLE diagnoses (
  id TEXT PRIMARY KEY,
  path_attempt_id TEXT NOT NULL,
  diagnosis_type TEXT NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  clicked_learn INTEGER NOT NULL DEFAULT 0,
  clicked_hwr INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (path_attempt_id) REFERENCES path_attempts(id)
);
CREATE INDEX idx_diagnoses_type ON diagnoses(diagnosis_type);
```

- [ ] **Step 2: Apply the migration to the LOCAL D1**

Run (from `app/`):
```bash
npx wrangler d1 migrations apply howwasihacked --local
```
Expected: reports `0001_init.sql` applied successfully (no Cloudflare login required for `--local`).

- [ ] **Step 3: Verify the tables exist locally**

Run:
```bash
npx wrangler d1 execute howwasihacked --local --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```
Expected output includes: `diagnoses`, `path_attempts`, `path_steps`, `sessions` (plus `d1_migrations`).

- [ ] **Step 4: Commit**

```bash
git add app/migrations/0001_init.sql
git commit -m "feat: add D1 schema migration"
```

---

### Task 3: Convert the data layer to async D1 (db.ts + session.ts + all routes)

This is one atomic change: `getDb()`'s return type changes, which forces every `session.ts` function async, which forces every route to `await`. Splitting it would leave the project in a non-compiling intermediate state, so it is a single task verified end-to-end.

**Files:**
- Rewrite: `app/src/lib/db.ts`
- Rewrite: `app/src/lib/session.ts`
- Modify: `app/src/app/api/session/route.ts`
- Modify: `app/src/app/api/path/route.ts`
- Modify: `app/src/app/api/diagnosis/route.ts`
- Modify: `app/src/app/api/probability/route.ts`
- Modify: `app/src/app/api/analytics/route.ts`

**Interfaces:**
- Consumes: D1 binding `DB` (Task 1), local schema (Task 2).
- Produces: `getDb(): D1Database`. All `session.ts` exports become async, e.g. `getSession(id: string): Promise<Session | null>`, `createSession(userHash: string): Promise<Session>`, `createPathAttempt(sessionId: string): Promise<PathAttempt>`, `getPathSteps(pathAttemptId: string): Promise<PathStep[]>`, `getDiagnosisByWalletType(): Promise<DiagnosisByWalletType[]>`, etc. `createUserHash(ip, userAgent): string` stays **synchronous**.

- [ ] **Step 1: Rewrite `app/src/lib/db.ts`**

```typescript
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Returns the D1 binding for the current request. Available in route handlers
// and server components during a request; works under `next dev` because
// next.config.ts calls initOpenNextCloudflareForDev().
export function getDb(): D1Database {
  return getCloudflareContext().env.DB;
}
```

- [ ] **Step 2: Rewrite `app/src/lib/session.ts`**

Replace the entire file with the async D1 version below. Every query uses `.bind(...)`; reads use `.first<T>()` (single row) or `.all<T>()` then `.results` (many rows); writes use `.run()`.

```typescript
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'node:crypto';
import { getDb } from './db';
import type { Session, PathAttempt, PathStep, Diagnosis, WalletType, ValueRange, ClusterStat } from './types';

// Hash from IP + User Agent for repeat-visitor identification. NOT PII, not reversible.
export function createUserHash(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}`;
  return createHash('sha256').update(data).digest('hex');
}

export async function createSession(userHash: string): Promise<Session> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  await db
    .prepare(`INSERT INTO sessions (id, user_hash, created_at) VALUES (?, ?, ?)`)
    .bind(id, userHash, now)
    .run();
  return { id, user_hash: userHash, created_at: now, wallet_type: null, wallet_specific: null, value_range: null };
}

export async function getSession(id: string): Promise<Session | null> {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<Session>();
  return row ?? null;
}

export async function updateSessionWallet(
  id: string,
  walletType: WalletType,
  walletSpecific: string | null
): Promise<void> {
  const db = getDb();
  await db
    .prepare(`UPDATE sessions SET wallet_type = ?, wallet_specific = ? WHERE id = ?`)
    .bind(walletType, walletSpecific, id)
    .run();
}

export async function updateSessionValueRange(id: string, valueRange: ValueRange): Promise<void> {
  const db = getDb();
  await db.prepare(`UPDATE sessions SET value_range = ? WHERE id = ?`).bind(valueRange, id).run();
}

export async function getSessionsByUserHash(userHash: string): Promise<Session[]> {
  const db = getDb();
  const { results } = await db
    .prepare('SELECT * FROM sessions WHERE user_hash = ? ORDER BY created_at DESC')
    .bind(userHash)
    .all<Session>();
  return results;
}

export async function createPathAttempt(sessionId: string): Promise<PathAttempt> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const countRow = await db
    .prepare('SELECT COUNT(*) as count FROM path_attempts WHERE session_id = ?')
    .bind(sessionId)
    .first<{ count: number }>();
  const attemptNumber = (countRow?.count ?? 0) + 1;
  await db
    .prepare(`INSERT INTO path_attempts (id, session_id, attempt_number, created_at) VALUES (?, ?, ?, ?)`)
    .bind(id, sessionId, attemptNumber, now)
    .run();
  return { id, session_id: sessionId, attempt_number: attemptNumber, created_at: now, completed_at: null };
}

export async function getLatestPathAttempt(sessionId: string): Promise<PathAttempt | null> {
  const db = getDb();
  const row = await db
    .prepare('SELECT * FROM path_attempts WHERE session_id = ? ORDER BY attempt_number DESC LIMIT 1')
    .bind(sessionId)
    .first<PathAttempt>();
  return row ?? null;
}

export async function getPathAttempt(id: string): Promise<PathAttempt | null> {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM path_attempts WHERE id = ?').bind(id).first<PathAttempt>();
  return row ?? null;
}

export async function createPathStep(
  pathAttemptId: string,
  questionId: string,
  answerSelected: string
): Promise<PathStep> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const countRow = await db
    .prepare('SELECT COUNT(*) as count FROM path_steps WHERE path_attempt_id = ?')
    .bind(pathAttemptId)
    .first<{ count: number }>();
  const stepOrder = (countRow?.count ?? 0) + 1;
  await db
    .prepare(
      `INSERT INTO path_steps (id, path_attempt_id, step_order, question_id, answer_selected, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, pathAttemptId, stepOrder, questionId, answerSelected, now)
    .run();
  return { id, path_attempt_id: pathAttemptId, step_order: stepOrder, question_id: questionId, answer_selected: answerSelected, created_at: now };
}

export async function getPathSteps(pathAttemptId: string): Promise<PathStep[]> {
  const db = getDb();
  const { results } = await db
    .prepare('SELECT * FROM path_steps WHERE path_attempt_id = ? ORDER BY step_order ASC')
    .bind(pathAttemptId)
    .all<PathStep>();
  return results;
}

export async function createDiagnosis(pathAttemptId: string, diagnosisType: string): Promise<Diagnosis> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO diagnoses (id, path_attempt_id, diagnosis_type, accepted, clicked_learn, clicked_hwr, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, pathAttemptId, diagnosisType, 0, 0, 0, now)
    .run();
  return { id, path_attempt_id: pathAttemptId, diagnosis_type: diagnosisType, accepted: false, clicked_learn: false, clicked_hwr: false, created_at: now };
}

type DiagnosisRow = {
  id: string; path_attempt_id: string; diagnosis_type: string;
  accepted: number; clicked_learn: number; clicked_hwr: number; created_at: string;
};

function toDiagnosis(row: DiagnosisRow): Diagnosis {
  return { ...row, accepted: Boolean(row.accepted), clicked_learn: Boolean(row.clicked_learn), clicked_hwr: Boolean(row.clicked_hwr) };
}

export async function getDiagnosis(id: string): Promise<Diagnosis | null> {
  const db = getDb();
  const row = await db.prepare('SELECT * FROM diagnoses WHERE id = ?').bind(id).first<DiagnosisRow>();
  return row ? toDiagnosis(row) : null;
}

export async function getDiagnosisByPathAttempt(pathAttemptId: string): Promise<Diagnosis | null> {
  const db = getDb();
  const row = await db
    .prepare('SELECT * FROM diagnoses WHERE path_attempt_id = ? ORDER BY created_at DESC LIMIT 1')
    .bind(pathAttemptId)
    .first<DiagnosisRow>();
  return row ? toDiagnosis(row) : null;
}

export async function updateDiagnosisAccepted(id: string, accepted: boolean): Promise<void> {
  const db = getDb();
  await db.prepare(`UPDATE diagnoses SET accepted = ? WHERE id = ?`).bind(accepted ? 1 : 0, id).run();
}

export async function updateDiagnosisClickedLearn(id: string): Promise<void> {
  const db = getDb();
  await db.prepare(`UPDATE diagnoses SET clicked_learn = 1 WHERE id = ?`).bind(id).run();
}

export async function updateDiagnosisClickedHwr(id: string): Promise<void> {
  const db = getDb();
  await db.prepare(`UPDATE diagnoses SET clicked_hwr = 1 WHERE id = ?`).bind(id).run();
}

export async function getRejectedDiagnosesForSession(sessionId: string): Promise<string[]> {
  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT DISTINCT d.diagnosis_type
       FROM diagnoses d
       JOIN path_attempts pa ON d.path_attempt_id = pa.id
       WHERE pa.session_id = ? AND d.accepted = 0`
    )
    .bind(sessionId)
    .all<{ diagnosis_type: string }>();
  return results.map((r) => r.diagnosis_type);
}

export async function getPathAttemptsForSession(sessionId: string): Promise<PathAttempt[]> {
  const db = getDb();
  const { results } = await db
    .prepare('SELECT * FROM path_attempts WHERE session_id = ? ORDER BY attempt_number ASC')
    .bind(sessionId)
    .all<PathAttempt>();
  return results;
}

// ==========================================
// ANALYTICS QUERY FUNCTIONS
// ==========================================

export interface DiagnosisByWalletType { wallet_type: string; diagnosis_type: string; count: number }
export interface DiagnosisByValueRange { value_range: string; diagnosis_type: string; count: number }
export interface PathAttemptStats {
  avg_attempts_before_accept: number;
  total_sessions_with_diagnosis: number;
  sessions_accepted_first_try: number;
  sessions_with_multiple_attempts: number;
}
export interface DropOffPoint { question_id: string; drop_off_count: number; total_reached: number; drop_off_rate: number }
export interface EngagementStats {
  total_diagnoses: number;
  clicked_learn_count: number;
  clicked_hwr_count: number;
  learn_click_rate: number;
  hwr_click_rate: number;
}
export interface DiagnosisTrend { date: string; diagnosis_type: string; count: number }
export interface RepeatVisitorStats { total_unique_visitors: number; repeat_visitors: number; repeat_rate: number }

export async function getDiagnosisByWalletType(): Promise<DiagnosisByWalletType[]> {
  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT s.wallet_type, d.diagnosis_type, COUNT(*) as count
       FROM diagnoses d
       JOIN path_attempts pa ON d.path_attempt_id = pa.id
       JOIN sessions s ON pa.session_id = s.id
       WHERE s.wallet_type IS NOT NULL AND d.accepted = 1
       GROUP BY s.wallet_type, d.diagnosis_type
       ORDER BY s.wallet_type, count DESC`
    )
    .all<DiagnosisByWalletType>();
  return results;
}

export async function getDiagnosisByValueRange(): Promise<DiagnosisByValueRange[]> {
  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT s.value_range, d.diagnosis_type, COUNT(*) as count
       FROM diagnoses d
       JOIN path_attempts pa ON d.path_attempt_id = pa.id
       JOIN sessions s ON pa.session_id = s.id
       WHERE s.value_range IS NOT NULL AND d.accepted = 1
       GROUP BY s.value_range, d.diagnosis_type
       ORDER BY s.value_range, count DESC`
    )
    .all<DiagnosisByValueRange>();
  return results;
}

export async function getPathAttemptStats(): Promise<PathAttemptStats> {
  const db = getDb();
  const avgResult = await db
    .prepare(
      `SELECT AVG(pa.attempt_number) as avg_attempts, COUNT(DISTINCT pa.session_id) as total_sessions
       FROM diagnoses d JOIN path_attempts pa ON d.path_attempt_id = pa.id
       WHERE d.accepted = 1`
    )
    .first<{ avg_attempts: number | null; total_sessions: number }>();
  const firstTryResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT pa.session_id) as count
       FROM diagnoses d JOIN path_attempts pa ON d.path_attempt_id = pa.id
       WHERE d.accepted = 1 AND pa.attempt_number = 1`
    )
    .first<{ count: number }>();
  const multipleResult = await db
    .prepare(
      `SELECT COUNT(DISTINCT pa.session_id) as count
       FROM diagnoses d JOIN path_attempts pa ON d.path_attempt_id = pa.id
       WHERE d.accepted = 1 AND pa.attempt_number > 1`
    )
    .first<{ count: number }>();
  return {
    avg_attempts_before_accept: avgResult?.avg_attempts ?? 0,
    total_sessions_with_diagnosis: avgResult?.total_sessions ?? 0,
    sessions_accepted_first_try: firstTryResult?.count ?? 0,
    sessions_with_multiple_attempts: multipleResult?.count ?? 0,
  };
}

export async function getDropOffPoints(): Promise<DropOffPoint[]> {
  const db = getDb();
  const reached = (
    await db.prepare(`SELECT question_id, COUNT(*) as total_reached FROM path_steps GROUP BY question_id`).all<{ question_id: string; total_reached: number }>()
  ).results;
  const completed = (
    await db
      .prepare(
        `SELECT ps.question_id, COUNT(DISTINCT pa.session_id) as completed
         FROM path_steps ps
         JOIN path_attempts pa ON ps.path_attempt_id = pa.id
         JOIN diagnoses d ON d.path_attempt_id = pa.id
         GROUP BY ps.question_id`
      )
      .all<{ question_id: string; completed: number }>()
  ).results;
  const completedMap = new Map(completed.map((c) => [c.question_id, c.completed]));
  return reached
    .map((r) => {
      const completedCount = completedMap.get(r.question_id) ?? 0;
      const dropOffCount = r.total_reached - completedCount;
      return {
        question_id: r.question_id,
        drop_off_count: dropOffCount,
        total_reached: r.total_reached,
        drop_off_rate: r.total_reached > 0 ? dropOffCount / r.total_reached : 0,
      };
    })
    .sort((a, b) => b.drop_off_rate - a.drop_off_rate);
}

export async function getEngagementStats(): Promise<EngagementStats> {
  const db = getDb();
  const result = await db
    .prepare(
      `SELECT COUNT(*) as total_diagnoses, SUM(clicked_learn) as clicked_learn_count, SUM(clicked_hwr) as clicked_hwr_count
       FROM diagnoses`
    )
    .first<{ total_diagnoses: number; clicked_learn_count: number | null; clicked_hwr_count: number | null }>();
  const total = result?.total_diagnoses ?? 0;
  const learn = result?.clicked_learn_count ?? 0;
  const hwr = result?.clicked_hwr_count ?? 0;
  return {
    total_diagnoses: total,
    clicked_learn_count: learn,
    clicked_hwr_count: hwr,
    learn_click_rate: total > 0 ? learn / total : 0,
    hwr_click_rate: total > 0 ? hwr / total : 0,
  };
}

export async function getDiagnosisTrends(days: number = 30): Promise<DiagnosisTrend[]> {
  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT date(created_at) as date, diagnosis_type, COUNT(*) as count
       FROM diagnoses
       WHERE created_at >= date('now', '-' || ? || ' days')
       GROUP BY date(created_at), diagnosis_type
       ORDER BY date ASC, count DESC`
    )
    .bind(days)
    .all<DiagnosisTrend>();
  return results;
}

export async function getRepeatVisitorStats(): Promise<RepeatVisitorStats> {
  const db = getDb();
  const totalResult = await db.prepare(`SELECT COUNT(DISTINCT user_hash) as count FROM sessions`).first<{ count: number }>();
  const repeatResult = await db
    .prepare(`SELECT COUNT(*) as count FROM (SELECT user_hash FROM sessions GROUP BY user_hash HAVING COUNT(*) > 1)`)
    .first<{ count: number }>();
  const total = totalResult?.count ?? 0;
  const repeat = repeatResult?.count ?? 0;
  return { total_unique_visitors: total, repeat_visitors: repeat, repeat_rate: total > 0 ? repeat / total : 0 };
}

export async function getFullPath(pathAttemptId: string): Promise<PathStep[]> {
  const db = getDb();
  const { results } = await db
    .prepare('SELECT * FROM path_steps WHERE path_attempt_id = ? ORDER BY step_order ASC')
    .bind(pathAttemptId)
    .all<PathStep>();
  return results;
}

export async function completePathAttempt(id: string): Promise<void> {
  const db = getDb();
  await db.prepare(`UPDATE path_attempts SET completed_at = datetime('now') WHERE id = ?`).bind(id).run();
}

export async function getClusterStats(): Promise<ClusterStat[]> {
  const db = getDb();
  const { results } = await db
    .prepare(
      `SELECT ps_wallet.answer_selected AS wallet,
              ps_date.answer_selected   AS generation_period,
              d.diagnosis_type          AS diagnosis,
              COUNT(*)                  AS count,
              MIN(pa.created_at)        AS first_seen,
              MAX(pa.created_at)        AS last_seen
       FROM path_attempts pa
       JOIN path_steps ps_wallet ON ps_wallet.path_attempt_id = pa.id AND ps_wallet.question_id = 'wallet_generated'
       JOIN path_steps ps_date ON ps_date.path_attempt_id = pa.id AND ps_date.question_id = 'key_generation_date'
       JOIN diagnoses d ON d.path_attempt_id = pa.id
       WHERE pa.completed_at IS NOT NULL AND ps_date.answer_selected != 'unknown'
       GROUP BY wallet, generation_period, diagnosis
       HAVING COUNT(*) > 1
       ORDER BY COUNT(*) DESC`
    )
    .all<ClusterStat>();
  return results;
}

export async function getSessionPaths(sessionId: string): Promise<{
  pathAttempt: PathAttempt;
  steps: PathStep[];
  diagnosis: Diagnosis | null;
}[]> {
  const pathAttempts = await getPathAttemptsForSession(sessionId);
  return Promise.all(
    pathAttempts.map(async (pa) => ({
      pathAttempt: pa,
      steps: await getFullPath(pa.id),
      diagnosis: await getDiagnosisByPathAttempt(pa.id),
    }))
  );
}
```

- [ ] **Step 3: Update `app/src/app/api/session/route.ts` — await every data call**

In `POST`: `const session = await createSession(userHash);`
In `GET`: `const session = await getSession(sessionId);`
In `PATCH`, replace the body's data calls with awaited versions:
```typescript
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (walletType) {
      await updateSessionWallet(sessionId, walletType as WalletType, walletSpecific ?? null);
    } else if (walletSpecific !== undefined) {
      const current = await getSession(sessionId);
      if (current?.wallet_type) {
        await updateSessionWallet(sessionId, current.wallet_type, walletSpecific);
      }
    }

    if (valueRange) {
      await updateSessionValueRange(sessionId, valueRange as ValueRange);
    }

    const updatedSession = await getSession(sessionId);
    return NextResponse.json(updatedSession);
```

- [ ] **Step 4: Update `app/src/app/api/path/route.ts` — await every data call**

`POST`: `const session = await getSession(sessionId);`, `const pathAttempt = await createPathAttempt(sessionId);`, `pathStep = await createPathStep(pathAttempt.id, questionId, answerSelected);`
`GET`: `const pathAttempt = await getPathAttempt(pathAttemptId);`, `const steps = await getPathSteps(pathAttemptId);`, `const pathAttempt = await getLatestPathAttempt(sessionId);`, `const steps = await getPathSteps(pathAttempt.id);`
`PATCH`: `const pathAttempt = await getPathAttempt(pathAttemptId);`, `await completePathAttempt(pathAttemptId);`, `const pathStep = await createPathStep(pathAttemptId, questionId, answerSelected);`

- [ ] **Step 5: Update `app/src/app/api/diagnosis/route.ts` — await every data call**

`POST`: `const pathAttempt = await getPathAttempt(pathAttemptId);`, `const diagnosis = await createDiagnosis(pathAttemptId, diagnosisType);`
`GET`: `const diagnosis = await getDiagnosis(diagnosisId);`, `const diagnosis = await getDiagnosisByPathAttempt(pathAttemptId);`
`PATCH`: `const diagnosis = await getDiagnosis(diagnosisId);`, `await updateDiagnosisAccepted(diagnosisId, accepted);`, `await updateDiagnosisClickedLearn(diagnosisId);`, `await updateDiagnosisClickedHwr(diagnosisId);`, `const updatedDiagnosis = await getDiagnosis(diagnosisId);`

- [ ] **Step 6: Update `app/src/app/api/probability/route.ts` — await every data call**

`POST`: `const session = await getSession(sessionId);`, `const pathAttempt = await getPathAttempt(pathAttemptId);`, `steps = await getPathSteps(pathAttemptId);`
`GET`: `const session = await getSession(sessionId);`, `const allRejectedDiagnoses = await getRejectedDiagnosesForSession(sessionId);`, `const pathAttempt = await getPathAttempt(pathAttemptId);`, `steps = await getPathSteps(pathAttemptId);`
Note: the `steps` local is typed `ReturnType<typeof getPathSteps>` which is now `Promise<PathStep[]>`. Change that annotation in BOTH handlers to `PathStep[]` and add the import: `import type { PathStep } from '@/lib/types';` at the top of the file.

- [ ] **Step 7: Update `app/src/app/api/analytics/route.ts` — await every data call**

Every `getX()` call in the `switch` becomes `await getX()`. Because `NextResponse.json({...})` object literals call them inline, await each, e.g.:
```typescript
      case 'by_wallet_type':
        return NextResponse.json({ diagnosisByWalletType: await getDiagnosisByWalletType() });
```
For the `'all'` / `default` branch, await each member:
```typescript
        return NextResponse.json({
          diagnosisByWalletType: await getDiagnosisByWalletType(),
          diagnosisByValueRange: await getDiagnosisByValueRange(),
          pathAttemptStats: await getPathAttemptStats(),
          dropOffPoints: await getDropOffPoints(),
          engagementStats: await getEngagementStats(),
          diagnosisTrends: await getDiagnosisTrends(days),
          repeatVisitorStats: await getRepeatVisitorStats(),
        });
```
Apply the same `await` to `getDropOffPoints`, `getEngagementStats`, `getDiagnosisTrends`, `getRepeatVisitorStats`, `getSessionPaths`, `getClusterStats` in their respective `case` branches.

- [ ] **Step 8: Type-check**

Run:
```bash
npx tsc --noEmit
```
Expected: exit 0. If errors mention a missing `await` or `Promise<...>` not assignable, fix that call site.

- [ ] **Step 9: Integration test — full flow against local D1 under `next dev`**

Start the dev server (`npm run dev`), then run the end-to-end flow:
```bash
# 1. Create a session
SID=$(curl -s -X POST http://localhost:3000/api/session | python3 -c "import sys,json;print(json.load(sys.stdin)['sessionId'])")
echo "session=$SID"

# 2. Create a path attempt
PID=$(curl -s -X POST http://localhost:3000/api/path -H 'Content-Type: application/json' -d "{\"sessionId\":\"$SID\"}" | python3 -c "import sys,json;print(json.load(sys.stdin)['pathAttempt']['id'])")
echo "path=$PID"

# 3. Record a step
curl -s -X PATCH http://localhost:3000/api/path -H 'Content-Type: application/json' -d "{\"pathAttemptId\":\"$PID\",\"questionId\":\"wallet_type\",\"answerSelected\":\"mobile\"}" -o /dev/null -w "step=%{http_code}\n"

# 4. Complete the attempt
curl -s -X PATCH http://localhost:3000/api/path -H 'Content-Type: application/json' -d "{\"pathAttemptId\":\"$PID\",\"complete\":true}" -o /dev/null -w "complete=%{http_code}\n"

# 5. Create a diagnosis
curl -s -X POST http://localhost:3000/api/diagnosis -H 'Content-Type: application/json' -d "{\"pathAttemptId\":\"$PID\",\"diagnosisType\":\"cloud_storage\"}" -o /dev/null -w "diagnosis=%{http_code}\n"

# 6. Probability + analytics
curl -s -X POST http://localhost:3000/api/probability -H 'Content-Type: application/json' -d "{\"sessionId\":\"$SID\",\"pathAttemptId\":\"$PID\"}" -o /dev/null -w "prob=%{http_code}\n"
curl -s 'http://localhost:3000/api/analytics?type=all&days=3650' -o /dev/null -w "analytics=%{http_code}\n"
```
Expected: `step=200`, `complete=200`, `diagnosis=201`, `prob=200`, `analytics=200`.

- [ ] **Step 10: Confirm rows were written to local D1**

```bash
npx wrangler d1 execute howwasihacked --local --command "SELECT (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM path_steps) AS steps, (SELECT COUNT(*) FROM diagnoses) AS diagnoses;"
```
Expected: counts ≥ 1 for each. Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add app/src/lib/db.ts app/src/lib/session.ts app/src/app/api
git commit -m "feat: migrate data layer from better-sqlite3 to Cloudflare D1"
```

---

### Task 4: Remove better-sqlite3 and verify the Worker build

**Files:**
- Modify: `app/package.json` (remove deps)
- Delete: `app/data/` (local sqlite artifacts, untracked)

**Interfaces:**
- Consumes: the fully-async data layer (Task 3).
- Produces: a project with zero `better-sqlite3` references that builds and runs on the `workerd` runtime via `opennextjs-cloudflare preview`.

- [ ] **Step 1: Remove the native-module dependencies**

Run (from `app/`):
```bash
npm uninstall better-sqlite3 @types/better-sqlite3
```

- [ ] **Step 2: Confirm no references remain**

```bash
grep -rn "better-sqlite3" src package.json || echo "CLEAN: no better-sqlite3 references"
```
Expected: `CLEAN: no better-sqlite3 references`.

- [ ] **Step 3: Remove the obsolete local file-DB directory**

```bash
rm -rf data
```
(This was the old `better-sqlite3` file location; D1 local state lives in `.wrangler/`.)

- [ ] **Step 4: Type-check + lint**

```bash
npx tsc --noEmit && npx eslint src
```
Expected: both exit 0.

- [ ] **Step 5: Build and preview on the workerd runtime**

```bash
npm run preview
```
Expected: `opennextjs-cloudflare build` completes, then a local `workerd` server starts (default `http://localhost:8788`). If the build fails referencing `better-sqlite3` or a Node-only API, STOP — it means a code path still imports a forbidden module.

- [ ] **Step 6: Apply migrations to the preview's local D1 and smoke-test**

In a second terminal (the preview uses the same local D1 binding; ensure migrations are applied):
```bash
npx wrangler d1 migrations apply howwasihacked --local
curl -s -X POST http://localhost:8788/api/session -o /dev/null -w "session=%{http_code}\n"
curl -s 'http://localhost:8788/api/analytics?type=all' -o /dev/null -w "analytics=%{http_code}\n"
curl -s -o /dev/null -w "analytics_page=%{http_code}\n" http://localhost:8788/analytics
```
Expected: `session=201`, `analytics=200`, `analytics_page=200`. Stop the preview server.

- [ ] **Step 7: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "chore: remove better-sqlite3 native dependency"
```

---

## Deploy (manual, requires Cloudflare account — do NOT run as part of automated execution)

These steps need an interactive `wrangler login` and a real Cloudflare account. Run them when ready to ship:

```bash
# From app/ — authenticate once
npx wrangler login

# Create the remote D1 database; copy the printed database_id
npx wrangler d1 create howwasihacked

# Paste that id into wrangler.jsonc -> d1_databases[0].database_id (replace "local-placeholder-id")

# Apply the schema to the REMOTE database
npx wrangler d1 migrations apply howwasihacked --remote

# Build + deploy the Worker
npm run deploy
```

After deploy, smoke-test the live URL's `/api/session` (expect 201) and `/analytics` (expect 200).

---

## Self-Review

**Spec coverage:**
- "Deploy as a Cloudflare Worker" → Tasks 1 & 4 (adapter, wrangler config, workerd preview build).
- "Replace better-sqlite3 / no native modules, no filesystem" → Tasks 3 & 4 (D1 client, removal, clean grep).
- "Create the DB fresh, no data migration" → Task 2 (single init migration; no ALTER/backfill).
- "No API behavior change" → Task 3 keeps all routes, shapes, and status codes; verified by the end-to-end curl flow (Step 9) and the analytics page check.
- "Analytics page keeps working" → covered by `/analytics` checks in Tasks 1, 3, and 4 (the page is unchanged; it only consumes the API).

**Placeholder scan:** No TBD/TODO/"handle edge cases" left; every code step shows full code or the exact call-site edits; the only intentional placeholder is `database_id: "local-placeholder-id"`, explicitly explained and replaced in the Deploy section.

**Type consistency:** `getDb()` returns `D1Database` (Task 3 Step 1), consumed by every `session.ts` function. All `session.ts` exports return `Promise<...>`; the `ReturnType<typeof getPathSteps>` annotation in `probability/route.ts` is explicitly changed to `PathStep[]` (Task 3 Step 6) since that helper is now async. `createUserHash` stays synchronous and is called without `await` in `session/route.ts` (unchanged). `DiagnosisRow`/`toDiagnosis` are defined once and reused by `getDiagnosis`/`getDiagnosisByPathAttempt`.
