CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(16) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 999999999),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores (score DESC);
