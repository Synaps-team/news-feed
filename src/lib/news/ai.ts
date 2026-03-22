import type { NewsCategory, RawNewsItem } from "@/lib/news/types";

type AiResult = {
  summary?: string;
  categories?: NewsCategory[];
  tags?: string[];
};

export async function enrichWithAi(item: RawNewsItem): Promise<AiResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const prompt = `
Return strict JSON with keys: summary, categories, tags.
Categories must only use: AI, Digital Architecture Tools, AI in Architecture.
Keep summary to one short sentence.

Title: ${item.title}
Snippet: ${item.snippet ?? ""}
Content: ${item.content ?? ""}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You classify architecture and AI news.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as AiResult;
  } catch {
    return null;
  }
}
