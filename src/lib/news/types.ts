export const NEWS_CATEGORIES = [
  "AI",
  "Digital Architecture Tools",
  "AI in Architecture",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type SourceType =
  | "rss"
  | "website"
  | "news_api"
  | "x"
  | "mock";

export type SourceConfig = {
  id: string;
  name: string;
  type: SourceType;
  url?: string;
  enabled: boolean;
  trustWeight?: number;
  categories?: NewsCategory[];
  description?: string;
  options?: Record<string, string | number | boolean | string[]>;
};

export type RawNewsItem = {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  title: string;
  url: string;
  author?: string | null;
  publishedAt?: string | null;
  snippet?: string | null;
  content?: string | null;
  engagementScore?: number | null;
  metadata?: Record<string, unknown>;
};

export type ScoredNewsItem = {
  id: string;
  title: string;
  summary: string;
  originalContent: string;
  snippet: string;
  url: string;
  normalizedUrl: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  author?: string | null;
  publishedAt: string;
  fetchedAt: string;
  categories: NewsCategory[];
  tags: string[];
  engagementScore: number;
  relevanceScore: number;
  sourceQualityScore: number;
  recencyScore: number;
  overallScore: number;
  duplicateGroupId: string | null;
  canonicalItemId: string | null;
  isCanonical: boolean;
  metadata: Record<string, unknown>;
};

export type DashboardNewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  sourceName: string;
  sourceType: SourceType;
  publishedAt: string;
  tags: string[];
  categories: NewsCategory[];
  overallScore: number;
};

export type DashboardSection = {
  category: NewsCategory;
  items: DashboardNewsItem[];
};

export type DashboardData = {
  sections: DashboardSection[];
  totalItems: number;
  sourceCount: number;
  lastUpdated: string | null;
};

export type IngestionResult = {
  fetchedCount: number;
  storedRawCount: number;
  storedProcessedCount: number;
  duplicateCount: number;
  skippedSources: Array<{ sourceId: string; reason: string }>;
  completedAt: string;
};
