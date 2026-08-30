/**
 * In-memory mock implementation of the Bloodchain Fabric contract.
 *
 * Used when FABRIC_MOCK_MODE=true (e.g. on Replit / Render without a real
 * Fabric network) or as a graceful fallback when the peer is unreachable at
 * startup. Implements the exact same function surface as contract.ts.
 */

import {
  DonationRecord,
  DuplicateTxError,
  LedgerFeedResult,
  LedgerStatsResult,
  NotFoundError,
  PublicDonationEntry,
  RecordDonationParams,
  RecordDonationResult,
} from './types.js';

/** The mock ledger — keyed by txId, mirroring "DONATION_<txId>" state keys. */
const ledger = new Map<string, DonationRecord>();

/** Monotonically increasing fake block height, seeded randomly. */
let currentBlockHeight = randomInt(100, 99999);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toPublicEntry(r: DonationRecord): PublicDonationEntry {
  return {
    txId: r.txId,
    centreName: r.centreName,
    district: r.district,
    bloodType: r.bloodType,
    donatedAt: r.donatedAt,
    donorHash: r.donorHash,
    operatorHash: r.operatorHash,
    ledgerTimestamp: r.ledgerTimestamp,
  };
}

export async function recordDonation(
  params: RecordDonationParams,
): Promise<RecordDonationResult> {
  if (ledger.has(params.txId)) {
    throw new DuplicateTxError(params.txId);
  }

  const ledgerTimestamp = new Date().toISOString();
  currentBlockHeight += randomInt(1, 3);

  const record: DonationRecord = {
    ...params,
    blockchainVerified: true,
    ledgerTimestamp,
  };
  ledger.set(params.txId, record);

  return {
    success: true,
    blockHeight: String(currentBlockHeight),
    ledgerTimestamp,
  };
}

export async function getDonation(txId: string): Promise<DonationRecord> {
  const record = ledger.get(txId);
  if (!record) {
    throw new NotFoundError(txId);
  }
  return record;
}

export async function getLedgerFeed(
  pageSize: number,
  bookmark: string,
): Promise<LedgerFeedResult> {
  const all = [...ledger.values()].sort(
    (a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime(),
  );

  const start = bookmark ? Math.max(0, parseInt(bookmark, 10) || 0) : 0;
  const page = all.slice(start, start + pageSize);
  const nextIndex = start + pageSize;
  const nextBookmark = nextIndex < all.length ? String(nextIndex) : '';

  return {
    records: page.map(toPublicEntry),
    nextBookmark,
    totalCount: all.length,
  };
}

export async function getLedgerStats(): Promise<LedgerStatsResult> {
  const donors = new Set<string>();
  const centres = new Set<string>();
  for (const record of ledger.values()) {
    donors.add(record.donorHash);
    centres.add(record.centreName);
  }
  return {
    totalDonations: ledger.size,
    uniqueDonors: donors.size,
    uniqueCentres: centres.size,
  };
}

// ─── Seed data ────────────────────────────────────────────────────────────────
// Six realistic Botswana donation records so the public ledger is never empty
// on first boot. Hashes below are fake SHA-256 hex strings — NOT real user data.

const OPERATOR_HASH =
  'c47a10dca9f39c3e2f1c34b57e8a9d21f06e5b48a3c72d1e9f84ab06c5d13e78'.slice(0, 64);

const SEED_DONOR_HASHES = [
  '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
  'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13',
  'a4e624d686e03ed2767c0abd85c14426b0b1157d2ce81d27bb4fe4f6f01d688a',
  '36bbe50ed96841d10443bcb670d6554f0a34b761be67ec9c4a8ad2c0c44ca42c',
];

interface SeedSpec {
  centreId: string;
  centreName: string;
  district: string;
  bloodType: string;
  daysAgo: number;
  hoursOffset: number;
}

const SEED_SPECS: SeedSpec[] = [
  { centreId: 'CTR-GAB-001', centreName: 'Princess Marina Hospital', district: 'Gaborone', bloodType: 'O+', daysAgo: 0, hoursOffset: 3 },
  { centreId: 'CTR-FRW-001', centreName: 'Nyangabgwe Referral Hospital', district: 'Francistown', bloodType: 'A-', daysAgo: 1, hoursOffset: 5 },
  { centreId: 'CTR-MOL-001', centreName: 'Sekgoma Memorial Hospital', district: 'Molepolole', bloodType: 'B+', daysAgo: 2, hoursOffset: 8 },
  { centreId: 'CTR-GAB-001', centreName: 'Princess Marina Hospital', district: 'Gaborone', bloodType: 'O-', daysAgo: 3, hoursOffset: 2 },
  { centreId: 'CTR-FRW-001', centreName: 'Nyangabgwe Referral Hospital', district: 'Francistown', bloodType: 'AB+', daysAgo: 5, hoursOffset: 6 },
  { centreId: 'CTR-MOL-001', centreName: 'Sekgoma Memorial Hospital', district: 'Molepolole', bloodType: 'A+', daysAgo: 6, hoursOffset: 10 },
];

function seedMockLedger(): void {
  const now = Date.now();
  SEED_SPECS.forEach((spec, i) => {
    const donatedAt = new Date(
      now - spec.daysAgo * 24 * 60 * 60 * 1000 - spec.hoursOffset * 60 * 60 * 1000,
    ).toISOString();
    const ledgerTimestamp = new Date(
      new Date(donatedAt).getTime() + 90 * 1000, // anchored ~90s after donation
    ).toISOString();

    const txId = `seed-${String(i + 1).padStart(4, '0')}-${SEED_DONOR_HASHES[i].slice(0, 8)}`;
    ledger.set(txId, {
      txId,
      donorHash: SEED_DONOR_HASHES[i],
      centreId: spec.centreId,
      centreName: spec.centreName,
      district: spec.district,
      bloodType: spec.bloodType,
      donatedAt,
      operatorHash: OPERATOR_HASH,
      blockchainVerified: true,
      ledgerTimestamp,
    });
  });
}

seedMockLedger();
