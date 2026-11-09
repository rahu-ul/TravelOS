import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { setupDb, teardownDb, buildApp } from '../support/hardening-helpers.js';
import { errorHandler, normalizeError } from '../../src/middleware/errorHandler.js';
import { asyncHandler } from '../../src/utils/asyncHandler.js';
import { ApiError } from '../../src/utils/ApiError.js';
import { validate } from '../../src/middleware/validate.js';
import { parseEnv } from '../../src/config/env.js';

let app;
beforeAll(async () => { await setupDb(); app = buildApp(); });
afterAll(teardownDb);

describe('API error handling', () => {
  it('unknown route -> 404 in the standard envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
  it('invalid JSON -> 400 INVALID_JSON', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
  it('oversized body -> 413', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(200000) });
    expect(res.status).toBe(413);
  });
  it('global rate limit -> 429 RATE_LIMITED', async () => {
    const limited = buildApp({ rateLimit: { max: 2 } });
    await request(limited).get('/api/health');
    await request(limited).get('/api/health');
    const res = await request(limited).get('/api/health');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
  it('health endpoint reports DB state and sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('connected');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
  it('CORS: allow-listed origin gets credentials header, others do not', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('uncaught handler errors -> 500 without leaking a stack trace', async () => {
    const mini = express();
    mini.get('/boom', asyncHandler(async () => { throw new Error('kaboom'); }));
    mini.use(errorHandler);
    const res = await request(mini).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });
});

describe('normalizeError', () => {
  it('maps known error types to statuses and codes', () => {
    expect(normalizeError(ApiError.conflict('x'))).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(normalizeError(ApiError.unprocessable('x'))).toMatchObject({ status: 422, code: 'UNPROCESSABLE' });
    expect(normalizeError({ code: 11000, keyPattern: { email: 1 } })).toMatchObject({ status: 409, code: 'DUPLICATE_KEY', details: ['email'] });
    expect(normalizeError(new mongoose.Error.CastError('ObjectId', 'abc', '_id'))).toMatchObject({ status: 400, code: 'INVALID_VALUE' });
    const zerr = z.object({ a: z.string() }).safeParse({}).error;
    expect(normalizeError(zerr)).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', details: [{ path: 'a' }] });
  });
  it('validate middleware replaces input with parsed values', async () => {
    const mini = express();
    mini.use(express.json());
    mini.get('/n', validate({ query: z.object({ page: z.coerce.number().int().min(1).default(1) }) }), (req, res) => res.json({ page: req.query.page }));
    mini.use(errorHandler);
    expect((await request(mini).get('/n?page=3')).body.page).toBe(3);
    expect((await request(mini).get('/n?page=0')).status).toBe(400);
  });
});

describe('environment validation', () => {
  const base = { MONGODB_URI: 'mongodb://127.0.0.1:27017/x', JWT_SECRET: 'a'.repeat(40) };
  it('accepts a minimal valid config and applies defaults', () => {
    const cfg = parseEnv(base);
    expect(cfg.PORT).toBe(5000);
    expect(cfg.clientOrigins).toEqual(['http://localhost:5173']);
  });
  it('rejects a missing/short secret and a bad Mongo URI with readable messages', () => {
    expect(() => parseEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
    expect(() => parseEnv({ ...base, MONGODB_URI: 'http://nope' })).toThrow(/MONGODB_URI/);
    expect(() => parseEnv({})).toThrow(/Invalid environment configuration/);
  });
  it('production requires CLIENT_ORIGIN and a non-placeholder secret', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(/CLIENT_ORIGIN/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://x.test', JWT_SECRET: 'change-me'.repeat(6) })).toThrow(/placeholder/);
  });
  it('a real LLM provider needs a key', () => {
    expect(() => parseEnv({ ...base, LLM_PROVIDER: 'anthropic' })).toThrow(/LLM_API_KEY/);
  });
});
