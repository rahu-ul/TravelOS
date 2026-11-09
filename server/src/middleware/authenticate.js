import { COOKIE_NAME } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../modules/auth/auth.service.js';
import { User } from '../modules/auth/user.model.js';

// Reads the JWT from the httpOnly cookie or Authorization Bearer header, loads the user and attaches it to req.user.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = req.cookies?.[COOKIE_NAME] || bearerToken;
  if (!token) throw ApiError.unauthorized();
  const payload = verifyToken(token); // throws JsonWebTokenError / TokenExpiredError -> 401 via errorHandler
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');
  req.user = user;
  next();
});
