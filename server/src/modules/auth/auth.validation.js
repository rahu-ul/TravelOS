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

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    // Note: role is omitted/forbidden or stripped so public users can never pass role
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
