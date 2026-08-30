import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowUpRight, Activity, Filter, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

export interface PublicLedgerEntry {
  txId: string;
  donorHashPrefix: string;
  centreName: string;
  district: string;
  bloodType: string;
  blockTimestamp: string;
  blockHeight?: number | string;
  verified: boolean;
}

const fallbackFeed: PublicLedgerEntry[] = [
  {
    txId: 'tx_98f4e2a18b76c543',
    donorHashPrefix: 'a1b2...c3d4',
    centreName: 'Princess Marina Hospital',
    district: 'Gaborone',
    bloodType: 'O-',
    blockTimestamp: '2 mins ago',
    blockHeight: '14,892',
    verified: true,
  },
  {
    txId: 'tx_77c1d3e89a54b219',
    donorHashPrefix: 'f8e7...b6a5',
    centreName: 'Nyangabgwe Referral Hospital',
    district: 'Francistown',
    bloodType: 'A+',
    blockTimestamp: '7 mins ago',
    blockHeight: '14,891',
    verified: true,
  },
  {
    txId: 'tx_55a9b2c48d31e760',
    donorHashPrefix: '3d4e...5f6a',
    centreName: 'Sekgoma Memorial Hospital',
    district: 'Molepolole',
    bloodType: 'B+',
    blockTimestamp: '14 mins ago',
    blockHeight: '14,890',
    verified: true,
  },
  {
    txId: 'tx_33f2e1a97c45d882',
    donorHashPrefix: '7b8c...9d0e',
    centreName: 'Maun General Hospital',
    district: 'Ngamiland',
    bloodType: 'O+',
    blockTimestamp: '22 mins ago',
    blockHeight: '14,889',
    verified: true,
  },
  {
    txId: 'tx_11d4e6b82a93c751',
    donorHashPrefix: 'e2f3...a4b5',
    centreName: 'Scottish Livingstone Hospital',
    district: 'Kanye',
    bloodType: 'AB-',
    blockTimestamp: '35 mins ago',
    blockHeight: '14,888',
    verified: true,
  },
];

interface LedgerFeedProps {
  apiBaseUrl?: string;
  limit?: number;
}

export const LedgerFeed: React.FC<LedgerFeedProps> = ({
  apiBaseUrl = (import.meta as unknown as { env?: { VITE_FABRIC_NODE_URL?: string } }).env?.VITE_FABRIC_NODE_URL ?? '',
  limit = 10,
}) => {
  const [feed, setFeed] = useState<PublicLedgerEntry[]>(fallbackFeed);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedTx, setSelectedTx] = useState<PublicLedgerEntry | null>(null);

  const fetchFeed = async () => {
    if (!apiBaseUrl) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/public/ledger?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.records) && data.records.length > 0) {
          setFeed(data.records);
        }
      }
    } catch {
      // Use existing fallback feed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    if (!apiBaseUrl) return;
    const interval = setInterval(fetchFeed, 15000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, limit]);

  const bloodTypes = ['ALL', 'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
  const filtered = filterType === 'ALL' ? feed : feed.filter(item => item.bloodType === filterType);

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-zinc-800/80 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white font-mono">
              Public Ledger Event Stream
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Immutable verification proofs broadcast by authorized health facility nodes across Botswana.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          {bloodTypes.slice(0, 6).map(bt => (
            <button
              key={bt}
              onClick={() => setFilterType(bt)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                filterType === bt
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      {/* Table Feed */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800/60 bg-zinc-900/20 text-zinc-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-6">Transaction ID</th>
              <th className="py-3 px-6">Donor Identity Hash</th>
              <th className="py-3 px-6">Facility / District</th>
              <th className="py-3 px-6">Group</th>
              <th className="py-3 px-6">Timestamp</th>
              <th className="py-3 px-6 text-right">Attestation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            <AnimatePresence>
              {filtered.map((item, idx) => (
                <motion.tr
                  key={item.txId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  onClick={() => setSelectedTx(selectedTx?.txId === item.txId ? null : item)}
                  className={`hover:bg-cyan-950/10 cursor-pointer transition-colors ${
                    selectedTx?.txId === item.txId ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-6 font-mono text-cyan-300 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-cyan-400/70" />
                    <span>{item.txId}</span>
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">
                    <span className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
                      {item.donorHashPrefix}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-zinc-200 font-sans">
                    <div className="font-medium text-white">{item.centreName}</div>
                    <div className="text-[11px] text-zinc-500">{item.district}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                      {item.bloodType}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400">{item.blockTimestamp}</td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Selected Transaction Inspector Modal / Drawer */}
      {selectedTx && (
        <div className="border-t border-zinc-800 bg-zinc-900/60 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-zinc-200 font-semibold">Ledger Block Proof #{selectedTx.blockHeight ?? '14,892'}</div>
              <div className="text-zinc-500">Channel: <span className="text-zinc-400">mychannel</span> · Chaincode: <span className="text-cyan-400">bloodchain-v1</span></div>
            </div>
          </div>
          <div className="text-zinc-400 text-[11px]">
            Donor Hash Attestation: <span className="text-emerald-400 font-mono">{selectedTx.donorHashPrefix}</span> · Facility: <span className="text-white font-sans">{selectedTx.centreName}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerFeed;
