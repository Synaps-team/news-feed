import { runIngestionJob } from "../src/lib/news/ingest";

async function main() {
  const result = await runIngestionJob();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
