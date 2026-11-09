import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectTestDb, dropTestDb } from '../helpers.js';

const app = createApp();
beforeAll(connectTestDb);
afterAll(dropTestDb);

describe('API foundation', () => {
  it('GET /api/health reports ok with the database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok', db: 'connected' } });
  });
  it('returns a JSON 404 envelope for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
  it('returns 400 INVALID_JSON for malformed bodies', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
  it('returns 413 for oversized bodies', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
  });
  it('sets security headers and hides x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
  it('only allows CORS for allow-listed origins', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('applies the global rate limiter', async () => {
    const limited = createApp({ rateLimit: { max: 2 } });
    const statuses = [];
    for (let i = 0; i < 4; i += 1) statuses.push((await request(limited).get('/api/health')).status);
    expect(statuses).toEqual([200, 200, 429, 429]);
    const res = await request(limited).get('/api/health');
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});
