/**
 * LedgerFeed — live public blockchain ledger feed widget.
 *
 * Drop-in React component for the bloodchain.life marketing site (React/Vite).
 * Fetches GET {baseUrl}/public/ledger?limit=10 every 30 seconds and renders a
 * dark-themed card list with neon cyan accents.
 *
 * Usage:
 *   <LedgerFeed />                                    // uses VITE_FABRIC_BASE_URL
 *   <LedgerFeed baseUrl="https://fabric.bloodchain.app" />
 */

import { useEffect, useState } from 'react';

interface PublicDonationEntry {
  txId: string;
  centreName: string;
  district: string;
  bloodType: string;
  donatedAt: string;
  donorHash: string;
  operatorHash: string;
  ledgerTimestamp: string;
}

interface LedgerFeedProps {
  baseUrl?: string;
}

const DEFAULT_BASE_URL: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any).env?.VITE_FABRIC_BASE_URL) ??
  'https://fabric.bloodchain.app';

const COLORS = {
  bg: '#060912',
  card: '#0b101d',
  border: '#16203a',
  cyan: '#2bd9e7',
  white: '#f4f7fb',
  muted: '#5b6b8c',
  red: '#ff4d5e',
  amber: '#ffb347',
  green: '#2be77a',
};

/** O- is the universal donor → red badge; rare types amber; common types cyan. */
function bloodTypeColor(bloodType: string): string {
  if (bloodType === 'O-') return COLORS.red;
  if (['AB-', 'B-', 'A-', 'AB+'].includes(bloodType)) return COLORS.amber;
  return COLORS.cyan;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function truncateTxId(txId: string): string {
  if (txId.length <= 14) return txId;
  return `${txId.slice(0, 8)}...${txId.slice(-4)}`;
}

export default function LedgerFeed({ baseUrl = DEFAULT_BASE_URL }: LedgerFeedProps) {
  const [entries, setEntries] = useState<PublicDonationEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchFeed = async () => {
      try {
        const res = await fetch(`${baseUrl}/public/ledger?limit=10`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setEntries(data.records ?? []);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    fetchFeed();
    const interval = setInterval(fetchFeed, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [baseUrl]);

  return (
    <section
      id="ledger-feed"
      aria-label="Live blockchain donation ledger"
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 520,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: COLORS.green,
            animation: 'ledgerPulse 1.6s ease-in-out infinite',
          }}
        />
        <span style={{ color: COLORS.green, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
          LIVE
        </span>
        <h3 style={{ color: COLORS.white, fontSize: 15, fontWeight: 600, margin: 0, marginLeft: 4 }}>
          Public Donation Ledger
        </h3>
      </header>

      <style>{`
        @keyframes ledgerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>

      {error && (
        <p style={{ color: COLORS.muted, fontSize: 13, margin: '24px 0', textAlign: 'center' }}>
          Ledger feed temporarily unavailable
        </p>
      )}

      {!error && entries === null && (
        <div role="status" aria-label="Loading ledger entries">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 62,
                borderRadius: 10,
                background: `linear-gradient(90deg, ${COLORS.card} 25%, ${COLORS.border} 50%, ${COLORS.card} 75%)`,
                backgroundSize: '200% 100%',
                animation: 'ledgerShimmer 1.4s ease-in-out infinite',
                marginBottom: 10,
              }}
            />
          ))}
          <style>{`
            @keyframes ledgerShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      )}

      {!error && entries !== null && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {entries.map((entry) => (
            <li
              key={entry.txId}
              className="ledger-entry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 10,
              }}
            >
              <span
                aria-label={`Blood type ${entry.bloodType}`}
                style={{
                  minWidth: 44,
                  textAlign: 'center',
                  padding: '5px 0',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: COLORS.bg,
                  background: bloodTypeColor(entry.bloodType),
                }}
              >
                {entry.bloodType}
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    color: COLORS.white,
                    fontSize: 13.5,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {entry.centreName}
                  <span style={{ color: COLORS.muted, fontWeight: 500 }}> · {entry.district}</span>
                </span>
                <span style={{ display: 'block', color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                  {relativeTime(entry.donatedAt)}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", marginLeft: 8 }}>
                    {truncateTxId(entry.txId)}
                  </span>
                </span>
              </span>

              <span
                title="Anchored on Hyperledger Fabric"
                style={{ color: COLORS.cyan, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                🔗 ✓ on chain
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
