import { getAuth } from '@clerk/express';
import type { Request } from 'express';

export interface RequestAuth {
  userId: string | null;
  isPilot: boolean;
}

const PILOT_USER_ID = 'dev-pilot-user';

export function getRequestAuth(req: Request): RequestAuth {
  let userId: string | null = null;
  try {
    if (process.env.CLERK_PUBLISHABLE_KEY) {
      const auth = getAuth(req);
      if (auth?.userId) userId = auth.userId;
    }
  } catch { /* Clerk middleware may not be installed in development. */ }
  if (!userId) userId = (req as any).auth?.userId ?? null;
  const isPilot = !userId && process.env.NODE_ENV !== 'production' &&
    process.env.PILOT_AUTH_ENABLED === 'true';
  return { userId: userId ?? (isPilot ? PILOT_USER_ID : null), isPilot };
}

export function requireUser(req: Request, res: { status: (code: number) => { json: (body: unknown) => unknown } }): string | null {
  const auth = getRequestAuth(req);
  if (!auth.userId || auth.isPilot) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sign in is required.' } });
    return null;
  }
  return auth.userId;
}
