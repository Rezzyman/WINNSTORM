# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WinnStorm is a comprehensive damage assessment platform for consultants, featuring the "Winn Methodology" for roof inspections. It's a full-stack TypeScript application with native mobile support via Capacitor.

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Express + Vite HMR) on port 5000

# Build
npm run build            # Build for production (Vite frontend + esbuild backend)
npm run start            # Run production build

# Type checking
npm run check            # TypeScript type check

# Database
npm run db:push          # Push schema changes to PostgreSQL via Drizzle

# Mobile (Capacitor)
npm run build && npx cap sync    # Sync web build to native platforms
npx cap open ios                 # Open iOS project in Xcode
npx cap open android             # Open Android project in Android Studio
```

## Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)
- **Backend**: Express.js with TypeScript (tsx for dev, esbuild for prod)
- **Database**: PostgreSQL via Neon serverless, Drizzle ORM
- **Auth**: Firebase Authentication with password-based admin fallback
- **AI**: OpenAI GPT for "Stormy" assistant, Whisper for voice transcription
- **Mobile**: Capacitor 7.x for iOS/Android native apps
- **Routing**: wouter (client), Express (server)

### Directory Structure
```
client/src/
├── pages/           # Route components (dashboard, clients, innovation-hub, etc.)
├── components/      # React components including stormy-chat.tsx
├── hooks/           # Custom hooks (use-voice-chat.ts, etc.)
└── lib/             # Utilities and shared client code

server/
├── index.ts         # Express app entry, session config, port 5000
├── routes.ts        # Main API routes (~125KB, comprehensive)
├── admin-routes.ts  # Admin panel endpoints
├── team-routes.ts   # Team portal endpoints
├── stormy-ai-service.ts  # Stormy AI backend
├── innovation-routes.ts  # Innovation framework APIs
├── innovation-services.ts # Service layer for innovation features
├── storage.ts       # Data access layer
└── db.ts            # Database connection

shared/
└── schema.ts        # Drizzle schema (all tables ~84KB)

ios/                 # Capacitor iOS project
android/             # Capacitor Android project
```

### Key Patterns
- **API routes**: All under `/api/*`, defined in `server/routes.ts`
- **Innovation features**: 7 enterprise modules at `/api/innovation/*` (claims, copilot, iot, drones, carriers, contractors, risk)
- **Admin panel**: `/admin` with allowlist-protected login, separate session auth
- **Team portal**: `/team/knowledge` for document uploads
- **Database schema**: Single `shared/schema.ts` file with all Drizzle table definitions

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` - Express session secret (required in production)
- `OPENAI_API_KEY` - For Stormy AI assistant

Firebase (client-side, VITE_ prefixed):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

Optional:
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps integration
- `SITE_PASSWORD` - HTTP Basic Auth for home page protection

## Mobile App

Bundle ID: `com.winnstorm.inspector`

The app uses Capacitor plugins for native features:
- Camera (inspection photos)
- Geolocation (property location)
- Filesystem (local storage)
- Preferences (settings)
- SQLite (offline data)

Production server URL configured in `capacitor.config.ts` points to `https://winnstorm.com`.
