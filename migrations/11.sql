
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  is_active BOOLEAN DEFAULT 1,
  last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, last_activity_at);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
