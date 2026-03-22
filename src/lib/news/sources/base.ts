import type { RawNewsItem, SourceConfig } from "@/lib/news/types";

export type SourceFetchContext = {
  fetchedAt: string;
};

export interface SourceAdapter {
  supports(source: SourceConfig): boolean;
  fetchItems(source: SourceConfig, context: SourceFetchContext): Promise<RawNewsItem[]>;
}
