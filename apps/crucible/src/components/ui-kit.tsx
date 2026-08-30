import { type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function Button({ children, className = '', variant = 'primary', ...props }: {
  children: ReactNode; className?: string; variant?: 'primary' | 'quiet' | 'outline' | 'danger';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:brightness-105',
    quiet: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-105',
  };
  return <button {...props} className={`focus-ring inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-all duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`} />;
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'red' | 'blue'; className?: string }) {
  const tones = {
    neutral: 'bg-secondary text-secondary-foreground',
    teal: 'bg-primary/10 text-primary',
    amber: 'bg-accent/20 text-[#8b5700]',
    red: 'bg-destructive/10 text-destructive',
    blue: 'bg-[#dce9f5] text-[#2c6388]',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.08em] ${tones[tone]} ${className}`}>{children}</span>;
}

export function Panel({ children, className = '', title, eyebrow, action }: { children: ReactNode; className?: string; title?: string; eyebrow?: string; action?: ReactNode }) {
  return <section className={`rounded-lg border border-border bg-card shadow-[0_2px_12px_hsl(211_31%_17%/.04)] ${className}`}>
    {(title || eyebrow || action) && <header className="flex items-end justify-between gap-4 border-b border-border px-5 py-4">
      <div>{eyebrow && <div className="font-mono-ui text-[10px] font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</div>}{title && <h2 className="mt-1 text-[15px] font-bold tracking-tight">{title}</h2>}</div>
      {action}
    </header>}
    {children}
  </section>;
}

export function StatCard({ icon: Icon, label, value, detail, tone = 'teal', testId }: { icon: LucideIcon; label: string; value: string | number; detail: string; tone?: 'teal' | 'amber' | 'red'; testId: string }) {
  return <div className="group rounded-lg border border-border bg-card p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(211_31%_17%/.08)]" data-testid={testId}>
    <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[.1em] text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${tone === 'amber' ? 'text-accent' : tone === 'red' ? 'text-destructive' : 'text-primary'}`} /></div>
    <div className="mt-3 font-mono-ui text-3xl font-bold tracking-[-.06em]">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
  </div>;
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3 p-5" data-testid="state-loading">{Array.from({ length: count }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-secondary/80" />)}</div>;
}

export function ErrorState({ message = 'Signal interrupted. Try again.' , onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="m-5 rounded-md border border-destructive/25 bg-destructive/5 p-5" data-testid="state-error"><div className="text-sm font-semibold text-destructive">{message}</div>{onRetry && <Button onClick={onRetry} variant="outline" className="mt-3">Retry connection</Button>}</div>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="px-5 py-12 text-center" data-testid="state-empty"><div className="font-mono-ui text-2xl text-primary">— —</div><div className="mt-3 text-sm font-semibold">{title}</div><p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{detail}</p></div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[.08em] text-muted-foreground">{label}</span>{children}{hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}</label>;
}

export const inputClass = 'focus-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary';