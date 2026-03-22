import { CATEGORY_KEYWORDS, TAG_KEYWORDS } from "@/lib/news/constants";
import type { NewsCategory, RawNewsItem } from "@/lib/news/types";
import { stripHtml, tokenize } from "@/lib/news/utils";

function scoreKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.reduce((score, keyword) => score + (lowerText.includes(keyword) ? 1 : 0), 0);
}

export function classifyItem(item: RawNewsItem): {
  categories: NewsCategory[];
  relevanceScore: number;
  tags: string[];
} {
  const corpus = `${item.title} ${stripHtml(item.snippet)} ${stripHtml(item.content)}`.trim();
  const categoryScores = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => ({
    category: category as NewsCategory,
    score: scoreKeywordMatches(corpus, keywords),
  }));

  const categories = categoryScores
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((entry) => entry.category);

  const tokens = tokenize(corpus);
  const tags = TAG_KEYWORDS.filter((keyword) => tokens.includes(keyword.replace(/\s+/g, "")) || corpus.toLowerCase().includes(keyword))
    .slice(0, 5);

  const maxPossibleScore = Math.max(...Object.values(CATEGORY_KEYWORDS).map((keywords) => keywords.length));
  const relevanceScore =
    categoryScores.length === 0
      ? 0
      : Math.min(
          1,
          categoryScores.reduce((highest, entry) => Math.max(highest, entry.score), 0) / Math.max(maxPossibleScore / 3, 1),
        );

  return {
    categories: categories.length > 0 ? categories : ["AI"],
    relevanceScore,
    tags,
  };
}
