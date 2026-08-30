import {
  FeedbackInputPaperComparison,
  SerologyInputHbsag,
  SerologyInputHcv,
  SerologyInputHiv,
  SerologyInputVdrl,
  useCreateUnit,
  useFractionateUnit,
  useGetDashboard,
  useGetUnits,
  useGetVault,
  useScreenUnit,
  useSubmitFeedback,
} from '@workspace/api-client-react';
import type { Unit, UnitInput, SerologyInput, VaultSlot } from '@workspace/api-client-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowRight, Beaker, Check, ChevronRight, Clock3, Droplets, Filter, Gauge, History, PackageCheck, RefreshCw, Search, ShieldAlert, Snowflake, Thermometer, TrendingUp, X } from 'lucide-react';
import { flexRender } from '@tanstack/react-table';
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getGetUnitsQueryKey, getGetVaultQueryKey } from '@workspace/api-client-react';
import { Badge, Button, EmptyState, ErrorState, Field, inputClass, LoadingRows, Panel, StatCard } from '@/components/ui-kit';

const fmtDate = (value?: string | null) => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const statusTone = (status: string) => status === 'verified' || status === 'passed' || status === 'available' ? 'teal' : status === 'quarantine' || status === 'reactive' || status === 'expired' ? 'red' : status === 'expiring' ? 'amber' : 'neutral';

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</div><h1 className="mt-2 text-3xl font-bold tracking-[-.045em] md:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p></div>{action}</div>;
}

export function DashboardPage() {
  const dashboard = useGetDashboard();
  const units = useGetUnits({ status: 'all' });
  const vault = useGetVault();
  if (dashboard.isLoading) return <><PageHeading eyebrow="Live operations" title="Good afternoon, Lena." detail="Here is the current state of the processing floor." /><Panel><LoadingRows count={5} /></Panel></>;
  if (dashboard.isError || !dashboard.data) return <><PageHeading eyebrow="Live operations" title="Operations unavailable" detail="The command view could not establish a data link." /><Panel><ErrorState onRetry={() => dashboard.refetch()} /></Panel></>;
  const d = dashboard.data;
  const recent = units.data?.slice(0, 5) ?? [];
  const expiring = (vault.data ?? []).filter((slot) => slot.component && (slot.component.hoursRemaining ?? 999) < 48).slice(0, 3);
  const rate = Math.round(d.throughput.current / Math.max(d.throughput.target, 1) * 100);
  return <div className="animate-enter"><PageHeading eyebrow="Live operations / 14 May 2024" title="Good afternoon, Lena." detail="The processing floor is moving cleanly. Two attention points need a technologist's eye." action={<Link href="/intake" className="focus-ring inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-105" data-testid="link-receive-unit">Receive unit <ArrowRight className="h-4 w-4" /></Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Droplets} label="Received today" value={d.receivedToday} detail="whole blood units" testId="stat-received" /><StatCard icon={PackageCheck} label="Processed today" value={d.processedToday} detail="components released" testId="stat-processed" /><StatCard icon={ShieldAlert} label="Quarantine" value={d.quarantineCount} detail="requires review" tone="red" testId="stat-quarantine" /><StatCard icon={Clock3} label="Expiry watch" value={d.expiringSoonCount} detail="within 48 hours" tone="amber" testId="stat-expiring" /></div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <Panel title="Throughput" eyebrow="Current shift" action={<Badge tone="teal"><span className="status-pulse mr-1.5 h-1.5 w-1.5 rounded-full bg-primary" />Live</Badge>}>
        <div className="p-5"><div className="flex items-end justify-between"><div><span className="font-mono-ui text-5xl font-bold tracking-[-.07em]">{d.throughput.current}</span><span className="ml-2 text-sm text-muted-foreground">{d.throughput.unit}</span></div><div className="text-right"><div className="font-mono-ui text-sm font-bold text-primary">{rate}%</div><div className="text-[11px] text-muted-foreground">of {d.throughput.target} target</div></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(rate, 100)}%` }} /></div><div className="mt-3 flex justify-between font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground"><span>Start 06:00</span><span>Target {d.throughput.target} / hr</span><span>Now</span></div></div>
      </Panel>
      <Panel title="Verification rate" eyebrow="Screening gate"><div className="flex items-center gap-5 p-5"><div className="relative flex h-24 w-24 items-center justify-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${d.verifiedRate}%, hsl(var(--secondary)) 0)` }}><div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-card font-mono-ui text-xl font-bold">{d.verifiedRate}%</div></div><div><div className="text-sm font-semibold">Pass rate this shift</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Across all serology panels. {d.quarantineCount ? `${d.quarantineCount} unit${d.quarantineCount > 1 ? 's' : ''} held for review.` : 'No units currently held.'}</p></div></div></Panel>
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <Panel title="Recent unit activity" eyebrow="Inbound ledger" action={<Link href="/intake" className="focus-ring text-xs font-bold text-primary hover:underline" data-testid="link-view-intake">View intake <ChevronRight className="inline h-3 w-3" /></Link>}>
        {units.isLoading ? <LoadingRows /> : units.isError ? <ErrorState onRetry={() => units.refetch()} /> : recent.length === 0 ? <EmptyState title="No units in the ledger" detail="Received units will appear here as soon as they are registered." /> : <div className="divide-y divide-border">{recent.map((unit) => <div key={unit.id} className="flex items-center gap-3 px-5 py-3.5" data-testid={`row-recent-unit-${unit.id}`}><div className="flex h-8 w-8 items-center justify-center rounded bg-secondary font-mono-ui text-[10px] font-bold text-primary">{unit.bloodGroup ?? '—'}</div><div className="min-w-0 flex-1"><div className="font-mono-ui text-xs font-bold">{unit.id}</div><div className="truncate text-[11px] text-muted-foreground">{unit.collectionSite} · {fmtDate(unit.createdAt)}</div></div><Badge tone={statusTone(unit.status) as 'teal' | 'red' | 'amber' | 'neutral'}>{unit.status}</Badge></div>)}</div>}
      </Panel>
      <Panel title="Expiry watch" eyebrow="Cold vault / priority"><div className="divide-y divide-border">{expiring.length ? expiring.map((slot) => <div className="flex items-center gap-3 px-5 py-3.5" key={slot.shelf} data-testid={`row-expiry-${slot.shelf}`}><div className="font-mono-ui text-xs font-bold text-primary">{slot.shelf}</div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{slot.component?.type} · {slot.component?.bloodGroup}</div><div className="text-[11px] text-muted-foreground">{slot.component?.id}</div></div><Badge tone="amber">{slot.component?.hoursRemaining}h</Badge></div>) : <EmptyState title="No urgent expiries" detail="The vault has no components inside the 48-hour watch window." />}</div></Panel>
    </div>
  </div>;
}

