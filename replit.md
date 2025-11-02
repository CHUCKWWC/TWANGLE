# Twangle - Relationship Coaching Platform

## Overview

Twangle is a couples' relationship wellness application providing psychological assessments, AI-powered coaching, and relationship-building tools. It helps couples understand attachment styles, identify relationship patterns, and offers personalized guidance based on established therapeutic frameworks. The platform features an AI relationship coach, an Attachment Style Assessment, a library of research-based exercises, a DIY couples retreat builder, and an AI-powered date night planner. Its primary goal is to foster healthier relationships through personalized, data-driven insights and interactive tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
**UI Component System:** Shadcn/ui with Radix UI primitives, Tailwind CSS, custom warm rose/mauve and terracotta theme, responsive mobile-first design.
**Design System:** Focus on a warm, organic aesthetic with Poppins, Inter, and Quicksand typography.
**Key UI Components:** Dashboard, AI Coach Chat, Retreat Builder, Date Night Planner, Exercises Library, Nervous System Regulation module, Weekly Summaries, Feedback Forms, Admin-only Feedback & Email Monitoring Reports, Relationship Health Score Dashboard, Partner Connection System, AI-Powered Relationship Journal, and Progress Analytics (Insights). Features include a global Trial Countdown Banner, Trial Value Dashboard, Trial Expiring Modal, and Trial Checklist for onboarding.
**Engagement Features:** Four major features to increase user engagement and trial-to-paid conversion:
1. **Relationship Health Score** - Calculates a 0-100 score based on user activity (assessments 30%, coaching 25%, exercises 20%, progress 15%, journaling 10%) with category breakdowns and historical trend tracking
2. **Partner Connection** - Email-based invitation system allowing couples to link accounts with configurable sharing permissions for assessments, progress, and journal entries
3. **AI-Powered Journal** - Personal relationship journaling with mood tracking and optional GPT-4o generated insights, supporting private or partner-shared entries
4. **Progress Analytics** - Periodic snapshots (daily/weekly/monthly) tracking engagement metrics with AI-generated insights and benchmarking against user history
**SEO Implementation:** Dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD structured data for E-E-A-T compliance across key pages.

### Backend Architecture

**Server Framework:** Express.js on Node.js with TypeScript.
**API Design:** RESTful endpoints for core functionalities (chat, planning, assessments, billing, reporting, analytics, admin, email verification, newsletter), secured with JSON request/response validation and ownership verification. Enhanced Stripe webhook handling tracks the full subscription lifecycle and conversion events.
**AI Coach Guardrails:** "Coach Charles" uses strict system prompts to provide relationship-only advice, explicitly refusing off-topic queries (medical, legal, financial, etc.) and redirecting users appropriately.
**AI Integration:** OpenAI GPT for coaching, planning, and assessment analysis, utilizing streaming responses and Zod-validated structured JSON for data consistency.

### Data Storage Solutions

**Database:** PostgreSQL via Neon serverless, managed with Drizzle ORM for type-safe queries.
**Data Models:** Comprehensive models for Users, Subscriptions, Chat Sessions, Assessments, Retreats, Date Nights, Feedback, Access Logs, Conversion Events, Subscription Events, Email Send Logs, Health Scores, Partnerships, Journal Entries, and Analytics Snapshots.
**Feedback Reporting:** An admin-only dashboard provides detailed analytics on user feedback, including summary statistics, distribution by type/category, and enriched user information.
**Engagement Tracking:** Health scores track relationship wellness over time, partnerships enable couples to share progress, journals provide AI-powered insights into relationship dynamics, and analytics snapshots capture periodic engagement metrics for benchmarking.

### Authentication & Authorization

**Freemium Model:** Authentication-required 7-day free trial, granting full access to all premium features without requiring a credit card. All users must sign up via Replit Auth (OIDC).
**Trial System Implementation:** Trials automatically start on signup, tracked by `trialStartedAt` and `trialEndsAt` timestamps. Frontend components dynamically display trial status, accumulated value, and trigger conversion modals based on trial progress.
**Pricing Tiers:** Offers Couples Starter, Premium, Annual, and Lifetime Access plans.
**Backend Security:** All API endpoints require authentication, with specific admin functions protected by `isAdmin` middleware. Features include email verification, IP-based geolocation blocking (Russia, China), and automated trial reminder emails.
**Email Verification & Reminders:** Utilizes Gmail/SendGrid for transactional emails, including 24-hour expiring tokens for verification and personalized trial reminder emails based on user activity.
**Admin Access Control:** Reporting and analytics features are restricted to specific admin emails.

## External Dependencies

**Third-Party Services:**
- **OpenAI API:** AI functionalities.
- **Neon Database:** Serverless PostgreSQL.
- **Gmail:** Transactional email services.
- **ip-api.com:** Geolocation services.
- **Stripe:** Payment processing and subscription management.

**Key NPM Packages:**
- **UI/UX:** `@radix-ui/*`, `recharts`, `embla-carousel`.
- **Forms:** `react-hook-form`, `@hookform/resolvers`.
- **Database:** `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`.
- **Date Handling:** `date-fns`.