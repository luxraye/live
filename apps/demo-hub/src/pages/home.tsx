import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetNationalStats } from '@workspace/api-client-react';
import { AnimatedNumber } from '@/components/animated-number';
import { BlockchainStats } from '@/components/BlockchainStats';
import { LedgerFeed } from '@/components/LedgerFeed';
import {
  Database, Network, ShieldCheck, Activity, Map, Lock,
  ExternalLink, X, Maximize2, ChevronDown, Users, Terminal,
  Mail, Smartphone, Truck, FlaskConical, Heart, QrCode, Download,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

interface RoadmapItem {
  id: string;
  name: string;
  fullName: string;
  status: 'LIVE' | 'IN_DEVELOPMENT' | 'PLANNED';
  completion: number;
  description: string;
  detail: string;
  url: string | null;
  icon: React.ReactNode;
}

// ─── Configuration — update after running EAS build ──────────────────────────

/**
 * After running `eas build --platform android --profile preview`, paste the
 * APK download URL from expo.dev here. Leave as an empty string until ready.
 * Example: "https://expo.dev/artifacts/eas/xxxx.apk"
 */
const PULSE_MOBILE_APK_URL = 'https://expo.dev/artifacts/eas/FtHBvqOh8tQf_Qjta5pBk9DpQ8FsTgEJ174zZ3nMWqQ.apk';

// ─── Static Data ─────────────────────────────────────────────────────────────

const ROADMAP: RoadmapItem[] = [
  {
    id: 'pulse',
    name: 'Pulse',
    fullName: 'Pulse — Donor Portal',
    status: 'LIVE',
    completion: 85,
    description: 'Citizen donor registration, donation history tracking, and airtime reward system.',
    detail:
      'Web-based portal for Botswana citizens to enroll as blood donors, view their donation history on the Strand ledger, and receive automated airtime compensation for each qualifying donation.',
    url: '/pulse/',
    icon: <Heart className="w-4 h-4" />,
  },
  {
    id: 'pulse-mobile',
    name: 'Pulse Mobile',
    fullName: 'Pulse Mobile — Donor App',
    status: 'LIVE',
    completion: 70,
    description: 'Native mobile donor app for Android and iOS field registration.',
    detail:
      'React Native / Expo application enabling community health workers and donors to register in the field. Designed for low-connectivity rural environments with a mobile-first UX.',
    url: null,
    icon: <Smartphone className="w-4 h-4" />,
  },
  {
    id: 'sanctum',
    name: 'Sanctum',
    fullName: 'Sanctum — Hospital Blood Bank',
    status: 'LIVE',
    completion: 80,
    description: 'Facility-level interface for blood bank technicians to log, manage, and route units.',
    detail:
      'Terminal-style workstation interface for hospital blood bank staff. Logs incoming units onto the Strand ledger, manages real-time inventory, and submits routing requests to the Torrent engine for inter-facility transfers.',
    url: '/sanctum/',
    icon: <Database className="w-4 h-4" />,
  },
  {
    id: 'vigil',
    name: 'Vigil',
    fullName: 'Vigil — National Dashboard',
    status: 'LIVE',
    completion: 80,
    description: 'Ministry-level epidemiological command dashboard for national blood grid oversight.',
    detail:
      'Real-time situational awareness for NBTS directors and Ministry of Health officials. Displays national inventory distribution across all facilities, shortage alerts ranked by severity, and the live Strand ledger event feed.',
    url: '/vigil/',
    icon: <Network className="w-4 h-4" />,
  },
  {
    id: 'crucible',
    name: 'Crucible',
    fullName: 'Crucible — Blood Processing Lab',
    status: 'PLANNED',
    completion: 0,
    description: 'Lab technician interface for screening, testing, and component separation of blood units.',
    detail:
      'Fills the critical gap between collection and distribution. Lab analysts log HIV, Hep B/C, malaria, and syphilis screening results. Each test outcome is cryptographically attested on the Strand ledger before a unit can be released for distribution.',
    url: null,
    icon: <FlaskConical className="w-4 h-4" />,
  },
  {
    id: 'transfuse',
    name: 'Transfuse',
    fullName: 'Transfuse — Bedside Clinical Interface',
    status: 'PLANNED',
    completion: 0,
    description: "Point-of-care interface for nurses to verify, administer, and close a unit's lifecycle.",
    detail:
      'The final node in the blood lifecycle. Clinicians scan a unit and a patient wristband, verify compatibility via the ledger, and log the transfusion event — permanently and immutably closing the chain of custody.',
    url: null,
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'relay',
    name: 'Relay',
    fullName: 'Relay — Courier & Transport',
    status: 'PLANNED',
    completion: 0,
    description: 'Mobile app for blood couriers managing inter-facility transport and chain-of-custody handoffs.',
    detail:
      'GPS-tracked courier interface for blood logistics personnel. Continuous temperature monitoring during transit, digital handoff signatures at each facility checkpoint, and real-time status updates streamed to Vigil.',
    url: null,
    icon: <Truck className="w-4 h-4" />,
  },
];

const STATUS_CONFIG = {
  LIVE: { label: 'LIVE', classes: 'bg-primary/10 text-primary border-primary/30' },
  IN_DEVELOPMENT: { label: 'IN DEV', classes: 'bg-secondary/10 text-secondary border-secondary/30' },
  PLANNED: { label: 'PLANNED', classes: 'bg-muted text-muted-foreground border-border' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppModal({ url, title, onClose }: AppModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-background"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <BloodchainWordmark small />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider border border-border hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">
              <Maximize2 className="w-3 h-3" /> New Tab
            </a>
            <button onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Close">
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
        <iframe src={url} title={title} className="flex-1 w-full border-0" allow="fullscreen" />
      </motion.div>
    </AnimatePresence>
  );
}

function BloodchainWordmark({ small = false }: { small?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${small ? '' : ''}`}>
      {/* Pulse-line SVG mark */}
      <svg
        viewBox="0 0 36 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={small ? 'w-7 h-4' : 'w-9 h-5'}
        aria-hidden="true"
      >
        <polyline
          points="0,10 6,10 9,2 13,18 17,6 21,14 25,10 36,10"
          stroke="hsl(350 96% 43%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className={`font-heading font-bold tracking-tighter ${small ? 'text-sm' : 'text-base md:text-lg'} text-foreground`}>
        BLOODCHAIN
      </span>
    </div>
  );
}

const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-10%' }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const StatBlock = ({ label, value, loading, error, delay = 0 }: { label: string; value?: number; loading: boolean; error: boolean; delay?: number }) => (
  <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border p-6 lg:p-12 last:border-0 relative overflow-hidden group hover:bg-muted/30 transition-colors">
    <Reveal delay={delay}>
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{label}</div>
      <div className="font-heading text-5xl lg:text-7xl font-bold tracking-tighter">
        {loading ? <span className="text-muted/50 animate-pulse">---</span>
          : error || value === undefined ? <span className="text-destructive">ERR</span>
          : <AnimatedNumber value={value} />}
      </div>
    </Reveal>
  </div>
);

function ProgressBar({ pct, status }: { pct: number; status: RoadmapItem['status'] }) {
  const fill = status === 'LIVE' ? 'bg-primary' : status === 'IN_DEVELOPMENT' ? 'bg-secondary' : 'bg-border';
  return (
    <div className="w-full h-1 bg-muted mt-3">
      <div className={`h-full ${fill} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RoadmapNode({ item, index, openModal }: { item: RoadmapItem; index: number; openModal: (url: string, title: string) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const isLast = index === ROADMAP.length - 1;

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
      )}

      <div className="flex gap-4">
        {/* Timeline dot */}
        <div className="relative z-10 flex-shrink-0 mt-2">
          <div className={`w-10 h-10 border flex items-center justify-center transition-colors
            ${item.status === 'LIVE' ? 'border-primary bg-primary/10 text-primary' :
              item.status === 'IN_DEVELOPMENT' ? 'border-secondary bg-secondary/10 text-secondary' :
              'border-border bg-background text-muted-foreground'}`}>
            {item.icon}
          </div>
        </div>

        {/* Card */}
        <div className={`flex-1 mb-6 border border-border bg-card transition-colors
          ${item.status !== 'PLANNED' ? 'cursor-pointer hover:border-primary/50' : 'cursor-pointer hover:border-border/80'}`}
          onClick={() => setOpen(!open)}>
          <div className="p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-heading font-bold text-base">{item.name}</span>
                <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border ${cfg.classes}`}>
                  {cfg.label}
                </span>
                {item.status !== 'PLANNED' && (
                  <span className="font-mono text-[10px] text-muted-foreground">{item.completion}%</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
              <ProgressBar pct={item.completion} status={item.status} />
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-foreground/80">{item.detail}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {item.url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openModal(item.url!, item.fullName); }}
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" /> Open {item.name}
                      </button>
                    )}
                    {item.id === 'pulse-mobile' && (
                      PULSE_MOBILE_APK_URL ? (
                        <a
                          href={PULSE_MOBILE_APK_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3 h-3" /> Download APK
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground border border-border px-3 py-2 flex items-center gap-2">
                          <Smartphone className="w-3 h-3" /> Install via Expo Go — see Demo Access below
                        </span>
                      )
                    )}
                    {item.status === 'PLANNED' && (
                      <span className="font-mono text-xs text-muted-foreground">Under design — Q2 2026</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', org: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await fetch("https://formsubmit.co/ajax/gnakedi@bloodchain.life", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Bloodchain Enquiry — ${form.org || form.name}`,
          name: form.name,
          organization: form.org,
          email: form.email,
          message: form.message,
          _template: 'box'
        })
      });
      
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', org: '', email: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full bg-background border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Name</label>
          <input type="text" name="name" required value={form.name} onChange={handleChange}
            placeholder="Your full name" className={inputClass} disabled={status === 'loading'} />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Organisation</label>
          <input type="text" name="org" value={form.org} onChange={handleChange}
            placeholder="Ministry / Hospital / Fund" className={inputClass} disabled={status === 'loading'} />
        </div>
      </div>
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Email</label>
        <input type="email" name="email" required value={form.email} onChange={handleChange}
          placeholder="you@organisation.bw" className={inputClass} disabled={status === 'loading'} />
      </div>
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-2">Message</label>
        <textarea name="message" required value={form.message} onChange={handleChange}
          placeholder="Partnership enquiry, investment interest, deployment request..." rows={4}
          className={`${inputClass} resize-none`} disabled={status === 'loading'} />
      </div>
      
      {status === 'error' && (
        <div className="text-red-500 font-mono text-xs">Failed to send message. Please try again later.</div>
      )}
      {status === 'success' && (
        <div className="text-green-500 font-mono text-xs">Message sent successfully! We'll be in touch.</div>
      )}
      
      <button type="submit" disabled={status === 'loading' || status === 'success'}
        className="flex items-center gap-2 px-6 py-4 bg-foreground text-background font-mono text-sm uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50">
        <Mail className="w-4 h-4" /> 
        {status === 'loading' ? 'Sending...' : status === 'success' ? 'Sent' : 'Send Enquiry'}
      </button>
    </form>
  );
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

