CREATE TABLE IF NOT EXISTS raw_news_items (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  author TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  snippet TEXT,
  content TEXT,
  engagement_score REAL DEFAULT 0,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_news_items_unique_url
  ON raw_news_items (normalized_url, source_id);

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  original_content TEXT,
  snippet TEXT,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  author TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  categories_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  engagement_score REAL DEFAULT 0,
  relevance_score REAL DEFAULT 0,
  source_quality_score REAL DEFAULT 0,
  recency_score REAL DEFAULT 0,
  overall_score REAL DEFAULT 0,
  duplicate_group_id TEXT,
  canonical_item_id TEXT,
  is_canonical INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_items_category_score
  ON news_items (published_at DESC, overall_score DESC);

CREATE TABLE IF NOT EXISTS job_runs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL
);
