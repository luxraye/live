/**
 * Authenticated /fabric/* routes — called only by the Bloodchain api-server.
 */

import { Router, Request, Response } from 'express';
import * as contract from '../fabric/contract.js';
import {
  DuplicateTxError,
  LedgerUnavailableError,
  NotFoundError,
  RecordDonationParams,
} from '../fabric/types.js';
import { requireGatewayAuth } from '../middleware/auth.js';
import { logger } from '../logger.js';

export const donationsRouter = Router();

// All /fabric/* routes require the shared gateway secret.
donationsRouter.use(requireGatewayAuth);

const BLOOD_TYPES = new Set(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']);
const SHA256_HEX = /^[0-9a-f]{64}$/i;

interface ValidationError {
  field: string;
  message: string;
}

function validateBody(body: unknown): { params?: RecordDonationParams; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  const requireString = (field: string): string => {
    const value = b[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push({ field, message: `${field} is required and must be a non-empty string` });
      return '';
    }
    return value.trim();
  };

  const txId = requireString('txId');
  const donorHash = requireString('donorHash');
  const centreId = requireString('centreId');
  const centreName = requireString('centreName');
  const district = requireString('district');
  const bloodType = requireString('bloodType');
  const donatedAt = requireString('donatedAt');
  const operatorHash = requireString('operatorHash');

  if (donorHash && !SHA256_HEX.test(donorHash)) {
    errors.push({ field: 'donorHash', message: 'donorHash must be a 64-character hex SHA-256 string' });
  }
  if (operatorHash && !SHA256_HEX.test(operatorHash)) {
    errors.push({ field: 'operatorHash', message: 'operatorHash must be a 64-character hex SHA-256 string' });
  }
  if (bloodType && !BLOOD_TYPES.has(bloodType)) {
    errors.push({ field: 'bloodType', message: `bloodType must be one of: ${[...BLOOD_TYPES].join(', ')}` });
  }
  if (donatedAt && Number.isNaN(Date.parse(donatedAt))) {
    errors.push({ field: 'donatedAt', message: 'donatedAt must be a valid ISO 8601 date string' });
  }

  if (errors.length > 0) return { errors };

  return {
    params: { txId, donorHash, centreId, centreName, district, bloodType, donatedAt, operatorHash },
    errors,
  };
}

/**
 * POST /fabric/donations
 * Anchor a verified donation on the ledger. Returns 201 on success,
 * 409 on duplicate txId (idempotency), 503 if the ledger is unreachable.
 */
donationsRouter.post('/donations', async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const { params, errors } = validateBody(req.body);

  if (!params) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: errors } });
    return;
  }

  try {
    const result = await contract.recordDonation(params);
    logger.info(
      {
        event: 'donation_recorded',
        txId: params.txId,
        centreName: params.centreName,
        bloodType: params.bloodType,
        blockHeight: result.blockHeight,
        latencyMs: Date.now() - startedAt,
      },
      'Donation anchored on ledger',
    );
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof DuplicateTxError) {
      logger.warn({ event: 'duplicate_tx', txId: params.txId }, 'Rejected duplicate donation txId');
      res.status(409).json({ error: { code: 'DUPLICATE_TX', message: err.message } });
      return;
    }
    if (err instanceof LedgerUnavailableError) {
      logger.error({ event: 'ledger_unavailable', txId: params.txId, error: err.message }, 'Ledger write failed — peer unreachable');
      res.status(503).json({ error: { code: 'LEDGER_UNAVAILABLE', message: err.message } });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ event: 'donation_error', txId: params.txId, error: message }, 'Unexpected error recording donation');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record donation' } });
  }
});

/**
 * GET /fabric/donations/:txId
 * Retrieve a single donation record by its transaction ID.
 */
donationsRouter.get('/donations/:txId', async (req: Request, res: Response) => {
  const txId = String(req.params.txId ?? '');

  try {
    const record = await contract.getDonation(txId);
    res.status(200).json(record);
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message } });
      return;
    }
    if (err instanceof LedgerUnavailableError) {
      res.status(503).json({ error: { code: 'LEDGER_UNAVAILABLE', message: err.message } });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ event: 'get_donation_error', txId, error: message }, 'Unexpected error fetching donation');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch donation' } });
  }
});
