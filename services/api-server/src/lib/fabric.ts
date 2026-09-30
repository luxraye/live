import crypto from 'node:crypto';
import { logger } from './logger';

export interface AnchorDonationParams {
  txId: string;
  clerkUserId: string;
  centreId: string;
  centreName: string;
  district: string;
  bloodType: string;
  donatedAt: string;
  operatorId: string;
}

export interface AnchorDonationResult {
  success: boolean;
  txId?: string;
  blockHeight?: string;
  ledgerTimestamp?: string;
}

const FABRIC_NODE_URL = process.env.FABRIC_NODE_URL;
const FABRIC_GATEWAY_SECRET = process.env.FABRIC_GATEWAY_SECRET;

/**
 * Deterministically pseudonymizes Clerk user IDs into salted 64-char SHA-256 hashes.
 * Salt prevents rainbow-table / re-identification attacks on the permanent public ledger.
 */
export function hashUserId(userId: string): string {
  const salt = process.env.FABRIC_DONOR_SALT || 'bloodchain-sovereign-donor-salt-2026';
  return crypto.createHash('sha256').update(`${salt}:${userId.trim()}`).digest('hex');
}

/**
 * Anchors a verified donation event to the Hyperledger Fabric node.
 * Non-blocking: logs error if ledger service is down, without failing the primary DB write.
 */
export async function anchorDonationToFabric(
  params: AnchorDonationParams,
): Promise<AnchorDonationResult | null> {
  if (!FABRIC_NODE_URL || !FABRIC_GATEWAY_SECRET) {
    logger.error('Fabric request refused: FABRIC_NODE_URL and FABRIC_GATEWAY_SECRET are required');
    return null;
  }
  const donorHash = hashUserId(params.clerkUserId);
  const operatorHash = hashUserId(params.operatorId);

  const payload = {
    txId: params.txId,
    donorHash,
    centreId: params.centreId,
    centreName: params.centreName,
    district: params.district,
    bloodType: params.bloodType,
    donatedAt: params.donatedAt,
    operatorHash,
  };

  try {
    const res = await fetch(`${FABRIC_NODE_URL}/fabric/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${FABRIC_GATEWAY_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 201) {
      const data = (await res.json()) as AnchorDonationResult;
      logger.info(
        { txId: params.txId, blockHeight: data.blockHeight, ledgerTimestamp: data.ledgerTimestamp },
        'Donation anchored to Hyperledger Fabric',
      );
      return { ...data, txId: params.txId, success: true };
    }

    if (res.status === 409) {
      logger.warn({ txId: params.txId }, 'Donation txId already anchored on Fabric (duplicate)');
      return { success: true, txId: params.txId };
    }

    const err = await res.json().catch(() => ({ error: { message: 'Fabric request failed' } }));
    logger.warn({ txId: params.txId, status: res.status, err }, 'Failed to anchor donation on Fabric');
    return null;
  } catch (error) {
    logger.warn(
      { txId: params.txId, error: error instanceof Error ? error.message : String(error) },
      'Fabric node is unreachable — donation saved in Postgres only',
    );
    return null;
  }
}

/**
 * Queries real-time public stats from the Fabric node.
 */
export async function getFabricStats(): Promise<{
  totalDonations: number;
  uniqueDonors: number;
  uniqueCentres: number;
} | null> {
  try {
    const res = await fetch(`${FABRIC_NODE_URL}/public/stats`);
    if (res.ok) {
      return (await res.json()) as { totalDonations: number; uniqueDonors: number; uniqueCentres: number };
    }
  } catch {
    // Ignore when fabric node is offline
  }
  return null;
}
