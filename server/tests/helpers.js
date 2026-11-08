import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/modules/auth/user.model.js';
import { ROLES, COOKIE_NAME } from '../src/config/constants.js';
import { signToken } from '../src/modules/auth/auth.service.js';

// Each test file gets its own throw-away database.
export async function connectTestDb() {
  const uri = env.MONGODB_URI.replace(/\/[^/?]*(\?|$)/, `/travelos_test_${process.pid}_${Date.now()}$1`);
  await mongoose.connect(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function dropTestDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

export const PASSWORD = 'Correct-Horse-9';

export async function createUser({ role = ROLES.STAFF_ADMIN, email, isActive = true, name = 'Test User' } = {}) {
  const passwordHash = await User.hashPassword(PASSWORD);
  return User.create({ name, email: email || `${role}-${Math.random().toString(36).slice(2)}@test.example`, passwordHash, role, isActive });
}

export const cookieFor = (user) => `${COOKIE_NAME}=${signToken(user)}`;

// ---- Compatibility helpers (used by tests/auth.test.js and tests/authorization.test.js) ----
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';

export const setupDb = connectTestDb;
export const teardownDb = dropTestDb;
export const TEST_PASSWORD = PASSWORD;
export const buildApp = (options) => createApp(options);

// Logs in through the real endpoint and returns a "name=value" string usable in a Cookie header.
export async function loginCookie(app, email, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return res.headers['set-cookie'][0].split(';')[0];
}

// Signs a JWT for a user id; override secret/expiry to forge invalid tokens.
export function forgeToken(userId, { secret = env.JWT_SECRET, expiresIn = '1h', role = ROLES.STAFF_ADMIN } = {}) {
  return jwt.sign({ role }, secret, { subject: String(userId), expiresIn });
}
