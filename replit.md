# Twangle - Relationship Coaching Platform

## Overview

Twangle is a couples' relationship wellness platform designed to provide psychological assessments, AI-powered coaching, and relationship-building tools. It aims to help couples understand attachment styles, identify relationship patterns, and offer personalized guidance based on established therapeutic frameworks. Key features include an AI relationship coach, an Attachment Style Assessment, a library of research-based exercises, a DIY couples retreat builder, and an AI-powered date night planner. The platform's core purpose is to foster healthier relationships through personalized, data-driven insights and interactive tools, maximizing user sign-ups and trial-to-paid conversions.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **40dayTwangle Content Restructuring** (November 2025): Major restructuring of 40-Day Twangle challenge data format to hide scripture references while displaying verse text. Database schema updated from `scriptureText`/`summary` to `passage`/`explanation`. The `scripture` field (e.g., "1 Corinthians 13:4") is stored but not displayed in UI. Frontend updated to show passage text under "Scripture" heading and explanation content under "Inspiration" heading (previously "Today's Teaching"). All 40 days of content reseeded with new data structure using The Message translation paraphrases. Backend storage queries updated to select `passage` and `explanation` fields instead of deprecated columns.
- **Twangle Logo Integration** (November 2025): Replaced all placeholder icons and text-based branding with the actual Twangle logo (interlocking hearts gradient design). Logo now appears in AppHeader navigation, Login page, Landing page hero section, favicon, and all SEO meta tags. Fixed header visibility bug where logo was hidden for authenticated users on dashboard.
- **Daily Conversations Category Selection** (November 2025): Implemented interactive category selection system allowing partners to choose the topic for their next conversation question. Features 7 themed categories (Emotional Intimacy, Communication & Conflict, Physical Intimacy, Finances & Planning, Values & Spiritual, Play & Adventure, Trust & Boundaries) plus "Surprise Me" option. Category choice synchronized between partners and automatically clears after use.
- **Schema Architecture Improvement** (November 2025): Fixed TypeScript type inconsistencies between insert schemas and storage layer. Introduced dual schema pattern:
  - Request schemas (e.g., `partnershipRequestSchema`, `journalEntryRequestSchema`) for validating client-supplied data (omit contextual fields like userId)
  - Full insert schemas (e.g., `insertPartnershipSchema`, `insertJournalEntrySchema`) for storage layer (include all required fields)
  - This ensures type safety while maintaining clear separation between client validation and database insertion
- **AI Coach Branding** (November 2025): Renamed all "Watson" references to "AI Coach Charles" throughout the platform for consistent brand identity
- **40dayTwangle UI Redesign** (November 2025): Completely redesigned the interface with an interactive card-based layout featuring a prominent current day card, 3-day preview system, celebration effects with lucide-react icons (PartyPopper, Trophy), and visual progress tracking. Removed all emojis per design guidelines.
- **Database Field Mapping Fix** (November 2025): Fixed missing content display in both 40dayTwangle and Daily Conversations by applying explicit field selection in all Drizzle ORM queries. This ensures proper camelCase mapping from database columns to JavaScript objects for fields like `summary`, `actionPrompt`, `journalQuestion`, `questionText`, and `therapyPrompt`.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, utilizing Vite, Wouter for routing, and TanStack Query for server state management. UI components are developed with Shadcn/ui, Radix UI primitives, and Tailwind CSS, following a warm, organic aesthetic with a responsive mobile-first design. Key UI elements include a Dashboard, AI Coach Chat, Retreat Builder, Date Night Planner, Exercises Library, and various engagement features like a Relationship Health Score, Partner Connection System, AI-Powered Relationship Journal, and Daily Conversations. Conversion optimization features include Social Proof Statistics, an Exit Intent Popup, a Comparison Table, and an Interactive Coach Demo. SEO is implemented with dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD structured data.

### Backend

The backend is an Express.js application on Node.js with TypeScript, providing RESTful APIs for core functionalities such as chat, planning, assessments, billing, and reporting. API security includes JSON request/response validation, ownership verification, and IP-based rate limiting for anonymous endpoints. An AI Coach ("AI Coach Charles") uses strict system prompts to provide relationship-only advice. AI integration leverages OpenAI GPT for coaching, planning, and assessment analysis, using streaming responses and Zod-validated structured JSON.

### Data Storage

PostgreSQL, managed via Neon serverless and Drizzle ORM, serves as the primary database. It stores comprehensive data models for users, subscriptions, chat sessions, assessments, and engagement features like Health Scores, Journal Entries, and Conversation Responses.

### Authentication & Authorization

Twangle uses a custom authentication system built with Passport.js supporting both email/password and social login (Google, Facebook). Password authentication uses bcrypt hashing for security. The platform implements a freemium model with a 7-day free trial that automatically starts upon registration. Pricing tiers include individual, couple, annual, and lifetime access plans.

**Authentication Methods:**
- **Email/Password:** Traditional login with bcrypt password hashing
- **Google OAuth:** Sign in with Google using passport-google-oauth20
- **Facebook OAuth:** Sign in with Facebook using passport-facebook

**Social Login Features:**
- Automatic account linking: If a user signs in with social login using an email that already exists, the accounts are automatically linked
- Email verification: Social login users are automatically marked as email verified
- Profile information: First name, last name, and profile picture are imported from social providers
- Trial activation: New social login users automatically get a 7-day free trial

**Security Features:**
- PostgreSQL-backed session management with 30-day cookie expiration
- Token-based password reset with rate limiting (3 requests per 15 minutes per IP)
- Email verification with 24-hour expiring tokens
- IP-based geolocation blocking for high-risk countries
- Secure OAuth callback handling with error redirection

**Database Schema:**
- Users table includes `authProvider` field ('local', 'google', 'facebook')
- `authProviderId` stores the unique identifier from OAuth provider
- Supports multiple authentication methods per email address through account linking

### Daily Conversations

A dedicated feature at `/conversations` implements a double-blind system where partners' responses to daily questions are hidden until both have answered. It features a question bank of 140 therapy-informed questions across 7 categories and 3 intensity levels. AI coaching is integrated via a "Help Me Out" modal offering guidance, "think time," and alternative questions using OpenAI GPT-4o. Free users have a limited number of responses, while paid users have unlimited access.

### Couple Subscription Architecture

The platform supports a shared subscription model where one Stripe subscription grants premium access to both partners. This involves a database schema for `couples` and an invitation flow for partners to join. Access control integrates lifetime access, free trials, individual subscriptions, and couple subscriptions. Stripe webhook integration ensures simultaneous access changes for both partners when a couple's subscription status changes.

### Stripe Connect Marketplace

Twangle supports a marketplace model using Stripe Connect with destination charges, allowing users to become merchants and sell products. The platform collects a 10% application fee, and merchants use Stripe Express accounts. The architecture includes `connected_accounts` and `products` database tables, and API endpoints for account creation, onboarding, product management, and checkout. Frontend pages exist for merchant onboarding, product management, and a public storefront.

## External Dependencies

### Third-Party Services

- **OpenAI API:** For all AI functionalities.
- **Neon Database:** Serverless PostgreSQL hosting.
- **Gmail:** Used for transactional email services.
- **ip-api.com:** For geolocation services.
- **Stripe:** For payment processing and subscription management.

### Key NPM Packages

- **UI/UX:** `@radix-ui/*`, `recharts`, `embla-carousel`.
- **Forms:** `react-hook-form`, `@hookform/resolvers`.
- **Database:** `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`.
- **Date Handling:** `date-fns`.