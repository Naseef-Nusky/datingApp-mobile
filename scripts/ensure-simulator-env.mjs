#!/usr/bin/env node
/**
 * Writes .env.simulator.local with Mac LAN IP for iOS Simulator → local backend.
 * Run automatically before cap:run:ios:local / build:simulator.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function getLanIp() {
  for (const iface of ['en0', 'en1', 'en2']) {
    try {
      const ip = execSync(`ipconfig getifaddr ${iface}`, { encoding: 'utf8' }).trim();
      if (ip) return ip;
    } catch {
      /* try next interface */
    }
  }
  return null;
}

const port = process.env.VITE_BACKEND_PORT || '5001';
const ip = getLanIp();

if (!ip) {
  console.warn(
    '[ensure-simulator-env] Could not detect LAN IP. Set VITE_API_URL manually in .env.simulator',
  );
  process.exit(0);
}

const apiUrl = `http://${ip}:${port}`;
const outPath = path.join(root, '.env.simulator.local');
fs.writeFileSync(outPath, `# Auto-generated — iOS Simulator → Mac backend\nVITE_API_URL=${apiUrl}\n`);
console.info(`[ensure-simulator-env] VITE_API_URL=${apiUrl}`);
