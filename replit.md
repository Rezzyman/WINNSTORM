# WinnStorm™ - Comprehensive Damage Assessment Platform

## Overview
Building a comprehensive online application that serves as the central hub for Damage Assessment Consultants, enabling them to efficiently conduct inspections, generate highly data-rich reports based on the "Winn Methodology," manage client projects, and facilitate their professional certification process. The application aims to "crystallize and effectively create a clone of Eric Winn's expertise."

## Core Features
- **Winn Report Generation**: Comprehensive damage assessment reports using the proven Winn Methodology
- **Consultant Certification System**: Training portal with courses, quizzes, and progress tracking
- **Client & Project Management**: Full CRM functionality for managing projects and clients
- **Weather Verification**: Integration with meteorological data sources for hail and storm verification
- **Comprehensive Data Collection**: Guided workflows for thermal data, terrestrial walks, and damage documentation

## Technical Architecture
- **Frontend**: React + TypeScript + Tailwind CSS (professional dark theme with WinnStorm branding)
- **Backend**: Express.js with PostgreSQL database via Drizzle ORM
- **Database**: PostgreSQL (production-ready persistence with full data integrity)
- **AI Integration**: Replit AI Integrations with GPT-5.1 for Stormy AI assistant (no API key management required)
- **Theme**: Professional dark interface with WinnStorm cyan gradient brand colors

## User Preferences
- Professional enterprise-grade interface design suitable for damage assessment consultants
- WinnStorm™ branding with clean, modern aesthetics
- Dark theme for reduced eye strain during long inspection sessions
- Focus on data-rich collection workflows and comprehensive reporting capabilities
- Intuitive UI optimized for both desktop and mobile field use
- AI assistant named "Stormy" for personalized inspection guidance

## Target Users
- **Damage Assessment Consultants**: Junior & Senior levels for inspections and report generation
- **Clients/Property Owners**: View reports and track project status
- **Administrators**: Oversee operations, manage users, review certifications
- **Insurance Adjusters/Engineers**: Receive and review comprehensive reports

## Project Architecture
- **User Management**: Role-based system (Junior/Senior Consultants, Admins, Clients)
- **Certification Portal**: Training courses, quizzes, progress tracking, performance metrics
- **Client & Project Management**: Full CRM functionality with pipeline management
- **Data Collection**: Guided workflows for weather verification, thermal data, damage assessment
- **Report Generation**: Dynamic PDF assembly with integrated evidence and Winn Methodology
- **Authentication**: Firebase integration with role-based access control
- **File Management**: Support for photos, thermal images, drone data, and document storage

## Current Sprint: Mobile-First Field Inspector App (KC Field Test Preparation)
**Goal**: Transform WinnStorm into a mobile-first, AI-guided inspection coach for field use, preparing for Kansas City field testing with Eric Winn

**Key Priorities**:
1. **Mobile-First UX**: Large touch targets (44px min), readable outdoor fonts, bottom navigation, one-handed operation
2. **Stormy AI Enhancement**: Context-aware guidance system that adapts to user experience level and current workflow step
3. **Field-Optimized Features**: Native camera integration, voice notes, offline capability, progressive web app
4. **Educational Integration**: Inline "Why This Matters" tooltips, micro-lessons, decision tree guidance
5. **Adaptive Learning**: Stormy reduces guidance as user demonstrates competency

## Recent Changes
- **2025-11-24**: STORMY AI UPGRADED TO GPT-5.1 - Enhanced AI assistant with latest OpenAI model:
  - Installed Replit AI Integrations for seamless GPT-5.1 access (no API key needed, charges to Replit credits)
  - Upgraded all AI endpoints from GPT-4o to GPT-5.1 for improved reasoning and contextual awareness
  - Enhanced system prompts with Eric Winn methodology focus for damage assessment expertise
  - Updated thermal image analysis with hail damage pattern recognition and moisture detection
  - Improved conversational AI for better beginner-to-expert adaptive coaching
  - Ready for Thursday's Blitzy assessment meeting with superior AI guidance capabilities
- **2025-11-24**: VISUAL CONSISTENCY & DATABASE MIGRATION - Production readiness improvements:
  - Migrated from MemStorage to PostgreSQL with Drizzle ORM for persistent data
  - Replaced all hardcoded zinc/gray colors with WinnStorm theme variables (cyan brand consistency)
  - Updated CRM buttons from red to WinnStorm gradient (primary → cyan-500)
  - Dashboard stats show neutral placeholders instead of misleading mock data
  - Firebase authentication fully implemented with Google sign-in and email/password
  - User onboarding flow with first-time modal guide
  - Fixed navigation - all footer buttons functional
  - Zero LSP errors - codebase production-ready
- **2025-11-18**: STRIPE SUBSCRIPTION PAYMENTS - Integrated subscription-based monetization with Stripe:
  - Created /subscribe/:plan page with Stripe Elements payment form
  - Built /subscription-success page with post-payment onboarding
  - Connected landing page pricing buttons to subscription checkout flow
  - Backend API route /api/create-subscription creates Stripe customers and subscriptions
  - Payment flow: Landing → Choose Plan → Stripe Checkout → Success Page → Dashboard
  - Supports Starter, Professional, and Enterprise pricing tiers
  - Test mode enabled with Stripe test keys (VITE_STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY)
