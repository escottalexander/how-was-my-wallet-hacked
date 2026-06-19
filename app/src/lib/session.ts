import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { getDb } from './db';
import type { Session, PathAttempt, PathStep, Diagnosis, WalletType, ValueRange, ClusterStat } from './types';

// Create a hash from IP and User Agent for identifying repeat visitors
// This is NOT PII - it cannot be reversed to identify the user
export function createUserHash(ip: string, userAgent: string): string {
  const data = `${ip}:${userAgent}`;
  return createHash('sha256').update(data).digest('hex');
}

// Create a new session
export function createSession(userHash: string): Session {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_hash, created_at)
    VALUES (?, ?, ?)
  `);

  stmt.run(id, userHash, now);

  return {
    id,
    user_hash: userHash,
    created_at: now,
    wallet_type: null,
    wallet_specific: null,
    value_range: null,
  };
}

// Get session by ID
export function getSession(id: string): Session | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const row = stmt.get(id) as Session | undefined;
  return row ?? null;
}

// Update session wallet info
export function updateSessionWallet(
  id: string,
  walletType: WalletType,
  walletSpecific: string | null
): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE sessions
    SET wallet_type = ?, wallet_specific = ?
    WHERE id = ?
  `);
  stmt.run(walletType, walletSpecific, id);
}

// Update session value range
export function updateSessionValueRange(id: string, valueRange: ValueRange): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE sessions
    SET value_range = ?
    WHERE id = ?
  `);
  stmt.run(valueRange, id);
}

// Get sessions by user hash (for repeat visitor analysis)
export function getSessionsByUserHash(userHash: string): Session[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE user_hash = ? ORDER BY created_at DESC');
  return stmt.all(userHash) as Session[];
}

// Create a new path attempt for a session
export function createPathAttempt(sessionId: string): PathAttempt {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Get the next attempt number for this session
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM path_attempts WHERE session_id = ?');
  const countResult = countStmt.get(sessionId) as { count: number };
  const attemptNumber = countResult.count + 1;

  const stmt = db.prepare(`
    INSERT INTO path_attempts (id, session_id, attempt_number, created_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, sessionId, attemptNumber, now);

  return {
    id,
    session_id: sessionId,
    attempt_number: attemptNumber,
    created_at: now,
    completed_at: null,
  };
}

// Get the latest path attempt for a session
export function getLatestPathAttempt(sessionId: string): PathAttempt | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM path_attempts
    WHERE session_id = ?
    ORDER BY attempt_number DESC
    LIMIT 1
  `);
  const row = stmt.get(sessionId) as PathAttempt | undefined;
  return row ?? null;
}

// Get path attempt by ID
export function getPathAttempt(id: string): PathAttempt | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM path_attempts WHERE id = ?');
  const row = stmt.get(id) as PathAttempt | undefined;
  return row ?? null;
}

// Create a new path step for a path attempt
export function createPathStep(
  pathAttemptId: string,
  questionId: string,
  answerSelected: string
): PathStep {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Get the next step order for this path attempt
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM path_steps WHERE path_attempt_id = ?');
  const countResult = countStmt.get(pathAttemptId) as { count: number };
  const stepOrder = countResult.count + 1;

  const stmt = db.prepare(`
    INSERT INTO path_steps (id, path_attempt_id, step_order, question_id, answer_selected, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, pathAttemptId, stepOrder, questionId, answerSelected, now);

  return {
    id,
    path_attempt_id: pathAttemptId,
    step_order: stepOrder,
    question_id: questionId,
    answer_selected: answerSelected,
    created_at: now,
  };
}

// Get all steps for a path attempt in order
export function getPathSteps(pathAttemptId: string): PathStep[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM path_steps
    WHERE path_attempt_id = ?
    ORDER BY step_order ASC
  `);
  return stmt.all(pathAttemptId) as PathStep[];
}

// Create a new diagnosis for a path attempt
export function createDiagnosis(
  pathAttemptId: string,
  diagnosisType: string
): Diagnosis {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO diagnoses (id, path_attempt_id, diagnosis_type, accepted, clicked_learn, clicked_hwr, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, pathAttemptId, diagnosisType, 0, 0, 0, now);

  return {
    id,
    path_attempt_id: pathAttemptId,
    diagnosis_type: diagnosisType,
    accepted: false,
    clicked_learn: false,
    clicked_hwr: false,
    created_at: now,
  };
}

// Get diagnosis by ID
export function getDiagnosis(id: string): Diagnosis | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM diagnoses WHERE id = ?');
  const row = stmt.get(id) as
    | { id: string; path_attempt_id: string; diagnosis_type: string; accepted: number; clicked_learn: number; clicked_hwr: number; created_at: string }
    | undefined;
  if (!row) return null;
  return {
    ...row,
    accepted: Boolean(row.accepted),
    clicked_learn: Boolean(row.clicked_learn),
    clicked_hwr: Boolean(row.clicked_hwr),
  };
}

// Get diagnosis by path attempt ID
export function getDiagnosisByPathAttempt(pathAttemptId: string): Diagnosis | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM diagnoses WHERE path_attempt_id = ? ORDER BY created_at DESC LIMIT 1');
  const row = stmt.get(pathAttemptId) as
    | { id: string; path_attempt_id: string; diagnosis_type: string; accepted: number; clicked_learn: number; clicked_hwr: number; created_at: string }
    | undefined;
  if (!row) return null;
  return {
    ...row,
    accepted: Boolean(row.accepted),
    clicked_learn: Boolean(row.clicked_learn),
    clicked_hwr: Boolean(row.clicked_hwr),
  };
}

// Update diagnosis accepted status
export function updateDiagnosisAccepted(id: string, accepted: boolean): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE diagnoses
    SET accepted = ?
    WHERE id = ?
  `);
  stmt.run(accepted ? 1 : 0, id);
}

