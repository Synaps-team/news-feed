import { NewsDashboard } from "@/components/news-dashboard";
import { closeDatabaseConnections } from "@/lib/db";
import { getDashboardData } from "@/lib/news/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const startedAt = Date.now();
  console.log("[page] start");
  try {
    const data = await getDashboardData();
    const allowManualRefresh = process.env.ENABLE_SERVER_INGEST === "true";
    console.log(`[page] done elapsed_ms=${Date.now() - startedAt} totalItems=${data.totalItems}`);

    return <NewsDashboard data={data} allowManualRefresh={allowManualRefresh} />;
  } finally {
    await closeDatabaseConnections();
  }
}
