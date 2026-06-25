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
