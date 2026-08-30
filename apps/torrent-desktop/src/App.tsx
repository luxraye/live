import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Crosshair,
  Droplets,
  Hospital,
  LayoutDashboard,
  MapPin,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Navigation,
  PackageCheck,
  Radio,
  ScanLine,
  Send,
  ShieldCheck,
  Thermometer,
  Timer,
  UserRound,
  Waypoints,
  X,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const [presentation, setPresentation] = useState(false);
  const [route, setRoute] = useState<'Gaborone → Molepolole' | 'Francistown → Serowe'>('Gaborone → Molepolole');
  const [thermalState, setThermalState] = useState<'safe' | 'watch' | 'hold'>('safe');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
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
          },
          appVersion: '1.0.0-desktop',
        }),
      });
    } catch {
      // offline-safe
    }
    setFeedbackSent(true);
    setFeedbackOpen(false);
    showToast('Pilot signal recorded in operations log');
  };

  return (
    <div className={`tt-app${presentation ? ' presentation' : ''}`}>
      <div className="tt-presentation-banner"><Radio size={13} /> Projection mode · live operations brief <span>Press the control again to exit</span></div>
      <div className="tt-shell">
        {!presentation && (
          <aside className="tt-sidebar" aria-label="Primary navigation">
            <div className="tt-brand">
              <div className="tt-brand-mark"><Droplets size={19} strokeWidth={2.6} /></div>
              <div><div className="tt-brand-name">torrent transit</div><div className="tt-brand-sub">cold-chain command</div></div>
            </div>
            <div className="tt-overline">Operations room</div>
            <nav className="tt-nav">
              <button className="tt-nav-item active" data-testid="nav-overview"><LayoutDashboard size={16} /> Overview <span className="tt-nav-count">LIVE</span></button>
              <button className="tt-nav-item" data-testid="nav-dispatches"><Navigation size={16} /> Dispatches <span className="tt-nav-count">04</span></button>
              <button className="tt-nav-item" data-testid="nav-custody"><ScanLine size={16} /> Custody log</button>
              <button className="tt-nav-item" data-testid="nav-facilities"><Hospital size={16} /> Facilities</button>
            </nav>
            <div className="tt-sidebar-bottom">
              <div className="tt-coverage">
                <div className="tt-coverage-title"><span>Network coverage</span><strong>81%</strong></div>
                <div className="tt-coverage-bar"><span /></div>
                <div className="tt-coverage-foot">12 of 15 districts reporting</div>
              </div>
              <button className="tt-nav-item" style={{ marginTop: 17, width: '100%' }} data-testid="nav-user"><UserRound size={16} /> Amantle · Control</button>
            </div>
          </aside>
        )}
        <main className="tt-main">
          <header className="tt-topbar">
            <div className="tt-context">
              <span className="tt-context-label">Botswana / Central district</span>
              <span style={{ color: '#88a19d' }}>/</span>
              <span className="tt-context-title">Control room</span>
            </div>
            <div className="tt-top-actions">
              <button className="tt-icon-btn" aria-label="View alerts" data-testid="button-alerts" onClick={() => showToast('No unresolved alerts in the network')}><Bell size={16} /></button>
              <button className="tt-ghost-btn" data-testid="button-feedback-open" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); }}><MessageSquareText size={14} /> {feedbackSent ? 'Feedback sent' : 'Pilot feedback'}</button>
              <button className="tt-mode-btn" data-testid="button-presentation-toggle" onClick={() => setPresentation((value) => !value)}>
                {presentation ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {presentation ? 'Exit projection' : 'Projection mode'}
              </button>
            </div>
          </header>

          <section className="tt-content">
            <div className="tt-heading-row">
              <div>
                <div className="tt-kicker"><span className="tt-live-dot" /> Live dispatch board <span style={{ opacity: .55 }}>·</span> 06:42 CAT</div>
                <h1 className="tt-heading">Move blood.<br /><em>Keep trust cold.</em></h1>
                <p className="tt-subheading">One clear view of every handoff between bank, driver, and bedside.</p>
              </div>
              <div className="tt-status-badge" data-testid="status-network"><Activity size={14} /><span>Network status</span><strong>All systems nominal</strong></div>
            </div>

            <div className="tt-grid">
              <section className="tt-card tt-route-card" data-testid="card-route-overview">
                <div className="tt-card-header">
                  <div><div className="tt-overline" style={{ padding: 0, color: presentation ? '#8eb0ad' : '#72918b' }}>Dispatch 0247 · Active</div><div className="tt-card-title" style={{ marginTop: 5 }}>{route}</div></div>
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
                  <div className="tt-map-float"><div className="tt-map-float-label">Vehicle position</div><div className="tt-map-float-value">{routeIsPrimary ? '68% en route' : '31% en route'}</div></div>
                  <div className="tt-map-scale">10 km</div>
                </div>
                <div className="tt-route-footer">
                  <div className="tt-route-progress">
                    <div className="tt-route-progress-top"><span>Waypoint 03 of 05 · driver Amantle K.</span><strong>{routeIsPrimary ? '68%' : '31%'}</strong></div>
                    <div className="tt-progress-line"><span style={{ width: routeIsPrimary ? '68%' : '31%' }} /></div>
                  </div>
                  <button className="tt-route-foot-action" data-testid="button-focus-route" onClick={() => showToast(`Focused on ${route}`)}><Crosshair size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} /> focus route</button>
                </div>
              </section>

              <div className="tt-side-stack">
                <section className="tt-card tt-thermal-card" data-testid="card-thermal">
                  <div className="tt-card-header"><div className="tt-card-title">Cooler telemetry</div><div className="tt-card-meta"><Timer size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> updated 12s ago</div></div>
                  <div className="tt-thermal-main">
                    <div><div className="tt-temp" data-testid="value-temperature">{thermal.temp}<sup>°C</sup></div><div className="tt-temp-caption">{thermal.label} · {thermal.detail}</div></div>
                    <div className="tt-temp-icon"><Thermometer size={22} /></div>
                  </div>
                  <div className="tt-thermal-options" role="group" aria-label="Thermal state">
                    <button className={`tt-thermal-option${thermalState === 'safe' ? ' selected' : ''}`} data-testid="button-thermal-safe" onClick={() => setThermalState('safe')}>Safe · 2–8°C</button>
                    <button className={`tt-thermal-option${thermalState === 'watch' ? ' selected' : ''}`} data-testid="button-thermal-watch" onClick={() => setThermalState('watch')}>Watch</button>
                    <button className={`tt-thermal-option${thermalState === 'hold' ? ' selected' : ''}`} data-testid="button-thermal-hold" onClick={() => setThermalState('hold')}>Hold</button>
                  </div>
                </section>
                <section className="tt-card tt-range-card" data-testid="card-inventory">
                  <div className="tt-card-header"><div className="tt-card-title">Load in transit</div><div className="tt-card-meta">sealed 06:18</div></div>
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
                <div className="tt-card-header"><div className="tt-card-title">Chain of custody</div><div className="tt-card-meta"><ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} /> verified ledger</div></div>
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
                <div className="tt-card-header"><div className="tt-card-title">Pilot signal</div><div className="tt-card-meta"><Activity size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> week 06</div></div>
                <div className="tt-feedback-body">
                  <div className="tt-quote">{feedbackSent ? 'Feedback received. The field team will see this in the next pilot review.' : 'We know where the blood is before the phone rings. That changes the whole shift.'}</div>
                  <div className="tt-feedback-author"><div className="tt-avatar">NM</div><span><strong style={{ color: presentation ? '#cfe4df' : '#294b4a' }}>Nonofo M.</strong> · Molepolole receiving</span></div>
                  <button className="tt-feedback-link" data-testid="button-feedback-link" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false); }}>{feedbackSent ? 'add another signal' : 'share a pilot signal'} <ArrowRight size={12} style={{ verticalAlign: 'middle', marginLeft: 3 }} /></button>
                </div>
              </section>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 19 }}>
              <button className="tt-ghost-btn" data-testid="button-route-primary" onClick={() => selectRoute('Gaborone → Molepolole')}><MapPin size={13} /> Gaborone → Molepolole</button>
              <button className="tt-ghost-btn" data-testid="button-route-secondary" onClick={() => selectRoute('Francistown → Serowe')}><Waypoints size={13} /> Francistown → Serowe</button>
              <span style={{ marginLeft: 'auto', color: presentation ? '#789796' : '#7b9690', font: '10px var(--app-font-mono)', alignSelf: 'center' }}><Clock3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />last sync 06:42:18 CAT</span>
            </div>
          </section>
        </main>
      </div>
      {feedbackOpen && (
        <div className="tt-feedback-panel" role="dialog" aria-modal="true" data-testid="dialog-feedback">
          <div className="tt-dialog">
            <div className="tt-dialog-head">
              <div><div className="tt-dialog-title">Share a pilot signal</div><div className="tt-dialog-copy">Keep the operations room close to the people using it.</div></div>
              <button className="tt-dialog-close" aria-label="Close feedback" data-testid="button-feedback-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button>
            </div>
            <div className="tt-dialog-body">
              <label className="tt-label" htmlFor="feedback-category">Signal type</label>
              <select id="feedback-category" className="tt-select" data-testid="select-feedback-category" defaultValue="handoff"><option value="handoff">Handoff / custody</option><option value="telemetry">Cooler telemetry</option><option value="route">Route visibility</option><option value="other">Other</option></select>
              <label className="tt-label" htmlFor="feedback-message" style={{ marginTop: 17 }}>What did the team notice?</label>
              <textarea id="feedback-message" className="tt-textarea" data-testid="textarea-feedback" defaultValue="" placeholder="Write a short field note..." />
              <div className="tt-dialog-footer"><button className="tt-ghost-btn" data-testid="button-feedback-cancel" onClick={() => setFeedbackOpen(false)}>Cancel</button><button className="tt-primary-btn" data-testid="button-feedback-submit" onClick={submitFeedback}><Send size={13} /> Add to pilot brief</button></div>
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
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
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
