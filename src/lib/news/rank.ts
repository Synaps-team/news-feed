import { SOURCE_QUALITY_WEIGHTS } from "@/lib/news/constants";
import type { RawNewsItem } from "@/lib/news/types";

export function calculateRecencyScore(publishedAt?: string | null): number {
  const published = publishedAt ? new Date(publishedAt) : new Date();
  const ageHours = Math.max(0, (Date.now() - published.getTime()) / (1000 * 60 * 60));

  if (ageHours <= 6) {
    return 1;
  }

  if (ageHours <= 24) {
    return 0.85;
  }

  if (ageHours <= 72) {
    return 0.65;
  }

  if (ageHours <= 168) {
    return 0.45;
  }

  return 0.2;
}

export function calculateSourceQuality(sourceName: string, trustWeight?: number): number {
  return trustWeight ?? SOURCE_QUALITY_WEIGHTS[sourceName] ?? 0.65;
}

export function calculateEngagementScore(item: RawNewsItem): number {
  return Math.min(1, Math.max(0, (item.engagementScore ?? 0) / 1000));
}

export function calculateOverallScore(input: {
  recencyScore: number;
  relevanceScore: number;
  sourceQualityScore: number;
  engagementScore: number;
}): number {
  const { recencyScore, relevanceScore, sourceQualityScore, engagementScore } = input;

  return Number(
    (
      recencyScore * 0.4 +
      relevanceScore * 0.35 +
      sourceQualityScore * 0.15 +
      engagementScore * 0.1
    ).toFixed(3),
  );
}