const GATE_PIN = '2806';

function PinGate({ children, sectionId, label }: { children: React.ReactNode; sectionId: string; label: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', handleKey);
    inputRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  const handleStripClick = () => {
    if (unlocked) setExpanded(prev => !prev);
  };

  const handleStripDoubleClick = () => {
    if (!unlocked) {
      setPin('');
      setModalOpen(true);
    }
  };

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === GATE_PIN) {
      setUnlocked(true);
      setExpanded(true);
      setModalOpen(false);
    } else {
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 450);
      inputRef.current?.focus();
    }
  };

  return (
    <div data-testid={`pin-gate-${sectionId}`}>
      {/* Locked / toggle strip */}
      <div
        onClick={handleStripClick}
        onDoubleClick={handleStripDoubleClick}
        className="border border-border bg-card/60 px-5 py-4 flex items-center justify-between cursor-default select-none hover:bg-muted/20 transition-colors"
        data-testid={`pin-gate-strip-${sectionId}`}
      >
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
          <span>// RESTRICTED — {label}</span>
        </div>
        {unlocked && (
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Gated content */}
      <AnimatePresence>
        {unlocked && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-8">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIN modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-xs border border-border bg-background p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`pin-modal-close-${sectionId}`}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-primary" />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Access Code</span>
              </div>
              <form onSubmit={submitPin}>
                <motion.input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`w-full bg-background border px-4 py-3 font-mono text-2xl tracking-[0.5em] text-center text-foreground focus:outline-none transition-colors ${shake ? 'border-destructive' : 'border-border focus:border-foreground'}`}
                  data-testid={`pin-input-${sectionId}`}
                />
                <button
                  type="submit"
                  className="mt-4 w-full px-4 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid={`pin-submit-${sectionId}`}
                >
                  Confirm
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FounderPhoto() {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div className="w-24 h-24 mb-6 border-2 border-foreground bg-muted flex items-center justify-center">
        <span className="font-heading text-2xl font-bold text-foreground tracking-tight select-none">GN</span>
      </div>
    );
  }

  return (
    <div className="w-24 h-24 mb-6 overflow-hidden border-2 border-foreground">
      <img
        src="/founder.png"
        alt="Gift Jr Nakedi — Founder"
        className="w-full h-full object-cover object-top"
        onError={() => setImgFailed(true)}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: stats, isLoading, isError } = useGetNationalStats();
  const [modal, setModal] = useState<{ url: string; title: string } | null>(null);

  const openModal = useCallback((url: string, title: string) => setModal({ url, title }), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {modal && <AppModal url={modal.url} title={modal.title} onClose={closeModal} />}

      {/* ── HEADER ── */}
      <header className="fixed top-0 w-full border-b border-border bg-background/80 backdrop-blur-md z-50">
        <div className="flex justify-between items-center px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-5">
            <BloodchainWordmark />
            <span className="hidden md:inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sovereign Health Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <a href="#ledger" className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Ledger
              </a>
              <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
              <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
              <a href="#team" className="hover:text-foreground transition-colors">Team</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
              <span>Live System</span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 lg:pt-32">

        {/* ── HERO ── */}
        <section className="px-4 py-12 md:px-8 md:py-24 border-b border-border relative overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-mono mb-8 uppercase tracking-wider">
                <Activity className="w-3 h-3" /> Restricted Distribution
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="font-heading text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] tracking-tighter mb-8 max-w-[12ch]">
                BLOODCHAIN
              </h1>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 mt-12 md:mt-24">
              <div className="md:col-span-4 border-t border-border pt-4">
                <Reveal delay={0.2}>
                  <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-2">Mandate</p>
                  <p className="text-lg leading-relaxed font-medium">
                    National sovereign infrastructure for cryptographic tracking and algorithmic distribution of the blood supply.
                  </p>
                </Reveal>
              </div>
              <div className="md:col-span-4 border-t border-border pt-4">
                <Reveal delay={0.3}>
                  <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-2">Authority</p>
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    Ministry of Health, Republic of Botswana. End-to-end provenance from donor vein to patient transfusion.
                  </p>
                </Reveal>
              </div>
              <div className="md:col-span-4 border-t border-border pt-4 flex flex-col items-start md:items-end">
                <Reveal delay={0.4} className="w-full">
                  <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest mb-6 md:text-right">Action</p>
                  <div className="flex flex-col gap-3 w-full">
                    <a href="#contact"
                      className="flex items-center justify-between px-6 py-4 bg-foreground text-background font-mono text-sm hover:bg-primary hover:text-primary-foreground transition-colors w-full group">
                      Partner With Us <Mail className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </a>
                    <a href="#roadmap"
                      className="flex items-center justify-between px-6 py-4 border border-foreground text-foreground font-mono text-sm hover:bg-foreground hover:text-background transition-colors w-full group">
                      View Full Roadmap <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXECUTIVE MANDATE ── */}
        <section className="py-24 px-4 md:px-8 border-b border-border bg-muted/10">
          <div className="max-w-4xl mx-auto text-center">
            <Reveal>
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-8">Executive Summary</div>
              <h2 className="font-heading text-3xl md:text-5xl leading-tight font-medium tracking-tight mb-8">
                "The national blood supply is critical sovereign infrastructure. It can no longer rely on fragmented databases, verbal agreements, or paper manifests."
              </h2>
              <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
                — Ministry of Health Strategic Directive 2025
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── LIVE STATS ── */}
        <section className="border-b border-border bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0">
            <StatBlock label="Total Units in Stock" value={stats?.totalUnitsInStock} loading={isLoading} error={isError} delay={0.1} />
            <StatBlock label="Units Collected Today" value={stats?.unitsCollectedToday} loading={isLoading} error={isError} delay={0.2} />
            <StatBlock label="Facilities Online" value={stats?.facilitiesOnline} loading={isLoading} error={isError} delay={0.3} />
          </div>
          <div className="border-t border-border p-6 lg:p-12">
            <Reveal delay={0.4}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground mb-2">Inventory by Blood Type</h3>
                  <div className="flex flex-wrap gap-4 font-mono text-lg">
                    {isLoading ? <span className="text-muted/50 animate-pulse">Scanning national inventory...</span>
                      : isError || !stats?.inventoryByBloodType ? <span className="text-destructive">System Offline</span>
                      : Object.entries(stats.inventoryByBloodType).map(([type, count]) => (
                          <div key={type} className="flex items-baseline gap-1">
                            <span className="font-bold text-foreground">{type}</span>
                            <span className="text-muted-foreground text-sm">:{String(count)}</span>
                          </div>
                        ))}
                  </div>
                </div>
                {stats?.activeAlerts !== undefined && stats.activeAlerts > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2 border border-destructive bg-destructive/5 text-destructive font-mono text-sm uppercase tracking-wider">
                    <span className="w-2 h-2 bg-destructive rounded-full animate-ping" />
                    {stats.activeAlerts} Active Shortage {stats.activeAlerts === 1 ? 'Alert' : 'Alerts'}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── THE LEDGER (STRAND / HYPERLEDGER FABRIC) ── */}
        <section id="ledger" className="py-24 px-4 md:px-8 border-b border-border bg-black/40 relative">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Header & Protocol Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <Reveal>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
                      Strand Protocol · Hyperledger Fabric
                    </span>
                  </div>
                  <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                    Cryptographic Truth.
                  </h2>
                  <div className="space-y-4 text-base text-zinc-400 leading-relaxed">
                    <p>
                      Every blood donation verified across Botswana's regional referral hospitals is cryptographically anchored onto a sovereign Hyperledger Fabric ledger.
                    </p>
                    <p>
                      Donor identities are protected via one-way <span className="text-zinc-200 font-mono text-sm">SHA-256</span> pseudonymization. The public audit stream below is live, unauthenticated, and permanently verifiable by hospitals, regulators, and citizens.
                    </p>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-7">
                <Reveal delay={0.15}>
                  <BlockchainStats />
                </Reveal>
              </div>
            </div>

            {/* Live Public Ledger Event Feed */}
            <Reveal delay={0.25}>
              <LedgerFeed />
            </Reveal>
          </div>
        </section>

        {/* ── ROUTING ENGINE (TORRENT) ── */}
        <section className="py-24 px-4 md:px-8 border-b border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal className="order-2 lg:order-1 relative aspect-square lg:aspect-[4/3] border border-border/20 p-4 overflow-hidden">
              <div className="absolute inset-0 bg-[url('/botswana-map.jpg')] bg-cover bg-center opacity-80 mix-blend-lighten filter grayscale transition-all duration-1000" />
              <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
              <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
                <div className="font-mono text-xs text-foreground bg-background/90 p-2 inline-block self-end backdrop-blur-sm uppercase">Network Topology</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border/30 bg-background/10 backdrop-blur-md p-4">
                    <div className="font-mono text-[10px] uppercase text-background/60 mb-1">Latency</div>
                    <div className="font-mono text-xl text-background">14ms</div>
                  </div>
                  <div className="border border-border/30 bg-background/10 backdrop-blur-md p-4">
                    <div className="font-mono text-[10px] uppercase text-background/60 mb-1">Coverage</div>
                    <div className="font-mono text-xl text-background">100%</div>
                  </div>
                </div>
              </div>
            </Reveal>
            <div className="order-1 lg:order-2">
              <Reveal delay={0.2}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 border border-border/30 flex items-center justify-center bg-background/5">
                    <Network className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-widest text-background/60">Torrent Engine</span>
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">Algorithmic Distribution.</h2>
                <div className="space-y-6 text-lg text-background/80 leading-relaxed">
                  <p>Blood is perishable. Distance is vast. The Torrent routing engine constantly recalculates the optimal distribution of supply across all national facilities based on real-time burn rates and transit latencies.</p>
                  <p>It anticipates shortages before they happen, routing critical units to rural clinics proactively.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── SOVEREIGN ARCHITECTURE ── */}
        <section className="py-24 px-4 md:px-8 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">Sovereign Architecture</h2>
                <p className="text-xl text-muted-foreground">Built for resilience. Designed for privacy.</p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-l border-border">
              <Reveal delay={0.1} className="border-r border-b border-border p-8 md:p-12 hover:bg-muted/20 transition-colors">
                <ShieldCheck className="w-8 h-8 text-primary mb-6" />
                <h3 className="font-heading text-xl font-bold mb-3">Zero-Knowledge Proofs</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Donor identities are mathematically decoupled from medical records. We prove eligibility and test results without exposing PII.</p>
              </Reveal>
              <Reveal delay={0.2} className="border-r border-b border-border p-8 md:p-12 hover:bg-muted/20 transition-colors">
                <Lock className="w-8 h-8 text-primary mb-6" />
                <h3 className="font-heading text-xl font-bold mb-3">Air-Gapped Resilience</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">Facilities can operate autonomously during network outages, reconciling cryptographic state when connectivity is restored.</p>
              </Reveal>
              <Reveal delay={0.3} className="border-r border-b border-border p-8 md:p-12 hover:bg-muted/20 transition-colors relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/sovereign-architecture.jpg')] bg-cover bg-center opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-background/90 group-hover:bg-background/40 transition-colors duration-700" />
                <div className="relative z-10">
                  <Map className="w-8 h-8 text-primary mb-6" />
                  <h3 className="font-heading text-xl font-bold mb-3">On-Premise Vaults</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">Data never leaves the Republic. The entire ledger is hosted within Ministry of Health sovereign data centres.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── PRODUCT ROADMAP ─────────────────────────────────────── NEW ── */}
        <section id="roadmap" className="py-24 px-4 md:px-8 border-b border-border bg-muted/10">
          <div className="max-w-4xl mx-auto">
            <PinGate sectionId="roadmap" label="Product Roadmap">
              <Reveal>
                <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Product Roadmap</div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">The Full Lifecycle.</h2>
                <p className="text-muted-foreground text-lg mb-16 max-w-2xl">
                  Seven interfaces. One unbroken chain — from the donor's vein to the patient's bedside. Click any node to expand.
                </p>
              </Reveal>
              <div>
                {ROADMAP.map((item, i) => (
                  <RoadmapNode key={item.id} item={item} index={i} openModal={openModal} />
                ))}
              </div>
            </PinGate>
          </div>
        </section>

        {/* ── DEPLOYMENT TIMELINE ── */}
        <section className="py-24 px-4 md:px-8 border-b border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="flex items-center gap-3 mb-16">
                <span className="font-mono text-xs uppercase tracking-widest text-background/60">Rollout Schedule</span>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-border/30">
              <Reveal delay={0.1} className="border-r border-b border-border/30 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-background/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <div className="relative z-10">
                  <div className="font-mono text-xs uppercase text-primary mb-4 bg-primary/10 inline-block px-2 py-1">Completed</div>
                  <h3 className="font-heading text-3xl font-bold mb-4">Phase I: Capital</h3>
                  <div className="font-mono text-sm text-background/60 mb-6">Gaborone District</div>
                  <p className="text-background/80 text-sm leading-relaxed">Initial deployment across Princess Marina Hospital and 4 secondary clinics. Strand ledger genesis block instantiated. 100% verifiable tracking achieved within 30 days.</p>
                </div>
              </Reveal>
              <Reveal delay={0.2} className="border-r border-b border-border/30 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-background/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-primary animate-pulse rounded-full" />
                    <div className="font-mono text-xs uppercase text-background bg-background/20 inline-block px-2 py-1">Active Deployment</div>
                  </div>
                  <h3 className="font-heading text-3xl font-bold mb-4">Phase II: National</h3>
                  <div className="font-mono text-sm text-background/60 mb-6">Republic-Wide</div>
                  <p className="text-background/80 text-sm leading-relaxed">Integration of all 18 district hospitals and mobile donation centres. Torrent engine activated for predictive routing across 580,000 sq km.</p>
                </div>
              </Reveal>
              <Reveal delay={0.3} className="border-r border-b border-border/30 p-8 md:p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-background/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <div className="relative z-10">
                  <div className="font-mono text-xs uppercase text-background/40 mb-4 border border-border/30 inline-block px-2 py-1">Pending 2026</div>
                  <h3 className="font-heading text-3xl font-bold mb-4 text-background/40">Phase III: SADC</h3>
                  <div className="font-mono text-sm text-background/40 mb-6">Cross-Border</div>
                  <p className="text-background/50 text-sm leading-relaxed">Federating the Strand protocol across Southern African Development Community partners to manage regional crisis reserves and emergency transfers.</p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── PLATFORM SUITE ─────────────────────────────────────── NEW ── */}
        <section id="platform" className="py-24 px-4 md:px-8 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <PinGate sectionId="platform" label="Platform Suite">
            <Reveal>
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Platform Suite</div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-16">Access Live Interfaces.</h2>
            </Reveal>

            {/* Live apps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-border mb-0">
              {[
                { label: 'Vigil', name: 'National Dashboard', desc: 'Ministry oversight and epidemiological command.', url: '/vigil/', status: 'LIVE' },
                { label: 'Sanctum', name: 'Hospital Blood Bank', desc: 'Facility-level unit logging and inventory management.', url: '/sanctum/', status: 'LIVE' },
                { label: 'Pulse', name: 'Donor Portal', desc: 'Citizen donor registration and impact tracking.', url: '/pulse/', status: 'LIVE' },
                { label: 'Pulse Mobile', name: 'Donor App', desc: 'Field registration via Expo Go on any smartphone.', url: null, status: 'LIVE' },
              ].map((app, i) => (
                <Reveal key={app.label} delay={i * 0.1}>
                  {app.url ? (
                    <button
                      onClick={() => openModal(app.url!, `${app.label} — ${app.name}`)}
                      className="block w-full text-left border-r border-b border-border p-8 hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{app.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 px-2 py-0.5">{app.status}</span>
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-2 group-hover:text-primary transition-colors">{app.name}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{app.desc}</p>
                      <div className="flex items-center gap-2 font-mono text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="w-3 h-3" /> Open
                      </div>
                    </button>
                  ) : (
                    <div className="border-r border-b border-border p-8">
                      <div className="flex justify-between items-start mb-8">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{app.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 px-2 py-0.5">{app.status}</span>
                      </div>
                      <h3 className="font-heading text-lg font-bold mb-2">{app.name}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{app.desc}</p>
                      <a href="#demo-access" className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <Smartphone className="w-3 h-3" /> See download instructions
                      </a>
                    </div>
                  )}
                </Reveal>
              ))}
            </div>

            {/* Roadmap apps (dimmed) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-border opacity-40">
              {[
                { label: 'Crucible', name: 'Blood Processing Lab', desc: 'Screening and component separation attestation.' },
                { label: 'Transfuse', name: 'Bedside Clinical Interface', desc: 'Point-of-care administration and lifecycle close.' },
                { label: 'Relay', name: 'Courier & Transport', desc: 'Chain-of-custody handoffs and temperature monitoring.' },
              ].map((app, i) => (
                <Reveal key={app.label} delay={i * 0.1}>
                  <div className="border-r border-b border-border p-8">
                    <div className="flex justify-between items-start mb-8">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{app.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">Planned</span>
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-2">{app.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{app.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            </PinGate>
          </div>
        </section>

        {/* ── DEMO ACCESS / TEST CREDENTIALS ──────────────────────── NEW ── */}
        <section id="demo-access" className="py-24 px-4 md:px-8 border-b border-border bg-card">
          <div className="max-w-7xl mx-auto">
            <PinGate sectionId="demo-access" label="Demo Access">
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-primary" />
                <div className="font-mono text-xs uppercase tracking-widest text-primary">Demo Access</div>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">Test Credentials & Access.</h2>
              <p className="text-muted-foreground mb-12 max-w-2xl">All interfaces are open during the demo period — no login required. Use the data below to explore each system.</p>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  app: 'Vigil — National Dashboard',
                  path: '/vigil/',
                  access: 'Read-only. No credentials required.',
                  items: [
                    'Observe national inventory in real time across all 6 facilities',
                    'View shortage alerts by blood type on the Alerts page',
                    'Use the Alert Routing form to simulate a blood dispatch',
                  ],
                  cta: null,
                  apkUrl: null,
                },
                {
                  app: 'Sanctum — Hospital Blood Bank',
                  path: '/sanctum/',
                  access: 'Open access. Default facility: FAC-001 (Princess Marina).',
                  items: [
                    'Donor ID to log a unit: D-2026-0891',
                    'Bag number example: BW-2026-008821',
                    'Navigate: CMD_CENTRE → UNIT_INDUCT → ROUTE_CTRL',
                  ],
                  cta: null,
                  apkUrl: null,
                },
                {
                  app: 'Pulse — Donor Portal',
                  path: '/pulse/',
                  access: 'Registration-based. No login required.',
                  items: [
                    'Click "Begin Registration" to create a new donor profile',
                    'Select any blood type (O+, A+, B+, AB−, O−…) and district',
                    'After submission you land on your personal dashboard',
                  ],
                  cta: null,
                  apkUrl: null,
                },
                {
                  app: 'Pulse Mobile — Donor App',
                  path: null,
                  access: PULSE_MOBILE_APK_URL
                    ? 'Direct Android APK available — no Expo Go required.'
                    : 'Install Expo Go on your phone, then scan the QR code.',
                  items: PULSE_MOBILE_APK_URL
                    ? [
                        '1. Tap "Download APK" below — opens the direct build link',
                        '2. Open the APK on your Android device and tap Install',
                        '3. If prompted, enable "Install from unknown sources" in Settings',
                      ]
                    : [
                        '1. Download Expo Go (free) from App Store or Play Store',
                        '2. Open the Expo link or scan the QR code (available on request)',
                        '3. Same registration flow as Pulse web — same demo data applies',
                      ],
                  cta: PULSE_MOBILE_APK_URL
                    ? null
                    : { label: 'See Mobile Setup →', href: '#demo-access' },
                  apkUrl: PULSE_MOBILE_APK_URL || null,
                },
              ].map((item) => (
                <Reveal key={item.app}>
                  <div className="border border-border p-6 h-full flex flex-col">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">{item.app}</div>
                    <div className="font-mono text-xs text-muted-foreground mb-4 pb-4 border-b border-border">{item.access}</div>
                    <ul className="space-y-2 flex-1">
                      {item.items.map((i) => (
                        <li key={i} className="font-mono text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-primary mt-0.5 flex-shrink-0">›</span> {i}
                        </li>
                      ))}
                    </ul>
                    {'apkUrl' in item && item.apkUrl && (
                      <a
                        href={item.apkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors self-start"
                      >
                        <Download className="w-3 h-3" /> Download APK
                      </a>
                    )}
                    {item.cta && (
                      <a href={item.cta.href}
                        className="mt-6 flex items-center gap-2 px-4 py-2 border border-foreground text-foreground font-mono text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors self-start">
                        {item.cta.label}
                      </a>
                    )}
                    {item.path && (
                      <button
                        onClick={() => openModal(item.path!, item.app)}
                        className="mt-6 flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors self-start">
                        <Maximize2 className="w-3 h-3" /> Open {item.app.split(' — ')[0]}
                      </button>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>

            {/* ── MOBILE TESTING PANEL ── */}
            <Reveal delay={0.15}>
              <div className="mt-8 border border-primary/30 bg-primary/5 p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                  {/* Left: primary APK install */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                        Install on Your Phone — Direct APK
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl font-bold mb-4">Pulse Mobile Beta</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      No app store or Expo required — install directly from the standalone{' '}
                      <strong className="text-foreground">Android APK</strong> and Pulse Mobile
                      runs on your device in under a minute.
                    </p>
                    <ol className="space-y-3 mb-6">
                      {(PULSE_MOBILE_APK_URL
                        ? [
                            { n: '01', text: 'Tap "Download APK" — the standalone build downloads directly to your Android device.' },
                            { n: '02', text: 'Open the downloaded APK and tap Install. Enable "Install from unknown sources" if prompted.' },
                            { n: '03', text: 'Pulse Mobile launches instantly. No account required to browse.' },
                            { n: '04', text: 'Tap "Become a donor" to register and receive your donor ID.' },
                          ]
                        : [
                            { n: '01', text: 'Request the APK via the contact form below — you get a direct download link.' },
                            { n: '02', text: 'Open the APK on your Android device and tap Install. Enable "Install from unknown sources" if prompted.' },
                            { n: '03', text: 'Pulse Mobile launches instantly. No account required to browse.' },
                            { n: '04', text: 'Tap "Become a donor" to register and receive your donor ID.' },
                          ]
                      ).map((step) => (
                        <li key={step.n} className="flex items-start gap-4">
                          <span className="font-mono text-xs text-primary border border-primary/30 px-2 py-0.5 shrink-0 mt-0.5">
                            {step.n}
                          </span>
                          <span className="text-sm text-foreground/80">{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap gap-3">
                      {PULSE_MOBILE_APK_URL ? (
                        <a
                          href={PULSE_MOBILE_APK_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                          data-testid="button-download-apk-primary"
                        >
                          <Download className="w-3.5 h-3.5" /> Download APK (Android)
                        </a>
                      ) : (
                        <a
                          href="#contact"
                          className="flex items-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
                          data-testid="button-request-apk"
                        >
                          <Mail className="w-3.5 h-3.5" /> Request the APK
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right: APK details + Expo Go alternative */}
                  <div className="flex flex-col gap-5">
                    {PULSE_MOBILE_APK_URL ? (
                      <div className="border border-primary/40 bg-primary/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Download className="w-4 h-4 text-primary" />
                          <p className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
                            Android APK — Direct Download
                          </p>
                        </div>
                        <p className="font-mono text-xs text-foreground/70 leading-relaxed mb-4">
                          Standalone build — no Expo Go required. Download and install directly on any Android device.
                        </p>
                        <a
                          href={PULSE_MOBILE_APK_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-xs uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors w-full justify-center"
                        >
                          <Download className="w-3.5 h-3.5" /> Download APK
                        </a>
                        <p className="font-mono text-[9px] text-muted-foreground mt-2 text-center">
                          Enable "Install from unknown sources" in Android settings if prompted.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-border/50 p-5 bg-card/50">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                          Standalone APK
                        </p>
                        <p className="font-mono text-xs text-foreground/70 leading-relaxed">
                          A direct Android APK download (no Expo Go required) is being prepared.{' '}
                          <a href="#contact" className="text-primary hover:underline">Request the APK</a> via the contact form.
                        </p>
                      </div>
                    )}

                    {/* Alternative: Expo Go */}
                    <div className="border border-border bg-card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          Alternative Method — Expo Go
                        </span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-3 leading-relaxed">
                        On iOS, or prefer not to install an APK? Use the free{' '}
                        <strong className="text-foreground">Expo Go</strong> app: open it → tap{' '}
                        <strong className="text-foreground">Enter URL manually</strong> → paste:
                      </p>
                      <div className="bg-muted/60 border border-border px-3 py-2 font-mono text-xs text-primary break-all">
                        exp://[replit-expo-domain]
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground mt-2 mb-4">
                        The exact URL is printed as a QR code in the Replit shell each time the Expo workflow starts.
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <a
                          href="https://apps.apple.com/app/expo-go/id982107779"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground font-mono text-xs uppercase tracking-wider hover:bg-muted/40 transition-colors"
                        >
                          App Store (iOS)
                        </a>
                        <a
                          href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground font-mono text-xs uppercase tracking-wider hover:bg-muted/40 transition-colors"
                        >
                          Play Store (Android)
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            </PinGate>
          </div>
        </section>

        {/* ── TEAM ────────────────────────────────────────────────── NEW ── */}
        <section id="team" className="py-24 px-4 md:px-8 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <div className="font-mono text-xs uppercase tracking-widest text-primary">The Team</div>
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Built by People Who Mean It.</h2>
              <p className="text-muted-foreground text-lg mb-16 max-w-2xl">
                Bloodchain is a Botswana-founded health technology venture. We are engineers, health policy advocates, and operators committed to fixing sovereign infrastructure — starting with blood.
              </p>
            </Reveal>

            <div className="max-w-xl mx-auto border border-border">
              <Reveal delay={0.1} className="p-8 md:p-12">
                {/* Founder photo with GN initials fallback */}
                <FounderPhoto />

                <h3 className="font-heading text-xl font-bold mb-1">Gift Jr Nakedi</h3>
                <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Founder & Lead Dev</div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Visionary technologist and health infrastructure advocate. Building the cryptographic backbone of Botswana's national blood supply.
                </p>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-primary" />
                    <a href="mailto:gnakedi@bloodchain.life" className="hover:text-foreground transition-colors">gnakedi@bloodchain.life</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Map className="w-3 h-3 text-primary" />
                    <span>Gaborone, Botswana</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── CONTACT ─────────────────────────────────────────────── NEW ── */}
        <section id="contact" className="py-24 px-4 md:px-8 border-b border-border bg-foreground text-background">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <Reveal>
                <div className="font-mono text-xs uppercase tracking-widest text-background/40 mb-4">Get in Touch</div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">Partner With Us.</h2>
                <div className="space-y-6 text-background/80 leading-relaxed">
                  <p>We are actively seeking partnerships with the Botswana Ministry of Health, district hospitals, the National Blood Transfusion Service, and impact investors operating in health systems strengthening.</p>
                  <p>If you are a health ministry official, hospital administrator, global health funder, or technology partner — we want to hear from you.</p>
                </div>
                <div className="mt-10 space-y-3 font-mono text-sm text-background/60">
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> gnakedi@bloodchain.life</div>
                  <div className="flex items-center gap-3"><Map className="w-4 h-4 text-primary" /> Gaborone, Botswana</div>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.2}>
              <div className="bg-background/5 border border-border/20 p-8">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="px-4 py-12 md:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <BloodchainWordmark />
            <p className="font-mono text-xs text-muted-foreground mt-2">
              &copy; {new Date().getFullYear()} Bloodchain. Founded by Gift Jr Nakedi. Republic of Botswana.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Secure System</span>
              <span>//</span>
              <span>v1.0.0-PROD</span>
              <span>//</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#roadmap" className="hover:text-foreground transition-colors">Roadmap</a>
              <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
              <a href="#team" className="hover:text-foreground transition-colors">Team</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
