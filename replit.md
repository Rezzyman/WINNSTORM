# WinnStorm™ - Comprehensive Damage Assessment Platform

## Overview
WinnStorm™ is a comprehensive online application for Damage Assessment Consultants. It provides tools for efficient inspections, generation of data-rich reports based on the "Winn Methodology," client and project management, and professional certification. The platform aims to encapsulate Eric Winn's expertise, offering features like Winn Report Generation, Consultant Certification, Client & Project Management, Weather Verification, and extensive Data Collection workflows. The business vision is to deliver enterprise-grade tools that enhance accuracy and efficiency in damage assessment.

## User Preferences
- Professional enterprise-grade interface design suitable for damage assessment consultants
- WinnStorm™ branding with clean, modern aesthetics
- Dark theme for reduced eye strain during long inspection sessions
- Focus on data-rich collection workflows and comprehensive reporting capabilities
- Intuitive UI optimized for both desktop and mobile field use
- AI assistant named "Stormy" for personalized inspection guidance

## System Architecture
The platform utilizes a **React, TypeScript, and Tailwind CSS** frontend, featuring a professional dark theme and WinnStorm branding. The backend is built with **Express.js** and leverages **PostgreSQL** with **Drizzle ORM**. **Firebase** provides authentication with role-based access control. AI integration is powered by **Replit AI Integrations with GPT-5.1** for the "Stormy" AI assistant.

**UI/UX Design Decisions:**
- **Theme**: Lovable-inspired design using Charcoal, Safety Orange, and white.
- **Typography**: Montserrat for headings and Inter for body text.
- **Aesthetics**: Sharp edges (0px border radius) and an industrial, high-contrast look.
- **Mobile-First UX**: Prioritizes large touch targets, readable fonts for outdoor use, bottom navigation, and one-handed operation.
- **Branding**: Consistent WinnStorm™ branding with a blue gradient shield logo.

**Key Technical Implementations:**
- **User Management**: Role-based access control.
- **Certification Portal**: Courses, quizzes, and progress tracking.
- **Client & Project Management**: CRM functionality.
- **Data Collection**: Guided workflows for various data types.
- **Report Generation**: Dynamic PDF assembly with evidence and Winn Methodology integration.
- **File Management**: Support for various media and document storage.
- **Mobile-First Transformation**: Uses **Capacitor** for native iOS and Android applications, integrating native device features.
- **AI Features**: Context-aware Stormy AI for inspection coaching, thermal image analysis, automated metric generation, and executive summary generation.
- **Offline-First Architecture**: Local persistence (SQLite/IndexedDB) and a bidirectional sync service with conflict resolution.
- **Evidence Capture**: High-resolution photo capture with GPS, voice memos with transcription, and integration with Limitless Pendant for recordings.
- **Step Validation System**: Enforces methodology requirements, provides AI feedback, and guidance.
- **Multi-Property Scheduling**: Calendar management, route optimization, and schedule generation.
- **AI Quality Services**: AI-powered thermal analysis, evidence quality checking, and inspection completeness tracking.
- **CRM Integration**: Native WinnStorm CRM plus ATERNA CRM+ (white-labeled premium CRM) and third-party integrations (JobNimbus, Salesforce, HubSpot, Pipedrive) for contact/job sync and report uploads.
- **Bulk Property Import**: CSV/Excel parsing, column mapping, data validation, and batch creation.
- **Team Assignment & Workload Management**: Assigning inspectors, tracking capacity, and workload visualization.
- **Pre-built Damage Templates**: Categorized damage templates with severity ratings, affected components, recommended actions, and required evidence checklists.

## Recent Changes (December 2025)
- **Admin Panel**: Secure admin dashboard at /admin with user management, project/client/property data grids
  - Admin login at /admin/login with email allowlist protection
  - Allowlisted emails: admin@winnstorm.com, eric@winnstorm.com, developer@winnstorm.com
  - Server-side protection via requireAdmin middleware
  - Discreet admin link in homepage footer
- **Demo Login Removed**: Demo login button removed from public auth page for production security
- **Innovation Hub**: Unified dashboard at /innovation for managing all enterprise features
- **Voice Chat System**: Full voice interaction with Stormy AI using OpenAI Whisper (STT) and TTS
- **Camera Integration**: Live camera preview with "What am I looking at?" visual queries
- **Clients Page**: Dedicated client management page at /clients
- **Mobile App Deployment**: Comprehensive documentation at docs/MOBILE_APP_DEPLOYMENT.md
- **iOS Permissions**: Camera, Photo Library, Microphone, Speech Recognition, Location (When In Use)
- **Android Permissions**: Camera, Storage, Audio Recording, Location

## Innovation Frameworks (Enterprise Features)

WinnStorm includes 7 cutting-edge innovation frameworks accessible via `/innovation`:

### 1. Predictive Claim Outcome Engine
AI-powered claim success prediction using historical data and insurer patterns.
- **Tables**: `claim_outcomes`, `claim_predictions`, `insurer_patterns`
- **API Routes**: `/api/innovation/claims/*`
- **Features**: GPT-powered predictions, confidence scoring, insurer behavior analysis
- **Status**: Preview (Enterprise tier)

