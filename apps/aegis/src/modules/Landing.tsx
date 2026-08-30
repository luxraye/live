import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldPlus, Droplets, ScanBarcode, AlertTriangle, KeyRound,
  IdCard, LogIn, Link2, Hospital, Workflow, Database,
  HeartPulse, ChevronRight, Lock,
} from 'lucide-react'
import { BigButton, Field, inputCls } from '../components/ui'

const FEATURES = [
  {
    icon: Droplets,
    title: 'Order blood in 3 taps',
    desc: 'STAT trauma release or full ward crossmatch — no paper forms, no phone calls to the lab.',
    tone: 'text-crimson-hi bg-crimson/10 border-crimson/30',
  },
  {
    icon: ScanBarcode,
    title: 'Bedside safety lock',
    desc: 'Dual wristband + bag scan with an ABO/Rh engine that physically blocks incompatible transfusions.',
    tone: 'text-cyanst bg-cyanst/10 border-cyanst/30',
  },
  {
    icon: AlertTriangle,
    title: '1-tap reaction alerts',
    desc: 'Fever, urticaria, tachycardia, hematuria — flagged to the Blood Bank the second they appear.',
    tone: 'text-amberwarn bg-amberwarn/10 border-amberwarn/30',
  },
]

const ECOSYSTEM = [
  { icon: Database, label: 'Bloodchain Ledger', desc: 'Every unit tracked donor → vein' },
  { icon: Hospital, label: 'Blood Bank Console', desc: 'Lab crossmatching & dispatch' },
  { icon: HeartPulse, label: 'Donor Network', desc: 'Recruitment & mobile drives' },
  { icon: ShieldPlus, label: 'Aegis Clinical', desc: 'You are here — the ward portal', active: true },
]

export default function Landing({ onLogin }: { onLogin: (name: string) => void }) {
  const [staffId, setStaffId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  async function signIn(demo = false) {
    if (!demo && (!staffId.trim() || pin.length < 4)) {
      setError(true)
      setTimeout(() => setError(false), 900)
      return
    }
    setBusy(true)
    // Pilot mode: credentials are accepted locally; production will verify
    // against the hospital staff registry via the Bloodchain API.
    await new Promise((r) => setTimeout(r, 650))
    onLogin(demo ? 'Pilot Clinician' : staffId.trim().toUpperCase())
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-8">
      {/* Top brand bar */}
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-crimson/40 bg-crimson/10 text-crimson-hi">
            <ShieldPlus size={24} />
          </div>
          <div>
            <p className="text-lg font-black tracking-wide text-inktext">
              AEGIS <span className="text-crimson-hi">CLINICAL</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-mute">Ward &amp; Theatre Portal</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-cyanst/40 bg-cyanst/10 px-3 py-1.5 text-[11px] font-bold text-cyanst">
          <Link2 size={12} /> Part of the Bloodchain ecosystem
        </span>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* ── Left: story ── */}
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-inktext sm:text-5xl">
              Blood at the bedside,
              <br />
              <span className="bg-gradient-to-r from-crimson-hi to-cyanst bg-clip-text text-transparent">
                verified in seconds.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute sm:text-base">
              Aegis Clinical is the hospital-facing portal of the{' '}
              <span className="font-bold text-cyanst">Bloodchain</span> network — Botswana's
              digital blood supply chain connecting donors, the National Blood Transfusion Service,
              and ward clinicians at Princess Marina, Nyangabgwe and beyond. Order units, verify
              compatibility at the bedside, and report reactions — every action sealed to a
              tamper-proof ledger, with zero extra paperwork for you.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc, tone }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.09 }}
                className={`rounded-2xl border p-4 ${tone.split(' ').slice(1).join(' ')}`}
              >
                <Icon size={24} className={tone.split(' ')[0]} />
                <h3 className="mt-2 text-sm font-black text-inktext">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-mute">{desc}</p>
              </motion.article>
            ))}
          </div>

          {/* Ecosystem strip */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 rounded-2xl border border-edge bg-panel p-5"
            id="ecosystem-section"
          >
            <header className="mb-4 flex items-center gap-2">
              <Workflow size={16} className="text-cyanst" />
              <h2 className="text-xs font-black uppercase tracking-widest text-mute">
                The Bloodchain ecosystem
              </h2>
            </header>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ECOSYSTEM.map(({ icon: Icon, label, desc, active }) => (
                <div
                  key={label}
                  className={`rounded-xl border p-3 text-center ${
                    active
                      ? 'border-crimson/50 bg-crimson/10'
                      : 'border-edge bg-panel2'
                  }`}
                >
                  <Icon size={20} className={`mx-auto ${active ? 'text-crimson-hi' : 'text-cyanst'}`} />
                  <p className={`mt-1.5 text-[11px] font-black ${active ? 'text-crimson-hi' : 'text-inktext'}`}>{label}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-mute">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-mute/80">
              One shared ledger · every unit traceable from donor arm to patient vein · no clinician ever touches the blockchain
            </p>
          </motion.section>
        </div>

        {/* ── Right: login card ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-edge bg-panel p-6 lg:sticky lg:top-6"
          id="login-card"
        >
          <header className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyanst/15 text-cyanst">
              <Lock size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-inktext">Clinician Sign-In</h2>
              <p className="text-[11px] text-mute">Hospital staff credentials required</p>
            </div>
          </header>

          <motion.div animate={error ? { x: [0, -10, 10, -8, 8, 0] } : {}} className="space-y-4">
            <Field label="Staff ID / MDC Registration #">
              <div className="relative">
                <IdCard size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
                <input
                  id="staff-id-input"
                  className={`${inputCls} pl-10 ${error && !staffId.trim() ? 'border-crimson' : ''}`}
                  placeholder="e.g. MDC-08841 or PMH-STAFF-2210"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </Field>
            <Field label="Clinician PIN">
              <div className="relative">
                <KeyRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputCls} pl-10 tracking-[0.5em] ${error && pin.length < 4 ? 'border-crimson' : ''}`}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && signIn()}
                  autoComplete="current-password"
                />
              </div>
            </Field>
          </motion.div>

          <BigButton
            id="signin-button"
            variant="crimson"
            className="mt-5 min-h-15 w-full"
            disabled={busy}
            onClick={() => signIn()}
          >
            <LogIn size={18} /> {busy ? 'VERIFYING…' : 'SIGN IN TO WARD PORTAL'}
          </BigButton>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-edge" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-mute">pilot programme</span>
            <span className="h-px flex-1 bg-edge" />
          </div>

          <BigButton variant="cyan" className="w-full" disabled={busy} onClick={() => signIn(true)} id="demo-button">
            <ChevronRight size={18} /> ENTER PILOT DEMO MODE
          </BigButton>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-mute/80">
            Access is limited to registered clinical staff. Sign-ins and all portal actions are
            recorded on the Bloodchain audit ledger in line with hospital transfusion policy.
          </p>
        </motion.section>
      </div>

      <footer className="mt-12 border-t border-edge pt-5 text-center text-[10px] text-mute/70">
        Aegis Clinical · a Bloodchain platform · Piloting at Princess Marina &amp; Nyangabgwe Referral Hospitals, Botswana
      </footer>
    </div>
  )
}
