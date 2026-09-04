/**
 * Validates whether a Clerk publishable key is well-formed before passing it to ClerkProvider.
 * Prevents "failed_to_load_clerk_js: net::ERR_NAME_NOT_RESOLVED" crashes when keys are missing,
 * placeholders (e.g. pk_live_YOUR_KEY_HERE), or malformed.
 */
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
