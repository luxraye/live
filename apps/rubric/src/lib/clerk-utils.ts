/**
 * Validates whether a Clerk publishable key is well-formed before passing it to ClerkProvider.
 * Prevents "failed_to_load_clerk_js: net::ERR_NAME_NOT_RESOLVED" crashes when keys are missing,
 * placeholders (e.g. pk_live_YOUR_KEY_HERE), or malformed.
 */
export function isValidClerkKey(key?: string | null): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.replace(/^["']|["']$/g, '').trim();
  if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) return false;
  if (trimmed.includes('YOUR_KEY_HERE') || trimmed.length < 25) return false;

  try {
    const raw = trimmed.replace(/^pk_(test|live)_/, '');
    let base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded =
      typeof atob !== 'undefined'
        ? atob(base64)
        : typeof Buffer !== 'undefined'
        ? Buffer.from(base64, 'base64').toString('utf-8')
        : '';
    return Boolean(decoded && (decoded.includes('.') || decoded.endsWith('$')));
  } catch {
    return /^[a-zA-Z0-9_-]+$/.test(trimmed.replace(/^pk_(test|live)_/, ''));
  }
}

export function sanitizeClerkKey(key?: string | null): string | undefined {
  if (!key || typeof key !== 'string') return undefined;
  const trimmed = key.replace(/^["']|["']$/g, '').trim();
  return isValidClerkKey(trimmed) ? trimmed : undefined;
}

