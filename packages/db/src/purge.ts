import { purgeAllMockData } from "./index";

async function main() {
  console.info("Starting database purge of mock records...");
  try {
    await purgeAllMockData();
    console.info("Purge successfully completed.");
    process.exit(0);
  } catch (err) {
    console.error("Purge encountered an error:", err);
    process.exit(1);
  }
}

main();