const unitColumns: LegacyColumnDef<Unit>[] = [
  {
    accessorKey: 'id',
    header: 'Unit ID',
    cell: ({ row }) => <span className="font-mono-ui text-xs font-bold">{row.original.id}</span>,
  },
  {
    accessorKey: 'bloodGroup',
    header: 'Group',
    cell: ({ row }) => <span className="font-mono-ui text-xs font-bold text-primary">{row.original.bloodGroup ?? '—'}</span>,
  },
  {
    accessorKey: 'collectionSite',
    header: 'Collection site',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.collectionSite}</span>,
  },
  {
    accessorKey: 'volumeMl',
    header: 'Volume',
    cell: ({ row }) => <span className="font-mono-ui text-xs">{row.original.volumeMl} mL</span>,
  },
  {
    accessorKey: 'status',
    header: 'Gate status',
    cell: ({ row }) => <Badge tone={statusTone(row.original.status) as 'teal' | 'red' | 'amber' | 'neutral'}>{row.original.status}</Badge>,
  },
];

function UnitQueueTable({ data, selectedId, onSelect }: { data: Unit[]; selectedId?: string; onSelect: (unit: Unit) => void }) {
  const table = useLegacyTable({ data, columns: unitColumns, getCoreRowModel: getCoreRowModel() });
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-left">
        <thead className="border-b border-border bg-secondary/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => <th key={header.id} className="px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground">{flexRender(header.column.columnDef.header, header.getContext())}</th>)}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row.original)} className={`cursor-pointer transition-colors hover:bg-secondary/50 ${selectedId === row.original.id ? 'bg-primary/5' : ''}`} data-testid={`row-queue-unit-${row.original.id}`}>
              {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const initialUnit: UnitInput = { donorCode: '', collectionSite: '', collectedAt: new Date().toISOString().slice(0, 16), volumeMl: 450 };
const initialSerology: SerologyInput = { aboForward: '', aboReverse: '', rhd: '', hiv: 'non-reactive', hbsag: 'non-reactive', hcv: 'non-reactive', vdrl: 'non-reactive' };

export function IntakePage() {
  const queryClient = useQueryClient();
  const units = useGetUnits({ status: 'pending' });
  const create = useCreateUnit();
  const screen = useScreenUnit();
  const fractionate = useFractionateUnit();
  const [unitForm, setUnitForm] = useState<UnitInput>(initialUnit);
  const [sero, setSero] = useState<SerologyInput>(initialSerology);
  const [selected, setSelected] = useState<Unit | null>(null);
  const [message, setMessage] = useState('');
  const updateUnit = (key: keyof UnitInput, value: string) => setUnitForm((f) => ({ ...f, [key]: key === 'volumeMl' ? Number(value) : value }));
  const receive = (e: FormEvent) => { e.preventDefault(); create.mutate({ data: unitForm }, { onSuccess: (unit) => { setSelected(unit); setMessage(`Unit ${unit.id} received. Complete the serology gate.`); setUnitForm(initialUnit); queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey({ status: 'pending' }) }); }, onError: () => setMessage('Unable to receive this unit. Check the fields and retry.') }); };
  const submitScreen = (e: FormEvent) => { e.preventDefault(); if (!selected) return; screen.mutate({ id: selected.id, data: sero }, { onSuccess: (unit) => { setSelected(unit); setMessage(unit.screening.gate === 'passed' ? 'Screening passed. Unit is ready to fractionate.' : 'Screening flagged this unit. It has been moved to quarantine.'); queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey({ status: 'pending' }) }); }, onError: () => setMessage('Screening result was not accepted. Retry the panel.') }); };
  const fractionateNow = () => { if (!selected) return; fractionate.mutate({ id: selected.id, data: { operator: 'Lena Morris' } }, { onSuccess: () => { setMessage('Fractionation complete. Components are entering cold storage.'); queryClient.invalidateQueries({ queryKey: getGetUnitsQueryKey({ status: 'pending' }) }); queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() }); }, onError: () => setMessage('Fractionation failed. Unit remains safely verified.') }); };
  return <div className="animate-enter"><PageHeading eyebrow="Inbound workflow" title="Receive & screen" detail="Register each whole blood unit, then clear the serology gate before it enters component processing." action={<div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Gate protocol v2.4</div>} />
    {message && <div className="mb-4 flex items-center gap-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary" data-testid="status-intake-message"><Check className="h-4 w-4" />{message}<button className="focus-ring ml-auto" onClick={() => setMessage('')} data-testid="button-dismiss-intake-message"><X className="h-4 w-4" /></button></div>}
    <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <Panel title="1 / Register donation" eyebrow="Whole blood intake"><form className="space-y-4 p-5" onSubmit={receive}><Field label="Donor code" hint="Use the sealed bag identifier."><input className={inputClass} required minLength={3} value={unitForm.donorCode} onChange={(e) => updateUnit('donorCode', e.target.value)} placeholder="e.g. DNR-48217" data-testid="input-donor-code" /></Field><Field label="Collection site"><input className={inputClass} required minLength={2} value={unitForm.collectionSite} onChange={(e) => updateUnit('collectionSite', e.target.value)} placeholder="Northside mobile drive" data-testid="input-collection-site" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Collected at"><input className={inputClass} required type="datetime-local" value={unitForm.collectedAt} onChange={(e) => updateUnit('collectedAt', e.target.value)} data-testid="input-collected-at" /></Field><Field label="Volume (mL)"><input className={inputClass} required min={1} type="number" value={unitForm.volumeMl} onChange={(e) => updateUnit('volumeMl', e.target.value)} data-testid="input-volume" /></Field></div><Button className="mt-2 w-full" disabled={create.isPending} type="submit" data-testid="button-receive-unit">{create.isPending ? 'Registering…' : 'Register donation'} <ArrowRight className="h-4 w-4" /></Button></form></Panel>
      <Panel title="2 / Serology gate" eyebrow={selected ? `Unit ${selected.id}` : 'Awaiting a unit'} action={selected ? <Badge tone={statusTone(selected.screening.gate) as 'teal' | 'red' | 'neutral'}>{selected.screening.gate}</Badge> : undefined}>
        {!selected ? <div className="flex min-h-[310px] items-center justify-center"><EmptyState title="Select a received unit" detail="Register a donation to open its screening panel." /></div> : <form className="p-5" onSubmit={submitScreen}><div className="grid gap-3 sm:grid-cols-2"><Field label="ABO forward"><input className={inputClass} required value={sero.aboForward} onChange={(e) => setSero({ ...sero, aboForward: e.target.value })} placeholder="Anti-A / Anti-B" data-testid="input-abo-forward" /></Field><Field label="ABO reverse"><input className={inputClass} required value={sero.aboReverse} onChange={(e) => setSero({ ...sero, aboReverse: e.target.value })} placeholder="A1 / B cells" data-testid="input-abo-reverse" /></Field><Field label="RhD"><input className={inputClass} required value={sero.rhd} onChange={(e) => setSero({ ...sero, rhd: e.target.value })} placeholder="Positive / negative" data-testid="input-rhd" /></Field>{(['hiv', 'hbsag', 'hcv', 'vdrl'] as const).map((key) => <Field key={key} label={key.toUpperCase()}><select className={inputClass} value={sero[key]} onChange={(e) => setSero({ ...sero, [key]: e.target.value })} data-testid={`select-${key}`}><option value="non-reactive">Non-reactive</option><option value="reactive">Reactive</option></select></Field>)}</div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button type="submit" disabled={screen.isPending || selected.screening.gate === 'passed'} data-testid="button-submit-screening">{screen.isPending ? 'Evaluating…' : 'Evaluate gate'} <Check className="h-4 w-4" /></Button><Button type="button" variant="outline" disabled={fractionate.isPending || selected.screening.gate !== 'passed'} onClick={fractionateNow} data-testid="button-fractionate">{fractionate.isPending ? 'Processing…' : 'Fractionate unit'} <Beaker className="h-4 w-4" /></Button></div></form>}
      </Panel>
    </div>
     <Panel className="mt-4" title="Pending screening queue" eyebrow={`${units.data?.length ?? 0} units waiting`} action={<Button variant="quiet" className="px-2 py-1" onClick={() => units.refetch()} data-testid="button-refresh-queue"><RefreshCw className="h-3.5 w-3.5" /></Button>}>{units.isLoading ? <LoadingRows /> : units.isError ? <ErrorState onRetry={() => units.refetch()} /> : units.data?.length ? <UnitQueueTable data={units.data} selectedId={selected?.id} onSelect={setSelected} /> : <EmptyState title="Screening queue clear" detail="All received units have moved through the current gate." />}</Panel>
  </div>;
}

