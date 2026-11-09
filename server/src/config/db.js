import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

// Centralized DNS configuration for MongoDB Atlas SRV resolution
function ensureDns() {
  const servers = (env.MONGODB_DNS_SERVERS || '8.8.8.8,8.8.4.4')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length > 0) {
    try {
      dns.setServers(servers);
    } catch {
      // In restricted or container environments where setServers is disallowed, continue gracefully
    }
  }
}

ensureDns();

export async function connectDB(uri = env.MONGODB_URI) {
  ensureDns();
  try {
    const connectOptions = { serverSelectionTimeoutMS: 10000 };

    // Prevent connecting to MongoDB Atlas default 'test' database in production/development
    // unless explicitly in test mode (vitest)
    if (!env.isTest) {
      const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/);
      const uriDb = match ? match[1] : '';
      if (!uriDb || uriDb === 'test') {
        connectOptions.dbName = process.env.MONGODB_DB_NAME || 'travelos';
      }
    }

    await mongoose.connect(uri, connectOptions);
  } catch (err) {
    throw new Error(`MongoDB connection failed: ${err.message}`, { cause: err });
  }
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

