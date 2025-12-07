# WinnStorm™ - Comprehensive Damage Assessment Platform

## Overview
WinnStorm™ is a comprehensive online application designed as a central hub for Damage Assessment Consultants. Its primary purpose is to enable efficient inspections, generate data-rich reports based on the "Winn Methodology," manage client projects, and facilitate professional certification. The platform aims to encapsulate and replicate Eric Winn's expertise, providing core capabilities such as Winn Report Generation, Consultant Certification, Client & Project Management, Weather Verification, and extensive Data Collection workflows. The business vision is to provide enterprise-grade tools for damage assessment, enhancing accuracy and efficiency in the field.

## User Preferences
- Professional enterprise-grade interface design suitable for damage assessment consultants
- WinnStorm™ branding with clean, modern aesthetics
- Dark theme for reduced eye strain during long inspection sessions
- Focus on data-rich collection workflows and comprehensive reporting capabilities
- Intuitive UI optimized for both desktop and mobile field use
- AI assistant named "Stormy" for personalized inspection guidance

## System Architecture
The platform features a robust technical stack including a **React, TypeScript, and Tailwind CSS** frontend with a professional dark theme and WinnStorm branding. The backend is built with **Express.js** and utilizes a **PostgreSQL** database managed by **Drizzle ORM** for production-ready data persistence. **Firebase** handles authentication with role-based access control (Junior/Senior Consultants, Admins, Clients). AI integration is powered by **Replit AI Integrations with GPT-5.1**, providing an AI assistant named "Stormy" without requiring API key management.

