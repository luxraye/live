import { type ReactNode, useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Crosshair,
  Download,
  Droplets,
  FileText,
  Filter,
  Hospital,
  Layers,
  LayoutDashboard,
  Link2,
  Lock,
  MapPin,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  Radio,
  RefreshCw,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Timer,
  Truck,
  UserRound,
  Waypoints,
  X,
  Zap,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type NavSection = 'overview' | 'dispatches' | 'custody' | 'facilities';

interface DispatchItem {
  id: string;
  code: string;
  route: string;
  origin: string;
  destination: string;
  distance: string;
  driver: string;
  vehicle: string;
  cooler: string;
  temp: number;
  tempStatus: 'safe' | 'watch' | 'hold';
  urgency: 'STAT' | 'Surge' | 'Scheduled' | 'Routine';
  status: 'In Transit' | 'Packing' | 'Departed Dock' | 'Delivered';
  progress: number;
  eta: string;
  totalUnits: number;
  units: { type: string; count: number; tag: string }[];
}

const INITIAL_DISPATCHES: DispatchItem[] = [
  {
    id: '1',
    code: 'TT-0247',
    route: 'Gaborone → Molepolole',
    origin: 'Princess Marina Hospital (Gaborone)',
    destination: 'Scottish Livingstone Hospital (Molepolole)',
    distance: '48 km',
    driver: 'Amantle Kgosi',
    vehicle: 'Toyota Hilux 4x4 · B 492 BWB',
    cooler: 'CRATE BWB-00481',
    temp: 4.2,
    tempStatus: 'safe',
    urgency: 'STAT',
    status: 'In Transit',
    progress: 68,
    eta: '07:11 CAT (29 min)',
    totalUnits: 18,
    units: [
      { type: 'Red Blood Cells (O−)', count: 8, tag: 'RBC' },
      { type: 'Red Blood Cells (A+)', count: 6, tag: 'RBC' },
      { type: 'Frozen Plasma (AB+)', count: 4, tag: 'FFP' },
    ],
  },
  {
    id: '2',
    code: 'TT-0248',
    route: 'Francistown → Serowe',
    origin: 'Nyangabgwe Referral Hospital (Francistown)',
    destination: 'Sekgoma Memorial Hospital (Serowe)',
    distance: '97 km',
    driver: 'Kagiso Moloi',
    vehicle: 'Land Cruiser Cold Van · B 118 BWC',
    cooler: 'CRATE BWB-00493',
    temp: 4.8,
    tempStatus: 'safe',
    urgency: 'Scheduled',
    status: 'In Transit',
    progress: 31,
    eta: '09:40 CAT (1h 12m)',
    totalUnits: 12,
    units: [
      { type: 'Red Blood Cells (O+)', count: 6, tag: 'RBC' },
      { type: 'Red Blood Cells (B+)', count: 4, tag: 'RBC' },
      { type: 'Platelets (Mixed)', count: 2, tag: 'PLT' },
    ],
  },
  {
    id: '3',
    code: 'TT-0249',
    route: 'Maun → Gumare',
    origin: 'Maun General Hospital',
    destination: 'Gumare Primary Hospital',
    distance: '154 km',
    driver: 'Thabo Dintwa',
    vehicle: 'Ford Ranger Heavy Transit · B 882 BWD',
    cooler: 'CRATE BWB-00512',
    temp: 3.9,
    tempStatus: 'safe',
    urgency: 'Surge',
    status: 'Departed Dock',
    progress: 14,
    eta: '11:15 CAT (2h 45m)',
    totalUnits: 8,
    units: [
      { type: 'Red Blood Cells (O−)', count: 4, tag: 'RBC' },
      { type: 'Red Blood Cells (A−)', count: 4, tag: 'RBC' },
    ],
  },
  {
    id: '4',
    code: 'TT-0250',
    route: 'Lobatse → Kanye',
    origin: 'Athlone Hospital (Lobatse)',
    destination: 'Kanye Seventh-day Adventist Hospital',
    distance: '42 km',
    driver: 'Lesego Balopi',
    vehicle: 'Isuzu D-Max · B 304 BWA',
    cooler: 'CRATE BWB-00520',
    temp: 4.1,
    tempStatus: 'safe',
    urgency: 'Routine',
    status: 'Packing',
    progress: 5,
    eta: '13:30 CAT (Loading Dock #1)',
    totalUnits: 10,
    units: [
      { type: 'Red Blood Cells (A+)', count: 6, tag: 'RBC' },
      { type: 'Red Blood Cells (O+)', count: 4, tag: 'RBC' },
    ],
  },
];

const FACILITIES_DATA = [
  {
    id: 'f1',
    name: 'Princess Marina Hospital',
    city: 'Gaborone (National Hub)',
    type: 'National Referral & Processing Center',
    totalStock: 342,
    deficitBloodType: 'None (Surplus)',
    deficitStatus: 'optimal',
    activeDispatches: 3,
    coldRoomTemp: '3.8°C',
    supervisor: 'Dr. K. Moloi',
    phone: '+267 362 1400',
    address: 'Hospital Way, Gaborone Central',
  },
  {
    id: 'f2',
    name: 'Nyangabgwe Referral Hospital',
    city: 'Francistown (Northern Hub)',
    type: 'Northern District Trauma & Bank',
    totalStock: 215,
    deficitBloodType: 'None (Stable)',
    deficitStatus: 'optimal',
    activeDispatches: 2,
    coldRoomTemp: '4.1°C',
    supervisor: 'M. Seretse',
    phone: '+267 241 1000',
    address: 'Matsiloje Road, Francistown',
  },
  {
    id: 'f3',
    name: 'NBTS Headquarters & Fractionation',
    city: 'Gaborone (National Reserve)',
    type: 'Sovereign Blood Fractionation & Reserve',
    totalStock: 580,
    deficitBloodType: 'None (Reserve Full)',
    deficitStatus: 'optimal',
    activeDispatches: 5,
    coldRoomTemp: '3.5°C',
    supervisor: 'T. Nthomiwa',
    phone: '+267 395 2444',
    address: 'Plot 1024 Extension 12, Gaborone',
  },
  {
    id: 'f4',
    name: 'Scottish Livingstone Hospital',
    city: 'Molepolole (Kweneng District)',
    type: 'District Trauma & Surgery Center',
    totalStock: 42,
    deficitBloodType: 'CRITICAL: O− Negative',
    deficitStatus: 'critical',
    activeDispatches: 1,
    coldRoomTemp: '4.4°C',
    supervisor: 'Dr. T. Kgosi',
    phone: '+267 592 0222',
    address: 'Thamaga Junction, Molepolole',
  },
  {
    id: 'f5',
    name: 'Sekgoma Memorial Hospital',
    city: 'Serowe (Central District)',
    type: 'Regional Emergency Receiving',
    totalStock: 68,
    deficitBloodType: 'Watch: B+ Plasma',
    deficitStatus: 'watch',
    activeDispatches: 1,
    coldRoomTemp: '4.0°C',
    supervisor: 'B. Tshekedi',
    phone: '+267 463 0251',
    address: 'Bojesi Ward, Serowe',
  },
  {
    id: 'f6',
    name: 'Maun General Hospital',
    city: 'Maun (Ngamiland / Delta)',
    type: 'Remote Surge Trauma Center',
    totalStock: 51,
    deficitBloodType: 'Stable',
    deficitStatus: 'optimal',
    activeDispatches: 1,
    coldRoomTemp: '3.9°C',
    supervisor: 'Dr. G. Mokgosi',
    phone: '+267 686 0444',
    address: 'Sedia Ward, Maun',
  },
  {
    id: 'f7',
    name: 'Kanye Seventh-day Adventist Hospital',
    city: 'Kanye (Southern District)',
    type: 'District Referral & Maternity',
    totalStock: 39,
    deficitBloodType: 'Low: A+ RBC',
    deficitStatus: 'watch',
    activeDispatches: 1,
    coldRoomTemp: '4.2°C',
    supervisor: 'Sister M. Phiri',
    phone: '+267 544 0255',
    address: 'Hospital Hill, Kanye',
  },
];

const CUSTODY_EVENTS = [
  {
    id: 'tx-01',
    txHash: '0x8f2190...d84e',
    blockHeight: '184,205',
    timestamp: '07:11:45 CAT',
    action: 'HOSPITAL RECEIVING WARD CONFIRMED & TRANSFUSION UNLOCKED',
    facility: 'Scottish Livingstone Hospital · Molepolole',
    custodian: 'Dr. T. Kgosi (Clinician #DR-902)',
    verification: 'Dual-scan verified: Patient wristband matched Unit #BW-O-48101',
    sealStatus: 'Cryptographic Tamper-Seal BROKEN UNDER WITNESS',
    temp: '4.2°C',
    status: 'verified',
  },
  {
    id: 'tx-02',
    txHash: '0x8f2194...7a29',
    blockHeight: '184,204',
    timestamp: '06:58:10 CAT',
    action: 'WAYPOINT 04 GEOFENCE ENTRY',
    facility: 'Molepolole East Corridor (A12 Highway)',
    custodian: 'Amantle Kgosi (Courier #TR-104)',
    verification: 'GPS lock: -24.4122, 25.5019 · Speed: 68 km/h · Variance: 0.0%',
    sealStatus: 'Cooler Crate SEAL-BW-8831 Intact',
    temp: '4.3°C',
    status: 'verified',
  },
  {
    id: 'tx-03',
    txHash: '0x8f2193...6c18',
    blockHeight: '184,203',
    timestamp: '06:42:30 CAT',
    action: 'WAYPOINT 03 TELEMETRY BEACON BROADCAST',
    facility: 'Metsimotlhabe Pass (Sensitech BLE Node #04)',
    custodian: 'Automated Cold-Chain Transceiver',
    verification: 'Sensitech IoT Stream: Platelet agitation active at 60 RPM',
    sealStatus: 'Sealed · Battery: 94%',
    temp: '4.2°C',
    status: 'verified',
  },
  {
    id: 'tx-04',
    txHash: '0x8f2192...bb43',
    blockHeight: '184,202',
    timestamp: '06:25:12 CAT',
    action: 'DISPATCH DOCK HANDOFF ACCEPTED',
    facility: 'Princess Marina Hospital · Dock #2',
    custodian: 'Amantle Kgosi (Courier #TR-104)',
    verification: 'Scanned Crate Barcode: ISBT-128-BW00481',
    sealStatus: 'Security Seal Applied (RFID Tag: BW-8831)',
    temp: '3.9°C',
    status: 'verified',
  },
  {
    id: 'tx-05',
    txHash: '0x8f2191...e901',
    blockHeight: '184,201',
    timestamp: '06:18:04 CAT',
    action: 'CENTRAL LAB PACKED & CRYPTO-SEALED',
    facility: 'Princess Marina Hospital Blood Bank',
    custodian: 'Tebogo Modise (Tech #LB-482)',
    verification: '18 units crossmatched & inspected under ISO 15189 protocol',
    sealStatus: 'Digital Signature: sig_ed25519_88a91f',
    temp: '3.8°C',
    status: 'verified',
  },
];

import Landing from '@/components/Landing';

function Home() {
  const [operatorRole, setOperatorRole] = useState<string | null>(null);

  if (!operatorRole) {
    return <Landing onLogin={(role) => setOperatorRole(role)} />;
  }

  return <HomeContent operatorRole={operatorRole} onExit={() => setOperatorRole(null)} />;
}

function HomeContent({ operatorRole, onExit }: { operatorRole: string; onExit: () => void }) {
  const [activeTab, setActiveTab] = useState<NavSection>('overview');
  const [presentation, setPresentation] = useState(false);
  const [route, setRoute] = useState<'Gaborone → Molepolole' | 'Francistown → Serowe'>('Gaborone → Molepolole');
  const [thermalState, setThermalState] = useState<'safe' | 'watch' | 'hold'>('safe');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newDispatchModalOpen, setNewDispatchModalOpen] = useState(false);
  const [dispatches, setDispatches] = useState<DispatchItem[]>(INITIAL_DISPATCHES);
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'STAT' | 'In Transit' | 'Packing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');

  const routeIsPrimary = route === 'Gaborone → Molepolole';
  const thermal = {
    safe: { temp: '4.2', label: 'Within range', detail: '2° to 8° C band', color: 'safe' },
    watch: { temp: '7.6', label: 'Approaching limit', detail: 'Monitor for 18 min', color: 'watch' },
    hold: { temp: '8.9', label: 'Handoff on hold', detail: 'Dispatch lead alerted', color: 'hold' },
  }[thermalState];

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const selectRoute = (nextRoute: 'Gaborone → Molepolole' | 'Francistown → Serowe') => {
    setRoute(nextRoute);
    showToast(nextRoute === 'Gaborone → Molepolole' ? 'Primary dispatch in focus' : 'Secondary dispatch in focus');
  };

  const advanceDispatchProgress = (id: string) => {
    setDispatches((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const nextProgress = Math.min(100, d.progress + 15);
        const nextStatus = nextProgress >= 100 ? 'Delivered' : 'In Transit';
        return { ...d, progress: nextProgress, status: nextStatus };
      })
    );
    showToast('Simulated courier route advance (+15%)');
  };

  const submitFeedback = async () => {
    try {
      const category = (document.getElementById('feedback-category') as HTMLSelectElement)?.value || 'handoff';
      const note = (document.getElementById('feedback-message') as HTMLTextAreaElement)?.value || '';
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'torrent-desktop',
          responses: {
            category,
            note,
            route,
            thermalState,
            activeTab,
          },
          appVersion: '1.0.0-desktop',
        }),
      });
    } catch {
      // offline safe
    }
    setFeedbackSent(true);
    setFeedbackOpen(false);
    showToast('Pilot signal recorded in operations log');
  };

  const handleCreateDispatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newRoute = fd.get('route') as string;
    const newUrgency = fd.get('urgency') as 'STAT' | 'Surge' | 'Scheduled' | 'Routine';
    const newDriver = fd.get('driver') as string;
    const newUnits = Number(fd.get('units') || 10);

    const newDispatch: DispatchItem = {
      id: String(Date.now()),
      code: `TT-02${dispatches.length + 51}`,
      route: newRoute || 'Gaborone → Thamaga',
      origin: 'Princess Marina Hospital',
      destination: newRoute ? newRoute.split('→')[1]?.trim() || 'Regional Clinic' : 'Thamaga Primary Hospital',
      distance: '38 km',
      driver: newDriver || 'K. Sechele',
      vehicle: 'Toyota Hilux 4x4 · B 602 BWE',
      cooler: `CRATE BWB-00${530 + dispatches.length}`,
      temp: 4.0,
      tempStatus: 'safe',
      urgency: newUrgency || 'STAT',
      status: 'Packing',
      progress: 0,
      eta: '45 min post-departure',
      totalUnits: newUnits,
      units: [
        { type: 'Packed RBC (O−)', count: Math.ceil(newUnits * 0.6), tag: 'RBC' },
        { type: 'Plasma (FFP)', count: Math.floor(newUnits * 0.4), tag: 'FFP' },
      ],
    };

    setDispatches([newDispatch, ...dispatches]);
    setNewDispatchModalOpen(false);
    showToast(`Emergency dispatch ${newDispatch.code} created & queued for dock loading`);
  };

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => {
      const matchesSearch =
        d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.driver.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (dispatchFilter === 'all') return true;
      if (dispatchFilter === 'STAT') return d.urgency === 'STAT';
      if (dispatchFilter === 'In Transit') return d.status === 'In Transit';
      if (dispatchFilter === 'Packing') return d.status === 'Packing' || d.status === 'Departed Dock';
      return true;
    });
  }, [dispatches, searchQuery, dispatchFilter]);

  return (
    <div className={`tt-app${presentation ? ' presentation' : ''}`}>
      <div className="tt-presentation-banner">
        <Radio size={13} /> Projection mode · live operations brief <span>Press button again or toggle below to exit</span>
      </div>

      <div className="tt-shell">
        {!presentation && (
          <aside className="tt-sidebar" aria-label="Primary navigation">
            <div className="tt-brand">
              <div className="tt-brand-mark"><Droplets size={19} strokeWidth={2.6} /></div>
              <div>
                <div className="tt-brand-name">torrent transit</div>
                <div className="tt-brand-sub">cold-chain command</div>
                <a
                  href="https://bloodchain.life"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '10px var(--app-font-mono)', color: '#69d8e0', textDecoration: 'none', marginTop: 4 }}
                >
                  <Link2 size={10} /> bloodchain.life
                </a>
              </div>
            </div>

            <div className="tt-overline">Operations room</div>
            <nav className="tt-nav">
              <button
                className={`tt-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                data-testid="nav-overview"
                onClick={() => { setActiveTab('overview'); showToast('Loaded Live Overview'); }}
              >
                <LayoutDashboard size={16} /> Overview <span className="tt-nav-count">LIVE</span>
              </button>
              <button
                className={`tt-nav-item ${activeTab === 'dispatches' ? 'active' : ''}`}
                data-testid="nav-dispatches"
                onClick={() => { setActiveTab('dispatches'); showToast('Loaded Active Dispatches'); }}
              >
                <Navigation size={16} /> Dispatches <span className="tt-nav-count">0${dispatches.length}</span>
              </button>
              <button
                className={`tt-nav-item ${activeTab === 'custody' ? 'active' : ''}`}
                data-testid="nav-custody"
                onClick={() => { setActiveTab('custody'); showToast('Loaded Chain of Custody Ledger'); }}
              >
                <ScanLine size={16} /> Custody log
              </button>
              <button
                className={`tt-nav-item ${activeTab === 'facilities' ? 'active' : ''}`}
                data-testid="nav-facilities"
                onClick={() => { setActiveTab('facilities'); showToast('Loaded Botswana Facilities Network'); }}
              >
                <Hospital size={16} /> Facilities
              </button>
            </nav>

            <div className="tt-sidebar-bottom">
              <div className="tt-coverage">
                <div className="tt-coverage-title">
                  <span>Network coverage</span>
                  <strong>81%</strong>
                </div>
                <div className="tt-coverage-bar"><span /></div>
                <div className="tt-coverage-foot">12 of 15 districts reporting</div>
              </div>
              <button
                className="tt-nav-item"
                style={{ marginTop: 17, width: '100%' }}
                data-testid="nav-user"
                onClick={() => setUserModalOpen(true)}
              >
                <UserRound size={16} /> Amantle · Control
              </button>
            </div>
          </aside>
        )}

        <main className="tt-main">
          <header className="tt-topbar">
            <div className="tt-context">
              <span className="tt-context-label">Botswana / National Network</span>
              <span style={{ color: '#88a19d' }}>/</span>
              <span className="tt-context-title">
                {activeTab === 'overview' && 'Control room · Live Dispatch'}
                {activeTab === 'dispatches' && 'Active Courier Dispatches (04 Corridor)'}
                {activeTab === 'custody' && 'Cryptographic Custody Ledger'}
                {activeTab === 'facilities' && 'National Logistics Facilities'}
              </span>
            </div>
            <div className="tt-top-actions">
              <button
                className="tt-ghost-btn"
                style={{ fontSize: 11, color: '#ef7459', borderColor: 'rgba(239,116,89,0.3)' }}
                onClick={onExit}
              >
                Exit Pilot
              </button>
              <button
                className="tt-icon-btn"
                aria-label="View alerts"
                data-testid="button-alerts"
                onClick={() => showToast('All cold-chain telemetry within 2°C - 8°C safety envelope')}
              >
                <Bell size={16} />
              </button>
              <button
                className="tt-ghost-btn"
                data-testid="button-feedback-open"
                onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); }}
              >
                <MessageSquareText size={14} /> {feedbackSent ? 'Feedback sent' : 'Pilot feedback'}
              </button>
              <button
                className="tt-mode-btn"
                data-testid="button-presentation-toggle"
                onClick={() => setPresentation((value) => !value)}
              >
                {presentation ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {presentation ? 'Exit projection' : 'Projection mode'}
              </button>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <section className="tt-content">
              <div className="tt-heading-row">
                <div>
                  <div className="tt-kicker"><span className="tt-live-dot" /> Live dispatch board <span style={{ opacity: .55 }}>·</span> 06:42 CAT</div>
                  <h1 className="tt-heading">Move blood.<br /><em>Keep trust cold.</em></h1>
                  <p className="tt-subheading">One clear view of every handoff between bank, driver, and bedside.</p>
                </div>
                <div className="tt-status-badge" data-testid="status-network">
                  <Activity size={14} />
                  <span>Network status</span>
                  <strong>All systems nominal</strong>
                </div>
              </div>

              <div className="tt-grid">
                <section className="tt-card tt-route-card" data-testid="card-route-overview">
                  <div className="tt-card-header">
                    <div>
                      <div className="tt-overline" style={{ padding: 0, color: presentation ? '#8eb0ad' : '#72918b' }}>Dispatch 0247 · Active</div>
                      <div className="tt-card-title" style={{ marginTop: 5 }}>{route}</div>
                    </div>
                    <div className="tt-card-meta">{routeIsPrimary ? '48 km' : '97 km'} <ChevronDown size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></div>
                  </div>
                  <div className="tt-map">
                    <svg className="tt-map-svg" viewBox="0 0 700 319" preserveAspectRatio="none" aria-label="Route map">
                      <path d={routeIsPrimary ? 'M97 258 C 188 248, 245 223, 300 191 S 402 140, 465 131 S 552 98, 614 51' : 'M97 258 C 185 235, 244 250, 325 220 S 455 174, 510 123 S 578 76, 614 51'} fill="none" stroke={presentation ? '#32565c' : '#9dc4b5'} strokeWidth="18" strokeLinecap="round" opacity=".5" />
                      <path d={routeIsPrimary ? 'M97 258 C 188 248, 245 223, 300 191 S 402 140, 465 131 S 552 98, 614 51' : 'M97 258 C 185 235, 244 250, 325 220 S 455 174, 510 123 S 578 76, 614 51'} fill="none" stroke="#0e8490" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 11" />
                      <path d="M182 0 L205 319 M394 0 L420 319 M0 211 L700 173" fill="none" stroke={presentation ? '#31545a' : '#b3cec0'} strokeWidth="1" opacity=".55" />
                      <circle cx="97" cy="258" r="7" fill="#ef7459" stroke={presentation ? '#142d37' : '#f7faf6'} strokeWidth="4" />
                      <circle cx="614" cy="51" r="7" fill="#69d8e0" stroke={presentation ? '#142d37' : '#f7faf6'} strokeWidth="4" />
                      <circle cx={routeIsPrimary ? 465 : 510} cy={routeIsPrimary ? 131 : 123} r="9" fill="#10232d" stroke="#ef7459" strokeWidth="3" />
                      <circle cx={routeIsPrimary ? 465 : 510} cy={routeIsPrimary ? 131 : 123} r="17" fill="none" stroke="#ef7459" strokeWidth="1" opacity=".45" />
                    </svg>
                    <div className="tt-map-label gaborone">Gaborone</div>
                    <div className="tt-map-label metsimotlhabe">Metsimotlhabe</div>
                    <div className="tt-map-label molepolole">{routeIsPrimary ? 'Molepolole' : 'Serowe'}</div>
                    <div className="tt-waypoint start"><i /> Bank</div>
                    <div className="tt-waypoint end"><i /> Hospital</div>
                    <div className="tt-map-float">
                      <div className="tt-map-float-label">Vehicle position</div>
                      <div className="tt-map-float-value">{routeIsPrimary ? '68% en route' : '31% en route'}</div>
                    </div>
                    <div className="tt-map-scale">10 km</div>
                  </div>
                  <div className="tt-route-footer">
                    <div className="tt-route-progress">
                      <div className="tt-route-progress-top">
                        <span>Waypoint 03 of 05 · driver Amantle K.</span>
                        <strong>{routeIsPrimary ? '68%' : '31%'}</strong>
                      </div>
                      <div className="tt-progress-line"><span style={{ width: routeIsPrimary ? '68%' : '31%' }} /></div>
                    </div>
                    <button className="tt-route-foot-action" data-testid="button-focus-route" onClick={() => showToast(`Focused on ${route}`)}>
                      <Crosshair size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} /> focus route
                    </button>
                  </div>
                </section>

                <div className="tt-side-stack">
                  <section className="tt-card tt-thermal-card" data-testid="card-thermal">
                    <div className="tt-card-header">
                      <div className="tt-card-title">Cooler telemetry</div>
                      <div className="tt-card-meta"><Timer size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> updated 12s ago</div>
                    </div>
                    <div className="tt-thermal-main">
                      <div>
                        <div className="tt-temp" data-testid="value-temperature">{thermal.temp}<sup>°C</sup></div>
                        <div className="tt-temp-caption">{thermal.label} · {thermal.detail}</div>
                      </div>
                      <div className="tt-temp-icon"><Thermometer size={22} /></div>
                    </div>
                    <div className="tt-thermal-options" role="group" aria-label="Thermal state">
                      <button className={`tt-thermal-option${thermalState === 'safe' ? ' selected' : ''}`} data-testid="button-thermal-safe" onClick={() => setThermalState('safe')}>Safe · 2–8°C</button>
                      <button className={`tt-thermal-option${thermalState === 'watch' ? ' selected' : ''}`} data-testid="button-thermal-watch" onClick={() => setThermalState('watch')}>Watch</button>
                      <button className={`tt-thermal-option${thermalState === 'hold' ? ' selected' : ''}`} data-testid="button-thermal-hold" onClick={() => setThermalState('hold')}>Hold</button>
                    </div>
                  </section>
                  <section className="tt-card tt-range-card" data-testid="card-inventory">
                    <div className="tt-card-header">
                      <div className="tt-card-title">Load in transit</div>
                      <div className="tt-card-meta">sealed 06:18</div>
                    </div>
                    <div className="tt-range-body">
                      <div className="tt-range-list">
                        <div className="tt-range-row"><span className="tt-blood-chip red">RBC</span><div><div className="tt-range-name">Red cells · O+ / A+</div><div className="tt-mini-line"><span style={{ width: '74%' }} /></div></div><span className="tt-range-count">18 units</span></div>
                        <div className="tt-range-row"><span className="tt-blood-chip gold">FFP</span><div><div className="tt-range-name">Plasma · AB / O</div><div className="tt-mini-line"><span style={{ width: '47%', background: '#cfaa44' }} /></div></div><span className="tt-range-count">06 units</span></div>
                        <div className="tt-range-row"><span className="tt-blood-chip blue">PLT</span><div><div className="tt-range-name">Platelets · mixed</div><div className="tt-mini-line"><span style={{ width: '29%', background: '#58aeb4' }} /></div></div><span className="tt-range-count">04 units</span></div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="tt-bottom-grid">
                <section className="tt-card tt-custody-card" data-testid="card-custody">
                  <div className="tt-card-header">
                    <div className="tt-card-title">Chain of custody</div>
                    <div className="tt-card-meta"><ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> verified ledger</div>
                  </div>
                  <div className="tt-custody-body">
                    <div className="tt-custody-list">
                      <div className="tt-custody-step"><div className="tt-custody-node"><Check size={13} /></div><div><div className="tt-custody-title">Packed</div><div className="tt-custody-meta">Central Bank<br />06:18 · Tebogo M.</div></div></div>
                      <div className="tt-custody-step"><div className="tt-custody-node"><Check size={13} /></div><div><div className="tt-custody-title">Released</div><div className="tt-custody-meta">Amantle K.<br />06:25 · scan 8F21</div></div></div>
                      <div className="tt-custody-step"><div className="tt-custody-node"><Check size={13} /></div><div><div className="tt-custody-title">In transit</div><div className="tt-custody-meta">Waypoint 03<br />06:42 · GPS lock</div></div></div>
                      <div className="tt-custody-step pending"><div className="tt-custody-node"><PackageCheck size={13} /></div><div><div className="tt-custody-title">Received</div><div className="tt-custody-meta">Molepolole Hospital<br />ETA 07:11 CAT</div></div></div>
                    </div>
                  </div>
                </section>
                <section className="tt-card tt-feedback-card" data-testid="card-feedback">
                  <div className="tt-card-header">
                    <div className="tt-card-title">Pilot signal</div>
                    <div className="tt-card-meta"><Activity size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> week 06</div>
                  </div>
                  <div className="tt-feedback-body">
                    <div className="tt-quote">{feedbackSent ? 'Feedback received. The field team will see this in the next pilot review.' : 'We know where the blood is before the phone rings. That changes the whole shift.'}</div>
                    <div className="tt-feedback-author"><div className="tt-avatar">NM</div><span><strong style={{ color: presentation ? '#cfe4df' : '#294b4a' }}>Nonofo M.</strong> · Molepolole receiving</span></div>
                    <button className="tt-feedback-link" data-testid="button-feedback-link" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); }}>
                      {feedbackSent ? 'add another signal' : 'share a pilot signal'} <ArrowRight size={12} style={{ verticalAlign: 'middle', marginLeft: 3 }} />
                    </button>
                  </div>
                </section>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 19 }}>
                <button className="tt-ghost-btn" data-testid="button-route-primary" onClick={() => selectRoute('Gaborone → Molepolole')}><MapPin size={13} /> Gaborone → Molepolole</button>
                <button className="tt-ghost-btn" data-testid="button-route-secondary" onClick={() => selectRoute('Francistown → Serowe')}><Waypoints size={13} /> Francistown → Serowe</button>
                <span style={{ marginLeft: 'auto', color: presentation ? '#789796' : '#7b9690', font: '10px var(--app-font-mono)', alignSelf: 'center' }}>
                  <Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />last sync 06:42:18 CAT
                </span>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DISPATCHES MATRIX */}
          {/* ========================================================================= */}
          {activeTab === 'dispatches' && (
            <section className="tt-content">
              <div className="tt-heading-row">
                <div>
                  <div className="tt-kicker"><span className="tt-live-dot" /> National Corridor Logistics</div>
                  <h1 className="tt-heading">Active Dispatches<br /><em>4 Live Corridors</em></h1>
                  <p className="tt-subheading">Track and manage emergency and routine cold-chain transport vehicles nationwide.</p>
                </div>
                <button
                  className="tt-primary-btn"
                  data-testid="button-new-dispatch"
                  onClick={() => setNewDispatchModalOpen(true)}
                >
                  <Plus size={14} /> Create Emergency Dispatch
                </button>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#72918b' }} />
                  <input
                    type="text"
                    placeholder="Search route, driver, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      background: presentation ? '#162f39' : '#ffffff',
                      border: '1px solid #cfddd5',
                      borderRadius: 8,
                      fontSize: 13,
                      color: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'STAT', 'In Transit', 'Packing'] as const).map((filter) => (
                    <button
                      key={filter}
                      className={`tt-ghost-btn ${dispatchFilter === filter ? 'active' : ''}`}
                      style={dispatchFilter === filter ? { background: '#0e8490', color: '#ffffff', borderColor: '#0e8490' } : {}}
                      onClick={() => setDispatchFilter(filter)}
                    >
                      {filter === 'all' ? 'All Dispatches' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dispatches Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                {filteredDispatches.map((item) => (
                  <div key={item.id} className="tt-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ font: '11px var(--app-font-mono)', fontWeight: 700, color: '#0e8490' }}>{item.code}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: item.urgency === 'STAT' ? '#ef7459' : item.urgency === 'Surge' ? '#cfaa44' : '#10232d',
                              color: item.urgency === 'Scheduled' || item.urgency === 'Routine' ? '#69d8e0' : '#ffffff',
                            }}
                          >
                            {item.urgency}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '6px 0 2px' }}>{item.route}</h3>
                        <div style={{ fontSize: 12, color: '#72918b' }}>{item.origin} ➔ {item.destination}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ font: '18px var(--app-font-mono)', fontWeight: 700, color: item.temp > 7 ? '#ef7459' : '#0e8490' }}>
                          {item.temp.toFixed(1)}°C
                        </div>
                        <div style={{ fontSize: 10, color: '#72918b' }}>{item.cooler}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ margin: '14px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                        <span style={{ color: '#72918b' }}>Status: <strong>{item.status}</strong></span>
                        <span style={{ font: '11px var(--app-font-mono)', fontWeight: 700 }}>{item.progress}% · ETA {item.eta}</span>
                      </div>
                      <div style={{ height: 6, background: '#dce8e2', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.progress}%`, background: item.urgency === 'STAT' ? '#ef7459' : '#0e8490', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>

                    {/* Units breakdown */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0 14px' }}>
                      {item.units.map((u, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: presentation ? '#162f39' : '#edf4f0', padding: '4px 8px', borderRadius: 6, fontSize: 11 }}>
                          <span className={`tt-blood-chip ${u.tag === 'RBC' ? 'red' : u.tag === 'FFP' ? 'gold' : 'blue'}`} style={{ width: 14, height: 14, fontSize: 8 }}>{u.tag}</span>
                          <span>{u.count}x {u.type}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e2ede6' }}>
                      <div style={{ fontSize: 12, color: '#72918b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Truck size={13} /> {item.driver}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="tt-ghost-btn"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => advanceDispatchProgress(item.id)}
                        >
                          <Zap size={12} /> Advance +15%
                        </button>
                        <button
                          className="tt-ghost-btn"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => showToast(`Receiving dock at ${item.destination} notified of arrival`)}
                        >
                          <Bell size={12} /> Ping Dock
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CHAIN OF CUSTODY LEDGER */}
          {/* ========================================================================= */}
          {activeTab === 'custody' && (
            <section className="tt-content">
              <div className="tt-heading-row">
                <div>
                  <div className="tt-kicker"><span className="tt-live-dot" /> Sovereign Provenance Feed</div>
                  <h1 className="tt-heading">Chain of Custody<br /><em>Cryptographic Ledger</em></h1>
                  <p className="tt-subheading">Immutable, tamper-evident audit logs anchored into the Hyperledger Fabric ledger node.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="tt-ghost-btn"
                    onClick={() => showToast('Merkle Tree Root Hash Re-verified: 0x9f8240ae91b4')}
                  >
                    <ShieldCheck size={14} color="#0e8490" /> Verify Merkle Root
                  </button>
                  <button
                    className="tt-primary-btn"
                    onClick={() => showToast('Custody certificate exported (SHA-256 JSON Hash)')}
                  >
                    <Download size={14} /> Export Audit Log
                  </button>
                </div>
              </div>

              {/* Ledger Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
                <div className="tt-card" style={{ padding: '14px 18px' }}>
                  <div className="tt-overline">Ledger State</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0e8490', margin: '4px 0' }}>100% Verified</div>
                  <div style={{ fontSize: 11, color: '#72918b' }}>0 tamper events across 184k blocks</div>
                </div>
                <div className="tt-card" style={{ padding: '14px 18px' }}>
                  <div className="tt-overline">Active Corridor Seals</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ef7459', margin: '4px 0' }}>4 Sealed Crates</div>
                  <div style={{ fontSize: 11, color: '#72918b' }}>RFID & ISBT-128 dual verification</div>
                </div>
                <div className="tt-card" style={{ padding: '14px 18px' }}>
                  <div className="tt-overline">Sensitech IoT Beacons</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0e8490', margin: '4px 0' }}>4.2°C Average</div>
                  <div style={{ fontSize: 11, color: '#72918b' }}>Cold envelope 2.0°C – 8.0°C</div>
                </div>
              </div>

              {/* Timeline Feed */}
              <div className="tt-card" style={{ padding: 24 }}>
                <div style={{ display: 'grid', gap: 20 }}>
                  {CUSTODY_EVENTS.map((evt, idx) => (
                    <div
                      key={evt.id}
                      style={{
                        display: 'flex',
                        gap: 16,
                        position: 'relative',
                        paddingBottom: idx === CUSTODY_EVENTS.length - 1 ? 0 : 20,
                        borderBottom: idx === CUSTODY_EVENTS.length - 1 ? 'none' : '1px solid #e5ede7',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: idx === 0 ? '#0e8490' : '#e0eee6',
                          color: idx === 0 ? '#ffffff' : '#10232d',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{evt.action}</h4>
                          <span style={{ font: '11px var(--app-font-mono)', color: '#72918b' }}>{evt.timestamp} · Block #{evt.blockHeight}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#10232d', margin: '4px 0' }}>
                          <strong>{evt.facility}</strong> · {evt.custodian}
                        </div>
                        <div style={{ fontSize: 12, color: '#56756f', background: presentation ? '#162f39' : '#f0f6f2', padding: '6px 10px', borderRadius: 6, marginTop: 6 }}>
                          <div>{evt.verification}</div>
                          <div style={{ font: '11px var(--app-font-mono)', color: '#0e8490', marginTop: 3 }}>
                            {evt.sealStatus} · Temp: <strong>{evt.temp}</strong> · Hash: {evt.txHash}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: FACILITIES NETWORK */}
          {/* ========================================================================= */}
          {activeTab === 'facilities' && (
            <section className="tt-content">
              <div className="tt-heading-row">
                <div>
                  <div className="tt-kicker"><span className="tt-live-dot" /> National Healthcare Infrastructure</div>
                  <h1 className="tt-heading">Facilities Network<br /><em>7 Blood Hubs & Hospitals</em></h1>
                  <p className="tt-subheading">Live inventory, storage capacity, and dispatch connections across all Botswana districts.</p>
                </div>
                <div className="tt-status-badge">
                  <Hospital size={14} />
                  <span>Total National Reserve</span>
                  <strong>1,295 Units</strong>
                </div>
              </div>

              {/* Facilities Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
                {FACILITIES_DATA.map((fac) => (
                  <div key={fac.id} className="tt-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 10, font: '10px var(--app-font-mono)', color: '#0e8490', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {fac.city}
                        </span>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 2px' }}>{fac.name}</h3>
                        <p style={{ fontSize: 12, color: '#72918b', margin: 0 }}>{fac.type}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#10232d' }}>{fac.totalStock}</div>
                        <div style={{ fontSize: 10, color: '#72918b' }}>units in bank</div>
                      </div>
                    </div>

                    <div style={{ margin: '14px 0', padding: '10px 12px', background: fac.deficitStatus === 'critical' ? '#fdeeed' : presentation ? '#162f39' : '#f0f6f2', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: fac.deficitStatus === 'critical' ? '#ef7459' : '#72918b', fontWeight: 600 }}>Deficit Alert</span>
                        <span style={{ fontWeight: 700, color: fac.deficitStatus === 'critical' ? '#ef7459' : '#0e8490' }}>{fac.deficitBloodType}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#72918b' }}>Cold Room: <strong>{fac.coldRoomTemp}</strong></span>
                        <span style={{ color: '#72918b' }}>Active Dispatches: <strong>{fac.activeDispatches}</strong></span>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#72918b', marginBottom: 14 }}>
                      <div><strong>Dock Lead:</strong> {fac.supervisor}</div>
                      <div><strong>Contact:</strong> {fac.phone} · {fac.address}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="tt-ghost-btn"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => showToast(`Emergency transfer order created for ${fac.name}`)}
                      >
                        <Zap size={12} /> Emergency Transfer
                      </button>
                      <button
                        className="tt-ghost-btn"
                        style={{ fontSize: 11 }}
                        onClick={() => showToast(`Calling dock supervisor at ${fac.name}: ${fac.phone}`)}
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE DISPATCH */}
      {/* ========================================================================= */}
      {newDispatchModalOpen && (
        <div className="tt-feedback-panel" role="dialog" aria-modal="true">
          <div className="tt-dialog" style={{ maxWidth: 480 }}>
            <div className="tt-dialog-head">
              <div>
                <div className="tt-dialog-title">Create Emergency Blood Dispatch</div>
                <div className="tt-dialog-copy">Assign a courier cold-box manifest to a national corridor.</div>
              </div>
              <button
                className="tt-dialog-close"
                onClick={() => setNewDispatchModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDispatch} className="tt-dialog-body">
              <label className="tt-label" htmlFor="route">Corridor Route</label>
              <select id="route" name="route" className="tt-select" defaultValue="Gaborone → Thamaga Hospital">
                <option value="Gaborone → Thamaga Hospital">Gaborone (Princess Marina) ➔ Thamaga Hospital</option>
                <option value="Francistown → Tutume Hospital">Francistown (Nyangabgwe) ➔ Tutume Hospital</option>
                <option value="Maun → Shakawe Clinic">Maun General ➔ Shakawe Emergency Clinic</option>
                <option value="Gaborone → Deborah Retief (Mochudi)">Gaborone ➔ Deborah Retief Memorial (Mochudi)</option>
              </select>

              <label className="tt-label" htmlFor="urgency" style={{ marginTop: 14 }}>Urgency Classification</label>
              <select id="urgency" name="urgency" className="tt-select" defaultValue="STAT">
                <option value="STAT">STAT · Critical Emergency (Immediate Dock Release)</option>
                <option value="Surge">Surge · Regional Deficit Buffer</option>
                <option value="Scheduled">Scheduled · Planned Restock</option>
                <option value="Routine">Routine Exchange</option>
              </select>

              <label className="tt-label" htmlFor="driver" style={{ marginTop: 14 }}>Assigned Driver & Vehicle</label>
              <input
                id="driver"
                name="driver"
                className="tt-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cfddd5', fontSize: 13, background: 'inherit', color: 'inherit' }}
                defaultValue="K. Sechele (Toyota Hilux · B 602 BWE)"
              />

              <label className="tt-label" htmlFor="units" style={{ marginTop: 14 }}>Total Units to Manifest</label>
              <input
                id="units"
                name="units"
                type="number"
                min={1}
                max={50}
                className="tt-input"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cfddd5', fontSize: 13, background: 'inherit', color: 'inherit' }}
                defaultValue={12}
              />

              <div className="tt-dialog-footer">
                <button
                  type="button"
                  className="tt-ghost-btn"
                  onClick={() => setNewDispatchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tt-primary-btn"
                >
                  <Send size={13} /> Dispatch to Cold Dock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: USER / OPERATOR PROFILE */}
      {/* ========================================================================= */}
      {userModalOpen && (
        <div className="tt-feedback-panel" role="dialog" aria-modal="true">
          <div className="tt-dialog" style={{ maxWidth: 420 }}>
            <div className="tt-dialog-head">
              <div>
                <div className="tt-dialog-title">Operator Profile</div>
                <div className="tt-dialog-copy">Torrent Transit Operations & Dispatch Control.</div>
              </div>
              <button
                className="tt-dialog-close"
                onClick={() => setUserModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="tt-dialog-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0e8490', color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700 }}>
                  AK
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Amantle Kgosi</h4>
                  <p style={{ margin: 0, fontSize: 12, color: '#72918b' }}>Senior Cold-Chain Dispatcher · ID #TR-104</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8, fontSize: 13, background: presentation ? '#162f39' : '#f0f6f2', padding: 14, borderRadius: 8 }}>
                <div><strong>Station:</strong> Gaborone Central Operations Room</div>
                <div><strong>Current Shift:</strong> 06:00 – 18:00 CAT (Active)</div>
                <div><strong>Primary Corridor:</strong> A12 Highway (Gaborone ➔ Molepolole)</div>
                <div><strong>Cold Compliance Score:</strong> 99.8% within 2°C – 8°C</div>
                <div><strong>Active Vehicle:</strong> Toyota Hilux 4x4 (B 492 BWB)</div>
              </div>

              <div className="tt-dialog-footer">
                <button
                  className="tt-primary-btn"
                  onClick={() => setUserModalOpen(false)}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PILOT FEEDBACK */}
      {/* ========================================================================= */}
      {feedbackOpen && (
        <div className="tt-feedback-panel" role="dialog" aria-modal="true" data-testid="dialog-feedback">
          <div className="tt-dialog">
            <div className="tt-dialog-head">
              <div>
                <div className="tt-dialog-title">Share a pilot signal</div>
                <div className="tt-dialog-copy">Keep the operations room close to the people using it.</div>
              </div>
              <button
                className="tt-dialog-close"
                aria-label="Close feedback"
                data-testid="button-feedback-close"
                onClick={() => setFeedbackOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="tt-dialog-body">
              <label className="tt-label" htmlFor="feedback-category">Signal type</label>
              <select id="feedback-category" className="tt-select" data-testid="select-feedback-category" defaultValue="handoff">
                <option value="handoff">Handoff / custody</option>
                <option value="telemetry">Cooler telemetry</option>
                <option value="route">Route visibility</option>
                <option value="other">Other</option>
              </select>
              <label className="tt-label" htmlFor="feedback-message" style={{ marginTop: 17 }}>What did the team notice?</label>
              <textarea id="feedback-message" className="tt-textarea" data-testid="textarea-feedback" defaultValue="" placeholder="Write a short field note..." />
              <div className="tt-dialog-footer">
                <button className="tt-ghost-btn" data-testid="button-feedback-cancel" onClick={() => setFeedbackOpen(false)}>Cancel</button>
                <button className="tt-primary-btn" data-testid="button-feedback-submit" onClick={submitFeedback}>
                  <Send size={13} /> Add to pilot brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="tt-toast" role="status" data-testid="status-toast"><ClipboardCheck size={14} /> {toast}</div>}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
