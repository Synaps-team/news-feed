import { closeDatabaseConnections } from "@/lib/db";
import { getDashboardData } from "@/lib/news/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  console.log("[api/news] start");
  try {
    const data = await getDashboardData();
    console.log(`[api/news] done elapsed_ms=${Date.now() - startedAt} totalItems=${data.totalItems}`);
    return Response.json(data);
  } finally {
    await closeDatabaseConnections();
  }
}
