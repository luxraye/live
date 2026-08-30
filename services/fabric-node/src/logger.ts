/**
 * Structured JSON logging via pino.
 *
 * Required log events (per design constraints):
 *  - Every transaction submission: txId, centreName, bloodType, blockHeight, latency
 *  - Every public ledger fetch: ip, limit, resultCount
 */

import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'bloodchain-fabric-node' },
  timestamp: pino.stdTimeFunctions.isoTime,
});
