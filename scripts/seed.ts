import { closeDatabaseConnections } from "../src/lib/db";
import { resetAndSeedDatabase } from "../src/lib/news/repository";

async function main() {
  try {
    await resetAndSeedDatabase();
    console.log("Seeded latest news database.");
  } finally {
    await closeDatabaseConnections();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
