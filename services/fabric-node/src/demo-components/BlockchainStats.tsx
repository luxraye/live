/**
 * BlockchainStats — public ledger statistics widget.
 *
 * Drop-in React component for the bloodchain.life marketing site (React/Vite).
 * Fetches GET {baseUrl}/public/stats on mount and every 60 seconds.
 * Displays three large stat numbers with an animated count-up on first load.
 *
 * Usage:
 *   <BlockchainStats />
 *   <BlockchainStats baseUrl="https://fabric.bloodchain.app" />
 */

import { useEffect, useRef, useState } from 'react';

interface LedgerStats {
  totalDonations: number;
  uniqueDonors: number;
  uniqueCentres: number;
}

interface BlockchainStatsProps {
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
};

/** Animated count-up number: eases from 0 to `target` on first render. */
function CountUp({ target, animate }: { target: number; animate: boolean }) {
  const [display, setDisplay] = useState(animate ? 0 : target);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!animate || animatedRef.current) {
      setDisplay(target);
      return;
    }
    animatedRef.current = true;

    const duration = 1200;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setDisplay(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);

  return <>{display.toLocaleString()}</>;
}

export default function BlockchainStats({ baseUrl = DEFAULT_BASE_URL }: BlockchainStatsProps) {
  const [stats, setStats] = useState<LedgerStats | null>(null);
  const [error, setError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const firstLoadRef = useRef(true);
  const [animateFirst, setAnimateFirst] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${baseUrl}/public/stats`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LedgerStats = await res.json();
        if (!cancelled) {
          setStats(data);
          setError(false);
          if (!firstLoadRef.current) setAnimateFirst(false);
          firstLoadRef.current = false;
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [baseUrl]);

  const items: { label: string; value: number | null }[] = [
    { label: 'Total Verified Donations', value: stats?.totalDonations ?? null },
    { label: 'Unique Donors on Chain', value: stats?.uniqueDonors ?? null },
    { label: 'Collection Centres Active', value: stats?.uniqueCentres ?? null },
  ];

  return (
    <section
      id="blockchain-stats"
      aria-label="Blockchain ledger statistics"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        position: 'relative',
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif",
        maxWidth: 640,
      }}
    >
      {showTooltip && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: -38,
            left: '50%',
            transform: 'translateX(-50%)',
            background: COLORS.card,
            border: `1px solid ${COLORS.cyan}`,
            color: COLORS.white,
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          Each number is independently verifiable on the blockchain
        </span>
      )}

      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
      >
        {items.map((item) => (
          <article
            key={item.label}
            className="stat-card"
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: '18px 14px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 34,
                fontWeight: 800,
                color: COLORS.cyan,
                lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {error && item.value === null ? '—' : item.value === null ? '·' : (
                <CountUp target={item.value} animate={animateFirst} />
              )}
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.muted,
                letterSpacing: 0.4,
              }}
            >
              {item.label}
            </span>
          </article>
        ))}
      </div>

      <footer style={{ textAlign: 'center', marginTop: 18 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 999,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: 0.5,
          }}
        >
          <span aria-hidden="true" style={{ color: COLORS.cyan }}>⛓</span>
          Verified on{' '}
          <span style={{ color: COLORS.cyan }}>HYPERLEDGER FABRIC</span>
        </span>
      </footer>
    </section>
  );
}
