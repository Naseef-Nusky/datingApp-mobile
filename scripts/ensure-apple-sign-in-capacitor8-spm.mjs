/**
 * @capacitor-community/apple-sign-in@7.x Package.swift pins capacitor-swift-pm to 7.x,
 * but Capacitor 8 + CapApp-SPM use 8.x — SPM fails to resolve and Xcode reports
 * "Unable to find module dependency" for CapacitorCommunityAppleSignIn / CapacitorApp / …
 * Re-apply after every `npm install` via package.json postinstall.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pkgPath = path.join(
  root,
  'node_modules',
  '@capacitor-community',
  'apple-sign-in',
  'Package.swift'
);

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

let s = fs.readFileSync(pkgPath, 'utf8');
const next = s.replace(
  '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")',
  '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")'
);

if (next !== s) {
  fs.writeFileSync(pkgPath, next, 'utf8');
  console.log('[ensure-apple-sign-in-capacitor8-spm] Patched apple-sign-in Package.swift for Capacitor 8 SPM.');
}
