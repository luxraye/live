import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquareHeart, Send, CheckCircle2 } from 'lucide-react'
import type { SurveyPayload } from '../types'
import { submitFeedback } from '../api'
import { BigButton, Field, Modal, inputCls } from '../components/ui'

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mute">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-label={`${n} stars`}
            className="rounded-lg p-1 transition active:scale-90">
            <Star
              size={34}
              className={n <= value ? 'fill-amberwarn text-amberwarn' : 'text-edge'}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Survey({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [ease, setEase] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [nps, setNps] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [role, setRole] = useState('Doctor')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function send() {
    if (!ease || !speed || nps === null) return
    setSending(true)
    const payload: SurveyPayload = {
      platform: 'aegis-clinical',
      easeOfOrdering: ease,
      verificationSpeed: speed,
      nps,
      feedback: feedback.trim(),
      role,
      submittedAt: new Date().toISOString(),
    }
    await submitFeedback(payload)
    setSending(false)
    setDone(true)
    setTimeout(() => {
      onClose()
      setDone(false)
      setEase(0); setSpeed(0); setNps(null); setFeedback('')
    }, 1800)
  }

  return (
    <Modal open={open} onClose={onClose} wide>
      {done ? (
        <div className="py-10 text-center">
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-verified/15 text-verified lock-glow">
            <CheckCircle2 size={34} />
          </motion.div>
          <h3 className="text-lg font-black text-inktext">Thank you, {role}!</h3>
          <p className="mt-1 text-sm text-mute">Your pilot feedback shapes the Botswana rollout.</p>
        </div>
      ) : (
        <div>
          <header className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson/15 text-crimson-hi">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-inktext">30-Second Pilot Survey</h3>
              <p className="text-xs text-mute">Help us prove Aegis beats paper request forms</p>
            </div>
          </header>

          <div className="mb-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mute">Your role</p>
            <div className="flex flex-wrap gap-2">
              {['Doctor', 'Surgeon', 'Ward Nurse', 'Anaesthetist', 'Lab Tech'].map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    role === r ? 'border-cyanst bg-cyanst/15 text-cyanst' : 'border-edge bg-panel2 text-mute'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Stars label="Ease of ordering blood" value={ease} onChange={setEase} />
            <Stars label="Speed of bedside verification" value={speed} onChange={setSpeed} />
          </div>

          <div className="mt-5">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-mute">
              Would you recommend this system over paper request forms? (0 = never, 10 = absolutely)
            </p>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button key={i} onClick={() => setNps(i)}
                  className={`min-h-11 rounded-lg text-sm font-black transition active:scale-95 ${
                    nps === i
                      ? i >= 9 ? 'bg-verified text-white' : i >= 7 ? 'bg-amberwarn text-black' : 'bg-crimson text-white'
                      : 'bg-panel2 text-mute hover:text-inktext'
                  }`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Field label="Clinical feedback (optional)">
              <textarea
                className={`${inputCls} min-h-24 resize-none`}
                placeholder="What would make this faster on your ward round?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </Field>
          </div>

          <BigButton
            id="submit-survey-button"
            variant="crimson"
            className="mt-5 w-full"
            disabled={!ease || !speed || nps === null || sending}
            onClick={send}
          >
            <Send size={18} /> {sending ? 'SUBMITTING…' : 'SUBMIT PILOT FEEDBACK'}
          </BigButton>
          <p className="mt-2 text-center text-[10px] text-mute">
            Sent to POST /api/feedback · platform: aegis-clinical
          </p>
        </div>
      )}
    </Modal>
  )
}
