"use client";

import { useMemo, useState } from "react";

import { NewsCard } from "@/components/news-card";
import { RefreshButton } from "@/components/refresh-button";
import type { DashboardData, NewsCategory } from "@/lib/news/types";

type DashboardTab = NewsCategory | "All";

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "No updates yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NewsDashboard({ data }: { data: DashboardData }) {
  const [activeCategory, setActiveCategory] = useState<DashboardTab>("All");

  const allItems = useMemo(() => {
    const seen = new Set<string>();

    return data.sections
      .flatMap((section) => section.items)
      .filter((item) => {
        if (seen.has(item.id)) {
          return false;
        }

        seen.add(item.id);
        return true;
      })
      .sort((left, right) => {
        const scoreDelta = right.overallScore - left.overallScore;

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
      });
  }, [data.sections]);

  const activeSection = useMemo(
    () =>
      activeCategory === "All"
        ? { category: "All" as const, items: allItems }
        : (data.sections.find((section) => section.category === activeCategory) ?? data.sections[0]),
    [activeCategory, allItems, data.sections],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-8">
      <header className="rounded-3xl border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(245,208,254,0.65),rgba(186,230,253,0.72))] p-8 shadow-lg shadow-fuchsia-100/60 backdrop-blur">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-fuchsia-700">
            Latest News Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            <span className="text-[#534a69]">AI</span>
            <span className="text-zinc-500">, </span>
            <span className="text-[#344e41]">Architecture tooling</span>
            <span className="text-zinc-500">, and </span>
            <span className="text-[#493d66]">AI in architecture</span>
            <span className="text-zinc-500">!</span>
          </h1>
        </div>
      </header>

      <main className="mt-8 flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory("All")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === "All"
                ? "bg-[linear-gradient(135deg,#d946ef,#7c3aed,#06b6d4)] text-white shadow-md shadow-fuchsia-200"
                : "border border-white/80 bg-white/80 text-zinc-700 hover:bg-white"
            }`}
          >
            All
          </button>
          {data.sections.map((section) => {
            const isActive = section.category === activeCategory;

            return (
              <button
                key={section.category}
                type="button"
                onClick={() => setActiveCategory(section.category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[linear-gradient(135deg,#d946ef,#7c3aed,#06b6d4)] text-white shadow-md shadow-fuchsia-200"
                    : "border border-white/80 bg-white/80 text-zinc-700 hover:bg-white"
                }`}
              >
                {section.category}
              </button>
            );
          })}
        </div>

        <section className="rounded-3xl border border-white/70 bg-white/82 p-6 shadow-lg shadow-cyan-100/50 backdrop-blur">
          {activeSection.items.length > 0 ? (
            <div className="divide-y divide-zinc-200/80">
              {activeSection.items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-fuchsia-200 bg-fuchsia-50/60 p-8 text-sm text-zinc-500">
              No items yet. Use the refresh button below, or wait for the scheduled ingestion run to populate the feed.
            </div>
          )}
        </section>
      </main>

      <footer className="mt-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-white/72 p-5 shadow-sm shadow-cyan-100/80 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-700">Items</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950">{data.totalItems}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-fuchsia-700">Sources</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-950">{data.sourceCount}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="text-sm text-zinc-500">Last updated: {formatUpdatedAt(data.lastUpdated)}</div>
            <RefreshButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
