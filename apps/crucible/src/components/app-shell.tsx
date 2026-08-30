import { useHealthCheck } from '@workspace/api-client-react';
import { Activity, ClipboardCheck, FlaskConical, LayoutDashboard, Link2, Menu, Snowflake, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Badge } from '@/components/ui-kit';
import { resolveLabProfile } from '@/components/Landing';

const nav = [
  { href: '/', label: 'Operations', hint: 'Live command view', icon: LayoutDashboard },
  { href: '/intake', label: 'Intake & screen', hint: 'Receive + verify', icon: FlaskConical },
  { href: '/vault', label: 'Cold vault', hint: 'A1–D4 matrix', icon: Snowflake },
  { href: '/audit', label: 'Audit trail', hint: 'Feedback + history', icon: ClipboardCheck },
];

export function AppShell({
  children,
  operatorRole = 'Tebogo Modise',
  onExit,
}: {
  children: ReactNode;
  operatorRole?: string;
  onExit?: () => void;
}) {
  const profile = resolveLabProfile(operatorRole);
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const health = useHealthCheck();
  const online = health.data?.status === 'ok' || health.data?.status === 'healthy';

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[268px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-5">
            <Link href="/" className="focus-ring flex items-center gap-3" data-testid="link-brand">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sidebar text-lg font-bold">C</span>
              <span><span className="block text-[15px] font-bold tracking-tight">Crucible Lab</span><span className="font-mono-ui text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/55">Component control</span></span>
            </Link>
            <button className="focus-ring rounded p-1 md:hidden" onClick={() => setOpen(false)} data-testid="button-close-menu"><X className="h-5 w-5" /></button>
          </div>
          <div className="px-5 pt-2">
            <a
              href="https://bloodchain.life"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] font-bold text-accent hover:underline"
            >
              <Link2 className="h-3 w-3" /> bloodchain.life
            </a>
          </div>
          <div className="px-4 py-4">
            <div className="mb-3 px-2 font-mono-ui text-[9px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/45">Workspace</div>
            <nav className="space-y-1">
              {nav.map(({ href, label, hint, icon: Icon }) => {
                const active = href === '/' ? location === '/' : location.startsWith(href);
                return (
                  <Link key={href} href={href} onClick={() => setOpen(false)} className={`focus-ring group flex items-center gap-3 rounded-md px-3 py-3 transition-colors ${active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
                    <Icon className={`h-[18px] w-[18px] ${active ? 'text-accent' : 'text-sidebar-foreground/55 group-hover:text-accent'}`} />
                    <span><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-[10px] text-current/55">{hint}</span></span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto border-t border-sidebar-border p-4">
            <div className="rounded-md bg-white/5 p-3">
              <div className="flex items-center gap-2">
                <span className={`status-pulse h-2 w-2 rounded-full ${health.isError ? 'bg-destructive' : 'bg-accent'}`} />
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.1em]">{health.isLoading ? 'Checking link' : online ? 'System nominal' : 'Service connected'}</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/50">Node clearance · {profile.clearanceLevel}</p>
            </div>
            <div className="mt-4 flex items-center gap-3 px-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">{profile.name}</div>
                <div className="truncate text-[10px] text-sidebar-foreground/50">{profile.title.split('&')[0]}</div>
              </div>
              {onExit && (
                <button
                  onClick={onExit}
                  className="rounded bg-white/5 px-2 py-1 text-[10px] font-bold text-sidebar-foreground/70 hover:bg-white/10 hover:text-white"
                  title="Switch Technologist Role"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-sidebar/40 md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" data-testid="button-overlay" />}
      <main className="min-h-[100dvh] md:pl-[268px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="focus-ring rounded p-1 md:hidden" onClick={() => setOpen(true)} data-testid="button-open-menu"><Menu className="h-5 w-5" /></button>
            <div className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">
              CL / <span className="text-primary">{location === '/' ? 'operations' : location.slice(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onExit && (
              <button
                onClick={onExit}
                className="rounded border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/20"
              >
                Exit Pilot
              </button>
            )}
            <Badge tone="teal">{profile.shift}</Badge>
            <span className="hidden font-mono-ui text-[10px] text-muted-foreground sm:inline">
              {profile.idCode} · {profile.station.split('(')[0].trim()}
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8">{children}</div>
      </main>
    </div>
  );
}
