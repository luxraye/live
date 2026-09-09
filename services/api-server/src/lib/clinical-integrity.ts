export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const COMPONENTS = ['prbc', 'ffp', 'platelets', 'cryo'] as const;
export const URGENCIES = ['elective', 'urgent_surgery', 'stat_trauma'] as const;
export const TRANSIT_STATUSES = ['assigned', 'in_transit', 'delivered', 'compromised'] as const;

export function bloodType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.normalize('NFKC').replace(/\u2212/g, '-');
  return (BLOOD_TYPES as readonly string[]).includes(normalized) ? normalized : null;
}
export function oneOf(value: unknown, allowed: readonly string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? value : null;
}
export function positiveUnits(value: unknown): number | null {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 100) return null;
  return value as number;
}
export function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
export function coordinate(value: unknown, min: number, max: number): number | null {
  return value == null ? null : finiteNumber(value) && value >= min && value <= max ? value : null;
}
export function compatibleRbc(donor: string, recipient: string): boolean {
  const d = bloodType(donor);
  const r = bloodType(recipient);
  if (!d || !r) return false;
  const [db, dr] = [d.replace(/[+-]/, ''), d.endsWith('+')];
  const [rb, rr] = [r.replace(/[+-]/, ''), r.endsWith('+')];
  return (db === 'O' || db === rb || rb === 'AB') && (!dr || rr);
}
export function idempotencyKey(req: { header(name: string): string | undefined }, body: Record<string, unknown>): string | null {
  const value = req.header('Idempotency-Key') ?? body.idempotencyKey;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255 ? value.trim() : null;
}