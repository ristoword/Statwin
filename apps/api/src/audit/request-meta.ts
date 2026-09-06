import type { Request } from 'express';

export type RequestMeta = {
  ip?: string;
  userAgent?: string;
  path?: string;
};

export function requestMeta(req: Request): RequestMeta {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const userAgent = req.headers['user-agent'];
  return {
    ip: forwardedIp?.trim() || req.ip,
    userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 400) : undefined,
    path: req.originalUrl ?? req.url,
  };
}
