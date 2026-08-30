import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Siren, Droplets, Timer, CheckCircle2, Truck, FlaskConical,
  ClipboardList, Building2, Hash, Layers, Send, ShieldCheck,
} from 'lucide-react'
import type { BloodGroup, BloodOrder, Component } from '../types'
import { newLedgerRef, submitOrder } from '../api'
import { bump } from '../stats'
import { BigButton, Chip, Field, Modal, Panel, SectionTitle, inputCls } from '../components/ui'

const GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
const COMPONENTS: Component[] = ['Packed RBC', 'Fresh Frozen Plasma', 'Cryoprecipitate', 'Platelets']
const INDICATIONS = [
  'Postpartum hemorrhage',
  'Sickle cell crisis',
  'Trauma surgery',
  'GI bleed',
  'Elective surgery',
  'Severe anaemia',
]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

const STATUS_META: Record<string, { label: string; icon: typeof Truck; cls: string }> = {
  DISPATCHED: { label: 'Dispatched', icon: Truck, cls: 'text-crimson-hi' },
  CROSSMATCHING: { label: 'Crossmatching', icon: FlaskConical, cls: 'text-cyanst' },
  READY: { label: 'Ready for Collection', icon: CheckCircle2, cls: 'text-verified' },
  IN_TRANSIT: { label: 'In Transit', icon: Truck, cls: 'text-cyanst' },
  DELIVERED: { label: 'Delivered to Ward', icon: CheckCircle2, cls: 'text-verified' },
}

