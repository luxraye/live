/**
 * Public, unauthenticated routes — the transparency layer.
 *
 * Anyone (investors, regulators, partner hospitals, the marketing site at
 * bloodchain.life) can read the ledger feed and stats without logging in.
 * All data served here is pseudonymous — hashes, never PII.
 */

import { Router, Request, Response } from 'express';
import * as contract from '../fabric/contract.js';
import { LedgerUnavailableError } from '../fabric/types.js';
import { logger } from '../logger.js';

export const publicRouter = Router();

/**
 * GET /public/ledger?limit=20&bookmark=
 * Paginated public feed of donation records. Cached 15 seconds.
 */
publicRouter.get('/ledger', async (req: Request, res: Response) => {
  const rawLimit = parseInt(String(req.query.limit ?? '20'), 10);
  const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 20 : rawLimit, 1), 100);
  const bookmark = String(req.query.bookmark ?? '');

  try {
    const result = await contract.getLedgerFeed(limit, bookmark);
    logger.info(
      { event: 'public_ledger_fetch', ip: req.ip, limit, resultCount: result.records.length },
      'Public ledger feed served',
    );
    res.set('Cache-Control', 'public, max-age=15');
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof LedgerUnavailableError) {
      res.status(503).json({ error: { code: 'LEDGER_UNAVAILABLE', message: err.message } });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ event: 'public_ledger_error', error: message }, 'Unexpected error serving public ledger');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ledger feed' } });
  }
});

/**
 * GET /public/stats
 * Aggregate ledger statistics for the public dashboard. Cached 30 seconds.
 */
publicRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await contract.getLedgerStats();
    logger.info({ event: 'public_stats_fetch', ip: req.ip, ...stats }, 'Public stats served');
    res.set('Cache-Control', 'public, max-age=30');
    res.status(200).json(stats);
  } catch (err) {
    if (err instanceof LedgerUnavailableError) {
      res.status(503).json({ error: { code: 'LEDGER_UNAVAILABLE', message: err.message } });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ event: 'public_stats_error', error: message }, 'Unexpected error serving public stats');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch ledger stats' } });
  }
});
