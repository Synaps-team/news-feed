import { resetAndSeedDatabase } from "../src/lib/news/repository";

async function main() {
  await resetAndSeedDatabase();
  console.log("Seeded latest news database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
