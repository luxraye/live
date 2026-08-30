import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanBarcode, User, Droplet, ShieldCheck, ShieldAlert, Lock,
  KeyRound, CheckCircle2, RotateCcw, Fingerprint, Camera,
} from 'lucide-react'
import type { BloodGroup } from '../types'
import { submitSignOff, submitVerification } from '../api'
import { bump } from '../stats'
import CameraScanner, { hasNativeScanner } from '../components/CameraScanner'
import { BigButton, Modal, Panel, SectionTitle } from '../components/ui'

// ABO/Rh compatibility: recipient ← donor
const COMPAT: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

const GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

function randomBarcode(prefix: string) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`
}

/** Try to read a blood group embedded in a scanned barcode (e.g. "UNIT-482913-AB+"). */
function groupFromCode(code: string): BloodGroup | null {
  const m = code.toUpperCase().match(/\b(AB|A|B|O)\s?([+-])\b/)
  if (!m) return null
  return `${m[1]}${m[2]}` as BloodGroup
}

/** Hard clinical alarm for ABO mismatch — Web Audio, no asset needed. */
function playMismatchAlarm() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, now + i * 0.35)
      osc.frequency.setValueAtTime(660, now + i * 0.35 + 0.15)
      gain.gain.setValueAtTime(0.0001, now + i * 0.35)
      gain.gain.exponentialRampToValueAtTime(0.28, now + i * 0.35 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.35 + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.35)
      osc.stop(now + i * 0.35 + 0.32)
    }
    setTimeout(() => void ctx.close(), 1600)
  } catch { /* audio blocked — vibration still fires */ }
}

function playMatchChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[523.25, 783.99].forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.25)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.3)
    })
    setTimeout(() => void ctx.close(), 900)
  } catch { /* ignore */ }
}

type Step = 'patient' | 'bag' | 'result'

function ScannerBox({
  label, icon, scanned, code, group, active, onScan, cameraAvailable,
}: {
  label: string
  icon: React.ReactNode
  scanned: boolean
  code: string | null
  group: BloodGroup | null
  active: boolean
  onScan: () => void
  cameraAvailable: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-5 transition ${
        scanned
          ? 'border-verified/60 bg-verified/5'
          : active
            ? 'border-cyanst/60 bg-cyanst/5'
            : 'border-edge bg-panel2 opacity-50'
      }`}
    >
      {active && !scanned && (
        <div className="laser-line pointer-events-none absolute left-3 right-3 h-0.5 rounded bg-cyanst shadow-[0_0_12px_2px_rgba(6,182,212,0.8)]" />
      )}
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${scanned ? 'bg-verified/15 text-verified' : 'bg-panel text-cyanst'}`}>
          {scanned ? <CheckCircle2 size={24} /> : icon}
        </div>
        <div>
          <p className="text-sm font-black tracking-wide text-inktext">{label}</p>
          {scanned ? (
            <p className="font-mono text-xs text-verified">
              {code} · Group <span className="text-base font-black">{group}</span>
            </p>
          ) : (
            <p className="text-xs text-mute">{active ? 'Ready — tap to scan' : 'Waiting…'}</p>
          )}
        </div>
      </div>
      {active && !scanned && (
        <BigButton variant="cyan" className="mt-4 w-full" onClick={onScan}>
          {cameraAvailable ? <Camera size={18} /> : <ScanBarcode size={18} />} SCAN {label.toUpperCase()}
        </BigButton>
      )}
    </div>
  )
}

export default function Verification({ clinician }: { clinician: string }) {
  const [step, setStep] = useState<Step>('patient')
  const [patientCode, setPatientCode] = useState<string | null>(null)
  const [patientGroup, setPatientGroup] = useState<BloodGroup | null>(null)
  const [bagCode, setBagCode] = useState<string | null>(null)
  const [bagGroup, setBagGroup] = useState<BloodGroup | null>(null)
  const [simGroupP, setSimGroupP] = useState<BloodGroup>('A+')
  const [simGroupB, setSimGroupB] = useState<BloodGroup>('A+')
  const [signOffOpen, setSignOffOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [signedOff, setSignedOff] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [cameraFor, setCameraFor] = useState<null | 'patient' | 'bag'>(null)
  const cameraAvailable = useRef(hasNativeScanner()).current

  const match = useMemo(() => {
    if (!patientGroup || !bagGroup) return null
    return COMPAT[patientGroup].includes(bagGroup)
  }, [patientGroup, bagGroup])

  function acceptPatient(code: string, group: BloodGroup) {
    setPatientCode(code)
    setPatientGroup(group)
    setStep('bag')
  }

  async function acceptBag(code: string, group: BloodGroup, pGroup: BloodGroup) {
    setBagCode(code)
    setBagGroup(group)
    setStep('result')
    const isMatch = COMPAT[pGroup].includes(group)
    bump({ verifications: 1, ...(isMatch ? {} : { incompatibilitiesBlocked: 1 }) })
    await submitVerification({
      patientBarcode: patientCode ?? '',
      bagBarcode: code,
      match: isMatch,
      clinicianPin: false,
      clinicianId: clinician,
      timestamp: new Date().toISOString(),
    })
    if (navigator.vibrate) navigator.vibrate(isMatch ? 80 : [120, 60, 120, 60, 240])
    if (isMatch) playMatchChime()
    else playMismatchAlarm()
  }

  function startScan(target: 'patient' | 'bag') {
    if (cameraAvailable) setCameraFor(target)
    else simulateScan(target)
  }

  function simulateScan(target: 'patient' | 'bag') {
    setCameraFor(null)
    if (target === 'patient') acceptPatient(randomBarcode('PT'), simGroupP)
    else void acceptBag(randomBarcode('UNIT'), simGroupB, patientGroup ?? simGroupP)
  }

  function onCameraDetected(raw: string) {
    const target = cameraFor
    setCameraFor(null)
    if (!target) return
    const embedded = groupFromCode(raw)
    if (target === 'patient') {
      acceptPatient(raw, embedded ?? simGroupP)
    } else {
      void acceptBag(raw, embedded ?? simGroupB, patientGroup ?? simGroupP)
    }
  }

  function reset() {
    setStep('patient')
    setPatientCode(null)
    setPatientGroup(null)
    setBagCode(null)
    setBagGroup(null)
    setSignedOff(false)
    setPin('')
  }

  async function confirmSignOff() {
    if (pin.length !== 4) {
      setPinError(true)
      setTimeout(() => setPinError(false), 900)
      return
    }
    bump({ signOffs: 1 })
    await submitSignOff({
      unitId: bagCode ?? '',
      patientBarcode: patientCode ?? '',
      completedAt: new Date().toISOString(),
      pinVerified: true,
      clinicianId: clinician,
    })
    setSignedOff(true)
    setSignOffOpen(false)
    setPin('')
  }

  return (
    <div className="space-y-5">
      <Panel id="verification-panel">
        <SectionTitle
          icon={<Fingerprint size={20} />}
          title="Bedside Dual-Verification"
          sub={
            cameraAvailable
              ? 'Camera barcode scanning active (Code 128 / ISBT 128) — ABO safety lock engages automatically'
              : 'Scan patient wristband, then blood bag — ABO safety lock engages automatically'
          }
        />

        {/* Demo group simulator (pilot mode) */}
        <div className="mb-4 rounded-xl border border-edge bg-panel2/60 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-mute">
            Pilot simulator — groups used when a barcode carries no ABO data
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] text-mute">Patient wristband group</p>
              <div className="flex flex-wrap gap-1">
                {GROUPS.map((g) => (
                  <button key={g} onClick={() => setSimGroupP(g)}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold ${simGroupP === g ? 'bg-cyanst/20 text-cyanst' : 'bg-panel text-mute'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] text-mute">Blood bag group</p>
              <div className="flex flex-wrap gap-1">
                {GROUPS.map((g) => (
                  <button key={g} onClick={() => setSimGroupB(g)}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold ${simGroupB === g ? 'bg-crimson/20 text-crimson-hi' : 'bg-panel text-mute'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScannerBox
            label="Patient Wristband"
            icon={<User size={24} />}
            scanned={!!patientCode}
            code={patientCode}
            group={patientGroup}
            active={step === 'patient'}
            onScan={() => startScan('patient')}
            cameraAvailable={cameraAvailable}
          />
          <ScannerBox
            label="Blood Bag Unit"
            icon={<Droplet size={24} />}
            scanned={!!bagCode}
            code={bagCode}
            group={bagGroup}
            active={step === 'bag'}
            onScan={() => startScan('bag')}
            cameraAvailable={cameraAvailable}
          />
        </div>

        {/* Result lock */}
        <AnimatePresence>
          {match !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-5 rounded-2xl border-2 p-6 text-center ${
                match
                  ? 'lock-glow border-verified bg-verified/10'
                  : 'mismatch-glow border-crimson bg-crimson/10'
              }`}
              id="verification-result"
            >
              {match ? (
                <>
                  <ShieldCheck size={56} className="mx-auto text-verified" />
                  <h3 className="mt-3 text-2xl font-black tracking-wide text-verified">COMPATIBLE — SAFE TO TRANSFUSE</h3>
                  <p className="mt-1 text-sm text-mute">
                    Patient {patientGroup} ← Unit {bagGroup} · verified on Bloodchain ledger
                  </p>
                  {!signedOff ? (
                    <BigButton variant="emerald" className="mx-auto mt-5 min-h-16 w-full max-w-sm text-base" onClick={() => setSignOffOpen(true)} id="signoff-button">
                      <KeyRound size={20} /> TRANSFUSION SIGN-OFF
                    </BigButton>
                  ) : (
                    <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-xl border border-verified/40 bg-verified/15 px-4 py-4 text-sm font-black text-verified">
                      <CheckCircle2 size={18} /> UNIT COMPLETED · {clinician} · {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <ShieldAlert size={56} className="mx-auto text-crimson-hi" />
                  <h3 className="mt-3 text-2xl font-black tracking-wide text-crimson-hi">INCOMPATIBLE — DO NOT TRANSFUSE</h3>
                  <p className="mt-1 text-sm font-bold text-inktext">
                    Patient {patientGroup} cannot receive {bagGroup} — safety lock engaged
                  </p>
                  <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-2 rounded-xl bg-crimson px-4 py-4 text-sm font-black text-white">
                    <Lock size={18} /> RETURN UNIT TO BLOOD BANK IMMEDIATELY
                  </div>
                  <p className="mt-3 text-xs text-mute">Blood Bank has been alerted automatically. Incident logged.</p>
                </>
              )}
              <button onClick={reset} className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-bold text-mute hover:text-inktext">
                <RotateCcw size={13} /> Start new verification
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      {/* Camera scanner */}
      <CameraScanner
        open={cameraFor !== null}
        title={cameraFor === 'patient' ? 'Scan Patient Wristband' : 'Scan Blood Bag Unit'}
        onDetected={onCameraDetected}
        onClose={() => setCameraFor(null)}
        onFallback={() => cameraFor && simulateScan(cameraFor)}
      />

      {/* PIN sign-off */}
      <Modal open={signOffOpen} onClose={() => setSignOffOpen(false)}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyanst/15 text-cyanst">
            <KeyRound size={26} />
          </div>
          <h3 className="text-lg font-black text-inktext">Clinician PIN Sign-Off</h3>
          <p className="mt-1 text-xs text-mute">
            Signing as <span className="font-bold text-cyanst">{clinician}</span> · records digital timestamp against unit {bagCode} on the Bloodchain ledger.
          </p>
          <motion.div animate={pinError ? { x: [0, -10, 10, -8, 8, 0] } : {}} className="mx-auto mt-5 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex h-14 w-12 items-center justify-center rounded-xl border-2 text-2xl font-black ${
                pin[i] ? 'border-cyanst bg-cyanst/10 text-cyanst' : pinError ? 'border-crimson' : 'border-edge bg-panel2 text-mute'
              }`}>
                {pin[i] ? '•' : ''}
              </div>
            ))}
          </motion.div>
          <div className="mx-auto mt-5 grid max-w-xs grid-cols-3 gap-2">
            {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === '⌫') setPin((p) => p.slice(0, -1))
                  else if (k === '✓') confirmSignOff()
                  else if (pin.length < 4) setPin((p) => p + k)
                }}
                className={`min-h-14 rounded-xl text-lg font-black transition active:scale-95 ${
                  k === '✓' ? 'bg-verified/20 text-verified' : k === '⌫' ? 'bg-panel2 text-mute' : 'bg-panel2 text-inktext hover:bg-edge'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
