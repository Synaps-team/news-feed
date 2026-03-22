import { closeDatabaseConnections } from "../src/lib/db";
import { runIngestionJob } from "../src/lib/news/ingest";

async function main() {
  try {
    const result = await runIngestionJob();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await closeDatabaseConnections();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
