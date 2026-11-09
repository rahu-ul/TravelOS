import dns from 'node:dns';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // ignore
}