**UI/UX Design Decisions:**
- **Theme**: Lovable-inspired design system using Charcoal (#1A1A1A), Safety Orange (hsl 16 100% 50%), and white.
- **Typography**: Montserrat for headings (bold/uppercase) and Inter for body text.
- **Aesthetics**: Sharp edges (0px border radius) and an industrial, high-contrast look.
- **Mobile-First UX**: Prioritizes large touch targets (44px min), readable outdoor fonts, bottom navigation, and one-handed operation for field use.
- **WinnStorm™ Branding**: Consistent branding with a blue gradient shield logo ("Certified to Winn" badge).

**Key Technical Implementations:**
- **User Management**: Role-based system for various user types.
- **Certification Portal**: Features courses, quizzes, progress tracking, and performance metrics.
- **Client & Project Management**: Full CRM functionality with pipeline management.
- **Data Collection**: Guided workflows for weather verification, thermal data, and damage assessment.
- **Report Generation**: Dynamic PDF assembly with integrated evidence and Winn Methodology.
- **File Management**: Support for photos, thermal images, drone data, and document storage.
- **Mobile-First Transformation**: Utilizes **Capacitor** for native iOS and Android applications, integrating native camera, filesystem, and preferences.
- **AI Features**: Context-aware Stormy AI assistant adapting to user experience levels, real-time inspection coaching, thermal image analysis for anomaly and damage detection, automated metric generation, and professional executive summary generation for reports.

## Phase 2 Automated Report Generation (Complete)

**PDF Report Service** (`server/pdf-report-service.ts`):
- Dynamic Winn Report PDF assembly with professional formatting
- Cover page with health score visualization and property details
- Table of contents with automatic page numbering
- Property information and building details sections
- Scan details and performance metrics display
- Issues and findings with severity color coding
- Thermal analysis section with anomaly detection results
- AI-generated recommendations based on findings
- Footer with page numbers and branding

**AI Executive Summary Generation**:
- GPT-5.1 powered professional executive summary generation
- Follows Winn Methodology standards
- Automatic fallback to template-based summary if AI unavailable
- API endpoint: `POST /api/reports/executive-summary/:scanId`

**Report Download API**:
- Full PDF generation and streaming download
- Proper Content-Disposition headers for filename
- Integrates thermal analysis into reports
- API endpoint: `GET /api/reports/download/:scanId`

## Phase 1 Mobile-First Infrastructure (Complete)

**Offline-First Architecture:**
- **SQLite/IndexedDB Database** (`client/src/lib/offline-database.ts`): Local persistence for properties, inspections, evidence, and sync queue. Uses Capacitor SQLite on native, IndexedDB on web.
- **Sync Service** (`client/src/lib/sync-service.ts`): Bidirectional sync with conflict resolution (last-write-wins with timestamp comparison), automatic retry queue, and network status detection.
- **Network Status Hooks** (`client/src/hooks/use-network-status.ts`): Real-time online/offline/syncing state with UI indicators.

**Evidence Capture Services:**
- **Camera Service** (`client/src/lib/camera-service.ts`): High-resolution photo capture via Capacitor Camera with GPS location tagging, supports gallery import and thermal image import from FLIR/Seek devices.
- **Voice Memo Service** (`client/src/lib/voice-memo-service.ts`): Audio recording with automatic location tagging, playback support, and Whisper API transcription integration.
- **Audio Transcription Service** (`server/audio-transcription.ts`): Real Whisper API integration for voice memo transcription with automatic summarization via GPT-5.1.
- **Evidence Capture Component** (`client/src/components/evidence-capture.tsx`): Unified UI for photos, thermal images, and voice memos with step-aware storage.

**Limitless Pendant Integration:**
- **Limitless Client** (`server/limitless-client.ts`): API client for Limitless Pendant device with lifelog fetching, audio download, and chat retrieval.
- **Limitless Sync Routes**: API endpoints for checking connection status (`/api/limitless/status`), fetching recordings (`/api/limitless/recordings`), and importing recordings as transcripts (`/api/limitless/import/:id`).
- **Transcript Management** (`client/src/pages/transcripts.tsx`): UI for uploading, processing, reviewing, and approving knowledge from Eric Winn's field recordings.

**Step Validation System:**
- **Step Validation Service** (`client/src/lib/step-validation-service.ts`): Enforces Winn Methodology requirements per step (min photos, AI validation, required fields), provides Stormy AI feedback messages, step guidance with tips/common mistakes/best practices.

**Multi-Property Scheduling:**
- **Scheduling Service** (`client/src/lib/scheduling-service.ts`): Calendar management, route optimization with nearest-neighbor algorithm, Haversine distance calculation, and schedule generation for day/week views.
- **Schedule Management Page** (`client/src/pages/schedule.tsx`): Mobile-optimized schedule interface with calendar and map views, inspection scheduling dialog, and today's inspections overview.
- **Inspection Calendar Component** (`client/src/components/inspection-calendar.tsx`): Week and day view modes, time slot management, and inspection status indicators.
- **Property Map Component** (`client/src/components/property-map.tsx`): Google Maps integration for property locations, marker clustering, route visualization, and interactive property selection.
- **Scheduled Inspections Schema**: Database table for persisting inspection schedules with date/time, priority, contact info, and route optimization data.

**AI Quality Services:**
- **Thermal Analysis Service** (`client/src/lib/thermal-analysis-service.ts`): AI-powered thermal image analysis for moisture detection, heat loss, and thermal bridging anomalies.
- **Evidence Quality Service** (`client/src/lib/evidence-quality-service.ts`): Client and server-side image quality checking for resolution, framing, and exposure issues.
- **Inspection Completeness Service** (`client/src/lib/inspection-completeness-service.ts`): Tracks step completion progress, calculates overall inspection scores, and estimates report quality.

## CRM Integrations (Phase 3)

**CRM Integration Service** (`server/crm-integrations.ts`):
- Unified interface for multiple CRM platforms with contact and job/opportunity sync
- Automatic document upload for Winn Reports to CRM platforms
- Per-user CRM configuration management with secure API key storage

**Supported CRM Platforms:**
- **JobNimbus**: Construction job management CRM with contacts, jobs, and file uploads
- **GoHighLevel**: All-in-one CRM with contacts and opportunities
- **Salesforce**: Enterprise CRM with Contact, Opportunity, and ContentVersion objects
  - Stage mapping to Salesforce opportunity stages (Prospecting, Qualification, etc.)
  - OpportunityContactRole linking for primary contacts
  - ContentVersion API for PDF report uploads
- **HubSpot**: Inbound marketing & sales CRM with contacts and deals
  - CRM v3/v4 API integration for contacts and deals
  - Association API for linking deals to contacts
  - Files API for report attachment with engagement notes
- **Pipedrive**: Sales-focused CRM with persons and deals
  - API token authentication
  - Notes API for adding inspection details to deals
  - Files API for document attachments

**CRM Configuration UI** (`client/src/components/crm-config.tsx`):
- Multi-CRM configuration management interface
- Automatic base URL population for each CRM type
- API key and webhook URL configuration
- Custom fields support with JSON input
- Sync history and activity logs

**API Endpoints:**
- `GET /api/crm/configs` - List user's CRM configurations
- `POST /api/crm/configs` - Create new CRM configuration
- `PUT /api/crm/configs/:id` - Update CRM configuration
- `DELETE /api/crm/configs/:id` - Delete CRM configuration
- `GET /api/crm/sync/logs/:configId` - View sync history

## Final Features (Phase 4)

**Bulk Property Import** (`server/property-import.ts`, `client/src/components/property-import.tsx`):
- CSV and Excel file parsing using papaparse and xlsx libraries
- Automatic column mapping with pattern matching (detects address, name, contact fields)
- Manual column mapping UI for custom spreadsheets
- Data validation with row-by-row error/warning reporting
- Batch property creation with progress tracking
- API endpoints:
  - `POST /api/properties/import/parse` - Parse file and detect columns
  - `POST /api/properties/import/validate` - Validate mapped data
  - `POST /api/properties/import/execute` - Execute bulk import

**Team Assignment & Workload Management** (`shared/schema.ts`, `server/routes.ts`, `client/src/pages/team-management.tsx`):
- Team assignments with inspector capacity limits (daily/weekly max inspections)
- Region and specialization tracking for intelligent assignment
- Availability management with unavailable periods
- Workload dashboard with utilization percentage visualization
- Color-coded utilization indicators (green/amber/red based on capacity)
- API endpoints:
  - `GET /api/team/assignments` - List all team assignments
  - `GET /api/team/assignments/:inspectorId` - Get specific assignment
  - `POST /api/team/assignments` - Create new assignment
  - `PUT /api/team/assignments/:id` - Update assignment
  - `DELETE /api/team/assignments/:id` - Remove assignment
  - `GET /api/team/workload` - Get current workload data with utilization

**Pre-built Damage Templates** (`shared/schema.ts`, `server/routes.ts`, `client/src/components/damage-template-selector.tsx`):
- 6 default damage type templates: Hail Impact, Wind Uplift, Thermal Bridging, Moisture Intrusion, Granule Loss, Flashing Failure
- Category-based organization (Storm Damage, Thermal Issues, Water Damage, Material Degradation, Penetration Issues)
- Severity ratings (critical/warning/info) with color-coded badges
- Affected components list for each damage type
- Recommended actions with priority levels (immediate/short_term/long_term) and cost estimates
- Required evidence checklist per template
- Inspection notes with Winn Methodology tips
- API endpoints:
  - `GET /api/damage-templates` - List all templates (optional category filter)
  - `GET /api/damage-templates/:id` - Get specific template
  - `POST /api/damage-templates` - Create custom template
  - `PUT /api/damage-templates/:id` - Update template
  - `DELETE /api/damage-templates/:id` - Remove template
  - `POST /api/damage-templates/seed` - Seed default templates

## External Dependencies
- **PostgreSQL**: Primary database for persistent data storage.
- **Firebase**: Authentication service for user management and access control.
- **Replit AI Integrations (GPT-5.1)**: Powers the Stormy AI assistant and various AI analysis features.
- **Capacitor**: Used for transforming the web application into native iOS and Android mobile applications.
- **Capacitor Plugins**: Camera, Filesystem, Geolocation, Preferences, SQLite for offline-first mobile capabilities.
- **Stripe**: Integrated for subscription payment processing.
- **Google Maps**: Used for property address lookup, satellite view, and drawing tools.