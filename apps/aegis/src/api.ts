// ─────────────────────────────────────────────────────────────
// Bloodchain API client for Aegis Clinical.
// Talks to the Bloodchain backend at http://localhost:5000/api.
//
// OFFLINE-FIRST: if the backend is unreachable (ward Wi-Fi drop,
// power cut), every POST is persisted to a local sync queue
// (localStorage) and replayed automatically when connectivity
// returns. The clinical workflow is NEVER blocked.
// ─────────────────────────────────────────────────────────────
import type { BloodOrder, ReactionAlert, SurveyPayload } from './types'

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://bloodchain-api-i9et.onrender.com/api' : 'http://localhost:5000/api')
).replace(/\/$/, '')

const TIMEOUT_MS = 3500
const QUEUE_KEY = 'aegis-sync-queue'
const MAX_QUEUE = 500

export interface QueuedAction {
  id: string
  path: string
  body: unknown
  queuedAt: number
  attempts: number
}

type QueueListener = (pending: number) => void
const listeners = new Set<QueueListener>()

export function onQueueChange(fn: QueueListener): () => void {
  listeners.add(fn)
  fn(readQueue().length)
  return () => listeners.delete(fn)
}

function readQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as QueuedAction[]
  } catch {
    return []
  }
}

function writeQueue(q: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)))
  listeners.forEach((fn) => fn(q.length))
}

export function pendingCount(): number {
  return readQueue().length
}

async function rawPost(path: string, body: unknown): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    return res.ok
  } catch {
    return false
  }
}

function enqueue(path: string, body: unknown) {
  const q = readQueue()
  q.push({
    id: `Q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    body,
    queuedAt: Date.now(),
    attempts: 0,
  })
  writeQueue(q)
}

/** Attempt to replay the queue front-to-back. Stops at first failure. */
export async function flushQueue(): Promise<number> {
  let q = readQueue()
  let flushed = 0
  while (q.length > 0) {
    const head = q[0]
    const ok = await rawPost(head.path, head.body)
    if (!ok) {
      head.attempts += 1
      writeQueue(q)
      break
    }
    q = q.slice(1)
    flushed += 1
    writeQueue(q)
  }
  return flushed
}

// Background flusher — kicks in on reconnect and every 20 s
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushQueue())
  setInterval(() => {
    if (readQueue().length > 0) void flushQueue()
  }, 20000)
}

async function apiPost<T>(path: string, body: unknown): Promise<{ ok: boolean; queued: boolean }> {
  const sent = await rawPost(path, body)
  if (sent) return { ok: true, queued: false }
  enqueue(path, body)
  return { ok: true, queued: true }
}

export function newLedgerRef(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `BC-${hex.toUpperCase()}`
}

export async function submitOrder(order: BloodOrder) {
  return apiPost('/clinical/orders', {
    hospitalName: order.destination || 'Princess Marina Hospital',
    wardRoom: order.destination || 'ICU / Trauma Bay',
    patientIdentifier: order.patientId,
    bloodType: order.bloodGroup,
    component: order.component.toLowerCase().replace(/\s+/g, '_'),
    unitsRequested: order.units,
    urgency: order.priority === 'STAT' ? 'stat_trauma' : 'elective',
    indication: order.indication,
    ledgerRef: order.ledgerRef,
  })
}

export async function submitVerification(payload: {
  patientBarcode: string
  bagBarcode: string
  match: boolean
  clinicianPin: boolean
  clinicianId?: string
  timestamp: string
}) {
  return apiPost('/clinical/transfusions', {
    unitBarcode: payload.bagBarcode,
    patientIdentifier: payload.patientBarcode,
    startedAt: payload.timestamp,
    hasReaction: false,
  })
}

export async function submitSignOff(payload: {
  unitId: string
  patientBarcode: string
  completedAt: string
  pinVerified: boolean
  clinicianId?: string
}) {
  return apiPost('/clinical/transfusions', {
    unitBarcode: payload.unitId,
    patientIdentifier: payload.patientBarcode,
    completedAt: payload.completedAt,
    hasReaction: false,
  })
}

export async function submitReaction(alert: ReactionAlert) {
  return apiPost('/clinical/transfusions', {
    unitBarcode: alert.unitId,
    patientIdentifier: alert.patientId,
    hasReaction: true,
    reactionDetails: { types: alert.types, sentAt: alert.sentAt },
  })
}

export async function submitFeedback(payload: SurveyPayload) {
  return apiPost('/feedback', {
    platform: payload.platform,
    responses: {
      easeOfOrdering: payload.easeOfOrdering,
      verificationSpeed: payload.verificationSpeed,
      nps: payload.nps,
      feedback: payload.feedback,
      role: payload.role,
    },
    appVersion: '1.0.0-aegis',
  })
}
