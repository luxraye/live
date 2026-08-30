import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-2xl border border-edge bg-panel p-5 ${className}`}>
      {children}
    </section>
  )
}

export function SectionTitle({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel2 text-crimson-hi">{icon}</div>
      <div>
        <h2 className="text-base font-bold tracking-wide text-inktext">{title}</h2>
        {sub && <p className="text-xs text-mute">{sub}</p>}
      </div>
    </header>
  )
}

export function BigButton({
  children,
  onClick,
  variant = 'crimson',
  className = '',
  disabled,
  id,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'crimson' | 'cyan' | 'emerald' | 'ghost' | 'amber'
  className?: string
  disabled?: boolean
  id?: string
}) {
  const variants: Record<string, string> = {
    crimson: 'bg-crimson text-white hover:bg-crimson-hi active:scale-[0.98]',
    cyan: 'bg-cyanst/15 text-cyanst border border-cyanst/40 hover:bg-cyanst/25 active:scale-[0.98]',
    emerald: 'bg-verified/15 text-verified border border-verified/40 hover:bg-verified/25 active:scale-[0.98]',
    amber: 'bg-amberwarn/15 text-amberwarn border border-amberwarn/40 hover:bg-amberwarn/25 active:scale-[0.98]',
    ghost: 'bg-panel2 text-inktext border border-edge hover:border-mute active:scale-[0.98]',
  }
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Chip({ active, onClick, children, tone = 'cyan', className = '' }: {
  active: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'cyan' | 'crimson'
  className?: string
}) {
  const activeCls =
    tone === 'cyan'
      ? 'border-cyanst bg-cyanst/15 text-cyanst'
      : 'border-crimson bg-crimson/15 text-crimson-hi'
  return (
    <button
      onClick={onClick}
      className={`min-h-12 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.97] ${
        active ? activeCls : 'border-edge bg-panel2 text-mute hover:text-inktext'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-mute">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full min-h-13 rounded-xl border border-edge bg-panel2 px-4 py-3 text-sm text-inktext placeholder:text-mute/60 outline-none transition focus:border-cyanst focus:ring-2 focus:ring-cyanst/20'

export function Modal({ open, onClose, children, wide }: {
  open: boolean
  onClose?: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-edge bg-panel p-6 shadow-2xl ${
              wide ? 'max-w-2xl' : 'max-w-md'
            }`}
          >
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-panel2 text-mute hover:text-inktext"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toast({ show, tone, children }: { show: boolean; tone: 'ok' | 'err' | 'info'; children: ReactNode }) {
  const tones = {
    ok: 'border-verified/50 bg-verified/15 text-verified',
    err: 'border-crimson/50 bg-crimson/15 text-crimson-hi',
    info: 'border-cyanst/50 bg-cyanst/15 text-cyanst',
  }
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className={`fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-bold shadow-xl backdrop-blur ${tones[tone]}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
