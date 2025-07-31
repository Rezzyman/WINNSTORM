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
- **Backend**: Express.js with in-memory storage (scalable for future growth)
- **Database**: Currently MemStorage with flexible structure for complex data relationships
- **Theme**: Professional dark interface with blue/gray accents for enterprise consulting environment

## User Preferences
- Professional enterprise-grade interface design suitable for damage assessment consultants
- WinnStorm™ branding with clean, modern aesthetics
- Dark theme for reduced eye strain during long inspection sessions
- Focus on data-rich collection workflows and comprehensive reporting capabilities
- Intuitive UI optimized for both desktop and mobile field use

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

## Recent Changes
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

## Test Login
- **Test Login Button**: Green button on auth page bypasses Firebase authentication
- **Test User**: Automatically creates test user with field-rep role
- **Access**: Provides full access to dashboard and Winn Report functionality
- **Logout**: Properly clears test user data and returns to login screen

## AI Features
- **Thermal Analysis**: Real-time AI analysis of thermal images using OpenAI GPT-4o
- **Issue Detection**: Automatically identifies temperature anomalies, moisture, insulation gaps
- **Metrics Generation**: Creates detailed inspection metrics and recommendations
- **Report Integration**: AI analysis results flow directly into Winn Report workflow

## Next Steps
- Enhance AI model prompts for more specific roofing analysis
- Add batch processing for multiple thermal images
- Implement cost estimation algorithms
- Plan blockchain integration architecture