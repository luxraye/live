/**
 * Shared types for the Bloodchain Fabric gateway service.
 *
 * PRIVACY: donorHash and operatorHash are SHA-256 hashes of Clerk user IDs,
 * computed by the api-server BEFORE they reach this service. This service
 * must never receive or store raw Clerk user IDs.
 */

export interface DonationRecord {
  txId: string;
  donorHash: string; // SHA-256 of clerk_user_id (64 hex chars)
  centreId: string;
  centreName: string;
  district: string;
  bloodType: string;
  donatedAt: string; // ISO 8601 UTC
  operatorHash: string; // SHA-256 of operator clerk_user_id
  blockchainVerified: boolean; // always true when on ledger
  ledgerTimestamp: string; // set by chaincode from the tx timestamp
}

/** Entry shape served on the public, unauthenticated ledger feed. */
export interface PublicDonationEntry {
  txId: string;
  centreName: string;
  district: string;
  bloodType: string;
  donatedAt: string;
  donorHash: string; // pseudonymous hash — not PII
  operatorHash: string; // pseudonymous hash — not PII
  ledgerTimestamp: string;
}

export interface RecordDonationParams {
  txId: string;
  donorHash: string;
  centreId: string;
  centreName: string;
  district: string;
  bloodType: string;
  donatedAt: string;
  operatorHash: string;
}

export interface RecordDonationResult {
  success: boolean;
  blockHeight: string;
  ledgerTimestamp: string;
}

export interface LedgerFeedResult {
  records: PublicDonationEntry[];
  nextBookmark: string;
  totalCount: number;
}

export interface LedgerStatsResult {
  totalDonations: number;
  uniqueDonors: number;
  uniqueCentres: number;
}

/** Error thrown when a txId already exists on the ledger (idempotency guard). */
export class DuplicateTxError extends Error {
  readonly code = 'DUPLICATE_TX';
  constructor(txId: string) {
    super(`Donation with txId ${txId} already exists on the ledger`);
    this.name = 'DuplicateTxError';
  }
}

/** Error thrown when a record cannot be found. */
export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND';
  constructor(txId: string) {
    super(`Donation with txId ${txId} does not exist`);
    this.name = 'NotFoundError';
  }
}

/** Error thrown when the Fabric peer is unreachable and mock mode is OFF. */
export class LedgerUnavailableError extends Error {
  readonly code = 'LEDGER_UNAVAILABLE';
  constructor(detail: string) {
    super(`Fabric peer unreachable: ${detail}`);
    this.name = 'LedgerUnavailableError';
  }
}
