import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.PORT, () => logger.info(`TravelOS API listening on port ${env.PORT} (${env.NODE_ENV})`));

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server:', err.message);
  process.exit(1);
});
