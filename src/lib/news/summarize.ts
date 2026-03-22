import type { RawNewsItem } from "@/lib/news/types";
import { stripHtml, truncate } from "@/lib/news/utils";

export function summarizeItem(item: RawNewsItem): string {
  const cleanSnippet = stripHtml(item.snippet);
  const cleanContent = stripHtml(item.content);
  const base = cleanSnippet || cleanContent;

  if (!base) {
    return truncate(item.title, 140);
  }

  const sentences = base
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const summary = sentences.slice(0, 2).join(" ");
  return truncate(summary || base, 180);
}
