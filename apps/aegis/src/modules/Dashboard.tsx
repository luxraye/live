import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, ShieldCheck, Timer, Droplets, AlertTriangle,
  TrendingDown, DollarSign, Ban, FileClock, CloudOff, Landmark,
} from 'lucide-react'
import { Panel, SectionTitle } from '../components/ui'
import { getStats, onStatsChange, BASELINE, type PilotStats } from '../stats'
import { pendingCount, onQueueChange } from '../api'

function Metric({
  icon, label, value, sub, tone = 'cyan', big = false, delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'cyan' | 'crimson' | 'emerald' | 'amber'
  big?: boolean
  delay?: number
}) {
  const tones = {
    cyan: 'text-cyanst border-cyanst/30 bg-cyanst/5',
    crimson: 'text-crimson-hi border-crimson/30 bg-crimson/5',
    emerald: 'text-verified border-verified/30 bg-verified/5',
    amber: 'text-amberwarn border-amberwarn/30 bg-amberwarn/5',
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-4 ${tones[tone]}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-90">
        {icon} {label}
      </div>
      <p className={`tabular mt-2 font-black text-inktext ${big ? 'text-4xl' : 'text-2xl'}`}>{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-snug text-mute">{sub}</p>}
    </motion.article>
  )
}

function CompareBar({ label, minutes, max, tone }: { label: string; minutes: number; max: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-bold text-inktext">{label}</span>
        <span className={`tabular text-sm font-black ${tone}`}>{minutes} min</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-panel2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(minutes / max) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${tone === 'text-crimson-hi' ? 'bg-crimson' : 'bg-verified'}`}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<PilotStats>(getStats())
  const [pending, setPending] = useState(pendingCount())

  useEffect(() => onStatsChange(setStats), [])
  useEffect(() => onQueueChange(setPending), [])

  const totalOrders = stats.statOrders + stats.electiveOrders + stats.mtpActivations
  const minutesSaved = totalOrders * (BASELINE.paperCrossmatchMin - BASELINE.aegisStatMin)
  const liabilityAvoided = stats.incompatibilitiesBlocked * BASELINE.abomishapCostUSD

  return (
    <div className="space-y-5">
      {/* Hero safety metric */}
      <Panel id="impact-hero" className="border-verified/40 bg-gradient-to-br from-verified/10 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-verified">
              <ShieldCheck size={14} /> Incompatible transfusions blocked
            </p>
            <p className="tabular mt-1 text-6xl font-black text-verified">{stats.incompatibilitiesBlocked}</p>
            <p className="mt-1 text-xs text-mute">
              Each blocked unit avoids a <span className="font-bold text-inktext">never-event</span> —
              est. ${BASELINE.abomishapCostUSD.toLocaleString()} in liability &amp; care costs
            </p>
          </div>
          {liabilityAvoided > 0 && (
            <div className="rounded-2xl border border-verified/40 bg-verified/10 p-4 text-center">
              <DollarSign size={20} className="mx-auto text-verified" />
              <p className="tabular mt-1 text-2xl font-black text-verified">
                ${(liabilityAvoided / 1_000_000).toFixed(0)}M+
              </p>
              <p className="text-[10px] font-bold text-mute">exposure avoided</p>
            </div>
          )}
        </div>
      </Panel>

      {/* Speed story */}
      <Panel id="speed-panel">
        <SectionTitle
          icon={<Timer size={20} />}
          title="Request-to-Dispatch Time"
          sub="Paper baseline vs. Aegis digital workflow"
        />
        <div className="space-y-4">
          <CompareBar label="Paper request form (status quo)" minutes={BASELINE.paperCrossmatchMin} max={BASELINE.paperCrossmatchMin} tone="text-crimson-hi" />
          <CompareBar label="Aegis STAT order" minutes={BASELINE.aegisStatMin} max={BASELINE.paperCrossmatchMin} tone="text-verified" />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyanst/30 bg-cyanst/10 px-4 py-3">
          <TrendingDown size={18} className="shrink-0 text-cyanst" />
          <p className="text-xs text-inktext">
            <span className="font-black text-cyanst">
              {Math.round((1 - BASELINE.aegisStatMin / BASELINE.paperCrossmatchMin) * 100)}% faster
            </span>{' '}
            — this session alone: <span className="tabular font-black">{minutesSaved}</span> clinician-minutes
            saved across {totalOrders} order{totalOrders === 1 ? '' : 's'}
          </p>
        </div>
      </Panel>

      {/* Session activity grid */}
      <Panel id="activity-panel">
        <SectionTitle icon={<BarChart3 size={20} />} title="Live Pilot Activity" sub="Counted from real actions on this device" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric icon={<Droplets size={12} />} label="Units ordered" value={String(stats.unitsOrdered)} tone="crimson" delay={0.05} />
          <Metric icon={<Timer size={12} />} label="STAT orders" value={String(stats.statOrders)} sub={`+ ${stats.mtpActivations} MTP activation${stats.mtpActivations === 1 ? '' : 's'}`} tone="crimson" delay={0.1} />
          <Metric icon={<FileClock size={12} />} label="Elective requests" value={String(stats.electiveOrders)} tone="cyan" delay={0.15} />
          <Metric icon={<ShieldCheck size={12} />} label="Bedside verifications" value={String(stats.verifications)} sub={`${stats.signOffs} signed off with PIN`} tone="emerald" delay={0.2} />
          <Metric icon={<AlertTriangle size={12} />} label="Reaction alerts" value={String(stats.reactionAlerts)} tone="amber" delay={0.25} />
          <Metric icon={<CloudOff size={12} />} label="Pending sync" value={String(pending)} sub={pending > 0 ? 'Will replay when Bloodchain reconnects' : 'All actions synced to ledger'} tone={pending > 0 ? 'amber' : 'emerald'} delay={0.3} />
        </div>
      </Panel>

      {/* Cost of status quo */}
      <Panel id="status-quo-panel" className="border-crimson/30">
        <SectionTitle
          icon={<Landmark size={20} />}
          title="The Cost of the Status Quo"
          sub="Why hospitals switch — pilot projections, clearly labelled"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={<Ban size={12} />} label="Units lost to expiry" value={`~${BASELINE.expiryWastagePct}%`} sub="of issued units discarded under paper tracking — ledger visibility recovers most" tone="crimson" delay={0.05} />
          <Metric icon={<DollarSign size={12} />} label="Cost per ABO never-event" value="$1M+" sub="liability, ICU care & reputational damage from one wrong bag" tone="crimson" delay={0.1} />
          <Metric icon={<FileClock size={12} />} label="Paper turnaround" value={`${BASELINE.paperCrossmatchMin} min`} sub="typical crossmatch request cycle in regional referral hospitals" tone="crimson" delay={0.15} />
        </div>
        <p className="mt-4 text-center text-[10px] text-mute/80">
          Baselines are pilot-programme planning anchors from regional transfusion-service reporting;
          live pilot data will replace projections as deployments scale.
        </p>
      </Panel>
    </div>
  )
}
