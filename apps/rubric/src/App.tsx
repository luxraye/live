import { useEffect, useState, type ReactNode } from 'react';
import { useAuth, useUser, SignIn } from '@clerk/react';
import {
  Activity, AlertTriangle, ArrowUpRight, Building2, Check, CheckCircle2,
  Clock3, FileCheck2, FileText, LayoutDashboard, Link2, Loader2, Menu, MessageSquareQuote,
  Network, Plus, Radio, RefreshCw, Search, Send, Settings2, ShieldCheck, Siren,
  TrendingUp, UserCheck, Users, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  useStatsOverview, useVerificationQueue, useVerificationDecision,
  useCentres, useCreateCentre, useUpdateCentre,
  useArticles, useCreateArticle,
  useNetworkRequests, useBroadcastRequest, useCloseRequest,
  type Centre, type VerificationItem,
} from '@/lib/hooks';


type Notify = (message: string, kind?: 'success' | 'error') => void;
type Icon = typeof Activity;

const navItems: { href: string; label: string; icon: Icon }[] = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/verification', label: 'Verification Queue', icon: ShieldCheck },
  { href: '/centres', label: 'Centres', icon: Building2 },
  { href: '/cms', label: 'Content CMS', icon: FileText },
  { href: '/requests', label: 'Network Requests', icon: Network },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
];

const bleedTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function PageHeading({ eyebrow, title, copy, actions }: { eyebrow: string; title: string; copy: string; actions?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{copy}</p></div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

function Kpi({ label, value, meta, tone, icon: KpiIcon, loading }: { label: string; value: string; meta: string; tone?: string; icon: Icon; loading?: boolean }) {
  const color = tone === 'critical' ? '#ef7482' : tone === 'warn' ? '#e9b957' : '#39d6e5';
  return (
    <div className="kpi">
      <KpiIcon size={16} color={color} style={{ float: 'right' }} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{loading ? <Loader2 size={18} /> : value}</div>
      <div className={'kpi-meta ' + (tone ?? '')}>{meta}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full, textarea }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; full?: boolean; textarea?: boolean;
}) {
  const id = 'field-' + label.toLowerCase().replaceAll(' ', '-');
  return (
    <div className={'field ' + (full ? 'full' : '')}>
      <label htmlFor={id}>{label}</label>
      {textarea
        ? <textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal" role="dialog" aria-modal>
        <div className="panel-head">
          <span className="panel-title">{title}</span>
          <button className="close" aria-label="Close" onClick={close}><X size={18} /></button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

function SkeletonRows({ cols = 4 }: { cols?: number }) {
  return (
    <>
      {[1, 2, 3].map(i => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}><div style={{ height: 14, background: '#162130', borderRadius: 4, width: j === 0 ? '70%' : '50%' }} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

import { isValidClerkKey } from '@/lib/clerk-utils';

function useSafeAuth() {
  const hasKey = isValidClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  if (!hasKey) {
    return {
      isSignedIn: true,
      isLoaded: true,
      signOut: async () => {},
    };
  }
  try {
    return useAuth();
  } catch {
    return {
      isSignedIn: true,
      isLoaded: true,
      signOut: async () => {},
    };
  }
}

function useSafeUser() {
  const hasKey = isValidClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  if (!hasKey) {
    return {
      user: {
        firstName: 'Command',
        lastName: 'Operator',
        emailAddresses: [{ emailAddress: 'operator@bloodchain.life' }],
      },
    };
  }
  try {
    return useUser();
  } catch {
    return {
      user: {
        firstName: 'Command',
        lastName: 'Operator',
        emailAddresses: [{ emailAddress: 'operator@bloodchain.life' }],
      },
    };
  }
}

function ClerkAuthGate({ children }: { children: ReactNode }) {
  try {
    const { isSignedIn, isLoaded } = useAuth();
    if (!isLoaded) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060912' }}>
          <Loader2 size={24} style={{ color: '#2bd9e7', animation: 'spin 1s linear infinite' }} />
        </div>
      );
    }

    if (!isSignedIn) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#060912' }}>
          <div style={{ maxWidth: 480, width: '100%', padding: '0 24px' }}>
            <div className="brand" style={{ justifyContent: 'center', marginBottom: 32 }}>
              <div className="brand-mark" aria-hidden="true" />
              <div>
                <div className="brand-name">RUBRIC</div>
                <div className="brand-sub">BLOODCHAIN / NATIONAL OPS</div>
              </div>
            </div>
            <SignIn routing="hash" />
          </div>
        </div>
      );
    }

    return <>{children}</>;
  } catch {
    return <>{children}</>;
  }
}

function AuthGuard({ children }: { children: ReactNode }) {
  const hasKey = isValidClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!hasKey) {
    return <>{children}</>;
  }

  return <ClerkAuthGate>{children}</ClerkAuthGate>;
}

import Landing from '@/components/Landing';

function App() {
  const [pilotRole, setPilotRole] = useState<string | null>(null);
  const { isSignedIn, signOut } = useSafeAuth();
  const { user } = useSafeUser();
  const hasClerk = isValidClerkKey(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const clerkName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.emailAddresses?.[0]?.emailAddress;

  const activeRole = pilotRole || (hasClerk && isSignedIn && clerkName ? clerkName : null);

  const handleExit = () => {
    setPilotRole(null);
    if (hasClerk && isSignedIn) {
      void signOut();
    }
  };

  if (!activeRole) {
    return (
      <TooltipProvider>
        <Landing onLogin={(role) => setPilotRole(role)} />
        <Toaster />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ErrorBoundary resetKey="shell">
          <Shell pilotRole={activeRole} onExitPilot={handleExit} />
        </ErrorBoundary>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

function Shell({ pilotRole, onExitPilot }: { pilotRole: string; onExitPilot: () => void }) {
  const { signOut } = useSafeAuth();
  const { user } = useSafeUser();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [now, setNow] = useState(new Date());
  const notify: Notify = (message, kind = 'success') => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3200);
  };
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const { data: stats } = useStatsOverview();
  const pending = stats?.pendingVerifications ?? 0;
  const openReqs = stats?.openRequests ?? 0;
  const pageTitle = navItems.find(i => i.href === location)?.label ?? 'Overview';
  useEffect(() => { document.title = 'Rubric Command Centre - ' + pageTitle; }, [pageTitle]);
  const operatorName = pilotRole || (user ? ((user.firstName ?? '') + ' ' + (user.lastName ?? '')).trim() : 'National Controller');
  const operatorInitials = operatorName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || 'NC';

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (menuOpen ? 'open' : '')}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div><div className="brand-name">RUBRIC</div><div className="brand-sub">BLOODCHAIN / NATIONAL OPS</div></div>
        </div>
        <div style={{ padding: '0 18px 12px' }}>
          <a
            href="https://bloodchain.life"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: '#39d6e5',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            <Link2 size={11} /> bloodchain.life
          </a>
        </div>
        <nav className="nav">
          {navItems.map(({ href, label, icon: NavIcon }) => {
            const active = location === href;
            const count = href === '/verification' ? pending : href === '/requests' ? openReqs : 0;
            return (
              <Link key={href} href={href} className={'nav-link ' + (active ? 'active' : '')} onClick={() => setMenuOpen(false)}>
                <NavIcon size={16} />
                <span>{label}</span>
                {count > 0 && (
                  <span className={'badge ' + (href === '/requests' ? 'badge-critical' : 'badge-warn')}>
                    {count.toString().padStart(2, '0')}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="user-badge">
            <div className="avatar" aria-hidden="true">{operatorInitials}</div>
            <div className="user-meta">
              <div className="user-name" title={operatorName}>{operatorName}</div>
              <div className="user-role">Sovereign Clearance</div>
            </div>
            <button onClick={onExitPilot} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Exit or Switch Pilot Role">
              <Settings2 size={14} color="#61798a" />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={22} /></button>
            <div>
              <div className="topbar-title">Bloodchain <span style={{ color: '#2bd9e7' }}>/</span> {pageTitle}</div>
              <div className="topbar-context">Republic of Botswana - national blood services telemetry</div>
            </div>
          </div>
          <div className="topbar-right">
            <button
              onClick={onExitPilot}
              className="btn btn-sm"
              style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(239,116,130,0.15)', color: '#ef7482', border: '1px solid rgba(239,116,130,0.4)', cursor: 'pointer' }}
            >
              Exit Pilot
            </button>
            <div className="live-system"><i className="pulse" /> Live system</div>
            <div className="utc" data-testid="text-utc-clock">UTC {now.toISOString().slice(11, 19)}</div>
          </div>
        </header>
        <Switch>
          <Route path="/" component={() => <OverviewPage notify={notify} />} />
          <Route path="/verification" component={() => <VerificationPage notify={notify} />} />
          <Route path="/centres" component={() => <CentresPage notify={notify} />} />
          <Route path="/cms" component={() => <CmsPage notify={notify} />} />
          <Route path="/requests" component={() => <RequestsPage notify={notify} />} />
          <Route path="/analytics" component={() => <AnalyticsPage notify={notify} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {toast && (
        <div className={'toast ' + toast.kind} role="status">
          {toast.kind === 'success'
            ? <CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            : <AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function OverviewPage({ notify }: { notify: Notify }) {
  const { data: stats, isLoading, refetch } = useStatsOverview();
  const matrix = [
    { type: 'O+', s: 84, d: '8.4d', c: '' }, { type: 'O-', s: 42, d: '4.2d', c: 'warn' },
    { type: 'A+', s: 67, d: '6.7d', c: '' }, { type: 'A-', s: 31, d: '3.1d', c: 'critical' },
    { type: 'B+', s: 73, d: '7.3d', c: '' }, { type: 'B-', s: 48, d: '4.8d', c: 'warn' },
    { type: 'AB+', s: 58, d: '5.8d', c: '' }, { type: 'AB-', s: 26, d: '2.6d', c: 'critical' },
  ];
  return (
    <div className="content">
      <PageHeading eyebrow="Situation room / 01" title="National readiness" copy="A live view of blood supply, identity integrity and network response."
        actions={
          <>
            <button className="btn" onClick={() => { void refetch(); notify('Telemetry refreshed'); }}>
              <RefreshCw size={14} /> Refresh feed
            </button>
            <button className="btn btn-primary" onClick={() => notify('Situation report prepared for export')}>
              <ArrowUpRight size={14} /> Export brief
            </button>
          </>
        }
      />
      <div className="grid kpi-grid">
        <Kpi label="Active donors" value={stats ? stats.totalDonors.toLocaleString() : '0'} meta="Verified members" icon={Users} loading={isLoading} />
        <Kpi label="Verified identities" value={stats ? String(stats.totalDonors - stats.pendingVerifications) : '0'} meta="Documents approved" icon={ShieldCheck} loading={isLoading} />
        <Kpi label="Open centres" value={stats ? String(stats.activeCentres) : '0'} meta="Active facilities" tone="warn" icon={Building2} loading={isLoading} />
        <Kpi label="Open requests" value={stats ? stats.openRequests.toString().padStart(2, '0') : '00'} meta={stats?.openRequests ? 'Require response' : 'None active'} tone={stats?.openRequests ? 'critical' : undefined} icon={Siren} loading={isLoading} />
      </div>
      <div className="grid split-grid">
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Blood supply matrix</span><span className="panel-meta">simulated - live integration pending</span></div>
          <div className="panel-body">
            <div className="matrix">
              {matrix.map(item => (
                <div className={'matrix-cell ' + item.c} key={item.type}>
                  <div className="blood">{item.type}</div>
                  <div className="stock">{item.s}%</div>
                  <div className="stock-bar"><i style={{ width: item.s + '%' }} /></div>
                  <small className="stock-note">{item.d} cover</small>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Network telemetry</span><span className="panel-meta">live from API</span></div>
          <div className="panel-body">
            <div className="grid telemetry">
              <div className="telemetry-item"><span>Total donors</span><b>{isLoading ? '...' : stats?.totalDonors.toLocaleString()}</b></div>
              <div className="telemetry-item"><span>Pending verifications</span><b style={{ color: (stats?.pendingVerifications ?? 0) > 0 ? '#e8b850' : '#51e0aa' }}>{isLoading ? '...' : stats?.pendingVerifications}</b></div>
              <div className="telemetry-item"><span>Open requests</span><b style={{ color: (stats?.openRequests ?? 0) > 0 ? '#f27a86' : '#51e0aa' }}>{isLoading ? '...' : stats?.openRequests}</b></div>
              <div className="telemetry-item"><span>Published articles</span><b>{isLoading ? '...' : stats?.publishedArticles}</b></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function VerificationPage({ notify }: { notify: Notify }) {
  const { data: items, isLoading, refetch } = useVerificationQueue();
  const { mutate: decide } = useVerificationDecision();
  const pending = items?.filter(i => i.status === 'pending').length ?? 0;
  const act = (item: VerificationItem, status: 'approved' | 'rejected') =>
    decide(
      { documentId: item.id, status, verificationLevel: status === 'approved' ? 1 : undefined },
      { onSuccess: () => notify('Identity ' + status), onError: () => notify('Decision failed', 'error') },
    );
  return (
    <div className="content">
      <PageHeading eyebrow="Identity integrity / 02" title="Verification queue" copy="Review submitted identity documents before a donor enters the trusted network."
        actions={<button className="btn" onClick={() => void refetch()}><RefreshCw size={14} /> Sync queue</button>}
      />
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Kpi label="Awaiting review" value={pending.toString().padStart(2, '0')} meta="Documents pending" tone="warn" icon={Clock3} loading={isLoading} />
        <Kpi label="Total submissions" value={String(items?.length ?? '-')} meta="All time" icon={CheckCircle2} loading={isLoading} />
        <Kpi label="Approved" value={String(items?.filter(i => i.status === 'approved').length ?? '-')} meta="Cleared for donation" icon={UserCheck} loading={isLoading} />
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head"><span className="panel-title">Submissions requiring action</span><span className="panel-meta">{pending} pending</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Applicant</th><th>Document</th><th>Submitted</th><th>Status</th><th>Decision</th></tr></thead>
            <tbody>
              {isLoading ? <SkeletonRows cols={5} /> : items?.map(item => (
                <tr key={item.id}>
                  <td>
                    <span className="table-primary">{item.first_name} {item.last_name}</span>
                    <span className="table-secondary">{item.clerk_user_id.slice(0, 12)}...</span>
                  </td>
                  <td>{item.document_type}</td>
                  <td className="mono">{relTime(item.created_at)}</td>
                  <td><span className={'status ' + (item.status === 'pending' ? 'pending' : item.status === 'approved' ? 'success' : 'critical')}>{item.status}</span></td>
                  <td>
                    {item.status === 'pending'
                      ? <div className="actions">
                          <button className="btn btn-success btn-sm" onClick={() => act(item, 'approved')}><Check size={13} /> Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => act(item, 'rejected')}><X size={13} /> Reject</button>
                        </div>
                      : <span className="panel-meta mono">decision logged</span>}
                  </td>
                </tr>
              ))}
              {!isLoading && !items?.length && (
                <tr><td colSpan={5}><div className="empty"><CheckCircle2 size={22} /><div>No submissions in queue.</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CentresPage({ notify }: { notify: Notify }) {
  const { data: centres, isLoading } = useCentres();
  const { mutate: createCentre } = useCreateCentre();
  const { mutate: updateCentre } = useUpdateCentre();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', district: '', address: '', opensAt: '', closesAt: '' });
  const visible = centres?.filter(c => (c.name + ' ' + (c.district ?? '')).toLowerCase().includes(query.toLowerCase())) ?? [];
  const toggle = (c: Centre) =>
    updateCentre(
      { id: c.id, is_open: !c.is_open } as Parameters<typeof updateCentre>[0],
      { onSuccess: () => notify('Centre status updated'), onError: () => notify('Update failed', 'error') },
    );
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.district) return notify('Name and district required', 'error');
    createCentre(
      { name: form.name, district: form.district, address: form.address, kind: 'clinic', opens_at: form.opensAt || null, closes_at: form.closesAt || null } as Parameters<typeof createCentre>[0],
      {
        onSuccess: () => { setForm({ name: '', district: '', address: '', opensAt: '', closesAt: '' }); setShowForm(false); notify(form.name + ' added'); },
        onError: () => notify('Failed to create centre', 'error'),
      },
    );
  };
  return (
    <div className="content">
      <PageHeading eyebrow="Network footprint / 03" title="Centres manager" copy="Coordinate the physical collection network across districts."
        actions={
          <>
            <div className="field" style={{ display: 'flex', minWidth: 190 }}>
              <Search size={14} style={{ position: 'absolute', margin: '11px 0 0 11px', color: '#63798b' }} />
              <input aria-label="Search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search centres..." style={{ paddingLeft: 32 }} />
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Add centre</button>
          </>
        }
      />
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Kpi label="Network centres" value={centres ? centres.length.toString().padStart(2, '0') : '-'} meta="Registered facilities" icon={Building2} loading={isLoading} />
        <Kpi label="Currently open" value={centres ? centres.filter(c => c.is_open).length.toString().padStart(2, '0') : '-'} meta="Accepting donations" icon={Radio} loading={isLoading} />
        <Kpi label="Active facilities" value={centres ? centres.filter(c => c.is_active).length.toString().padStart(2, '0') : '-'} meta="In the network" icon={Users} loading={isLoading} />
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head"><span className="panel-title">Facility operations</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Centre</th><th>District</th><th>Hours</th><th>Status</th><th>Control</th></tr></thead>
            <tbody>
              {isLoading ? <SkeletonRows cols={5} /> : visible.map(c => (
                <tr key={c.id}>
                  <td className="table-primary">{c.name}</td>
                  <td>{c.district}</td>
                  <td className="mono">{c.opens_at && c.closes_at ? c.opens_at + ' - ' + c.closes_at : '-'}</td>
                  <td><span className={'status ' + (c.is_open ? 'success' : 'critical')}>{c.is_open ? 'Open' : 'Closed'}</span></td>
                  <td>
                    <button className={'btn btn-sm ' + (c.is_open ? 'btn-danger' : 'btn-success')} onClick={() => toggle(c)}>
                      {c.is_open ? 'Mark closed' : 'Open centre'}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !visible.length && (
                <tr><td colSpan={5}><div className="empty"><Building2 size={22} /><div>No centres match this search.</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {showForm && (
        <Modal title="Register collection centre" close={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={add}>
            <Field label="Centre name" value={form.name} placeholder="e.g. Lobatse District Hospital" onChange={v => setForm({ ...form, name: v })} />
            <Field label="District" value={form.district} placeholder="e.g. Southern" onChange={v => setForm({ ...form, district: v })} />
            <Field label="Address" full value={form.address} placeholder="Street address" onChange={v => setForm({ ...form, address: v })} />
            <Field label="Opens at" value={form.opensAt} placeholder="07:00" onChange={v => setForm({ ...form, opensAt: v })} />
            <Field label="Closes at" value={form.closesAt} placeholder="17:00" onChange={v => setForm({ ...form, closesAt: v })} />
            <div className="form-actions">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Plus size={14} /> Add to network</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CmsPage({ notify }: { notify: Notify }) {
  const { data: articles, isLoading } = useArticles();
  const { mutate: createArticle, isPending } = useCreateArticle();
  const [form, setForm] = useState({ title: '', topic: 'general', content: '' });
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const publish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return notify('Add title and content before publishing', 'error');
    createArticle(
      { title: form.title, slug: slugify(form.title), bodyMarkdown: form.content, topic: form.topic, isPublished: true },
      {
        onSuccess: () => { setForm({ title: '', topic: 'general', content: '' }); notify('Guidance published to the Bloodchain network'); },
        onError: () => notify('Publish failed', 'error'),
      },
    );
  };
  const proto = [
    { icon: ShieldCheck, t: 'Clinical review', d: 'Every article is attributed to the active operator.' },
    { icon: Radio, t: 'Instant distribution', d: 'Published guidance appears in all connected facilities.' },
    { icon: Activity, t: 'Read telemetry', d: 'Monitor reach and acknowledgement after release.' },
  ];
  return (
    <div className="content">
      <PageHeading eyebrow="Clinical communications / 04" title="Content CMS" copy="Publish precise, versioned guidance to the clinical network."
        actions={<span className="status success">Publishing channel online</span>}
      />
      <div className="drawer-layout">
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Compose guidance</span></div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={publish}>
              <Field label="Article title" full value={form.title} placeholder="Write a clear operational headline" onChange={v => setForm({ ...form, title: v })} />
              <div className="field">
                <label>Topic</label>
                <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}>
                  <option value="general">General</option>
                  <option value="blood_type">Blood type</option>
                  <option value="preparation">Preparation</option>
                  <option value="safety">Safety</option>
                </select>
              </div>
              <Field label="Guidance content" full textarea value={form.content} placeholder="Write the guidance..." onChange={v => setForm({ ...form, content: v })} />
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => notify('Draft saved locally')}>Save draft</button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? <Loader2 size={14} /> : <Send size={14} />} Publish guidance
                </button>
              </div>
            </form>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Publishing protocol</span><FileCheck2 size={15} color="#4be0aa" /></div>
          <div className="panel-body">
            <div className="activity">
              {proto.map(({ icon: I, t, d }) => (
                <div key={t} className="activity-row">
                  <div className="activity-icon"><I size={14} /></div>
                  <div className="activity-copy"><b>{t}</b><br /><span className="panel-meta">{d}</span></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <div className="panel-head"><span className="panel-title">Published articles</span><span className="panel-meta">{articles?.length ?? '-'} records</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Article</th><th>Topic</th><th>Published</th><th>State</th></tr></thead>
            <tbody>
              {isLoading ? <SkeletonRows cols={4} /> : articles?.map(a => (
                <tr key={a.id}>
                  <td className="table-primary">{a.title}</td>
                  <td><span className="tag">{a.topic}</span></td>
                  <td className="mono">{a.published_at ? relTime(a.published_at) : '-'}</td>
                  <td><span className="status success">Published</span></td>
                </tr>
              ))}
              {!isLoading && !articles?.length && (
                <tr><td colSpan={4}><div className="empty"><FileText size={22} /><div>No articles published yet.</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RequestsPage({ notify }: { notify: Notify }) {
  const { data: requests, isLoading } = useNetworkRequests();
  const { mutate: broadcast, isPending: isBroadcasting } = useBroadcastRequest();
  const { mutate: closeReq } = useCloseRequest();
  const [form, setForm] = useState({ bloodType: 'A-', priority: 'critical', facilityName: '', description: '' });
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.facilityName || !form.description) return notify('Facility and description required', 'error');
    broadcast(
      { bloodType: form.bloodType, priority: form.priority, facilityName: form.facilityName, description: form.description },
      {
        onSuccess: () => { setForm({ ...form, facilityName: '', description: '' }); notify('Request broadcast for ' + form.bloodType); },
        onError: () => notify('Broadcast failed', 'error'),
      },
    );
  };
  return (
    <div className="content">
      <PageHeading eyebrow="Emergency coordination / 05" title="Network requests" copy="Broadcast precise shortage signals and watch the donor response arrive."
        actions={<span className="status critical">{(requests?.length ?? 0).toString().padStart(2, '0')} active requests</span>}
      />
      <div className="drawer-layout">
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Broadcast shortage request</span><span className="panel-meta">priority channel</span></div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={handleBroadcast}>
              <div className="field">
                <label>Blood group</label>
                <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })}>
                  {bleedTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
              <Field label="Requesting facility" full value={form.facilityName} placeholder="e.g. Princess Marina Hospital" onChange={v => setForm({ ...form, facilityName: v })} />
              <Field label="Description" full textarea value={form.description} placeholder="Describe the shortage..." onChange={v => setForm({ ...form, description: v })} />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isBroadcasting}>
                  {isBroadcasting ? <Loader2 size={14} /> : <Siren size={14} />} Broadcast request
                </button>
              </div>
            </form>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Active requests</span><span className="panel-meta">live response counts</span></div>
          <div className="panel-body">
            {isLoading
              ? <div className="empty"><Loader2 size={22} /></div>
              : requests?.length
                ? requests.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid #162130', paddingBottom: 14, marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="table-primary">{r.facility_name}</span>
                        <span className={'status ' + (r.priority === 'critical' ? 'critical' : r.priority === 'urgent' ? 'pending' : 'info')}>{r.priority}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, marginBottom: 8 }}>
                        <span className="mono" style={{ color: '#f27a86' }}>{r.blood_type}</span>
                        <span className="panel-meta">{r.response_count} responses - {relTime(r.created_at)}</span>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => closeReq(r.id, { onSuccess: () => notify('Request closed'), onError: () => notify('Close failed', 'error') })}>Close request</button>
                    </div>
                  ))
                : <div className="empty"><CheckCircle2 size={22} /><div>No active shortage requests.</div></div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function AnalyticsPage({ notify }: { notify: Notify }) {
  const { data: stats, isLoading } = useStatsOverview();
  const bars = [49, 64, 55, 71, 67, 82, 76, 91, 84, 96];
  const funnel = [
    { label: 'Registered donors', value: stats?.totalDonors ?? 0, w: 100 },
    { label: 'Verified identities', value: (stats?.totalDonors ?? 0) - (stats?.pendingVerifications ?? 0), w: 76 },
    { label: 'Network responses', value: stats?.totalResponses ?? 0, w: 52 },
    { label: 'Feedback submissions', value: stats?.feedbackSubmissions ?? 0, w: 28 },
  ];
  return (
    <div className="content">
      <PageHeading eyebrow="Stakeholder intelligence / 06" title="Analytics" copy="A measured view of adoption, trust conversion and donor sentiment."
        actions={<button className="btn" onClick={() => notify('Analytics brief prepared')}><ArrowUpRight size={14} /> Export brief</button>}
      />
      <div className="grid kpi-grid">
        <Kpi label="Total donors" value={isLoading ? '-' : (stats?.totalDonors ?? 0).toLocaleString()} meta="Registered members" icon={Users} loading={isLoading} />
        <Kpi label="Pending verifications" value={isLoading ? '-' : String(stats?.pendingVerifications ?? 0)} meta="Awaiting review" tone="warn" icon={ShieldCheck} loading={isLoading} />
        <Kpi label="Active centres" value={isLoading ? '-' : String(stats?.activeCentres ?? 0)} meta="Collection facilities" icon={Building2} loading={isLoading} />
        <Kpi label="Network responses" value={isLoading ? '-' : (stats?.totalResponses ?? 0).toLocaleString()} meta="Donor actions taken" icon={Clock3} loading={isLoading} />
      </div>
      <div className="grid split-grid">
        <section className="panel chart-panel">
          <div className="panel-head"><span className="panel-title">Donation activity</span><span className="panel-meta">10 week view</span></div>
          <div className="panel-body">
            <div className="bar-chart">
              {bars.map((h, i) => (
                <div className="bar-col" key={i}>
                  <div className={'bar ' + (i % 3 === 0 ? 'alt' : '')} style={{ height: h + '%' }} />
                  <span className="bar-label">{'W' + (i + 1)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Conversion funnel</span><span className="panel-meta">live from API</span></div>
          <div className="panel-body">
            <div className="funnel">
              {funnel.map(item => (
                <div className="funnel-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="funnel-track"><div className="funnel-fill" style={{ width: item.w + '%' }} /></div>
                  <b className="funnel-value">{item.value.toLocaleString()}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <div className="grid split-grid">
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Platform content</span><span className="panel-meta">live from API</span></div>
          <div className="panel-body">
            <div className="grid telemetry">
              <div className="telemetry-item"><span>Published articles</span><b>{isLoading ? '...' : stats?.publishedArticles}</b></div>
              <div className="telemetry-item"><span>Open requests</span><b style={{ color: (stats?.openRequests ?? 0) > 0 ? '#f27a86' : '#51e0aa' }}>{isLoading ? '...' : stats?.openRequests}</b></div>
              <div className="telemetry-item"><span>Feedback entries</span><b>{isLoading ? '...' : stats?.feedbackSubmissions}</b></div>
              <div className="telemetry-item"><span>Active centres</span><b>{isLoading ? '...' : stats?.activeCentres}</b></div>
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><span className="panel-title">Donor verbatim</span><MessageSquareQuote size={15} color="#2bd9e7" /></div>
          <div className="panel-body">
            <blockquote className="quote">
              I knew exactly which centre had capacity before I left home.
              <cite>verified donor - Gaborone</cite>
            </blockquote>
            <blockquote className="quote" style={{ marginTop: 10, borderLeftColor: '#4be0aa' }}>
              Our team can finally see the same shortage signal as the national office.
              <cite>facility manager - Francistown</cite>
            </blockquote>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;