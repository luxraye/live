/**
 * api.ts — Authenticated fetch wrapper for the Bloodchain API server.
 *
 * Every request to a protected route attaches the Clerk session token
 * as an Authorization: Bearer header. Public routes (like /api/articles)
 * don't require a token — pass token = null for those.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  token: string | null,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let code = 'API_ERROR';
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      code = json?.error?.code ?? code;
      message = json?.error?.message ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, code, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string, token: string | null) {
  return request<T>('GET', path, token);
}

export function apiPost<T>(path: string, token: string | null, body: unknown) {
  return request<T>('POST', path, token, body);
}

export function apiPut<T>(path: string, token: string | null, body: unknown) {
  return request<T>('PUT', path, token, body);
}
