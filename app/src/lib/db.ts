import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database file location - stored in app directory for development
const DB_PATH = path.join(process.cwd(), 'data', 'howwasihacked.db');

// Singleton database connection
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Better concurrent access
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  // Session table - stores anonymous user sessions
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      wallet_type TEXT,
      wallet_specific TEXT,
      value_range TEXT
    )
  `);

  // Index for finding repeat visitors
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_hash ON sessions(user_hash)
  `);

  // PathAttempt table - tracks each diagnostic attempt within a session
  database.exec(`
    CREATE TABLE IF NOT EXISTS path_attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  // Index for finding attempts by session
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_path_attempts_session ON path_attempts(session_id)
  `);

  // PathStep table - tracks each question/answer in a path attempt
  database.exec(`
    CREATE TABLE IF NOT EXISTS path_steps (
      id TEXT PRIMARY KEY,
      path_attempt_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      answer_selected TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (path_attempt_id) REFERENCES path_attempts(id)
    )
  `);

  // Index for finding steps by path attempt
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_path_steps_attempt ON path_steps(path_attempt_id)
  `);

  // Diagnosis table - stores the final diagnosis for each path attempt
  database.exec(`
    CREATE TABLE IF NOT EXISTS diagnoses (
      id TEXT PRIMARY KEY,
      path_attempt_id TEXT NOT NULL,
      diagnosis_type TEXT NOT NULL,
      accepted INTEGER NOT NULL DEFAULT 0,
      clicked_learn INTEGER NOT NULL DEFAULT 0,
      clicked_hwr INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (path_attempt_id) REFERENCES path_attempts(id)
    )
  `);

  // Index for analytics queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_diagnoses_type ON diagnoses(diagnosis_type)
  `);
}

// Close database connection (for cleanup)
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
