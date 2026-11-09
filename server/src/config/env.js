import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Single .env at the repository root (see .env.example)
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const boolString = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');
const optional = z.string().trim().min(1).optional();

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z
      .string({ required_error: 'MONGODB_URI is required' })
      .regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URI must start with mongodb:// or mongodb+srv://'),
    MONGODB_DNS_SERVERS: z.preprocess((value) => (value === '' ? undefined : value), optional),
    JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN_HOURS: z.coerce.number().positive().default(8),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
    CLIENT_ORIGIN: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
    SEED_DEFAULT_PASSWORD: optional,
    DEMO_ADMIN_EMAIL: optional,
    DEMO_ADMIN_PASSWORD: optional,
    ALLOW_PROD_SEED: boolString,
    LLM_PROVIDER: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
    LLM_API_KEY: optional,
    LLM_MODEL: optional,
    CLOUDINARY_CLOUD_NAME: optional,
    CLOUDINARY_API_KEY: optional,
    CLOUDINARY_API_SECRET: optional,
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === 'production') {
      if (!val.CLIENT_ORIGIN) {
        ctx.addIssue({ code: 'custom', path: ['CLIENT_ORIGIN'], message: 'CLIENT_ORIGIN is required in production' });
      }
      if (/change[-_ ]?me|secret-secret|example/i.test(val.JWT_SECRET)) {
        ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'JWT_SECRET looks like a placeholder; generate a random value' });
      }
    }
    if (val.LLM_PROVIDER !== 'mock' && !val.LLM_API_KEY) {
      ctx.addIssue({ code: 'custom', path: ['LLM_API_KEY'], message: 'LLM_API_KEY is required when LLM_PROVIDER is not "mock"' });
    }
  });

export function parseEnv(raw) {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || 'env'}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const cfg = result.data;
  return Object.freeze({
    ...cfg,
    isProduction: cfg.NODE_ENV === 'production',
    isTest: cfg.NODE_ENV === 'test',
    clientOrigins: (cfg.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  });
}

export const env = parseEnv(process.env);
