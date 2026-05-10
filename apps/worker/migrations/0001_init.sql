-- Players: anonymous identity via device fingerprint hash
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

-- Matches: one row per finished match
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  p1_id TEXT NOT NULL,
  p2_id TEXT NOT NULL,
  p1_nickname TEXT NOT NULL,
  p2_nickname TEXT NOT NULL,
  p1_score INTEGER NOT NULL,
  p2_score INTEGER NOT NULL,
  winner_id TEXT,
  ended_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_ended_at ON matches(ended_at);
CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(last_seen);