function VaultCell({ slot, onSelect }: { slot: VaultSlot; onSelect: () => void }) {
  const urgent = slot.component && (slot.component.hoursRemaining ?? 999) <= 24;
  return <button onClick={onSelect} className={`focus-ring group min-h-[94px] rounded-md border p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${slot.status === 'empty' ? 'border-dashed border-border bg-background' : urgent ? 'border-accent/70 bg-accent/10' : slot.status === 'quarantine' ? 'border-destructive/40 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`} data-testid={`button-vault-slot-${slot.shelf}`}><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] font-bold">{slot.shelf}</span><span className={`h-1.5 w-1.5 rounded-full ${slot.status === 'empty' ? 'bg-border' : urgent ? 'bg-accent' : slot.status === 'quarantine' ? 'bg-destructive' : 'bg-primary'}`} /></div>{slot.component ? <><div className="mt-3 text-[11px] font-bold">{slot.component.type} · {slot.component.bloodGroup}</div><div className="mt-1 font-mono-ui text-[9px] text-muted-foreground">{slot.component.hoursRemaining ?? '—'}h remaining</div></> : <div className="mt-5 text-[10px] text-muted-foreground">Empty</div>}</button>;
}

export function VaultPage() {
  const vault = useGetVault();
  const [selected, setSelected] = useState<VaultSlot | null>(null);
  const [filter, setFilter] = useState<'all' | 'occupied' | 'expiring'>('all');
  if (vault.isLoading) return <><PageHeading eyebrow="Cold storage" title="Vault matrix" detail="A1–D4 component locations and expiry watchlist." /><Panel><LoadingRows count={6} /></Panel></>;
  if (vault.isError || !vault.data) return <><PageHeading eyebrow="Cold storage" title="Vault unavailable" detail="The cold storage map could not be loaded." /><Panel><ErrorState onRetry={() => vault.refetch()} /></Panel></>;
  const slots = vault.data.filter((slot) => filter === 'all' || slot.status === filter);
  const shelves = [...new Set(vault.data.map((s) => s.shelf.charAt(0)))].sort();
  const expiring = vault.data.filter((s) => s.component && (s.component.hoursRemaining ?? 999) < 48).sort((a, b) => (a.component?.hoursRemaining ?? 999) - (b.component?.hoursRemaining ?? 999));
  return <div className="animate-enter"><PageHeading eyebrow="Cold storage / 4°C" title="Vault matrix" detail="Every component, one glance. Select a slot to inspect chain-of-custody details." action={<div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 font-mono-ui text-[10px]"><Thermometer className="h-3.5 w-3.5 text-primary" /> 4.0°C <span className="text-muted-foreground">stable</span></div>} />
    <div className="mb-4 flex flex-wrap gap-2">{(['all', 'occupied', 'expiring'] as const).map((f) => <Button key={f} variant={filter === f ? 'primary' : 'outline'} className="py-1.5 text-xs capitalize" onClick={() => setFilter(f)} data-testid={`button-vault-filter-${f}`}>{f}</Button>)}<span className="ml-auto hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.1em] text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-primary" /> Available <span className="ml-2 h-2 w-2 rounded-full bg-accent" /> Expiring</span></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_330px]"><Panel title="Storage map" eyebrow={`${slots.length} slots visible`}><div className="overflow-x-auto p-5"><div className="min-w-[610px] space-y-5">{shelves.map((shelf) => <div key={shelf} className="grid grid-cols-[30px_1fr] items-start gap-3"><div className="pt-8 font-mono-ui text-xs font-bold text-muted-foreground">{shelf}</div><div className="grid grid-cols-4 gap-2">{slots.filter((s) => s.shelf.startsWith(shelf)).map((slot) => <VaultCell key={slot.shelf} slot={slot} onSelect={() => setSelected(slot)} />)}</div></div>)}</div></div></Panel>
      <Panel title="Slot inspector" eyebrow={selected?.shelf ?? 'Select a slot'}>{selected ? <div className="p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-lg font-bold text-primary">{selected.component?.bloodGroup ?? '—'}</div><div><div className="font-mono-ui text-sm font-bold">{selected.component?.id ?? 'Empty slot'}</div><div className="text-xs text-muted-foreground">{selected.zone} · {selected.temperature}</div></div></div>{selected.component && <dl className="mt-6 space-y-3 border-t border-border pt-4 text-xs"><div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd className="font-bold">{selected.component.type}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Parent unit</dt><dd className="font-mono-ui">{selected.component.parentUnitId}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Expires</dt><dd>{fmtDate(selected.component.expiresAt)}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Time remaining</dt><dd className={selected.component.hoursRemaining && selected.component.hoursRemaining < 48 ? 'font-bold text-accent' : 'font-bold text-primary'}>{selected.component.hoursRemaining} hours</dd></div></dl>}</div> : <EmptyState title="No slot selected" detail="Select a cell in the storage map to inspect its component." />}</Panel></div>
    <Panel className="mt-4" title="Expiry watchlist" eyebrow={`${expiring.length} components inside 48 hours`}><div className="divide-y divide-border">{expiring.length ? expiring.slice(0, 8).map((slot) => <button key={slot.shelf} onClick={() => setSelected(slot)} className="focus-ring flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-secondary/50" data-testid={`button-watchlist-${slot.shelf}`}><span className="font-mono-ui text-xs font-bold text-primary">{slot.shelf}</span><span className="flex-1 text-xs font-semibold">{slot.component?.id} <span className="font-normal text-muted-foreground">· {slot.component?.type} · {slot.component?.bloodGroup}</span></span><Badge tone="amber">{slot.component?.hoursRemaining}h left</Badge></button>) : <EmptyState title="Watchlist clear" detail="No components require expiry intervention." />}</div></Panel>
  </div>;
}

