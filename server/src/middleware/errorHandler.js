import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { errorBody } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`));
}

export function normalizeError(err) {
  if (err instanceof ApiError) {
    return { status: err.statusCode, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Data validation failed',
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { status: 400, code: 'INVALID_VALUE', message: `Invalid value for "${err.path}"` };
  }
  if (err?.code === 11000) {
    return { status: 409, code: 'DUPLICATE_KEY', message: 'A record with the same unique value already exists', details: Object.keys(err.keyPattern || {}) };
  }
  if (err?.type === 'entity.parse.failed') {
    return { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' };
  }
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' };
  }
  if (err?.name === 'TokenExpiredError') {
    return { status: 401, code: 'TOKEN_EXPIRED', message: 'Session expired, please sign in again' };
  }
  if (err?.name === 'JsonWebTokenError' || err?.name === 'NotBeforeError') {
    return { status: 401, code: 'UNAUTHORIZED', message: 'Invalid authentication token' };
  }
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: env.isProduction ? 'Something went wrong' : err?.message || 'Something went wrong',
  };
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const { status, code, message, details } = normalizeError(err);
  if (status >= 500) logger.error(`${req.method} ${req.originalUrl}`, err);
  if (res.headersSent) return;
  res.status(status).json(errorBody(code, message, details));
}
