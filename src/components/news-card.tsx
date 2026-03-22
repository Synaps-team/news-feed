import type { DashboardNewsItem } from "@/lib/news/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NewsCard({ item }: { item: DashboardNewsItem }) {
  return (
    <article className="grid gap-3 py-4 transition first:pt-0 last:pb-0 md:grid-cols-[190px_minmax(0,1fr)_120px] md:items-start">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 md:flex-col md:items-start md:gap-1">
        <span className="rounded-full bg-cyan-100 px-2.5 py-1 font-medium text-cyan-800">
          {item.sourceName}
        </span>
        <span className="uppercase tracking-wide text-fuchsia-700">{item.sourceType}</span>
        <span>{formatDate(item.publishedAt)}</span>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-zinc-950">
          <a
            className="decoration-fuchsia-400 underline-offset-4 transition hover:text-fuchsia-700 hover:underline"
            href={item.url}
            target="_blank"
            rel="noreferrer"
          >
            {item.title}
          </a>
        </h3>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{item.summary}</p>

        {item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={`${item.id}-${tag}`}
                className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-start md:justify-end">
        <a
          className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-fuchsia-300 hover:bg-fuchsia-100"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          Read
        </a>
      </div>
    </article>
  );
}
