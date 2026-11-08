import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { setupDb, teardownDb, createUser, buildApp, loginCookie, TEST_PASSWORD } from '../support/hardening-helpers.js';
import { COOKIE_NAME } from '../../src/config/constants.js';

let app;
let staff;

beforeAll(async () => {
  await setupDb();
  app = buildApp();
  staff = await createUser({ email: 'login@test.example' });
});
afterAll(teardownDb);

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.example', password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('login@test.example');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toContain(`${COOKIE_NAME}=`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it('normalises email case and whitespace', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '  LOGIN@Test.Example ', password: TEST_PASSWORD });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password with 401 and a generic message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@test.example', password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('gives the same response for an unknown email (no account enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.example', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('rejects a deactivated account', async () => {
    await createUser({ email: 'off@test.example', isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email: 'off@test.example', password: TEST_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR for a malformed body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.path).sort()).toEqual(['email', 'password']);
  });

  it('rejects unexpected fields and NoSQL operator payloads', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
    const extra = await request(app).post('/api/auth/login').send({ email: 'login@test.example', password: TEST_PASSWORD, role: 'staff_admin' });
    expect(extra.status).toBe(400);
  });

  it('rate limits repeated login attempts with 429', async () => {
    const limited = buildApp({ rateLimit: { loginMax: 3 } });
    const attempt = () => request(limited).post('/api/auth/login').send({ email: 'login@test.example', password: 'bad-password' });
    for (let i = 0; i < 3; i += 1) expect((await attempt()).status).toBe(401);
    const res = await attempt();
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });
});

describe('GET /api/auth/me and POST /api/auth/logout', () => {
  it('returns the current user for a valid session', async () => {
    const cookie = await loginCookie(app, 'login@test.example');
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@test.example');
    expect(res.body.data.user.role).toBe('staff_admin');
  });

  it('returns 401 without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('logout clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.data.loggedOut).toBe(true);
    expect(res.headers['set-cookie'][0]).toMatch(new RegExp(`${COOKIE_NAME}=;`));
  });

  it('stops working once the account is deactivated', async () => {
    const u = await createUser({ email: 'soon-off@test.example' });
    const cookie = await loginCookie(app, 'soon-off@test.example');
    u.isActive = false;
    await u.save();
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(res.status).toBe(401);
  });
});
