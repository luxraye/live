import fs from "node:fs";
import path from "node:path";
import { purgeAllMockData } from "./index";

try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile();
  }
} catch {
  // No .env file or already loaded
}

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
