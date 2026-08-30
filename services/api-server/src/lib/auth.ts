import { getAuth } from '@clerk/express';
import type { Request } from 'express';

export function getRequestAuth(req: Request): { userId: string | null } {
  try {
    if (process.env.CLERK_PUBLISHABLE_KEY) {
      const auth = getAuth(req);
      if (auth && auth.userId) return { userId: auth.userId };
    }
  } catch {
    // Proceed to fallback
  }

  const custom = (req as any).auth?.userId;
  if (custom) return { userId: custom };

  const header = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  return { userId: header || 'dev-pilot-user' };
}
