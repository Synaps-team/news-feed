import type { SourceAdapter } from "@/lib/news/sources/base";
import { newsApiAdapter } from "@/lib/news/sources/news-api";
import { rssAdapter } from "@/lib/news/sources/rss";
import { xAdapter } from "@/lib/news/sources/x";
import type { SourceConfig } from "@/lib/news/types";

const adapters: SourceAdapter[] = [rssAdapter, newsApiAdapter, xAdapter];

export function getAdapterForSource(source: SourceConfig): SourceAdapter | null {
  return adapters.find((adapter) => adapter.supports(source)) ?? null;
}
