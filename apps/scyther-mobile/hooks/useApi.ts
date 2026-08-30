import { useAuth } from '@clerk/expo';
import { useCallback } from 'react';

const getBaseUrl = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export function useApi() {
  const { getToken } = useAuth();

  const apiFetch = useCallback(async <T>(path: string, options?: RequestInit): Promise<T> => {
    const token = await getToken();
    const res = await fetch(`${getBaseUrl()}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(err?.error?.message ?? 'Request failed');
    }
    return res.json() as Promise<T>;
  }, [getToken]);

  return { apiFetch };
}
