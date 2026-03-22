"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleRefresh() {
    setMessage(null);

    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      startTransition(() => {
        router.refresh();
      });

      setMessage("Feed refreshed");
    } catch {
      setMessage("Refresh failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="rounded-full bg-[linear-gradient(135deg,#d946ef,#7c3aed,#06b6d4)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:opacity-60"
      >
        {isPending ? "Refreshing..." : "Refresh"}
      </button>
      {message ? <span className="text-sm text-zinc-500">{message}</span> : null}
    </div>
  );
}