// Update diagnosis clicked_learn status
export function updateDiagnosisClickedLearn(id: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE diagnoses
    SET clicked_learn = 1
    WHERE id = ?
  `);
  stmt.run(id);
}

// Update diagnosis clicked_hwr status
export function updateDiagnosisClickedHwr(id: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE diagnoses
    SET clicked_hwr = 1
    WHERE id = ?
  `);
  stmt.run(id);
}

// Get all rejected diagnoses for a session
export function getRejectedDiagnosesForSession(sessionId: string): string[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT DISTINCT d.diagnosis_type
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    WHERE pa.session_id = ? AND d.accepted = 0
  `);
  const rows = stmt.all(sessionId) as { diagnosis_type: string }[];
  return rows.map((row) => row.diagnosis_type);
}

// Get all path attempts for a session
export function getPathAttemptsForSession(sessionId: string): PathAttempt[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM path_attempts
    WHERE session_id = ?
    ORDER BY attempt_number ASC
  `);
  return stmt.all(sessionId) as PathAttempt[];
}

// ==========================================
// ANALYTICS QUERY FUNCTIONS
// ==========================================

export interface DiagnosisByWalletType {
  wallet_type: string;
  diagnosis_type: string;
  count: number;
}

export interface DiagnosisByValueRange {
  value_range: string;
  diagnosis_type: string;
  count: number;
}

export interface PathAttemptStats {
  avg_attempts_before_accept: number;
  total_sessions_with_diagnosis: number;
  sessions_accepted_first_try: number;
  sessions_with_multiple_attempts: number;
}

export interface DropOffPoint {
  question_id: string;
  drop_off_count: number;
  total_reached: number;
  drop_off_rate: number;
}

export interface EngagementStats {
  total_diagnoses: number;
  clicked_learn_count: number;
  clicked_hwr_count: number;
  learn_click_rate: number;
  hwr_click_rate: number;
}

export interface DiagnosisTrend {
  date: string;
  diagnosis_type: string;
  count: number;
}

export interface RepeatVisitorStats {
  total_unique_visitors: number;
  repeat_visitors: number;
  repeat_rate: number;
}

// Get most common diagnosis by wallet type
export function getDiagnosisByWalletType(): DiagnosisByWalletType[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.wallet_type,
      d.diagnosis_type,
      COUNT(*) as count
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    JOIN sessions s ON pa.session_id = s.id
    WHERE s.wallet_type IS NOT NULL
      AND d.accepted = 1
    GROUP BY s.wallet_type, d.diagnosis_type
    ORDER BY s.wallet_type, count DESC
  `);
  return stmt.all() as DiagnosisByWalletType[];
}

// Get most common diagnosis by value range
export function getDiagnosisByValueRange(): DiagnosisByValueRange[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.value_range,
      d.diagnosis_type,
      COUNT(*) as count
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    JOIN sessions s ON pa.session_id = s.id
    WHERE s.value_range IS NOT NULL
      AND d.accepted = 1
    GROUP BY s.value_range, d.diagnosis_type
    ORDER BY s.value_range, count DESC
  `);
  return stmt.all() as DiagnosisByValueRange[];
}

// Get average number of path attempts before accepting diagnosis
export function getPathAttemptStats(): PathAttemptStats {
  const db = getDb();

  // Get sessions where a diagnosis was accepted
  const avgStmt = db.prepare(`
    SELECT
      AVG(pa.attempt_number) as avg_attempts,
      COUNT(DISTINCT pa.session_id) as total_sessions
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    WHERE d.accepted = 1
  `);
  const avgResult = avgStmt.get() as { avg_attempts: number | null; total_sessions: number };

  // Get sessions that accepted on first try
  const firstTryStmt = db.prepare(`
    SELECT COUNT(DISTINCT pa.session_id) as count
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    WHERE d.accepted = 1 AND pa.attempt_number = 1
  `);
  const firstTryResult = firstTryStmt.get() as { count: number };

  // Get sessions with multiple attempts
  const multipleStmt = db.prepare(`
    SELECT COUNT(DISTINCT pa.session_id) as count
    FROM diagnoses d
    JOIN path_attempts pa ON d.path_attempt_id = pa.id
    WHERE d.accepted = 1 AND pa.attempt_number > 1
  `);
  const multipleResult = multipleStmt.get() as { count: number };

  return {
    avg_attempts_before_accept: avgResult.avg_attempts ?? 0,
    total_sessions_with_diagnosis: avgResult.total_sessions,
    sessions_accepted_first_try: firstTryResult.count,
    sessions_with_multiple_attempts: multipleResult.count,
  };
}

