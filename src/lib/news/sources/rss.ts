import { XMLParser } from "fast-xml-parser";

import type { SourceAdapter } from "@/lib/news/sources/base";
import type { RawNewsItem, SourceConfig } from "@/lib/news/types";
import { stripHtml } from "@/lib/news/utils";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readEntryLink(entry: Record<string, unknown>): string {
  const directLink = entry.link;

  if (typeof directLink === "string") {
    return directLink;
  }

  if (directLink && typeof directLink === "object" && "href" in directLink) {
    return String(directLink.href);
  }

  return "";
}

function normalizeRssItems(source: SourceConfig, payload: string): RawNewsItem[] {
  const parsed = parser.parse(payload) as {
    rss?: { channel?: { item?: Record<string, unknown> | Record<string, unknown>[] } };
    feed?: { entry?: Record<string, unknown> | Record<string, unknown>[] };
  };

  const rssItems = toArray(parsed.rss?.channel?.item).map((item) => ({
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    title: String(item.title ?? "Untitled"),
    url: String(item.link ?? ""),
    author: typeof item.creator === "string" ? item.creator : typeof item.author === "string" ? item.author : null,
    publishedAt: typeof item.pubDate === "string" ? item.pubDate : typeof item.isoDate === "string" ? item.isoDate : null,
    snippet: typeof item.description === "string" ? stripHtml(item.description) : null,
    content: typeof item["content:encoded"] === "string" ? stripHtml(item["content:encoded"]) : null,
    engagementScore: null,
    metadata: {
      rawGuid: item.guid ?? null,
    },
  }));

  const atomItems = toArray(parsed.feed?.entry).map((entry) => ({
    sourceId: source.id,
    sourceName: source.name,
    sourceType: source.type,
    title: String(entry.title ?? "Untitled"),
    url: readEntryLink(entry),
    author:
      entry.author && typeof entry.author === "object" && "name" in entry.author
        ? String(entry.author.name)
        : null,
    publishedAt: typeof entry.updated === "string" ? entry.updated : typeof entry.published === "string" ? entry.published : null,
    snippet: typeof entry.summary === "string" ? stripHtml(entry.summary) : null,
    content: typeof entry.content === "string" ? stripHtml(entry.content) : null,
    engagementScore: null,
    metadata: {},
  }));

  return [...rssItems, ...atomItems].filter((item) => item.url);
}

export const rssAdapter: SourceAdapter = {
  supports(source) {
    return source.type === "rss";
  },

  async fetchItems(source) {
    if (!source.url) {
      return [];
    }

    const response = await fetch(source.url, {
      headers: {
        "user-agent": "latest-news-dashboard/0.1",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed for ${source.name}: ${response.status}`);
    }

    const xml = await response.text();
    return normalizeRssItems(source, xml);
  },
};