- **2025-11-17**: NATIVE iOS & ANDROID APPLICATIONS - Transformed WinnStorm into native mobile apps using Capacitor:
  - Configured Capacitor 7.x with iOS and Android platforms
  - Enhanced camera-capture component with native Capacitor Camera API (falls back to web on browsers)
  - App ID: com.winnstorm.inspector, App Name: WinnStorm
  - Native camera with saveToGallery, 90% quality, fullscreen presentation
  - Created comprehensive DEPLOYMENT.md with App Store and Google Play submission guides
  - iOS and Android projects synced with latest web build
  - 3 native plugins integrated: Camera, Filesystem, Preferences
  - Platform detection with Capacitor.isNativePlatform() for seamless web/native compatibility
- **2025-11-17**: MOBILE-FIRST FIELD READINESS TRANSFORMATION - Complete mobile-first redesign for field inspectors working on rooftops:
  - Added 44px touch-target buttons, h-12 field-input forms, h-14 mobile navigation for outdoor usability
  - Implemented fixed bottom navigation bar (MobileWorkflowNav) with large Previous/Next buttons and progress indicator
  - Created educational tooltip system (EducationalTooltip) with HelpCircle icons and "Why This Matters" training content
  - Built comprehensive Stormy AI guidance system (stormy-guidance.ts) with Beginner/Intermediate/Expert modes
  - Step-specific educational content covering purpose, importance, key points, and common mistakes for all 8 workflow steps
  - Context-aware AI prompts that adapt based on user level, current step, and collected inspection data
  - Proactive welcome messages when advancing to new workflow steps (for beginners/intermediates)
  - Dynamic quick action suggestions that change based on current step and experience level
  - Experience level selector in AI Assistant with GraduationCap icon
- **2025-11-17**: NATIVE CAMERA INTEGRATION - Direct photo capture for field use:
  - Created CameraCapture component with capture='environment' for rear camera access
  - Photo review interface with Cancel/Retake/Confirm buttons
  - Integrated into Thermal Analysis workflow for direct thermal image capture
  - Base64 to File conversion for seamless integration with existing upload workflows
  - Mobile-optimized with touch-friendly review controls
- **2025-02-05**: CREATED KILLER LANDING PAGE - Built comprehensive marketing website with parallax effects, detailed pricing tiers, testimonials, and complete feature showcase for WinnStorm.com
- **2025-02-05**: ACTIVATED TRAINING PORTAL - Created comprehensive WinnStorm™ certification training portal with course management, progress tracking, and multi-level certification system
- **2025-01-31**: IMPLEMENTED CONTEXTUAL AI ASSISTANT "STORMY" - Integrated OpenAI powered AI assistant named "Stormy" with Eric Winn's methodology for real-time inspection guidance (upgraded to GPT-5.1 on 2025-11-24)
- **2025-01-31**: ENHANCED GOOGLE MAPS INTEGRATION - Added property address lookup with satellite view and drawing tools for roof section marking
- **2025-01-31**: UPDATED STORMY AVATAR - Implemented custom cowboy hat avatar image (ChatGPT Image Jul 31, 2025, 03_42_36 PM_1753998186905.png) for AI assistant branding
- **2025-01-09**: UPDATED WINNSTORM™ RESTORATION PRO LOGO - New blue gradient shield design with "Certified to Winn" badge integrated throughout application
- **2025-01-09**: FIXED DEMO ACCOUNT BLANK SCANS - Resolved schema mismatches and storage implementation for proper thermal scan display
- **2025-01-09**: IMPLEMENTED LIGHT/DARK MODE TOGGLE - Complete theme system with localStorage persistence and system preference detection
- **2025-01-09**: MAJOR TRANSFORMATION - Rebranded from WHITE HOT to WinnStorm™ based on comprehensive requirements
- **2025-01-09**: Updated data schema for complete damage assessment consulting system with training, certification, and project management
- **2025-01-09**: Redesigned dashboard with WinnStorm™ branding, consultant certification tracking, and project-focused interface
- **2025-01-09**: Implemented comprehensive data structures for weather verification, thermal inspection, terrestrial walks, test squares, and damage assessment
- **2025-01-09**: Added support for multi-stage consultant certification system (Junior → Senior) with training progress tracking
- **2025-01-09**: Built project-based workflow system supporting client management, property assessment, and comprehensive reporting
- **2025-01-09**: Integrated Winn Methodology data collection including core samples, moisture tests, soft metals, and compliance tracking

## Authentication
- **Firebase Integration**: Google sign-in and email/password authentication
- **User Onboarding**: First-time user guide modal after login
- **Role-Based Access**: Consultant, admin, and client role management
- **Session Management**: Secure token-based authentication with PostgreSQL persistence

## AI Features (Powered by GPT-5.1)
- **Stormy AI Assistant**: Context-aware conversational guidance using GPT-5.1 via Replit AI Integrations
  - Adapts to user experience level (Beginner/Intermediate/Expert)
  - Real-time inspection coaching based on Eric Winn methodology
  - Step-specific educational tips and "Why This Matters" explanations
  - No API key management required (charges to Replit credits)
- **Thermal Image Analysis**: Advanced AI analysis of thermal imagery using GPT-5.1 vision capabilities
  - Temperature anomaly detection and pattern recognition
  - Moisture intrusion and water infiltration identification
  - Hail damage signature analysis
  - Insulation gap and thermal bridging detection
  - Structural integrity assessment
- **Automated Metrics Generation**: AI-powered inspection metrics and recommendations
- **Report Generation**: Professional executive summaries for insurance claims and restoration planning
- **Report Integration**: AI analysis results flow directly into Winn Report workflow

## Next Steps (Post-KC Field Test)
- Refine Stormy prompts based on Eric Winn's field feedback
- Implement progressive difficulty levels in training modules
- Add batch thermal image processing
- Develop cost estimation algorithms based on real inspection data
- Plan blockchain integration for report verification and certification tracking