// Get drop-off points in the flow
export function getDropOffPoints(): DropOffPoint[] {
  const db = getDb();

  // Get counts for each question reached
  const reachedStmt = db.prepare(`
    SELECT
      question_id,
      COUNT(*) as total_reached
    FROM path_steps
    GROUP BY question_id
  `);
  const reached = reachedStmt.all() as { question_id: string; total_reached: number }[];

  // Get counts for sessions that completed a diagnosis after each question
  const completedStmt = db.prepare(`
    SELECT
      ps.question_id,
      COUNT(DISTINCT pa.session_id) as completed
    FROM path_steps ps
    JOIN path_attempts pa ON ps.path_attempt_id = pa.id
    JOIN diagnoses d ON d.path_attempt_id = pa.id
    GROUP BY ps.question_id
  `);
  const completed = completedStmt.all() as { question_id: string; completed: number }[];

  const completedMap = new Map(completed.map(c => [c.question_id, c.completed]));

  return reached.map(r => {
    const completedCount = completedMap.get(r.question_id) ?? 0;
    const dropOffCount = r.total_reached - completedCount;
    return {
      question_id: r.question_id,
      drop_off_count: dropOffCount,
      total_reached: r.total_reached,
      drop_off_rate: r.total_reached > 0 ? dropOffCount / r.total_reached : 0,
    };
  }).sort((a, b) => b.drop_off_rate - a.drop_off_rate);
}

// Get Learn section and HWR engagement stats
export function getEngagementStats(): EngagementStats {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_diagnoses,
      SUM(clicked_learn) as clicked_learn_count,
      SUM(clicked_hwr) as clicked_hwr_count
    FROM diagnoses
  `);
  const result = stmt.get() as {
    total_diagnoses: number;
    clicked_learn_count: number;
    clicked_hwr_count: number;
  };

  return {
    total_diagnoses: result.total_diagnoses,
    clicked_learn_count: result.clicked_learn_count ?? 0,
    clicked_hwr_count: result.clicked_hwr_count ?? 0,
    learn_click_rate: result.total_diagnoses > 0
      ? (result.clicked_learn_count ?? 0) / result.total_diagnoses
      : 0,
    hwr_click_rate: result.total_diagnoses > 0
      ? (result.clicked_hwr_count ?? 0) / result.total_diagnoses
      : 0,
  };
}

// Get diagnosis trends over time (grouped by day)
export function getDiagnosisTrends(days: number = 30): DiagnosisTrend[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      date(created_at) as date,
      diagnosis_type,
      COUNT(*) as count
    FROM diagnoses
    WHERE created_at >= date('now', '-' || ? || ' days')
    GROUP BY date(created_at), diagnosis_type
    ORDER BY date ASC, count DESC
  `);
  return stmt.all(days) as DiagnosisTrend[];
}

// Get repeat visitor statistics
export function getRepeatVisitorStats(): RepeatVisitorStats {
  const db = getDb();

  // Total unique visitors (by user_hash)
  const totalStmt = db.prepare(`
    SELECT COUNT(DISTINCT user_hash) as count FROM sessions
  `);
  const totalResult = totalStmt.get() as { count: number };

  // Users with multiple sessions
  const repeatStmt = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT user_hash FROM sessions GROUP BY user_hash HAVING COUNT(*) > 1
    )
  `);
  const repeatResult = repeatStmt.get() as { count: number };

  return {
    total_unique_visitors: totalResult.count,
    repeat_visitors: repeatResult.count,
    repeat_rate: totalResult.count > 0 ? repeatResult.count / totalResult.count : 0,
  };
}

// Get full path for a path attempt in order
export function getFullPath(pathAttemptId: string): PathStep[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM path_steps
    WHERE path_attempt_id = ?
    ORDER BY step_order ASC
  `);
  return stmt.all(pathAttemptId) as PathStep[];
}

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

// Get all paths for a session with their diagnoses
export function getSessionPaths(sessionId: string): {
  pathAttempt: PathAttempt;
  steps: PathStep[];
  diagnosis: Diagnosis | null;
}[] {
  const pathAttempts = getPathAttemptsForSession(sessionId);

  return pathAttempts.map(pa => ({
    pathAttempt: pa,
    steps: getFullPath(pa.id),
    diagnosis: getDiagnosisByPathAttempt(pa.id),
  }));
}
