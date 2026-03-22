import fs from "node:fs";
import path from "node:path";

import { ensureDatabaseReady, getDatabaseProvider, getPostgresDb, getSqliteDb } from "@/lib/db";
import type {
  DashboardData,
  DashboardNewsItem,
  DashboardSection,
  IngestionResult,
  NewsCategory,
  RawNewsItem,
  ScoredNewsItem,
} from "@/lib/news/types";
import { NEWS_CATEGORIES } from "@/lib/news/types";
import { createHash, fromJson, normalizeUrl, safeDate, toJson } from "@/lib/news/utils";

type NewsItemRow = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source_name: string;
  source_type: DashboardNewsItem["sourceType"];
  published_at: string;
  tags_json: string;
  categories_json: string;
  overall_score: number;
};

function mockDataPath(): string {
  return path.join(process.cwd(), "data", "mock-items.json");
}

function toCount(value: number | string | bigint): number {
  return Number(value);
}

export async function seedDatabaseIfEmpty() {
  if (await hasNewsItems()) {
    return;
  }

  const mockItems = JSON.parse(fs.readFileSync(mockDataPath(), "utf8")) as ScoredNewsItem[];
  await upsertProcessedItems(mockItems);
}

export async function hasNewsItems(): Promise<boolean> {
  await ensureDatabaseReady();

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    const row = db.prepare("SELECT COUNT(*) AS count FROM news_items").get() as { count: number };
    return row.count > 0;
  }

  const sql = getPostgresDb();
  const rows = await sql.unsafe("SELECT COUNT(*) AS count FROM news_items");
  return toCount(rows[0]?.count ?? 0) > 0;
}

export async function resetAndSeedDatabase() {
  await ensureDatabaseReady();

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    db.exec("DELETE FROM raw_news_items; DELETE FROM news_items; DELETE FROM job_runs;");
  } else {
    const sql = getPostgresDb();
    await sql.unsafe("TRUNCATE TABLE raw_news_items, news_items, job_runs");
  }

  await seedDatabaseIfEmpty();
}

export async function storeRawItems(items: RawNewsItem[], fetchedAt: string): Promise<number> {
  if (items.length === 0) {
    return 0;
  }

  await ensureDatabaseReady();

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    const insert = db.prepare(`
      INSERT OR IGNORE INTO raw_news_items (
        id, source_id, source_name, source_type, title, url, normalized_url,
        author, published_at, fetched_at, snippet, content, engagement_score, payload_json
      ) VALUES (
        @id, @source_id, @source_name, @source_type, @title, @url, @normalized_url,
        @author, @published_at, @fetched_at, @snippet, @content, @engagement_score, @payload_json
      )
    `);

    const transaction = db.transaction((rawItems: RawNewsItem[]) => {
      let inserted = 0;

      for (const item of rawItems) {
        const info = insert.run({
          id: createHash(`${item.sourceId}:${normalizeUrl(item.url)}`),
          source_id: item.sourceId,
          source_name: item.sourceName,
          source_type: item.sourceType,
          title: item.title,
          url: item.url,
          normalized_url: normalizeUrl(item.url),
          author: item.author ?? null,
          published_at: item.publishedAt ?? null,
          fetched_at: fetchedAt,
          snippet: item.snippet ?? null,
          content: item.content ?? null,
          engagement_score: item.engagementScore ?? 0,
          payload_json: toJson(item),
        });

        inserted += Number(info.changes);
      }

      return inserted;
    });

    return transaction(items);
  }

  const sql = getPostgresDb();
  let inserted = 0;

  for (const item of items) {
    const rows = await sql.unsafe(
      `
        INSERT INTO raw_news_items (
          id, source_id, source_name, source_type, title, url, normalized_url,
          author, published_at, fetched_at, snippet, content, engagement_score, payload_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (normalized_url, source_id) DO NOTHING
        RETURNING id
      `,
      [
        createHash(`${item.sourceId}:${normalizeUrl(item.url)}`),
        item.sourceId,
        item.sourceName,
        item.sourceType,
        item.title,
        item.url,
        normalizeUrl(item.url),
        item.author ?? null,
        item.publishedAt ?? null,
        fetchedAt,
        item.snippet ?? null,
        item.content ?? null,
        item.engagementScore ?? 0,
        toJson(item),
      ],
    );

    inserted += rows.length;
  }

  return inserted;
}

