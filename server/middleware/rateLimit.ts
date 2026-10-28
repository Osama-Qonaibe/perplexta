import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { logSecurityAlert } from '../services/notifications.js';

const limitMultiplier = 500;

const resolveClientKey = (req: any): string => {
  if (req.user?.id) {
    return `user_${req.user.id}`;
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded: any = jwt.decode(token);
        if (decoded && decoded.id) {
          return `user_${decoded.id}`;
        }
      } catch (e) {}
      return `auth_${token.slice(-32)}`;
    }
  }
  if (req.cookies && req.cookies.token) {
    try {
      const decoded: any = jwt.decode(req.cookies.token);
      if (decoded && decoded.id) {
        return `user_${decoded.id}`;
      }
    } catch (e) {}
    return `cookie_${req.cookies.token.slice(-32)}`;
  }
  return ipKeyGenerator(req.ip || 'anonymous');
};

const createRateLimitHandler = (type: string) => {
  return (req: any, res: any, next: any, options: any) => {
    logSecurityAlert(
      req.user?.id || null,
      'rate_limit_blocked',
      'medium',
      `Rate limit exceeded: ${type}`,
      {
        path: req.path,
        method: req.method,
        limit: options.max,
        windowMs: options.windowMs,
        limitType: type
      },
      req
    ).catch(err => console.error('[RateLimit Log] Failed to record block:', err));

    res.status(options.statusCode).json(
      typeof options.message === 'object' 
        ? options.message 
        : { error: options.message || 'Rate limit exceeded' }
    );
  };
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  handler: createRateLimitHandler('global')
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security: Too many auth attempts. Please try again later.' },
  handler: createRateLimitHandler('auth')
});

export const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 100 * limitMultiplier,                    // 100 refreshes per minute per user
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many token refresh attempts. Please wait a moment.' },
  handler: createRateLimitHandler('refresh')
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please wait a moment.' },
  handler: createRateLimitHandler('chat_fast')
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in an hour.' },
  handler: createRateLimitHandler('forgot_password')
});

export const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security alert: Too many token verification requests. Slow down.' },
  handler: createRateLimitHandler('token')
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Security: Too many admin requests. Action throttled.' },
  handler: createRateLimitHandler('admin')
});

export const broadcastLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30 * limitMultiplier,
  keyGenerator: resolveClientKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many broadcast attempts. Admin communications are limited.' },
  handler: createRateLimitHandler('broadcast')
});