function OrderCard({ order, now }: { order: BloodOrder; now: number }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.CROSSMATCHING
  const Icon = meta.icon
  const remaining = order.etaSeconds !== null
    ? Math.max(0, order.etaSeconds - Math.floor((now - order.createdAt) / 1000))
    : null
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${
        order.priority === 'STAT' ? 'border-crimson/50 bg-crimson/5' : 'border-edge bg-panel2'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-lg px-2.5 py-1 text-[11px] font-black tracking-widest ${
              order.priority === 'STAT' ? 'bg-crimson text-white' : 'bg-cyanst/15 text-cyanst'
            }`}
          >
            {order.priority}
          </span>
          <div>
            <p className="text-sm font-bold text-inktext">
              {order.units}u {order.bloodGroup} · {order.component}
            </p>
            <p className="text-xs text-mute">
              {order.patientId} → {order.destination} · {order.indication}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`flex items-center justify-end gap-1.5 text-xs font-bold ${meta.cls}`}>
            <Icon size={14} /> {meta.label}
          </p>
          {remaining !== null && remaining > 0 && (
            <p className="tabular mt-1 flex items-center justify-end gap-1 text-lg font-black text-crimson-hi">
              <Timer size={16} /> {fmt(remaining)}
            </p>
          )}
          {remaining === 0 && (
            <p className="mt-1 text-xs font-bold text-verified">ARRIVED — collect at ward door</p>
          )}
          {order.ledgerRef && (
            <p className="mt-0.5 font-mono text-[10px] text-mute/70">{order.ledgerRef}</p>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export default function Ordering({ onOrderCount }: { onOrderCount: (n: number) => void }) {
  const [orders, setOrders] = useState<BloodOrder[]>([])
  const [now, setNow] = useState(Date.now())
  const [statModal, setStatModal] = useState(false)
  const [statGroup, setStatGroup] = useState<BloodGroup>('O-')
  const [sending, setSending] = useState(false)

  // Elective form state
  const [patientId, setPatientId] = useState('')
  const [group, setGroup] = useState<BloodGroup>('O+')
  const [component, setComponent] = useState<Component>('Packed RBC')
  const [units, setUnits] = useState(2)
  const [indication, setIndication] = useState(INDICATIONS[0])
  const [customIndication, setCustomIndication] = useState('')
  const [destination, setDestination] = useState('')
  const [confirm, setConfirm] = useState<BloodOrder | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => onOrderCount(orders.length), [orders.length, onOrderCount])

  // Simulate lifecycle progression for demo realism
  useEffect(() => {
    const t = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          const age = (Date.now() - o.createdAt) / 1000
          if (o.priority === 'STAT') {
            if (o.etaSeconds !== null && age >= o.etaSeconds && o.status !== 'DELIVERED')
              return { ...o, status: 'DELIVERED' }
            return o
          }
          if (age > 40 && o.status === 'CROSSMATCHING') return { ...o, status: 'READY' }
          return o
        }),
      )
    }, 3000)
    return () => clearInterval(t)
  }, [])

  async function fireStat() {
    setSending(true)
    const order: BloodOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      priority: 'STAT',
      patientId: 'UNCROSSMATCHED / TRAUMA',
      bloodGroup: statGroup,
      component: 'Packed RBC',
      units: 2,
      indication: 'Trauma — uncrossmatched emergency release',
      destination: 'Resus / Trauma Bay',
      status: 'DISPATCHED',
      createdAt: Date.now(),
      etaSeconds: 8 * 60,
      ledgerRef: newLedgerRef(),
    }
    bump({ statOrders: 1, unitsOrdered: 2, totalStatDispatchSec: 8 * 60 })
    await submitOrder(order)
    setOrders((p) => [order, ...p])
    setSending(false)
    setStatModal(false)
  }

  // Massive Transfusion Protocol — one tap dispatches a full trauma pack:
  // 4u RBC + 4u FFP + 1 platelet pool (1:1:1 balanced resuscitation)
  async function fireMTP() {
    setSending(true)
    const ts = Date.now()
    const base = {
      priority: 'STAT' as const,
      patientId: 'MTP ACTIVATION / TRAUMA',
      bloodGroup: statGroup,
      indication: 'Massive Transfusion Protocol — 1:1:1 trauma pack',
      destination: 'Resus / Trauma Bay',
      status: 'DISPATCHED' as const,
      createdAt: ts,
      etaSeconds: 8 * 60,
    }
    const pack: BloodOrder[] = [
      { ...base, id: `MTP-${ts.toString(36).toUpperCase()}-R`, component: 'Packed RBC', units: 4, ledgerRef: newLedgerRef() },
      { ...base, id: `MTP-${ts.toString(36).toUpperCase()}-P`, component: 'Fresh Frozen Plasma', units: 4, ledgerRef: newLedgerRef() },
      { ...base, id: `MTP-${ts.toString(36).toUpperCase()}-T`, component: 'Platelets', units: 1, ledgerRef: newLedgerRef() },
    ]
    bump({ mtpActivations: 1, unitsOrdered: 9, totalStatDispatchSec: 8 * 60 })
    await Promise.all(pack.map((o) => submitOrder(o)))
    setOrders((p) => [...pack, ...p])
    setSending(false)
    setStatModal(false)
  }

  async function fireElective() {
    if (!patientId.trim() || !destination.trim()) return
    setSending(true)
    const order: BloodOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      priority: 'ELECTIVE',
      patientId: patientId.trim().toUpperCase(),
      bloodGroup: group,
      component,
      units,
      indication: indication === 'Other' ? customIndication.trim() || 'Unspecified' : indication,
      destination: destination.trim(),
      status: 'CROSSMATCHING',
      createdAt: Date.now(),
      etaSeconds: null,
      ledgerRef: newLedgerRef(),
    }
    bump({ electiveOrders: 1, unitsOrdered: units })
    await submitOrder(order)
    setOrders((p) => [order, ...p])
    setConfirm(order)
    setSending(false)
    setPatientId('')
    setDestination('')
    setUnits(2)
  }

  return (
    <div className="space-y-5">
      {/* STAT strip */}
      <Panel id="stat-order-panel" className="border-crimson/40 bg-gradient-to-br from-crimson/10 to-transparent">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="stat-pulse flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-crimson text-white">
              <Siren size={28} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-inktext">STAT TRAUMA ORDER</h2>
              <p className="text-xs text-mute">
                Uncrossmatched emergency units · immediate dispatch · no crossmatch delay
              </p>
            </div>
          </div>
          <BigButton
            id="stat-order-button"
            variant="crimson"
            className="min-h-16 text-base"
            onClick={() => setStatModal(true)}
          >
            <Droplets size={20} /> REQUEST EMERGENCY UNITS
          </BigButton>
        </div>
      </Panel>

      {/* Elective crossmatch */}
      <Panel id="elective-order-panel">
        <SectionTitle
          icon={<ClipboardList size={20} />}
          title="Elective / Ward Crossmatch Request"
          sub="Full crossmatch — routed to Blood Bank laboratory"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient ID / Hospital Reg #">
            <div className="relative">
              <Hash size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input
                id="patient-id-input"
                className={`${inputCls} pl-10`}
                placeholder="e.g. PMH-2026-04471"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Destination Ward / OR Room #">
            <div className="relative">
              <Building2 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input
                id="destination-input"
                className={`${inputCls} pl-10`}
                placeholder="e.g. Female Surgical Ward 3 / OR-2"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Required ABO / Rh Group">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {GROUPS.map((g) => (
                <Chip key={g} active={group === g} onClick={() => setGroup(g)} tone="crimson">
                  {g}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Component">
            <div className="grid grid-cols-2 gap-2">
              {COMPONENTS.map((cmp) => (
                <Chip key={cmp} active={component === cmp} onClick={() => setComponent(cmp)}>
                  {cmp}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Units Requested">
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((u) => (
                <Chip key={u} active={units === u} onClick={() => setUnits(u)}>
                  {u}
                </Chip>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Clinical Indication">
            <div className="flex flex-wrap gap-2">
              {[...INDICATIONS, 'Other'].map((ind) => (
                <Chip key={ind} active={indication === ind} onClick={() => setIndication(ind)}>
                  {ind}
                </Chip>
              ))}
            </div>
          </Field>
          {indication === 'Other' && (
            <input
              className={`${inputCls} mt-2`}
              placeholder="Type clinical indication…"
              value={customIndication}
              onChange={(e) => setCustomIndication(e.target.value)}
            />
          )}
        </div>

        <BigButton
          id="submit-crossmatch-button"
          className="mt-5 w-full"
          variant="cyan"
          disabled={!patientId.trim() || !destination.trim() || sending}
          onClick={fireElective}
        >
          <Send size={18} /> SUBMIT CROSSMATCH REQUEST
        </BigButton>
      </Panel>

      {/* Active orders */}
      {orders.length > 0 && (
        <Panel id="active-orders-panel">
          <SectionTitle
            icon={<Layers size={20} />}
            title="Active Orders"
            sub="Live status from Blood Bank"
          />
          <div className="space-y-3">
            <AnimatePresence>
              {orders.map((o) => (
                <OrderCard key={o.id} order={o} now={now} />
              ))}
            </AnimatePresence>
          </div>
        </Panel>
      )}

      {/* STAT confirm modal */}
      <Modal open={statModal} onClose={() => setStatModal(false)}>
        <div className="text-center">
          <div className="stat-pulse mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-crimson text-white">
            <Siren size={32} />
          </div>
          <h3 className="text-lg font-black text-inktext">EMERGENCY RELEASE</h3>
          <p className="mt-1 text-sm text-mute">
            2 units uncrossmatched packed cells will be dispatched immediately to Resus / Trauma Bay.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {(['O-', 'O+'] as BloodGroup[]).map((g) => (
              <Chip key={g} active={statGroup === g} onClick={() => setStatGroup(g)} tone="crimson" className="min-h-16 text-xl">
                {g === 'O-' ? 'O− (universal)' : 'O+ (male/repro-safe)'}
              </Chip>
            ))}
          </div>
          <BigButton
            id="confirm-stat-button"
            variant="crimson"
            className="mt-5 min-h-16 w-full text-base"
            disabled={sending}
            onClick={fireStat}
          >
            <Siren size={20} /> {sending ? 'DISPATCHING…' : 'CONFIRM STAT DISPATCH (2u RBC)'}
          </BigButton>
          <BigButton
            id="mtp-button"
            variant="amber"
            className="mt-3 min-h-16 w-full text-base"
            disabled={sending}
            onClick={fireMTP}
          >
            <Droplets size={20} /> ACTIVATE MTP — FULL TRAUMA PACK
          </BigButton>
          <p className="mt-2 text-[11px] font-bold text-amberwarn">
            MTP = 4u RBC + 4u FFP + 1 platelet pool (1:1:1 balanced resuscitation)
          </p>
          <p className="mt-3 text-[11px] text-mute">
            Emergency release is logged against the requesting clinician. Crossmatch sample must follow within 30 min.
          </p>
        </div>
      </Modal>

      {/* Elective confirmation */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        {confirm && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-verified/15 text-verified lock-glow">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-lg font-black text-inktext">Request Logged to Blood Bank</h3>
            <p className="mt-2 text-sm text-mute">
              {confirm.units}u {confirm.bloodGroup} {confirm.component} for{' '}
              <span className="font-bold text-inktext">{confirm.patientId}</span> → {confirm.destination}
            </p>
            <p className="mt-2 font-mono text-xs text-cyanst">Ledger ref: {confirm.ledgerRef}</p>
            <BigButton variant="emerald" className="mt-5 w-full" onClick={() => setConfirm(null)}>
              <CheckCircle2 size={18} /> DONE
            </BigButton>
          </div>
        )}
      </Modal>
    </div>
  )
}
