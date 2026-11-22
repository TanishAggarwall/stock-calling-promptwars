import type { NextFunction, Request, Response } from 'express';

/** API prefixes that trigger real-world side effects (calls, messages, stored credentials). */
export const PUBLIC_DEMO_BLOCKED_PATHS = [
  '/api/secrets',
  '/api/calls',
  '/api/omni',
  '/api/telegram',
] as const;

const READ_ONLY_METHODS = new Set(['GET', 'HEAD']);

/** True when the app runs in the cloud as an open, login-free public demo. */
export function isPublicDemo(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CLOUD_MODE === 'true' && env.PUBLIC_DEMO === 'true';
}

/**
 * Express middleware for the public demo: read-only requests pass through,
 * while anything that could place a call, send a message or store a key is refused.
 */
export function publicDemoGuard(req: Request, res: Response, next: NextFunction): void {
  if (READ_ONLY_METHODS.has(req.method)) {
    next();
    return;
  }
  res.status(403).json({
    error: 'Disabled in the public demo. Run locally with your own keys to place calls.',
  });
}