export async function upsertProcessedItems(items: ScoredNewsItem[]): Promise<number> {
  if (items.length === 0) {
    return 0;
  }

  await ensureDatabaseReady();

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    const statement = db.prepare(`
      INSERT INTO news_items (
        id, title, summary, original_content, snippet, url, normalized_url, source_id,
        source_name, source_type, author, published_at, fetched_at, categories_json,
        tags_json, engagement_score, relevance_score, source_quality_score,
        recency_score, overall_score, duplicate_group_id, canonical_item_id, is_canonical,
        metadata_json, updated_at
      ) VALUES (
        @id, @title, @summary, @original_content, @snippet, @url, @normalized_url, @source_id,
        @source_name, @source_type, @author, @published_at, @fetched_at, @categories_json,
        @tags_json, @engagement_score, @relevance_score, @source_quality_score,
        @recency_score, @overall_score, @duplicate_group_id, @canonical_item_id, @is_canonical,
        @metadata_json, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        summary = excluded.summary,
        original_content = excluded.original_content,
        snippet = excluded.snippet,
        url = excluded.url,
        normalized_url = excluded.normalized_url,
        source_id = excluded.source_id,
        source_name = excluded.source_name,
        source_type = excluded.source_type,
        author = excluded.author,
        published_at = excluded.published_at,
        fetched_at = excluded.fetched_at,
        categories_json = excluded.categories_json,
        tags_json = excluded.tags_json,
        engagement_score = excluded.engagement_score,
        relevance_score = excluded.relevance_score,
        source_quality_score = excluded.source_quality_score,
        recency_score = excluded.recency_score,
        overall_score = excluded.overall_score,
        duplicate_group_id = excluded.duplicate_group_id,
        canonical_item_id = excluded.canonical_item_id,
        is_canonical = excluded.is_canonical,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
    `);

    const transaction = db.transaction((processedItems: ScoredNewsItem[]) => {
      let count = 0;

      for (const item of processedItems) {
        statement.run({
          id: item.id,
          title: item.title,
          summary: item.summary,
          original_content: item.originalContent,
          snippet: item.snippet,
          url: item.url,
          normalized_url: item.normalizedUrl,
          source_id: item.sourceId,
          source_name: item.sourceName,
          source_type: item.sourceType,
          author: item.author ?? null,
          published_at: safeDate(item.publishedAt),
          fetched_at: safeDate(item.fetchedAt),
          categories_json: toJson(item.categories),
          tags_json: toJson(item.tags),
          engagement_score: item.engagementScore,
          relevance_score: item.relevanceScore,
          source_quality_score: item.sourceQualityScore,
          recency_score: item.recencyScore,
          overall_score: item.overallScore,
          duplicate_group_id: item.duplicateGroupId,
          canonical_item_id: item.canonicalItemId,
          is_canonical: item.isCanonical ? 1 : 0,
          metadata_json: toJson(item.metadata),
          updated_at: new Date().toISOString(),
        });
        count += 1;
      }

      return count;
    });

    return transaction(items);
  }

  const sql = getPostgresDb();
  let count = 0;

  for (const item of items) {
    const rows = await sql.unsafe(
      `
        INSERT INTO news_items (
          id, title, summary, original_content, snippet, url, normalized_url, source_id,
          source_name, source_type, author, published_at, fetched_at, categories_json,
          tags_json, engagement_score, relevance_score, source_quality_score,
          recency_score, overall_score, duplicate_group_id, canonical_item_id, is_canonical,
          metadata_json, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23,
          $24, $25
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          original_content = EXCLUDED.original_content,
          snippet = EXCLUDED.snippet,
          url = EXCLUDED.url,
          normalized_url = EXCLUDED.normalized_url,
          source_id = EXCLUDED.source_id,
          source_name = EXCLUDED.source_name,
          source_type = EXCLUDED.source_type,
          author = EXCLUDED.author,
          published_at = EXCLUDED.published_at,
          fetched_at = EXCLUDED.fetched_at,
          categories_json = EXCLUDED.categories_json,
          tags_json = EXCLUDED.tags_json,
          engagement_score = EXCLUDED.engagement_score,
          relevance_score = EXCLUDED.relevance_score,
          source_quality_score = EXCLUDED.source_quality_score,
          recency_score = EXCLUDED.recency_score,
          overall_score = EXCLUDED.overall_score,
          duplicate_group_id = EXCLUDED.duplicate_group_id,
          canonical_item_id = EXCLUDED.canonical_item_id,
          is_canonical = EXCLUDED.is_canonical,
          metadata_json = EXCLUDED.metadata_json,
          updated_at = EXCLUDED.updated_at
        RETURNING id
      `,
      [
        item.id,
        item.title,
        item.summary,
        item.originalContent,
        item.snippet,
        item.url,
        item.normalizedUrl,
        item.sourceId,
        item.sourceName,
        item.sourceType,
        item.author ?? null,
        safeDate(item.publishedAt),
        safeDate(item.fetchedAt),
        toJson(item.categories),
        toJson(item.tags),
        item.engagementScore,
        item.relevanceScore,
        item.sourceQualityScore,
        item.recencyScore,
        item.overallScore,
        item.duplicateGroupId,
        item.canonicalItemId,
        item.isCanonical ? 1 : 0,
        toJson(item.metadata),
        new Date().toISOString(),
      ],
    );

    count += rows.length;
  }

  return count;
}

