import { useAuth } from '@clerk/expo';
import { useCallback } from 'react';

const getBaseUrl = () =>
  (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://bloodchain-api-i9et.onrender.com'
  ).replace(/\/$/, '');

export function useApi() {
  let getToken: (() => Promise<string | null>) | null = null;
  try {
    const auth = useAuth();
    getToken = auth?.getToken ?? null;
  } catch {
    getToken = null;
  }

  const apiFetch = useCallback(async <T>(path: string, options?: RequestInit): Promise<T> => {
    let token: string | null = null;
    if (getToken) {
      try {
        token = await Promise.race([
          getToken(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
      } catch {
        token = null;
      }
    }
    const base = getBaseUrl().replace(/\/$/, '');
    const cleanPath = path.startsWith('/api') ? path : `/api${path}`;
    const url = `${base}${cleanPath}`;

    const res = await fetch(url, {
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
