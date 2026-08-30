// Lightweight pilot metrics store (localStorage) feeding the
// Impact Dashboard. Every clinically meaningful event is counted
// so demos show REAL session activity on top of pilot projections.

const KEY = 'aegis-pilot-stats'

export interface PilotStats {
  statOrders: number
  electiveOrders: number
  mtpActivations: number
  unitsOrdered: number
  verifications: number
  incompatibilitiesBlocked: number
  signOffs: number
  reactionAlerts: number
  totalStatDispatchSec: number // accumulated, for averaging
  firstUseAt: number | null
}

const DEFAULTS: PilotStats = {
  statOrders: 0,
  electiveOrders: 0,
  mtpActivations: 0,
  unitsOrdered: 0,
  verifications: 0,
  incompatibilitiesBlocked: 0,
  signOffs: 0,
  reactionAlerts: 0,
  totalStatDispatchSec: 0,
  firstUseAt: null,
}

type Listener = (s: PilotStats) => void
const listeners = new Set<Listener>()

export function getStats(): PilotStats {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<PilotStats>) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function bump(patch: Partial<Record<keyof PilotStats, number>>) {
  const s = getStats()
  for (const [k, v] of Object.entries(patch)) {
    const key = k as keyof PilotStats
    if (key === 'firstUseAt') continue
    ;(s[key] as number) = ((s[key] as number) ?? 0) + (v ?? 0)
  }
  if (!s.firstUseAt) s.firstUseAt = Date.now()
  localStorage.setItem(KEY, JSON.stringify(s))
  listeners.forEach((fn) => fn(s))
}

export function onStatsChange(fn: Listener): () => void {
  listeners.add(fn)
  fn(getStats())
  return () => listeners.delete(fn)
}

// ── Status-quo baseline anchors (cited on dashboard) ──
export const BASELINE = {
  paperCrossmatchMin: 52, // typical paper request turnaround, SSA referral hospitals
  aegisStatMin: 8,
  abomishapCostUSD: 1_000_000, // liability + care cost per ABO never-event
  expiryWastagePct: 9, // share of issued units discarded to expiry/handling
}
