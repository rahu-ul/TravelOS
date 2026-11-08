import { ROLE_PERMISSIONS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';

export const hasPermission = (role, permission) => (ROLE_PERMISSIONS[role] || []).includes(permission);

// authorize('packages:write') — user must hold ALL listed permissions. Must run after authenticate.
export const authorize = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  const allowed = permissions.every((p) => hasPermission(req.user.role, p));
  return allowed ? next() : next(ApiError.forbidden());
};
