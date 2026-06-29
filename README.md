# Vantage Dating — Mobile App

Separate Capacitor project for iOS (and future Android). The live **web** app remains in `../datingApp-frontend`.

## Setup

```bash
cd datingApp-mobile
npm install
```

Copy env and set your API URL:

```bash
cp .env.production.example .env.production
# Edit .env.production — e.g. VITE_API_URL=https://api.vantagedating.com
```

## Development

Browser preview (port 3001 — does not conflict with web on 3000):

```bash
npm run dev
```

iOS simulator / device:

```bash
npm run cap:run:ios
```

## Build for App Store

```bash
npm run cap:sync:ios
npm run cap:ios   # open Xcode → Archive → TestFlight
```

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | React UI (copy of frontend — customize for mobile here) |
| `src/mobile/` | Add new mobile-only screens and components here |
| `ios/` | Xcode / Capacitor native project |
| `capacitor.config.json` | App ID: `com.vantagedating.app` |

## Notes

- **Do not** deploy this project's `dist/` to your web server — that is `datingApp-frontend`'s job.
- Backend API is shared: `../datingApp-backend` (same as web).
- New mobile-only features: build in this project only so live web is unaffected.
