import { COOKIE_NAME } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as authService from './auth.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
};

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: authService.TOKEN_MAX_AGE_MS });
  sendSuccess(res, { user }, { status: 201 });
});

export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body.email, req.body.password);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: authService.TOKEN_MAX_AGE_MS });
  sendSuccess(res, { user });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  sendSuccess(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});
