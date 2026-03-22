import { getDashboardData } from "@/lib/news/repository";
import { runIngestionJob } from "@/lib/news/ingest";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.ENABLE_SERVER_INGEST !== "true") {
    return Response.json(
      { error: "Server-side ingestion is disabled for this deployment. Run the local ingest worker instead." },
      { status: 403 },
    );
  }

  const result = await runIngestionJob();
  const data = await getDashboardData();

  return Response.json({
    result,
    data,
  });
}
