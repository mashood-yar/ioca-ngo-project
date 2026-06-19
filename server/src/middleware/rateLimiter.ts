import rateLimit from 'express-rate-limit';

// Standard rate limiter for API endpoints (e.g., 100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive endpoints like contact forms or donations (e.g., 10 requests per 15 minutes)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { success: false, error: 'Rate limit exceeded, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
