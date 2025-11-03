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
**Key UI Components:** Dashboard, AI Coach Chat, Retreat Builder, Date Night Planner, Exercises Library, Nervous System Regulation module, Weekly Summaries, Feedback Forms, Admin-only Feedback & Email Monitoring Reports, Relationship Health Score Dashboard, Partner Connection System, AI-Powered Relationship Journal, Daily Conversations (standalone dedicated page), and Progress Analytics (Insights). Features include a global Trial Countdown Banner, Trial Value Dashboard, Trial Expiring Modal, and Trial Checklist for onboarding.
**Conversion Optimization Features:** Six landing page features designed to maximize sign-ups and trial-to-paid conversion:
1. **Social Proof Statistics** - Real-time display of user count, coaching sessions, and ratings from database
2. **Exit Intent Popup** - Modal triggered when user attempts to leave, encouraging signup with value proposition
3. **Comparison Table** - Side-by-side Traditional Therapy vs Twangle feature/cost comparison
4. **Interactive Coach Demo** - Anonymous users can try Coach Charles with 3 free messages (sample conversations or custom questions), protected by dual security: session-based 3-message cap + IP-based 10 requests/hour rate limiting
5. **Newsletter Signup** - Email capture form with public API endpoint creating database records
6. **Partner Invitation Landing** - Personalized landing pages for partnership invitation links with inviter name display
**Engagement Features:** Five major features to increase user engagement and trial-to-paid conversion:
1. **Relationship Health Score** - Calculates a 0-100 score based on user activity (assessments 30%, coaching 25%, exercises 20%, progress 15%, journaling 10%) with category breakdowns and historical trend tracking
2. **Partner Connection** - Email-based invitation system allowing couples to link accounts with configurable sharing permissions for assessments, progress, and journal entries
3. **AI-Powered Journal** - Personal relationship journaling with mood tracking and optional GPT-4o generated insights, supporting private or partner-shared entries
4. **Daily Conversations** - Standalone dedicated feature at /conversations with therapy-informed daily questions using double-blind responses (both must answer before seeing each other's responses). Free users get 3 conversation responses, paid users get unlimited access. Includes 140 questions across 7 categories (emotional intimacy, communication/conflict, physical intimacy, finances/planning, values/spiritual, play/adventure, trust/boundaries) with 3 intensity levels. Features AI coaching via "Help Me Out" modal with guidance, think time, and alternative question options. Prominent feature card on landing page marked "FREE" drives conversions by surfacing the feature limit
5. **Progress Analytics** - Periodic snapshots (daily/weekly/monthly) tracking engagement metrics with AI-generated insights and benchmarking against user history
**SEO Implementation:** Dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD structured data for E-E-A-T compliance across key pages.

### Backend Architecture

**Server Framework:** Express.js on Node.js with TypeScript.
**API Design:** RESTful endpoints for core functionalities (chat, planning, assessments, billing, reporting, analytics, admin, email verification, newsletter, conversations), secured with JSON request/response validation and ownership verification. Enhanced Stripe webhook handling tracks the full subscription lifecycle and conversion events.
**API Security:** Anonymous chat endpoint (`/api/chat`) protected by dual security layers: session-based 3-message cap + IP-based rate limiting (10 requests/hour) to prevent OpenAI API abuse while maintaining demo functionality.
**AI Coach Guardrails:** "Coach Charles" uses strict system prompts to provide relationship-only advice, explicitly refusing off-topic queries (medical, legal, financial, etc.) and redirecting users appropriately.
**AI Integration:** OpenAI GPT for coaching, planning, and assessment analysis, utilizing streaming responses and Zod-validated structured JSON for data consistency.

### Data Storage Solutions

**Database:** PostgreSQL via Neon serverless, managed with Drizzle ORM for type-safe queries.
**Data Models:** Comprehensive models for Users, Subscriptions, Chat Sessions, Assessments, Retreats, Date Nights, Feedback, Access Logs, Conversion Events, Subscription Events, Email Send Logs, Health Scores, Partnerships, Journal Entries, Analytics Snapshots, Conversation Questions, Conversation Responses, and Conversation Help Events.
**Feedback Reporting:** An admin-only dashboard provides detailed analytics on user feedback, including summary statistics, distribution by type/category, and enriched user information.
**Engagement Tracking:** Health scores track relationship wellness over time, partnerships enable couples to share progress, journals provide AI-powered insights into relationship dynamics, daily conversations foster deeper connection through structured dialogue, and analytics snapshots capture periodic engagement metrics for benchmarking.

### Daily Conversations Architecture

**Double-Blind System:** Responses are hidden until both partners answer the same daily question, then unlock simultaneously to encourage honest, independent reflection before discussion.

**Question Bank:** 140 therapy-informed questions organized by:
- **Categories (7):** Emotional intimacy, communication/conflict, physical intimacy, finances/planning, values/spiritual, play/adventure, trust/boundaries
- **Intensity Levels (1-3):** Gradual progression from gentle to deeper questions
- **Therapy Prompts:** Contextual guidance for each question based on therapeutic frameworks

**AI Coaching Integration:** "Help Me Out" modal provides:
- **Guidance Tab:** OpenAI GPT-4o generates personalized coaching tips for the current question
- **Think Time Tab:** Encourages users to defer answering when they need more reflection time
- **Alternative Tab:** AI generates two alternative questions (feelings-focused and action-focused) from the same category for users who find the original too challenging

**API Endpoints:**
- `GET /api/conversations/daily` - Fetches today's question and response status for the partnership
- `POST /api/conversations/respond` - Submits a response with double-blind validation
- `POST /api/conversations/help` - Generates AI coaching content (guidance/alternative questions)
- `GET /api/conversations/history` - Retrieves past complete conversations

**UI Integration:** Standalone dedicated page at `/conversations` route with full-featured UI (no longer part of Journal tabs). Navigation links appear in desktop Tools dropdown and mobile menu. Requires active partnership to access. Features usage tracking badge showing remaining free questions and upgrade prompts when limit is reached.

**Usage Limits:** Free users get 3 conversation responses total (tracked in `users.conversationResponseCount`). Paid users get unlimited access. API endpoints enforce limits and return `remainingResponses` and `isLimitReached` flags for UI display.

### Stripe Connect Marketplace

**Platform Model:** Twangle now supports a marketplace model enabling users to become merchants and sell products through the platform using Stripe Connect with destination charges.

**Architecture Pattern:** 
- **Destination Charges:** Payments are processed on the platform account, with funds transferred to connected merchant accounts
- **Application Fee:** Platform collects 10% of each sale as an application fee
- **Express Accounts:** Merchants use Stripe Express accounts with platform-controlled pricing and fees

**Database Schema:**
- `connected_accounts` table: Stores Stripe connected account IDs linked to users with status flags (chargesEnabled, detailsSubmitted, payoutsEnabled)
- `products` table: Platform-level products mapped to connected accounts, storing Stripe product/price IDs, pricing, and merchant associations

**API Endpoints:**
- `POST /api/stripe-connect/account` - Create connected account with controller properties (requires auth)
- `POST /api/stripe-connect/account-link` - Generate Stripe onboarding URL (requires auth)
- `GET /api/stripe-connect/account-status` - Fetch and sync account status from Stripe (requires auth)
- `POST /api/stripe-connect/product` - Create platform-level products (requires auth)
- `GET /api/stripe-connect/products` - List all products across merchants (public)
- `GET /api/stripe-connect/my-products` - Get user's products (requires auth)
- `POST /api/stripe-connect/checkout` - Create checkout session with destination charge (public)
- `GET /api/stripe-connect/checkout-session/:sessionId` - Retrieve session details (public)

**Frontend Pages:**
- `/merchant/onboard` - Merchant account creation and Stripe onboarding status tracking
- `/merchant/products` - Product creation and management with fee breakdown display
- `/storefront` - Public marketplace for browsing and purchasing products
- `/storefront/success` - Checkout confirmation page

**Key Features:**
- Real-time account status syncing with Stripe API
- Clear fee breakdown showing merchant earnings (90%) vs platform fee (10%)
- Secure authentication for all merchant endpoints
- Public storefront for customer browsing and purchasing
- Comprehensive error handling and validation

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