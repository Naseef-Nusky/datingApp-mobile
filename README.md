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
| `src/routes/mobileRoutes.jsx` | **All mobile routes** — add new routes here |
| `src/app/MobileAppShell.jsx` | Mobile shell (header, calls, inactivity) |
| `src/mobile/` | Mobile-only pages and components |
| `src/pages/` | Shared screens (Dashboard, Inbox, etc.) |
| `ios/` | Xcode / Capacitor native project |
| `capacitor.config.json` | App ID: `com.vantagedating.app` |

## API

Mobile app calls **`/api/mobile/*`** on the backend (web uses `/api/*`).

| Endpoint | Purpose |
|----------|---------|
| `GET /api/mobile/health` | Health check |
| `GET /api/mobile/config` | Mobile feature flags |
| `GET /api/mobile/auth/me` | Current user (same as web) |

All axios requests are rewritten automatically in `src/main.jsx`.

- `/` — welcome + login hero
- `/dashboard`, `/inbox`, `/profile/:id`, `/vip`, … — app screens
- `/terms`, `/privacy`, `/help` — legal & help
- Web SEO paths (`/mature-online-dating`, etc.) redirect to `/` or `/help`

## Notes

- **Do not** deploy this project's `dist/` to your web server — that is `datingApp-frontend`'s job.
- Backend API is shared: `../datingApp-backend` (same as web).
- New mobile-only features: build in this project only so live web is unaffected.
