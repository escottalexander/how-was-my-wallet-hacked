-- Distinguish the post-incident diagnostic flow ("how was I hacked") from the
-- preventative risk check ("am I at risk"). Existing rows are diagnostic.
ALTER TABLE path_attempts ADD COLUMN mode TEXT NOT NULL DEFAULT 'diagnostic';
CREATE INDEX idx_path_attempts_mode ON path_attempts(mode);
