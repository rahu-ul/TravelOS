import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createLimiter } from '../../middleware/rateLimit.js';
import { loginSchema, registerSchema } from './auth.validation.js';
import * as controller from './auth.controller.js';

export function createAuthRouter({ loginLimit, windowMs }) {
  const router = Router();
  const loginLimiter = createLimiter({
    windowMs,
    limit: loginLimit,
    message: 'Too many login attempts, please try again later',
  });
  const registerLimiter = createLimiter({
    windowMs,
    limit: loginLimit,
    message: 'Too many registration attempts, please try again later',
  });
  router.post('/register', registerLimiter, validate({ body: registerSchema }), controller.register);
  router.post('/signup', registerLimiter, validate({ body: registerSchema }), controller.register);
  router.post('/login', loginLimiter, validate({ body: loginSchema }), controller.login);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);
  return router;
}
