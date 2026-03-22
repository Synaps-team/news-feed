# Latest News Dashboard

A minimal Next.js MVP that aggregates and displays the latest news about:

- AI
- Digital architecture tools
- AI in architecture

The app ingests multiple source types, normalizes them into one format, classifies and ranks them, removes duplicates, stores them in a database, and renders a simple dashboard UI.

## Stack

- Frontend: Next.js App Router
- Backend: Next.js route handlers
- Database: SQLite locally, Supabase/Postgres on Vercel
- Scheduling: local cron or Vercel cron
- Optional AI enrichment: OpenAI

## Features

- Modular source adapters for RSS, news APIs, and X
- Keyword prefiltering plus optional AI enrichment
- Deduplication and canonical item tracking
- Ranking based on recency, relevance, source quality, and engagement
- Real RSS ingestion by default, with optional seed data for offline testing
- Refresh button and cron-ready ingestion endpoint

## Project Structure

```text
src/
  app/
    api/
      cron/ingest/route.ts
      news/route.ts
      refresh/route.ts
    layout.tsx
    page.tsx
  components/
    news-card.tsx
    news-dashboard.tsx
    refresh-button.tsx
  lib/
    db.ts
    news/
      ai.ts
      classify.ts
      dedupe.ts
      ingest.ts
      rank.ts
      repository.ts
      source-config.ts
      summarize.ts
      types.ts
      utils.ts
      sources/
        base.ts
        news-api.ts
        rss.ts
        x.ts
data/
  mock-items.json
  sources.json
scripts/
  ingest.ts
  seed.ts
sql/
  schema.sql
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
cp .env.example .env.local
```

3. Start development:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

On first load, the app will attempt a live ingest from the enabled RSS sources automatically.

## Local Development Workflow

- `npm run seed`: reset the SQLite DB and load sample items
- `npm run ingest`: fetch configured live sources and persist results
- `npm run dev`: run the app locally
- Use the `Refresh` button in the UI to trigger a new ingest job

By default the app writes to `data/latest-news.db`. If the database is empty, the app tries a live ingest from the enabled sources. Use `npm run seed` only if you want mock data for offline UI testing.

## Database Modes

The app supports two database providers:

- `sqlite`: default for local development
- `postgres`: recommended for Vercel and Supabase

### Local development

Use:

```env
DATABASE_PROVIDER=sqlite
DATABASE_PATH=./data/latest-news.db
```

### Vercel + Supabase

Use:

```env
DATABASE_PROVIDER=postgres
POSTGRES_URL=postgresql://...
```

You can get the `POSTGRES_URL` value from your Supabase project connection settings. Use the pooled connection string for Vercel.

## Environment Variables

See `.env.example`.

- `DATABASE_PATH`: SQLite database file path
- `DATABASE_PROVIDER`: `sqlite` or `postgres`
- `POSTGRES_URL`: Supabase/Postgres connection string for production
- `OPENAI_API_KEY`: optional summary/classification enrichment
- `OPENAI_MODEL`: optional AI model override
- `NEWS_API_KEY`: optional News API adapter
- `X_BEARER_TOKEN`: optional X official API adapter
- `CRON_SECRET`: optional shared secret for `/api/cron/ingest`

## Source Configuration

Starter sources live in `data/sources.json`.

- Enabled by default: RSS feeds for AI and architecture/tooling sources
- Disabled by default: News API and X until credentials are added

Each source entry supports:

- `id`
- `name`
- `type`
- `url`
- `enabled`
- `trustWeight`
- `categories`
- `options`

## Ingestion Flow

1. Load enabled sources from `data/sources.json`
2. Fetch fresh items from each adapter
3. Normalize to a common raw item shape
4. Store raw items in `raw_news_items`
5. Classify and tag each item
6. Generate a short summary
7. Score each item
8. Detect duplicates and mark a canonical record
9. Save processed items to `news_items`
10. Return the best and latest canonical items to the dashboard

## Ranking Logic

The ranking formula is:

```text
overall = recency * 0.40 + relevance * 0.35 + source_quality * 0.15 + engagement * 0.10
```

## Scheduling

### Local cron

Run once a day at 6pm CET:

```bash
0 17 * * * cd /absolute/path/to/Latest_news && npm run ingest
```

### Vercel cron

`vercel.json` includes a sample schedule for once a day at `17:00 UTC`, which is `18:00 CET`, hitting:

```text
/api/cron/ingest
```

If `CRON_SECRET` is set, send it as:

```text
Authorization: Bearer <secret>
```

## Deploy To Vercel

1. Push the project to GitHub.
2. In Supabase, open the SQL editor and run `sql/schema.sql`.
3. In Vercel, import the GitHub repo as a new project.
4. Add these environment variables in Vercel:

- `DATABASE_PROVIDER=postgres`
- `POSTGRES_URL=<your supabase pooled connection string>`
- `OPENAI_API_KEY`
- `NEWS_API_KEY`
- `X_BEARER_TOKEN`
- `CRON_SECRET`
- optionally `OPENAI_MODEL`

5. Deploy.

After deployment:

- the app will use Supabase/Postgres instead of the local SQLite file
- `/api/cron/ingest` will be called automatically by Vercel cron
- the `Refresh` button will trigger a live ingest against the production database

## Notes

- The X adapter expects official API access and will stay inactive without a bearer token.
- The AI layer is optional. Without an API key the app falls back to deterministic keyword classification and extractive summaries.
- With the default config, real data comes from public RSS sources. News API and X require credentials only if you choose to enable them.

## Next Extensions

- Add per-source health tracking and retry behavior
- Add source management UI
- Add embeddings-based semantic dedupe and clustering
