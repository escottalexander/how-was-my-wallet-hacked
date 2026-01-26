import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { getDb } from './db';
import type { Session, WalletType, ValueRange } from './types';

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