export function AuditPage() {
  const feedback = useSubmitFeedback();
  const [rating, setRating] = useState(0);
  const [comparison, setComparison] = useState<FeedbackInputPaperComparison>('faster');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); if (!rating) return; feedback.mutate({ data: { platform: 'crucible-lab', rating, paperComparison: comparison, note } }, { onSuccess: (result) => { setSent(`Feedback ${result.id} logged at ${fmtDate(result.submittedAt)}.`); setRating(0); setNote(''); }, onError: () => setSent('Feedback could not be logged. The workflow remains unchanged; retry when connected.') }); };
  const events = [{ time: '14:28:41', title: 'Component released', detail: 'PRBC-240514-018 · verified by Lena Morris', tone: 'teal' }, { time: '14:21:06', title: 'Unit held for review', detail: 'WB-240514-022 · reactive HCV result', tone: 'red' }, { time: '14:12:33', title: 'Vault temperature checked', detail: 'Zone C · 4.1°C · within operating band', tone: 'blue' }, { time: '13:57:09', title: 'Shift handoff completed', detail: 'M. Chen → L. Morris · no open exceptions', tone: 'neutral' }];
  return <div className="animate-enter"><PageHeading eyebrow="Feedback & history" title="Audit trail" detail="A transparent record of workflow signals, operator feedback, and exceptions." action={<Badge tone="blue"><History className="mr-1 h-3 w-3" /> immutable log</Badge>} />
    <div className="grid gap-4 lg:grid-cols-[1fr_390px]"><Panel title="Operational history" eyebrow="Today · 14 May 2024"><div className="divide-y divide-border">{events.map((event, i) => <div key={event.time} className="flex gap-4 px-5 py-4" data-testid={`row-audit-event-${i}`}><div className="flex flex-col items-center"><span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.tone === 'red' ? 'bg-destructive' : event.tone === 'teal' ? 'bg-primary' : event.tone === 'blue' ? 'bg-[#5a91b6]' : 'bg-muted-foreground'}`} />{i < events.length - 1 && <span className="mt-2 h-full w-px bg-border" />}</div><div><div className="flex items-center gap-3"><span className="font-mono-ui text-[10px] text-muted-foreground">{event.time}</span><span className="text-sm font-bold">{event.title}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p></div></div>)}</div></Panel>
      <Panel title="Tell us how it feels" eyebrow="Workflow pilot"><form onSubmit={submit} className="space-y-5 p-5"><Field label="Overall rating"><div className="flex gap-2">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} className={`focus-ring flex h-10 w-10 items-center justify-center rounded-md border font-mono-ui text-sm font-bold transition ${rating >= n ? 'border-accent bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent'}`} data-testid={`button-rating-${n}`}>{n}</button>)}</div></Field><Field label="Compared with paper logs"><select className={inputClass} value={comparison} onChange={(e) => setComparison(e.target.value as FeedbackInputPaperComparison)} data-testid="select-paper-comparison"><option value="much-slower">Much slower</option><option value="slower">Slower</option><option value="same">About the same</option><option value="faster">Faster</option><option value="much-faster">Much faster</option></select></Field><Field label="Note (optional)"><textarea className={`${inputClass} h-24 resize-none py-2`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What would make the next handoff clearer?" data-testid="textarea-feedback-note" /></Field>{sent && <div className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary" data-testid="status-feedback">{sent}</div>}<Button className="w-full" disabled={!rating || feedback.isPending} type="submit" data-testid="button-submit-feedback">{feedback.isPending ? 'Logging…' : 'Submit feedback'} <ArrowRight className="h-4 w-4" /></Button></form></Panel></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-card p-4"><Gauge className="h-4 w-4 text-primary" /><div className="mt-4 font-mono-ui text-2xl font-bold">2.4</div><div className="mt-1 text-xs text-muted-foreground">Current protocol version</div></div><div className="rounded-lg border border-border bg-card p-4"><TrendingUp className="h-4 w-4 text-primary" /><div className="mt-4 font-mono-ui text-2xl font-bold">+18m</div><div className="mt-1 text-xs text-muted-foreground">Time saved this shift</div></div><div className="rounded-lg border border-border bg-card p-4"><Filter className="h-4 w-4 text-primary" /><div className="mt-4 font-mono-ui text-2xl font-bold">0</div><div className="mt-1 text-xs text-muted-foreground">Open audit exceptions</div></div></div>
  </div>;
}