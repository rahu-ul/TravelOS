import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from './user.model.js';

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', env.BCRYPT_ROUNDS);

export const TOKEN_MAX_AGE_MS = env.JWT_EXPIRES_IN_HOURS * 60 * 60 * 1000;

export function signToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: `${env.JWT_EXPIRES_IN_HOURS}h`,
    algorithm: 'HS256',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}

export async function login(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { user, token: signToken(user) };
}
