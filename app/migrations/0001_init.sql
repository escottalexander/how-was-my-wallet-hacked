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

