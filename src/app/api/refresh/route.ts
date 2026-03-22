import { getDashboardData } from "@/lib/news/repository";
import { runIngestionJob } from "@/lib/news/ingest";

export const runtime = "nodejs";

export async function POST() {
  const result = await runIngestionJob();
  const data = await getDashboardData();

  return Response.json({
    result,
    data,
  });
}
