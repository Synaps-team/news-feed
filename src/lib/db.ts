import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import postgres from "postgres";

declare global {
  var __latestNewsDb__: Database.Database | undefined;
  var __latestNewsPg__: ReturnType<typeof postgres> | undefined;
  var __latestNewsPgReady__: Promise<void> | undefined;
}

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "latest-news.db");
export type DatabaseProvider = "sqlite" | "postgres";

export const DB_SCHEMA = `
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
`;

function ensureParentDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

export function getDatabaseProvider(): DatabaseProvider {
  if (process.env.DATABASE_PROVIDER === "postgres" || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL) {
    return "postgres";
  }

  return "sqlite";
}

export function getDatabasePath(): string {
  return process.env.DATABASE_PATH || DEFAULT_DB_PATH;
}

function getPostgresUrl(): string {
  return process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || "";
}

function initializeDb(databasePath: string): Database.Database {
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.exec(DB_SCHEMA);
  return db;
}

export function getSqliteDb(): Database.Database {
  if (!global.__latestNewsDb__) {
    const databasePath = getDatabasePath();
    ensureParentDirectory(databasePath);

    try {
      global.__latestNewsDb__ = initializeDb(databasePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (!message.includes("file is not a database")) {
        throw error;
      }

      if (fs.existsSync(databasePath)) {
        fs.unlinkSync(databasePath);
      }

      global.__latestNewsDb__ = initializeDb(databasePath);
    }
  }

  return global.__latestNewsDb__;
}

export function getPostgresDb() {
  if (!global.__latestNewsPg__) {
    const connectionString = getPostgresUrl();

    if (!connectionString) {
      throw new Error("POSTGRES_URL or SUPABASE_DB_URL is required when DATABASE_PROVIDER=postgres");
    }

    global.__latestNewsPg__ = postgres(connectionString, {
      prepare: false,
      max: 1,
    });
  }

  return global.__latestNewsPg__;
}

export async function ensureDatabaseReady(): Promise<void> {
  if (getDatabaseProvider() === "sqlite") {
    getSqliteDb();
    return;
  }

  if (!global.__latestNewsPgReady__) {
    global.__latestNewsPgReady__ = (async () => {
      const sql = getPostgresDb();
      await sql.unsafe(DB_SCHEMA);
    })();
  }

  await global.__latestNewsPgReady__;
}
