import { runIngestionJob } from "@/lib/news/ingest";
import { getDashboardData, hasNewsItems } from "@/lib/news/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasNewsItems())) {
    await runIngestionJob();
  }

  const data = await getDashboardData();
  return Response.json(data);
}
