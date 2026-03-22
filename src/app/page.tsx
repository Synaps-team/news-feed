import { NewsDashboard } from "@/components/news-dashboard";
import { getDashboardData } from "@/lib/news/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  const allowManualRefresh = process.env.ENABLE_SERVER_INGEST === "true";

  return <NewsDashboard data={data} allowManualRefresh={allowManualRefresh} />;
}