export async function saveJobRun(result: IngestionResult) {
  await ensureDatabaseReady();

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    db.prepare(`
      INSERT INTO job_runs (id, status, summary_json, started_at, completed_at)
      VALUES (@id, @status, @summary_json, @started_at, @completed_at)
    `).run({
      id: createHash(`${result.completedAt}:${result.storedProcessedCount}`),
      status: "success",
      summary_json: toJson(result),
      started_at: result.completedAt,
      completed_at: result.completedAt,
    });
    return;
  }

  const sql = getPostgresDb();
  await sql.unsafe(
    `
      INSERT INTO job_runs (id, status, summary_json, started_at, completed_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        summary_json = EXCLUDED.summary_json,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at
    `,
    [
      createHash(`${result.completedAt}:${result.storedProcessedCount}`),
      "success",
      toJson(result),
      result.completedAt,
      result.completedAt,
    ],
  );
}

async function getDashboardRows(category: NewsCategory): Promise<DashboardNewsItem[]> {
  await ensureDatabaseReady();

  let rows: NewsItemRow[] = [];

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    rows = db
      .prepare(
        `
        SELECT
          id, title, summary, url, source_name, source_type,
          published_at, tags_json, categories_json, overall_score
        FROM news_items
        WHERE is_canonical = 1
        ORDER BY published_at DESC, overall_score DESC
        LIMIT 60
      `,
      )
      .all() as NewsItemRow[];
  } else {
    const sql = getPostgresDb();
    const result = await sql.unsafe(`
      SELECT
        id, title, summary, url, source_name, source_type,
        published_at, tags_json, categories_json, overall_score
      FROM news_items
      WHERE is_canonical = 1
      ORDER BY published_at DESC, overall_score DESC
      LIMIT 60
    `);
    rows = result as unknown as NewsItemRow[];
  }

  return rows
    .map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      url: row.url,
      sourceName: row.source_name,
      sourceType: row.source_type,
      publishedAt: row.published_at,
      tags: fromJson<string[]>(row.tags_json, []),
      categories: fromJson<NewsCategory[]>(row.categories_json, []),
      overallScore: row.overall_score,
    }))
    .filter((row) => row.categories.includes(category))
    .slice(0, 12);
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureDatabaseReady();

  const sections: DashboardSection[] = await Promise.all(
    NEWS_CATEGORIES.map(async (category) => ({
      category,
      items: await getDashboardRows(category),
    })),
  );

  let totalItems = 0;
  let sourceCount = 0;
  let lastUpdated: string | null = null;

  if (getDatabaseProvider() === "sqlite") {
    const db = getSqliteDb();
    const countRow = db.prepare("SELECT COUNT(*) AS count FROM news_items WHERE is_canonical = 1").get() as {
      count: number;
    };
    const sourceRow = db.prepare("SELECT COUNT(DISTINCT source_id) AS count FROM news_items").get() as {
      count: number;
    };
    const updatedRow = db
      .prepare("SELECT MAX(fetched_at) AS fetched_at FROM news_items")
      .get() as { fetched_at: string | null };

    totalItems = countRow.count;
    sourceCount = sourceRow.count;
    lastUpdated = updatedRow.fetched_at;
  } else {
    const sql = getPostgresDb();
    const countRows = await sql.unsafe("SELECT COUNT(*) AS count FROM news_items WHERE is_canonical = 1");
    const sourceRows = await sql.unsafe("SELECT COUNT(DISTINCT source_id) AS count FROM news_items");
    const updatedRows = await sql.unsafe("SELECT MAX(fetched_at) AS fetched_at FROM news_items");

    totalItems = toCount(countRows[0]?.count ?? 0);
    sourceCount = toCount(sourceRows[0]?.count ?? 0);
    lastUpdated = (updatedRows[0]?.fetched_at as string | null | undefined) ?? null;
  }

  return {
    sections,
    totalItems,
    sourceCount,
    lastUpdated,
  };
}
