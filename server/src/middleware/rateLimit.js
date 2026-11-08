import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

export function createLimiter({ windowMs, limit, message = 'Too many requests, please try again later' }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMITED', message)),
  });
}
