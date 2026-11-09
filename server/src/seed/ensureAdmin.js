import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { ROLES } from '../config/constants.js';
import { User } from '../modules/auth/user.model.js';
import { passwordPolicy } from '../modules/auth/auth.validation.js';

const DEFAULT_ADMIN_EMAIL = 'admin@travelos.example';
const DEFAULT_ADMIN_PASSWORD = 'TravelOS_Demo_2026!';

export async function ensureDemoAdmin() {
  const email = (env.DEMO_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  const rawPassword = env.DEMO_ADMIN_PASSWORD || env.SEED_DEFAULT_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  passwordPolicy.parse(rawPassword);

  let existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    logger.info(`Demo admin account (${email}) already exists.`);
    if (existing.role !== ROLES.STAFF_ADMIN || !existing.isActive) {
      existing.role = ROLES.STAFF_ADMIN;
      existing.isActive = true;
      await existing.save();
      logger.info(`Updated demo admin (${email}) to active ${ROLES.STAFF_ADMIN}.`);
    }
    return existing;
  }

  const passwordHash = await User.hashPassword(rawPassword);
  const created = await User.create({
    name: 'Anjali Menon (Demo Admin)',
    email,
    passwordHash,
    role: ROLES.STAFF_ADMIN,
    isActive: true,
  });

  logger.info(`Created demo admin account (${email}) with role ${ROLES.STAFF_ADMIN}.`);
  return created;
}

const isDirectRun = process.argv.some(arg => arg.includes('ensureAdmin'));
if (isDirectRun) {
  (async () => {
    try {
      await connectDB();
      await ensureDemoAdmin();
    } catch (err) {
      logger.error('Failed to ensure demo admin:', err.message);
      process.exit(1);
    } finally {
      await disconnectDB();
    }
  })();
}
