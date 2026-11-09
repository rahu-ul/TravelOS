import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-jwt-secret-0123456789abcdef0123456789',
      MONGODB_URI: process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/travelos_test',
      BCRYPT_ROUNDS: '4',
      LOGIN_RATE_LIMIT_MAX: '1000',
      RATE_LIMIT_MAX: '100000',
      CLIENT_ORIGIN: 'http://localhost:5173',
    },
  },
});
