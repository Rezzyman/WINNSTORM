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
- **CRM Integration**: Unified interface for various CRM platforms (JobNimbus, GoHighLevel, Salesforce, HubSpot, Pipedrive) for contact/job sync and report uploads.
- **Bulk Property Import**: CSV/Excel parsing, column mapping, data validation, and batch creation.
- **Team Assignment & Workload Management**: Assigning inspectors, tracking capacity, and workload visualization.
- **Pre-built Damage Templates**: Categorized damage templates with severity ratings, affected components, recommended actions, and required evidence checklists.

## External Dependencies
- **PostgreSQL**: Primary database.
- **Firebase**: Authentication service.
- **Replit AI Integrations (GPT-5.1)**: AI assistant and analysis.
- **Capacitor**: Native mobile application development.
- **Capacitor Plugins**: Camera, Filesystem, Geolocation, Preferences, SQLite.
- **Stripe**: Subscription payment processing.
- **Google Maps**: Mapping and location services.