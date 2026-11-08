import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
    password: z.string().min(1, 'Password is required').max(200),
  })
  .strict();

// Used when creating accounts (seed now, user management later).
export const passwordPolicy = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(200)
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/\d/, 'Password needs a digit');
