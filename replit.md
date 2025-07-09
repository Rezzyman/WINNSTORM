# WHITE HOT - Thermal Roof Intelligence Platform

## Overview
Building a comprehensive, blockchain-based platform for commercial roofing inspection documentation. The system creates immutable "digital titles" for commercial roofs, similar to Carfax for vehicles, providing irrefutable evidence and maintenance history.

## Core Features
- **Winn Report Generation**: 300+ page detailed reports with precise data
- **Blockchain Integration**: Encrypted, immutable database for roof histories
- **Digital Title System**: Working history of each roof inspection
- **Commercial Scale**: Targeting every commercial roof nationally/internationally

## Technical Architecture
- **Frontend**: React + TypeScript + Tailwind CSS (pure black theme with WHITE HOT branding)
- **Backend**: Express.js with in-memory storage (will migrate to blockchain)
- **Database**: Currently MemStorage, planning blockchain implementation
- **Theme**: Pure black background (#000000) with red/orange accents matching WHITE HOT logo

## User Preferences
- Pure black background throughout the entire application
- WHITE HOT logo prominently displayed with red/orange accent colors
- Professional, enterprise-grade interface design
- Focus on detailed data collection and comprehensive reporting

## Project Architecture
- **Data Model**: Properties, Scans, Reports with extensive metrics and issues tracking
- **Workflow**: Multi-step process for creating comprehensive Winn reports
- **Authentication**: Firebase integration with role-based access
- **File Management**: Thermal and standard image uploads with comparison tools

## Recent Changes
- **2025-01-09**: Implemented AI-powered thermal analysis using OpenAI GPT-4o vision model
- **2025-01-09**: Added comprehensive thermal analysis API endpoints and components
- **2025-01-09**: Integrated thermal analysis into Winn Report workflow with real-time processing
- **2025-01-09**: Created test login system for easier development and testing
- **2025-01-09**: Implemented detailed data structures for building info, roof systems, and cost estimates

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