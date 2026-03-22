import type { SourceAdapter } from "@/lib/news/sources/base";
import type { RawNewsItem } from "@/lib/news/types";

type XApiResponse = {
  data?: Array<{
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
    public_metrics?: {
      like_count?: number;
      retweet_count?: number;
      reply_count?: number;
      quote_count?: number;
    };
  }>;
};

export const xAdapter: SourceAdapter = {
  supports(source) {
    return source.type === "x";
  },

  async fetchItems(source): Promise<RawNewsItem[]> {
    const token = process.env.X_BEARER_TOKEN;
    const query = String(source.options?.query ?? "(AI OR BIM OR architecture AI) -is:retweet lang:en");

    if (!token) {
      return [];
    }

    const endpoint =
      source.url ??
      `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(
        query,
      )}&tweet.fields=created_at,public_metrics,author_id&max_results=10`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`X API fetch failed for ${source.name}: ${response.status}`);
    }

    const payload = (await response.json()) as XApiResponse;

    return (payload.data ?? []).map((tweet) => {
      const engagement =
        (tweet.public_metrics?.like_count ?? 0) +
        (tweet.public_metrics?.retweet_count ?? 0) * 2 +
        (tweet.public_metrics?.reply_count ?? 0) +
        (tweet.public_metrics?.quote_count ?? 0) * 2;

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.type,
        title: tweet.text.slice(0, 120),
        url: `https://x.com/i/web/status/${tweet.id}`,
        author: tweet.author_id ?? null,
        publishedAt: tweet.created_at ?? null,
        snippet: tweet.text,
        content: tweet.text,
        engagementScore: engagement,
        metadata: {
          query,
        },
      };
    });
  },
};
