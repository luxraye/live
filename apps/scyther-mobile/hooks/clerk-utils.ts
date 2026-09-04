export function isValidClerkKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) return false;
  if (trimmed.includes('YOUR_KEY_HERE') || trimmed.length < 20) return false;
  try {
    const raw = trimmed.replace(/^pk_(test|live)_/, '');
    const decoded = atob(raw);
    return Boolean(decoded && (decoded.includes('.') || decoded.endsWith('$')));
  } catch {
    return false;
  }
}
