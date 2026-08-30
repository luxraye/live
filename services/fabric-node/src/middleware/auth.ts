/**
 * Gateway authentication middleware.
 *
 * The api-server authenticates to /fabric/* routes with a shared secret:
 *   Authorization: Bearer <FABRIC_GATEWAY_SECRET>
 *
 * Comparison uses crypto.timingSafeEqual to prevent timing attacks.
 */

import { NextFunction, Request, Response } from 'express';
import * as crypto from 'node:crypto';
import { logger } from '../logger.js';

export function requireGatewayAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.FABRIC_GATEWAY_SECRET;

  if (!secret) {
    logger.error('FABRIC_GATEWAY_SECRET is not configured — rejecting all /fabric/* requests');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Gateway secret not configured' } });
    return;
  }

  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const presented = match?.[1] ?? '';

  // timingSafeEqual requires equal-length buffers; hash both sides first so
  // length differences do not short-circuit the comparison.
  const expectedDigest = crypto.createHash('sha256').update(secret, 'utf8').digest();
  const presentedDigest = crypto.createHash('sha256').update(presented, 'utf8').digest();

  if (!presented || !crypto.timingSafeEqual(expectedDigest, presentedDigest)) {
    logger.warn({ ip: req.ip, path: req.path }, 'Rejected /fabric request with missing or invalid bearer token');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid bearer token' } });
    return;
  }

  next();
}
