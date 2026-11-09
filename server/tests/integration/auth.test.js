import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { ROLES, COOKIE_NAME } from '../../src/config/constants.js';
import { connectTestDb, dropTestDb, createUser, cookieFor, PASSWORD } from '../helpers.js';
import { User } from '../../src/modules/auth/user.model.js';

const app = createApp();
let admin;
let traveller;
let disabled;

beforeAll(async () => {
  await connectTestDb();
  admin = await createUser({ role: ROLES.STAFF_ADMIN, email: 'admin@test.example', name: 'Admin Person' });
  traveller = await createUser({ role: ROLES.TRAVELLER, email: 'traveller@test.example', name: 'Traveller Person' });
  disabled = await createUser({ role: ROLES.STAFF_ADMIN, email: 'disabled@test.example', isActive: false });
});
afterAll(dropTestDb);

const login = (email, password) => request(app).post('/api/auth/login').send({ email, password });

describe('POST /api/auth/register (Traveller Signup)', () => {
  it('registers a new traveller and assigns the traveller role on the backend', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Traveller',
        email: 'newtraveller@test.example',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newtraveller@test.example');
    expect(res.body.data.user.role).toBe(ROLES.TRAVELLER);
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify in database
    const dbUser = await User.findOne({ email: 'newtraveller@test.example' }).select('+passwordHash');
    expect(dbUser).not.toBeNull();
    expect(dbUser.role).toBe(ROLES.TRAVELLER);
    expect(dbUser.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash

    // Verify cookie set
    const cookie = res.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`));
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('rejects duplicate email registration with a 409 conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Traveller',
        email: 'traveller@test.example',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects passwords that do not match confirmPassword', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Mismatch',
        email: 'mismatch@test.example',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects weak passwords failing the password policy', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password',
        email: 'weak@test.example',
        password: 'weak',
        confirmPassword: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ignores/rejects any attempt to self-assign an admin role via signup', async () => {
    // If strict schema rejects extra fields:
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Attacker',
        email: 'attacker@test.example',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: ROLES.STAFF_ADMIN,
      });

    // Zod strict() rejects unexpected 'role' field
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

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
    expect(res.body.data.token).toBeUndefined();
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
});

describe('GET /api/auth/me', () => {
  it('returns current user profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookieFor(traveller));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(traveller.email);
    expect(res.body.data.user.role).toBe(ROLES.TRAVELLER);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/enquiries/my (Traveller Enquiries)', () => {
  it('returns enquiries matching the authenticated traveller email', async () => {
    const res = await request(app)
      .get('/api/enquiries/my')
      .set('Cookie', cookieFor(traveller));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.enquiries)).toBe(true);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/enquiries/my');
    expect(res.status).toBe(401);
  });
});

describe('Role-based authorization and Admin boundary', () => {
  it('blocks unauthenticated access to admin routes', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('blocks travellers from accessing admin routes with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookieFor(traveller));

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows staff_admin to access admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', cookieFor(admin));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