### 2. Stormy Field Co-Pilot
Real-time AI guidance during inspections with wearable integration.
- **Tables**: `field_copilot_sessions`, `copilot_guidance_events`, `wearable_devices`
- **API Routes**: `/api/innovation/copilot/*`
- **Features**: Hands-free guidance, Limitless Pendant support, smart glasses integration
- **Status**: Preview (Professional tier)

### 3. Smart Sensor Network (IoT)
Property monitoring sensors for moisture, impact, and environmental tracking.
- **Tables**: `iot_devices`, `sensor_readings`, `sensor_alerts`
- **API Routes**: `/api/innovation/iot/*`
- **Features**: Alert thresholds, automatic claim triggers, real-time monitoring
- **Status**: Coming Soon (Enterprise tier)

### 4. Drone Integration
Autonomous drone flights with thermal mapping and 3D modeling.
- **Tables**: `drone_pilots`, `drone_assets`, `flight_sessions`
- **API Routes**: `/api/innovation/drones/*`
- **Features**: Flight planning, thermal map storage, 3D model references, DJI/Skydio SDK stubs
- **Status**: Preview (Professional tier)

### 5. Insurance Carrier Console
White-label portal for insurance companies to receive structured claims.
- **Tables**: `carrier_accounts`, `carrier_users`, `carrier_claim_submissions`
- **API Routes**: `/api/innovation/carriers/*`
- **Features**: API key management, adjudication workflows, AI-generated summaries
- **Status**: Preview (Enterprise tier)

### 6. Contractor Marketplace
Matching verified contractors with property owners for repairs.
- **Tables**: `contractor_profiles`, `repair_jobs`, `contractor_bids`, `referral_fees`
- **API Routes**: `/api/innovation/contractors/*`
- **Features**: Bidding system, job matching, credential verification, referral tracking
- **Status**: Coming Soon (Professional tier)

### 7. Regional Risk Intelligence
Anonymized data product for insurers and reinsurers.
- **Tables**: `risk_regions`, `risk_assessments`, `risk_data_exports`
- **API Routes**: `/api/innovation/risk/*`
- **Features**: Geographic risk scoring, trend analysis, data export for carriers
- **Status**: Coming Soon (Enterprise tier)

### Module Management
- **Tables**: `innovation_modules`, `organization_modules`
- **API Routes**: `/api/innovation/modules/*`
- **Features**: Enable/disable modules per organization, usage tracking

## Mobile App Deployment
See `docs/MOBILE_APP_DEPLOYMENT.md` for complete instructions on:
- Building for iOS App Store (Xcode, TestFlight, App Store Connect)
- Building for Google Play Store (Android Studio, signing, Play Console)
- Required screenshots, descriptions, and privacy policy requirements
- Version management and update procedures

## Key API Endpoints

### Core APIs
- `/api/user` - User management
- `/api/properties` - Property CRUD
- `/api/projects` - Project management
- `/api/clients` - Client management
- `/api/stormy/*` - Stormy AI chat and voice

### Innovation APIs
- `/api/innovation/modules` - Module management
- `/api/innovation/claims/*` - Predictive claims
- `/api/innovation/copilot/*` - Field co-pilot
- `/api/innovation/iot/*` - IoT sensors
- `/api/innovation/drones/*` - Drone integration
- `/api/innovation/carriers/*` - Carrier console
- `/api/innovation/contractors/*` - Marketplace
- `/api/innovation/risk/*` - Risk intelligence

## External Dependencies
- **PostgreSQL**: Primary database.
- **Firebase**: Authentication service (project: winnstorm-43a69).
- **OpenAI GPT-5**: AI assistant (Stormy) for inspection guidance and analysis.
- **OpenAI Whisper/TTS**: Voice transcription and speech synthesis.
- **Capacitor**: Native mobile application development.
- **Capacitor Plugins**: Camera, Filesystem, Geolocation, Preferences, SQLite.
- **Stripe**: Subscription payment processing.
- **Google Maps**: Mapping and location services.

## File Structure

```
├── client/src/
│   ├── pages/
│   │   ├── innovation-hub.tsx    # Innovation features dashboard
│   │   ├── dashboard.tsx         # Main dashboard
│   │   ├── clients.tsx           # Client management
│   │   └── ...
│   ├── components/
│   │   ├── stormy-chat.tsx       # AI chat with voice
│   │   └── ...
│   └── hooks/
│       ├── use-voice-chat.ts     # Voice interaction hook
│       └── ...
├── server/
│   ├── routes.ts                 # Main API routes
│   ├── innovation-routes.ts      # Innovation framework APIs
│   ├── innovation-services.ts    # Service layer for all frameworks
│   ├── stormy-ai-service.ts      # Stormy AI backend
│   ├── voice-service.ts          # Voice processing
│   └── ...
├── shared/
│   └── schema.ts                 # Database schema (all tables)
├── ios/                          # iOS Capacitor project
├── android/                      # Android Capacitor project
└── docs/
    └── MOBILE_APP_DEPLOYMENT.md  # Mobile deployment guide
```

## Development Notes
- Demo login: demo@winnstorm.com / DemoTest123!
- Production domain: https://winnstorm.com
- Voice endpoints: /api/stormy/voice/chat, /api/stormy/voice/speak, /api/stormy/voice/transcribe
- Initialize innovation modules: POST /api/innovation/modules/seed
