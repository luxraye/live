import type { Request, Response, NextFunction } from 'express';

export const PILOT_USER_ID = 'dev-pilot-user';

/**
 * Isolated development-only middleware for sovereign pilot authentication.
 * Never active in production (enforced by production boot guard in app.ts).
 */
export function devPilotAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV !== 'production' && process.env.PILOT_AUTH_ENABLED === 'true') {
    const existingAuth = (req as any).auth;
    if (!existingAuth?.userId) {
      (req as any).auth = { userId: PILOT_USER_ID };
      (req as any).isPilotAuth = true;
    }
  }
  next();
}
