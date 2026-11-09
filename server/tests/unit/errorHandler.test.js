import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { z } from 'zod';
import { normalizeError } from '../../src/middleware/errorHandler.js';
import { ApiError } from '../../src/utils/ApiError.js';

describe('normalizeError', () => {
  it('maps ApiError as-is', () => {
    expect(normalizeError(ApiError.conflict('x'))).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(normalizeError(ApiError.forbidden())).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
  it('maps ZodError to 400 with field details', () => {
    const r = z.object({ a: z.string() }).safeParse({});
    expect(normalizeError(r.error)).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', details: [{ path: 'a' }] });
  });
  it('maps mongoose validation and cast errors to 400', () => {
    const ve = new mongoose.Error.ValidationError();
    ve.addError('name', new mongoose.Error.ValidatorError({ path: 'name', message: 'Name is required' }));
    expect(normalizeError(ve)).toMatchObject({ status: 400, details: [{ path: 'name', message: 'Name is required' }] });
    expect(normalizeError(new mongoose.Error.CastError('ObjectId', 'zzz', '_id'))).toMatchObject({ status: 400, code: 'INVALID_VALUE' });
  });
  it('maps duplicate key errors to 409', () => {
    expect(normalizeError({ code: 11000, keyPattern: { email: 1 } })).toMatchObject({ status: 409, code: 'DUPLICATE_KEY', details: ['email'] });
  });
  it('maps JWT errors to 401 and body-parser errors to 400/413', () => {
    expect(normalizeError({ name: 'TokenExpiredError' })).toMatchObject({ status: 401, code: 'TOKEN_EXPIRED' });
    expect(normalizeError({ name: 'JsonWebTokenError' })).toMatchObject({ status: 401 });
    expect(normalizeError({ type: 'entity.parse.failed' })).toMatchObject({ status: 400, code: 'INVALID_JSON' });
    expect(normalizeError({ type: 'entity.too.large' })).toMatchObject({ status: 413 });
  });
  it('maps unknown errors to 500', () => {
    expect(normalizeError(new Error('boom'))).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });
});
