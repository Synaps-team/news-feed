import { closeDatabaseConnections } from "@/lib/db";
import { runIngestionJob } from "@/lib/news/ingest";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (process.env.ENABLE_SERVER_INGEST !== "true") {
    return Response.json(
      { error: "Server-side ingestion is disabled for this deployment. Run ingestion outside Vercel." },
      { status: 403 },
    );
  }

  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngestionJob();
    return Response.json(result);
  } finally {
    await closeDatabaseConnections();
  }
}
