import app from "./app";
import { logger } from "./lib/logger";
import { autoSeedDatabase } from "@workspace/db";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Ensure database tables exist and seed demo records on startup
autoSeedDatabase().catch((err) => {
  logger.warn({ err }, "Database initialization warning");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

