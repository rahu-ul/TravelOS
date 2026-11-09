import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { setupDb, teardownDb, createUser, buildApp, loginCookie, forgeToken } from '../support/hardening-helpers.js';
import { authenticate } from '../../src/middleware/authenticate.js';
import { authorize, hasPermission } from '../../src/middleware/authorize.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { COOKIE_NAME, PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '../../src/config/constants.js';

let app;
let admin;

beforeAll(async () => {
  await setupDb();
  app = buildApp();
  admin = await createUser({ email: 'admin@test.example' });
  await createUser({ email: 'traveller@test.example', role: ROLES.TRAVELLER });
});
afterAll(teardownDb);

describe('protected routes: GET /api/admin/users', () => {
  it('401 without authentication', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('401 for a malformed token', async () => {
    const res = await request(app).get('/api/admin/users').set('Cookie', `${COOKIE_NAME}=garbage`);
    expect(res.status).toBe(401);
  });

  it('401 for a token signed with the wrong secret', async () => {
    const token = forgeToken(admin._id, { secret: 'attacker-secret-attacker-secret-1234567890' });
    const res = await request(app).get('/api/admin/users').set('Cookie', `${COOKIE_NAME}=${token}`);
    expect(res.status).toBe(401);
  });

  it('401 TOKEN_EXPIRED for an expired token', async () => {
    const token = forgeToken(admin._id, { expiresIn: -10 });
    const res = await request(app).get('/api/admin/users').set('Cookie', `${COOKIE_NAME}=${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('403 for an authenticated traveller (role-based authorization)', async () => {
    const cookie = await loginCookie(app, 'traveller@test.example');
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('200 for staff admin, without leaking password hashes', async () => {
    const cookie = await loginCookie(app, 'admin@test.example');
    const res = await request(app).get('/api/admin/users').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
    expect(res.body.data.users.every((u) => u.role === ROLES.STAFF_ADMIN)).toBe(true);
  });
});

describe('authorize middleware', () => {
  it('requires ALL listed permissions', async () => {
    const mini = express();
    mini.get('/x', (req, _res, next) => { req.user = { role: ROLES.TRAVELLER }; next(); }, authorize(PERMISSIONS.PACKAGES_READ), (_req, res) => res.json({ ok: true }));
    mini.use(errorHandler);
    expect((await request(mini).get('/x')).status).toBe(403);
  });

  it('hasPermission reflects the role map', () => {
    expect(hasPermission(ROLES.STAFF_ADMIN, PERMISSIONS.PACKAGES_PUBLISH)).toBe(true);
    expect(hasPermission(ROLES.TRAVELLER, PERMISSIONS.PACKAGES_PUBLISH)).toBe(false);
    expect(hasPermission('unknown-role', PERMISSIONS.PACKAGES_READ)).toBe(false);
  });

  it('authorize without authenticate yields 401, not a crash', async () => {
    const mini = express();
    mini.get('/x', authorize(PERMISSIONS.PACKAGES_READ), (_req, res) => res.json({ ok: true }));
    mini.use(errorHandler);
    expect((await request(mini).get('/x')).status).toBe(401);
  });
});
