import { enrichWithAi } from "@/lib/news/ai";
import { classifyItem } from "@/lib/news/classify";
import { markDuplicates } from "@/lib/news/dedupe";
import { calculateEngagementScore, calculateOverallScore, calculateRecencyScore, calculateSourceQuality } from "@/lib/news/rank";
import { saveJobRun, storeRawItems, upsertProcessedItems } from "@/lib/news/repository";
import { getEnabledSources } from "@/lib/news/source-config";
import { getAdapterForSource } from "@/lib/news/sources";
import { summarizeItem } from "@/lib/news/summarize";
import type { IngestionResult, RawNewsItem, ScoredNewsItem } from "@/lib/news/types";
import { createHash, normalizeUrl, safeDate, stripHtml, truncate } from "@/lib/news/utils";

async function fetchFromSources(fetchedAt: string): Promise<{
  items: RawNewsItem[];
  skippedSources: Array<{ sourceId: string; reason: string }>;
}> {
  const sources = getEnabledSources();
  const skippedSources: Array<{ sourceId: string; reason: string }> = [];
  const items: RawNewsItem[] = [];

  for (const source of sources) {
    const adapter = getAdapterForSource(source);

    if (!adapter) {
      skippedSources.push({ sourceId: source.id, reason: "No adapter configured" });
      continue;
    }

    try {
      const fetched = await adapter.fetchItems(source, { fetchedAt });
      items.push(...fetched.slice(0, 20));
    } catch (error) {
      skippedSources.push({
        sourceId: source.id,
        reason: error instanceof Error ? error.message : "Unknown fetch error",
      });
    }
  }

  return { items, skippedSources };
}

async function processItems(rawItems: RawNewsItem[], fetchedAt: string): Promise<ScoredNewsItem[]> {
  const processed: ScoredNewsItem[] = [];

  for (const item of rawItems) {
    const heuristic = classifyItem(item);
    const ai = process.env.OPENAI_API_KEY ? await enrichWithAi(item) : null;
    const categories = ai?.categories?.length ? ai.categories : heuristic.categories;
    const tags = ai?.tags?.length ? ai.tags : heuristic.tags;
    const summary = ai?.summary || summarizeItem(item);
    const recencyScore = calculateRecencyScore(item.publishedAt);
    const sourceQualityScore = calculateSourceQuality(item.sourceName);
    const engagementScore = calculateEngagementScore(item);
    const relevanceScore = heuristic.relevanceScore;
    const overallScore = calculateOverallScore({
      recencyScore,
      relevanceScore,
      sourceQualityScore,
      engagementScore,
    });
    const originalContent = stripHtml(item.content) || stripHtml(item.snippet) || item.title;
    const normalizedUrl = normalizeUrl(item.url);

    processed.push({
      id: createHash(`${normalizedUrl}:${item.sourceId}`),
      title: truncate(item.title, 180),
      summary,
      originalContent,
      snippet: truncate(stripHtml(item.snippet) || summary, 220),
      url: item.url,
      normalizedUrl,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      sourceType: item.sourceType,
      author: item.author ?? null,
      publishedAt: safeDate(item.publishedAt),
      fetchedAt,
      categories,
      tags,
      engagementScore,
      relevanceScore,
      sourceQualityScore,
      recencyScore,
      overallScore,
      duplicateGroupId: null,
      canonicalItemId: null,
      isCanonical: true,
      metadata: item.metadata ?? {},
    });
  }

  return processed;
}

export async function runIngestionJob(): Promise<IngestionResult> {
  const fetchedAt = new Date().toISOString();
  const { items, skippedSources } = await fetchFromSources(fetchedAt);
  const filteredItems = items.filter((item) => Boolean(item.title && item.url));
  const storedRawCount = await storeRawItems(filteredItems, fetchedAt);
  const processedItems = await processItems(filteredItems, fetchedAt);
  const deduped = markDuplicates(processedItems);
  const storedProcessedCount = await upsertProcessedItems(deduped.items);

  const result: IngestionResult = {
    fetchedCount: filteredItems.length,
    storedRawCount,
    storedProcessedCount,
    duplicateCount: deduped.duplicateCount,
    skippedSources,
    completedAt: fetchedAt,
  };

  await saveJobRun(result);
  return result;
}
