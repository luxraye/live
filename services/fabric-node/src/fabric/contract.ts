/**
 * Typed contract wrapper — the single entry point the routes use to talk to
 * the ledger. Dispatches to the real Fabric contract or the in-memory mock
 * depending on the connection state established at startup.
 */

import { getFabricContract, usingMockMode } from './connection.js';
import * as mock from './mock.js';
import {
  DonationRecord,
  DuplicateTxError,
  LedgerFeedResult,
  LedgerStatsResult,
  LedgerUnavailableError,
  NotFoundError,
  PublicDonationEntry,
  RecordDonationParams,
  RecordDonationResult,
} from './types.js';

const utf8 = new TextDecoder();

function translateFabricError(err: unknown, txId?: string): never {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('DUPLICATE_TX')) {
    throw new DuplicateTxError(txId ?? 'unknown');
  }
  if (message.includes('NOT_FOUND')) {
    throw new NotFoundError(txId ?? 'unknown');
  }
  // Anything else at the transport/endorsement layer means the ledger write
  // or read did not happen — surface as 503, never as silent success.
  throw new LedgerUnavailableError(message);
}

export async function recordDonation(
  params: RecordDonationParams,
): Promise<RecordDonationResult> {
  if (usingMockMode) {
    return mock.recordDonation(params);
  }

  const contract = getFabricContract();
  if (!contract) {
    throw new LedgerUnavailableError('no active Fabric connection');
  }

  try {
    // Submit and wait for commit so we can report the real block number.
    const submitted = await contract.submitAsync('RecordDonation', {
      arguments: [
        params.txId,
        params.donorHash,
        params.centreId,
        params.centreName,
        params.district,
        params.bloodType,
        params.donatedAt,
        params.operatorHash,
      ],
    });

    const status = await submitted.getStatus();
    if (!status.successful) {
      throw new LedgerUnavailableError(
        `transaction ${params.txId} failed to commit with code ${status.code}`,
      );
    }

    const record = JSON.parse(utf8.decode(submitted.getResult())) as DonationRecord;
    return {
      success: true,
      blockHeight: status.blockNumber.toString(),
      ledgerTimestamp: record.ledgerTimestamp,
    };
  } catch (err) {
    if (err instanceof LedgerUnavailableError) throw err;
    translateFabricError(err, params.txId);
  }
}

export async function getDonation(txId: string): Promise<DonationRecord> {
  if (usingMockMode) {
    return mock.getDonation(txId);
  }

  const contract = getFabricContract();
  if (!contract) {
    throw new LedgerUnavailableError('no active Fabric connection');
  }

  try {
    const result = await contract.evaluateTransaction('GetDonation', txId);
    return JSON.parse(utf8.decode(result)) as DonationRecord;
  } catch (err) {
    translateFabricError(err, txId);
  }
}

export async function getLedgerFeed(
  pageSize: number,
  bookmark: string,
): Promise<LedgerFeedResult> {
  if (usingMockMode) {
    return mock.getLedgerFeed(pageSize, bookmark);
  }

  const contract = getFabricContract();
  if (!contract) {
    throw new LedgerUnavailableError('no active Fabric connection');
  }

  try {
    const result = await contract.evaluateTransaction(
      'GetLedgerFeed',
      String(pageSize),
      bookmark,
    );
    const parsed = JSON.parse(utf8.decode(result)) as {
      records: DonationRecord[] | null;
      nextBookmark: string;
      totalCount: number;
    };

    // Serve newest-first regardless of chaincode range-scan order.
    const records: PublicDonationEntry[] = (parsed.records ?? [])
      .sort((a, b) => new Date(b.donatedAt).getTime() - new Date(a.donatedAt).getTime())
      .map((r) => ({
        txId: r.txId,
        centreName: r.centreName,
        district: r.district,
        bloodType: r.bloodType,
        donatedAt: r.donatedAt,
        donorHash: r.donorHash,
        operatorHash: r.operatorHash,
        ledgerTimestamp: r.ledgerTimestamp,
      }));

    return {
      records,
      nextBookmark: parsed.nextBookmark ?? '',
      totalCount: parsed.totalCount ?? records.length,
    };
  } catch (err) {
    translateFabricError(err);
  }
}

export async function getLedgerStats(): Promise<LedgerStatsResult> {
  if (usingMockMode) {
    return mock.getLedgerStats();
  }

  const contract = getFabricContract();
  if (!contract) {
    throw new LedgerUnavailableError('no active Fabric connection');
  }

  try {
    const result = await contract.evaluateTransaction('GetLedgerStats');
    return JSON.parse(utf8.decode(result)) as LedgerStatsResult;
  } catch (err) {
    translateFabricError(err);
  }
}
