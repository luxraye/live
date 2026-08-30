import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Droplets, ScanBarcode, AlertTriangle, MessageSquareHeart,
  Activity, Wifi, WifiOff, ShieldPlus, LogOut, BarChart3, CloudUpload,
} from 'lucide-react'
import Landing from './modules/Landing'
import Ordering from './modules/Ordering'
import Verification from './modules/Verification'
import Reactions from './modules/Reactions'
import Dashboard from './modules/Dashboard'
import Survey from './modules/Survey'
import { API_BASE, onQueueChange, flushQueue } from './api'

type Tab = 'order' | 'verify' | 'react' | 'impact'

const TABS: { id: Tab; label: string; icon: typeof Droplets }[] = [
  { id: 'order', label: 'Order Blood', icon: Droplets },
  { id: 'verify', label: 'Verify', icon: ScanBarcode },
  { id: 'react', label: 'Reactions', icon: AlertTriangle },
  { id: 'impact', label: 'Impact', icon: BarChart3 },
]

export default function App() {
  const [clinician, setClinician] = useState<string | null>(
    () => sessionStorage.getItem('aegis-clinician'),
  )
  const [tab, setTab] = useState<Tab>('order')
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)
  const [orderCount, setOrderCount] = useState(0)
  const [clock, setClock] = useState(new Date())
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => onQueueChange(setPendingSync), [])

  // Probe Bloodchain backend
  useEffect(() => {
    let cancelled = false
    async function probe() {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 2500)
        await fetch(`${API_BASE}/healthz`, { signal: ctrl.signal })
        clearTimeout(t)
        if (!cancelled) setOnline(true)
        void flushQueue()
      } catch {
        if (!cancelled) setOnline(false)
      }
    }
    probe()
    const iv = setInterval(probe, 30000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Auto-prompt pilot survey after meaningful usage (first order placed), once per session
  useEffect(() => {
    if (orderCount === 1 && !sessionStorage.getItem('aegis-survey-prompted')) {
      const t = setTimeout(() => {
        sessionStorage.setItem('aegis-survey-prompted', '1')
        setSurveyOpen(true)
      }, 25000)
      return () => clearTimeout(t)
    }
  }, [orderCount])

  function login(name: string) {
    sessionStorage.setItem('aegis-clinician', name)
    setClinician(name)
  }

  function logout() {
    sessionStorage.removeItem('aegis-clinician')
    sessionStorage.removeItem('aegis-survey-prompted')
    setClinician(null)
    setTab('order')
  }

  if (!clinician) {
    return <Landing onLogin={login} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-28 pt-4">
      {/* Header */}
      <header id="app-header" className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-crimson/40 bg-crimson/10 text-crimson-hi">
            <ShieldPlus size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide text-inktext">
              AEGIS <span className="text-crimson-hi">CLINICAL</span>
            </h1>
            <p className="text-[11px] text-mute">Princess Marina Hospital · {clinician}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="tabular text-sm font-black text-inktext">
            {clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className={`flex items-center justify-end gap-1 text-[10px] font-bold ${
            online === null ? 'text-mute' : online ? 'text-verified' : 'text-amberwarn'
          }`}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online === null ? 'Connecting…' : online ? 'Bloodchain LIVE' : 'Demo mode (offline)'}
          </p>
          <button
            id="signout-button"
            onClick={logout}
            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-mute transition hover:text-crimson-hi"
          >
            <LogOut size={10} /> Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'order' && <Ordering onOrderCount={setOrderCount} />}
            {tab === 'verify' && <Verification clinician={clinician} />}
            {tab === 'react' && <Reactions />}
            {tab === 'impact' && <Dashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav — thumb-reachable on tablets */}
      <nav id="bottom-nav" className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-panel/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex min-h-18 flex-col items-center justify-center gap-1 text-[11px] font-bold transition ${
                tab === id ? (id === 'react' ? 'text-amberwarn' : id === 'impact' ? 'text-verified' : 'text-cyanst') : 'text-mute'
              }`}
            >
              <Icon size={22} />
              {label}
              {tab === id && <span className={`h-1 w-8 rounded-full ${id === 'react' ? 'bg-amberwarn' : id === 'impact' ? 'bg-verified' : 'bg-cyanst'}`} />}
            </button>
          ))}
          <button
            onClick={() => setSurveyOpen(true)}
            className="flex min-h-18 flex-col items-center justify-center gap-1 text-[11px] font-bold text-crimson-hi"
            id="survey-nav-button"
          >
            <MessageSquareHeart size={22} />
            Pilot Survey
          </button>
        </div>
      </nav>

      {/* Live activity ticker */}
      <div className="fixed bottom-20 right-4 z-30 hidden items-center gap-1.5 rounded-full border border-edge bg-panel/90 px-3 py-1.5 text-[10px] font-bold text-cyanst backdrop-blur sm:flex">
        <Activity size={12} className="animate-pulse" /> {orderCount} active order{orderCount === 1 ? '' : 's'}
      </div>

      {/* Offline sync badge */}
      {pendingSync > 0 && (
        <button
          id="pending-sync-badge"
          onClick={() => void flushQueue()}
          className="fixed bottom-20 left-4 z-30 flex items-center gap-1.5 rounded-full border border-amberwarn/50 bg-amberwarn/15 px-3 py-1.5 text-[10px] font-bold text-amberwarn backdrop-blur"
          title="Tap to retry sync now"
        >
          <CloudUpload size={12} className="animate-pulse" /> {pendingSync} action{pendingSync === 1 ? '' : 's'} pending sync
        </button>
      )}

      <Survey open={surveyOpen} onClose={() => setSurveyOpen(false)} />
    </div>
  )
}
