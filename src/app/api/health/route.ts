import { closeDatabaseConnections, ensureDatabaseReady, getDatabaseProvider, getPostgresDb, getSqliteDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const provider = getDatabaseProvider();

  try {
    const dbReadyStartedAt = Date.now();
    await ensureDatabaseReady();
    const dbReadyElapsedMs = Date.now() - dbReadyStartedAt;

    let counts = {
      newsItems: 0,
      rawNewsItems: 0,
      jobRuns: 0,
    };

    const countStartedAt = Date.now();

    if (provider === "sqlite") {
      const db = getSqliteDb();
      counts = {
        newsItems: (db.prepare("SELECT COUNT(*) AS count FROM news_items").get() as { count: number }).count,
        rawNewsItems: (db.prepare("SELECT COUNT(*) AS count FROM raw_news_items").get() as { count: number }).count,
        jobRuns: (db.prepare("SELECT COUNT(*) AS count FROM job_runs").get() as { count: number }).count,
      };
    } else {
      const sql = getPostgresDb();
      const [stats] = await sql.unsafe(`
        SELECT
          (SELECT COUNT(*) FROM news_items) AS news_items,
          (SELECT COUNT(*) FROM raw_news_items) AS raw_news_items,
          (SELECT COUNT(*) FROM job_runs) AS job_runs
      `);

      counts = {
        newsItems: Number(stats?.news_items ?? 0),
        rawNewsItems: Number(stats?.raw_news_items ?? 0),
        jobRuns: Number(stats?.job_runs ?? 0),
      };
    }

    const countElapsedMs = Date.now() - countStartedAt;

    return Response.json({
      ok: true,
      provider,
      env: {
        databaseProvider: process.env.DATABASE_PROVIDER ?? null,
        hasPostgresUrl: Boolean(process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL),
        enableServerIngest: process.env.ENABLE_SERVER_INGEST ?? null,
      },
      timings: {
        dbReadyElapsedMs,
        countElapsedMs,
        totalElapsedMs: Date.now() - startedAt,
      },
      counts,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        provider,
        error: error instanceof Error ? error.message : "Unknown error",
        totalElapsedMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  } finally {
    await closeDatabaseConnections();
  }
}
