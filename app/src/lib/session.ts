import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { getDb } from './db';
import type { Session, PathAttempt, PathStep, WalletType, ValueRange } from './types';

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
