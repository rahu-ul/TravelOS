import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../../src/config/env.js';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { createApp } from '../../src/app.js';
import { User } from '../../src/modules/auth/user.model.js';
import { ROLES } from '../../src/config/constants.js';

export const TEST_PASSWORD = 'CorrectHorse#2026';

// Own, uniquely named database per test file so it can never collide with other suites or dev data.
export async function setupDb() {
  const uri = env.MONGODB_URI.replace(/\/[^/?]*(\?|$)/, `/travelos_hardening_test_${process.pid}_${Date.now()}$1`);
  if (!/test/i.test(uri)) throw new Error('Refusing to run tests against a non-test database');
  await connectDB(uri);
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function teardownDb() {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
}

export async function createUser(overrides = {}) {
  const passwordHash = await User.hashPassword(TEST_PASSWORD);
  return User.create({
    name: 'Test Staff',
    email: `user-${new mongoose.Types.ObjectId()}@test.example`,
    passwordHash,
    role: ROLES.STAFF_ADMIN,
    ...overrides,
  });
}

export const buildApp = (opts) => createApp(opts);

export async function loginCookie(app, email, password = TEST_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.headers['set-cookie'].map((c) => c.split(';')[0]).join('; ');
}

export const forgeToken = (userId, { secret = env.JWT_SECRET, expiresIn = '1h' } = {}) =>
  jwt.sign({ role: ROLES.STAFF_ADMIN }, secret, { subject: String(userId), expiresIn, algorithm: 'HS256' });
