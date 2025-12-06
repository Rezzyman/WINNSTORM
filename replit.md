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

## External Dependencies
- **PostgreSQL**: Primary database for persistent data storage.
- **Firebase**: Authentication service for user management and access control.
- **Replit AI Integrations (GPT-5.1)**: Powers the Stormy AI assistant and various AI analysis features.
- **Capacitor**: Used for transforming the web application into native iOS and Android mobile applications.
- **Stripe**: Integrated for subscription payment processing.
- **Google Maps**: Used for property address lookup, satellite view, and drawing tools.