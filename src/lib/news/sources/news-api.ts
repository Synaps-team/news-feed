import type { SourceAdapter } from "@/lib/news/sources/base";

type NewsApiArticle = {
  title: string;
  url: string;
  author?: string | null;
  publishedAt?: string | null;
  description?: string | null;
  content?: string | null;
  source?: { name?: string };
};

export const newsApiAdapter: SourceAdapter = {
  supports(source) {
    return source.type === "news_api" || source.type === "website";
  },

  async fetchItems(source) {
    const apiKey = process.env.NEWS_API_KEY;
    const query = String(source.options?.query ?? "AI OR architecture technology");
    const endpoint =
      source.url ??
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=20&sortBy=publishedAt&language=en`;

    if (!apiKey) {
      return [];
    }

    const response = await fetch(endpoint, {
      headers: {
        "X-Api-Key": apiKey,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`News API fetch failed for ${source.name}: ${response.status}`);
    }

    const payload = (await response.json()) as { articles?: NewsApiArticle[] };

    return (payload.articles ?? []).map((article) => ({
      sourceId: source.id,
      sourceName: article.source?.name || source.name,
      sourceType: source.type,
      title: article.title,
      url: article.url,
      author: article.author,
      publishedAt: article.publishedAt,
      snippet: article.description,
      content: article.content,
      engagementScore: null,
      metadata: {
        query,
      },
    }));
  },
};
