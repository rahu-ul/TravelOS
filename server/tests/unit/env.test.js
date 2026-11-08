import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/config/env.js';

const base = { MONGODB_URI: 'mongodb://127.0.0.1:27017/x', JWT_SECRET: 'a'.repeat(40) };

describe('environment validation', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const env = parseEnv(base);
    expect(env.PORT).toBe(5000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.clientOrigins).toEqual(['http://localhost:5173']);
    expect(env.MONGODB_DNS_SERVERS).toBeUndefined();
    expect(parseEnv({ ...base, MONGODB_DNS_SERVERS: '' }).MONGODB_DNS_SERVERS).toBeUndefined();
  });
  it('rejects a missing MONGODB_URI', () => {
    expect(() => parseEnv({ JWT_SECRET: 'a'.repeat(40) })).toThrow(/MONGODB_URI/);
  });
  it('rejects a short JWT_SECRET', () => {
    expect(() => parseEnv({ ...base, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
  it('rejects a non-mongodb URI', () => {
    expect(() => parseEnv({ ...base, MONGODB_URI: 'http://nope' })).toThrow(/MONGODB_URI/);
  });
  it('requires CLIENT_ORIGIN and a non-placeholder secret in production', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(/CLIENT_ORIGIN/);
    expect(() => parseEnv({ ...base, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://x.test', JWT_SECRET: 'change-me-'.repeat(5) })).toThrow(/placeholder/);
    expect(parseEnv({ ...base, NODE_ENV: 'production', CLIENT_ORIGIN: 'https://x.test' }).isProduction).toBe(true);
  });
  it('requires an API key for a real LLM provider', () => {
    expect(() => parseEnv({ ...base, LLM_PROVIDER: 'openai' })).toThrow(/LLM_API_KEY/);
  });
});
