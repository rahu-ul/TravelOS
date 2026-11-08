import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { ROLES, COOKIE_NAME } from '../../src/config/constants.js';
import { connectTestDb, dropTestDb, createUser, cookieFor, PASSWORD } from '../helpers.js';

const app = createApp();
let admin;
let traveller;
let disabled;

beforeAll(async () => {
  await connectTestDb();
  admin = await createUser({ role: ROLES.STAFF_ADMIN, email: 'admin@test.example', name: 'Admin Person' });
  traveller = await createUser({ role: ROLES.TRAVELLER, email: 'traveller@test.example' });
  disabled = await createUser({ role: ROLES.STAFF_ADMIN, email: 'disabled@test.example', isActive: false });
});
afterAll(dropTestDb);

const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and sets a secure httpOnly cookie', async () => {
    const res = await login('admin@test.example', PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { user: { email: 'admin@test.example', role: 'staff_admin' } } });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(res.body.data.token).toBeUndefined(); // token only travels in the cookie
  });
  it('is case-insensitive on email', async () => {
    expect((await login('ADMIN@Test.Example', PASSWORD)).status).toBe(200);
  });
  it('rejects a wrong password with a generic 401', async () => {
    const res = await login('admin@test.example', 'wrong-password');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    expect(res.headers['set-cookie']).toBeUndefined();
  });
  it('gives the same response for an unknown email (no user enumeration)', async () => {
    const res = await login('nobody@test.example', PASSWORD);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });
  it('rejects disabled accounts', async () => {
    const res = await login(disabled.email, PASSWORD);
    expect(res.status).toBe(401);
  });
  it('validates input (400) including unknown fields', async () => {
    const bad = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    expect(bad.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(['email', 'password']));
    const extra = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'x', role: 'staff_admin' });
    expect(extra.status).toBe(400);
  });
  it('is not vulnerable to NoSQL operator injection', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
  it('rate-limits repeated login attempts', async () => {
    const limited = createApp({ rateLimit: { loginMax: 3 } });
    const statuses = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(limited).post('/api/auth/login').send({ email: 'admin@test.example', password: 'bad' })).status);
    }
    expect(statuses).toEqual([401, 401, 401, 429, 429]);
  });
});

describe('GET /api/auth/me (protected route)', () => {
  it('rejects requests without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
  it('returns the current user for a logged-in session (cookie round trip)', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@test.example', password: PASSWORD }).expect(200);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'admin@test.example', name: 'Admin Person' });
  });
  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', `${COOKIE_NAME}=${cookieFor(admin).split('=')[1]}x`);
    expect(res.status).toBe(401);
  });
  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ role: 'staff_admin' }, 'some-other-secret-that-is-long-enough-123', { subject: String(admin._id) });
    const res = await request(app).get('/api/auth/me').set('Cookie', `${COOKIE_NAME}=${forged}`);
    expect(res.status).toBe(401);
  });
  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const expired = jwt.sign({ role: 'staff_admin' }, env.JWT_SECRET, { subject: String(admin._id), expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set('Cookie', `${COOKIE_NAME}=${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });
  it('rejects a valid token whose user was disabled afterwards', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieFor(disabled));
    expect(res.status).toBe(401);
  });
  it('rejects a token with alg "none"', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: String(admin._id), role: 'staff_admin' })).toString('base64url');
    const res = await request(app).get('/api/auth/me').set('Cookie', `${COOKIE_NAME}=${header}.${payload}.`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie so the session no longer works', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@test.example', password: PASSWORD }).expect(200);
    await agent.get('/api/auth/me').expect(200);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'][0]).toMatch(new RegExp(`${COOKIE_NAME}=;`));
    await agent.get('/api/auth/me').expect(401);
  });
  it('is idempotent when not logged in', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(200);
  });
});

describe('role-based authorization on /api/admin', () => {
  it('401 without authentication', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
  });
  it('403 for an authenticated traveller', async () => {
    const res = await request(app).get('/api/admin/users').set('Cookie', cookieFor(traveller));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
  it('200 for staff admin, listing only active staff without secrets', async () => {
    const res = await request(app).get('/api/admin/users').set('Cookie', cookieFor(admin));
    expect(res.status).toBe(200);
    const emails = res.body.data.users.map((u) => u.email);
    expect(emails).toContain('admin@test.example');
    expect(emails).not.toContain('traveller@test.example');
    expect(emails).not.toContain('disabled@test.example');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(res.body.meta.count).toBe(res.body.data.users.length);
  });
});
