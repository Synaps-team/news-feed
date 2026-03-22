import type { ScoredNewsItem } from "@/lib/news/types";
import { createHash, tokenize } from "@/lib/news/utils";

function jaccardSimilarity(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const intersection = [...leftSet].filter((token) => rightSet.has(token)).length;
  const union = new Set([...leftSet, ...rightSet]).size;

  return union === 0 ? 0 : intersection / union;
}

export function markDuplicates(items: ScoredNewsItem[]): {
  items: ScoredNewsItem[];
  duplicateCount: number;
} {
  const groups = new Map<string, ScoredNewsItem[]>();

  for (const item of items) {
    const key = item.normalizedUrl;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.push(item);
      continue;
    }

    const similarGroup = [...groups.values()].find((group) => {
      const representative = group[0];
      const similarity = jaccardSimilarity(tokenize(representative.title), tokenize(item.title));
      return similarity >= 0.8;
    });

    if (similarGroup) {
      similarGroup.push(item);
      continue;
    }

    groups.set(key, [item]);
  }

  let duplicateCount = 0;

  for (const group of groups.values()) {
    group.sort((left, right) => right.overallScore - left.overallScore);

    if (group.length > 1) {
      duplicateCount += group.length - 1;
    }

    const duplicateGroupId = group.length > 1 ? createHash(group.map((item) => item.id).join(":")) : null;
    const canonicalId = group[0].id;

    group.forEach((item, index) => {
      item.duplicateGroupId = duplicateGroupId;
      item.canonicalItemId = index === 0 ? null : canonicalId;
      item.isCanonical = index === 0;
    });
  }

  return { items, duplicateCount };
}
