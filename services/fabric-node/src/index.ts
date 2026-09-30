/**
 * bloodchain-fabric-node — entry point.
 *
 * Express 5 gateway service that anchors verified blood donation events on
 * a Hyperledger Fabric distributed ledger (or an in-memory mock when
 * FABRIC_MOCK_MODE=true).
 */

import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { closeFabric, initFabric, modeReason, usingMockMode } from './fabric/connection.js';
import { logger } from './logger.js';
import { donationsRouter } from './routes/donations.js';
import { publicRouter } from './routes/public.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

async function main(): Promise<void> {
  // Establish Fabric connection (or mock mode) before accepting traffic.
  await initFabric();

  const app = express();

  // Running behind Render / reverse proxy — trust 1 hop to prevent client IP spoofing
  app.set('trust proxy', 1);

  // Security headers: CSP, HSTS, X-Content-Type-Options, etc.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(express.json({ limit: '64kb' }));

  // CORS — allow list from ALLOWED_ORIGINS (comma-separated).
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser clients (no Origin header), allow-listed origins, and Render deployments.
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          /^https:\/\/bloodchain-[a-z0-9-]+\.onrender\.com$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    }),
  );

  // Health check — reports which ledger mode the service is running in.
  app.get('/healthz', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'bloodchain-fabric-node',
      ledgerMode: usingMockMode ? 'mock' : 'fabric',
      detail: modeReason,
      timestamp: new Date().toISOString(),
    });
  });

  // Root — simple service identification page.
  app.get('/', (_req, res) => {
    res.status(200).json({
      service: 'bloodchain-fabric-node',
      description:
        'Bloodchain Hyperledger Fabric gateway — anchors verified blood donations on an immutable distributed ledger.',
      ledgerMode: usingMockMode ? 'mock' : 'fabric',
      endpoints: {
        'POST /fabric/donations': 'Anchor a verified donation (Bearer auth required)',
        'GET /fabric/donations/:txId': 'Fetch a donation record (Bearer auth required)',
        'GET /public/ledger': 'Public paginated ledger feed (no auth)',
        'GET /public/stats': 'Public ledger statistics (no auth)',
        'GET /healthz': 'Health check',
      },
    });
  });

  // Rate limiting for public transparency endpoints (healthz is untouched)
  const publicLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 60, // 60 requests per minute per IP
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please slow down.' } },
  });

  app.use('/fabric', donationsRouter);
  app.use('/public', publicLimiter, publicRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(
      { port: PORT, ledgerMode: usingMockMode ? 'mock' : 'fabric', allowedOrigins },
      `bloodchain-fabric-node listening on port ${PORT}`,
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      closeFabric();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Fatal startup error');
  process.exit(1);
});
