import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Discover .env from repository root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,8.8.4.4')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers.length > 0) {
  try {
    dns.setServers(dnsServers);
  } catch {
    // In restricted container environments, continue with system DNS
  }
}

const entryPoint = process.argv[2];
if (!entryPoint) {
  throw new Error('A backend entry point is required');
}

await import(pathToFileURL(path.resolve(__dirname, entryPoint)).href);
