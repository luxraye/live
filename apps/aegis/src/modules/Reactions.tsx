import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Thermometer, Sparkles, HeartPulse, Droplet,
  Radio, CheckCircle2, Hash,
} from 'lucide-react'
import type { ReactionAlert, ReactionType } from '../types'
import { submitReaction } from '../api'
import { bump } from '../stats'
import { BigButton, Field, Panel, SectionTitle, inputCls } from '../components/ui'

const REACTIONS: { type: ReactionType; icon: typeof Thermometer; hint: string }[] = [
  { type: 'Fever', icon: Thermometer, hint: '≥ 38°C or rise ≥ 1°C' },
  { type: 'Urticaria', icon: Sparkles, hint: 'Rash / hives / itching' },
  { type: 'Tachycardia', icon: HeartPulse, hint: 'HR > 100 or rise > 20' },
  { type: 'Hematuria', icon: Droplet, hint: 'Dark urine — suspect hemolysis' },
]

export default function Reactions() {
  const [selected, setSelected] = useState<ReactionType[]>([])
  const [unitId, setUnitId] = useState('')
  const [patientId, setPatientId] = useState('')
  const [sending, setSending] = useState(false)
  const [alerts, setAlerts] = useState<ReactionAlert[]>([])

  function toggle(t: ReactionType) {
    setSelected((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))
  }

  async function sendAlert() {
    if (selected.length === 0) return
    setSending(true)
    const alert: ReactionAlert = {
      id: `RXN-${Date.now().toString(36).toUpperCase()}`,
      types: selected,
      unitId: unitId.trim().toUpperCase() || 'UNIT-UNKNOWN',
      patientId: patientId.trim().toUpperCase() || 'UNSPECIFIED',
      sentAt: Date.now(),
      acknowledged: false,
    }
    bump({ reactionAlerts: 1 })
    await submitReaction(alert)
    setAlerts((p) => [alert, ...p])
    setSelected([])
    setUnitId('')
    setPatientId('')
    setSending(false)
    // Simulate Blood Bank acknowledging
    setTimeout(() => {
      setAlerts((p) => p.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a)))
    }, 4000)
  }

  return (
    <div className="space-y-5">
      <Panel id="reaction-panel" className="border-amberwarn/30">
        <SectionTitle
          icon={<AlertTriangle size={20} />}
          title="Adverse Reaction Checklist"
          sub="1-tap logging — STOP the transfusion first, then alert Blood Bank"
        />

        <div className="mb-4 rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-center text-sm font-black tracking-wide text-crimson-hi">
          ⚠ STOP TRANSFUSION · KEEP IV LINE OPEN WITH SALINE · RECHECK IDENTIFIERS
        </div>

        <div className="grid grid-cols-2 gap-3">
          {REACTIONS.map(({ type, icon: Icon, hint }) => {
            const active = selected.includes(type)
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-4 transition active:scale-[0.97] ${
                  active
                    ? 'border-amberwarn bg-amberwarn/15 text-amberwarn'
                    : 'border-edge bg-panel2 text-mute hover:text-inktext'
                }`}
              >
                <Icon size={28} />
                <span className="text-sm font-black">{type}</span>
                <span className="text-[10px] opacity-80">{hint}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Unit Barcode # (optional)">
            <div className="relative">
              <Hash size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input className={`${inputCls} pl-10`} placeholder="UNIT-482913" value={unitId} onChange={(e) => setUnitId(e.target.value)} />
            </div>
          </Field>
          <Field label="Patient ID (optional)">
            <div className="relative">
              <Hash size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
              <input className={`${inputCls} pl-10`} placeholder="PMH-2026-04471" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            </div>
          </Field>
        </div>

        <BigButton
          id="send-reaction-alert"
          variant="amber"
          className="mt-5 min-h-16 w-full text-base"
          disabled={selected.length === 0 || sending}
          onClick={sendAlert}
        >
          <Radio size={20} />
          {sending ? 'ALERTING BLOOD BANK…' : `ALERT BLOOD BANK NOW${selected.length ? ` (${selected.length})` : ''}`}
        </BigButton>
      </Panel>

      <AnimatePresence>
        {alerts.length > 0 && (
          <Panel id="sent-alerts-panel">
            <SectionTitle icon={<Radio size={20} />} title="Sent Alerts" sub="Blood Bank acknowledgement status" />
            <div className="space-y-3">
              {alerts.map((a) => (
                <motion.article
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-xl border border-edge bg-panel2 p-4"
                >
                  <div>
                    <p className="text-sm font-bold text-inktext">{a.types.join(' + ')}</p>
                    <p className="text-xs text-mute">
                      {a.unitId} · {a.patientId} · {new Date(a.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {a.acknowledged ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-verified/15 px-3 py-1.5 text-xs font-black text-verified">
                      <CheckCircle2 size={14} /> BLOOD BANK ACK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-lg bg-amberwarn/15 px-3 py-1.5 text-xs font-black text-amberwarn">
                      <Radio size={14} className="animate-pulse" /> SENDING…
                    </span>
                  )}
                </motion.article>
              ))}
            </div>
          </Panel>
        )}
      </AnimatePresence>
    </div>
  )
}
