# Twangle - Relationship Coaching Platform

## Overview

Twangle is a couples' relationship wellness application that offers psychological assessments, AI-powered coaching, and relationship-building tools. It helps couples understand attachment styles, identify relationship patterns, and provides personalized guidance based on frameworks like Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The platform includes:
- An Attachment Style Assessment with AI analysis.
- An AI relationship coach ("Coach Charles") with enhanced guardrails.
- A library of research-based relationship exercises.
- An interactive Nervous System Regulation educational module with guided timers.
- A DIY couples retreat builder with AI-generated itineraries.
- An AI-powered Date Night planner.
- Weekly coaching session summaries.
- A user feedback system with comprehensive reporting.
- Comprehensive access and usage reporting.
- Growth intelligence platform with conversion tracking, revenue analytics, and subscription lifecycle monitoring.
- Feedback analytics dashboard (admin-only).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.

**UI Component System:** Shadcn/ui with Radix UI primitives, Tailwind CSS, custom theme (light/dark modes), responsive mobile-first design.

**Design System:** Typography (Poppins, Inter, Quicksand), warm rose/mauve and terracotta color palette, warm/organic aesthetic, progressive intimacy model.

**Key UI Components:** Dashboard, AppHeader with feature badges, EmailVerificationBanner, Profile, AssessmentQuestion, AttachmentResults (Recharts), AICoachChat, RetreatBuilder (multi-step wizard with vision planning), RetreatItinerary (AI-generated with framework citations), DateNightPlanner, ExercisesLibrary, NervousSystemRegulation (educational module with expandable technique cards and daily practice guide), WeeklySummaries, FeedbackForm, FeedbackReport (admin-only feedback analytics), RequirePlan (premium feature gate), Paywall (Stripe hosted), SubscriptionCheckout (custom form), Reports, Analytics (revenue dashboard with MRR/ARR, conversion funnel, customer distribution), FeatureCard (auth-aware navigation), SEO (dynamic meta tags), StructuredData (JSON-LD schemas), CoachCredentials (E-E-A-T compliance), **TrialCountdownBanner** (global trial timer), **TrialValueDashboard** (accumulated value display), **TrialExpiringModal** (urgency trigger at 2 days), **TrialChecklist** (4-item onboarding activation guide).

**SEO Implementation:** Comprehensive SEO system with dynamic meta tags (title, description, keywords), Open Graph and Twitter Card support, JSON-LD structured data (Organization, Service, Person, FAQ, Breadcrumb schemas), FAQ page optimized for featured snippets, and author credentials for E-E-A-T compliance. All major pages (Landing, Coach, Assessment, Retreat, Exercises, DateNight, Summaries) include unique, keyword-optimized metadata.

### Backend Architecture

**Server Framework:** Express.js on Node.js with TypeScript (ESM).

**API Design:** RESTful endpoints (`/api`) for chat, retreat/date night planning, user eligibility, feedback, attachment assessments, billing (Stripe), reporting (access logs, feedback analytics), analytics (revenue metrics, conversion funnel, subscription/conversion events), admin functions, email verification, and newsletter subscriptions. Enhanced Stripe webhook handler (`/webhooks/stripe`) tracks full subscription lifecycle (checkout, renewals, cancellations, payment events) and writes conversion events (free_to_paid, paid_to_free, subscription_renewed, subscription_canceled) and subscription events (created, updated, deleted, payment_succeeded, payment_failed). JSON request/response with validation. Ownership verification on protected resources. Access logging with IP geolocation. Click-to-feature redirect flow.

**AI Coach Guardrails (Updated):** Coach Charles is configured with strict boundaries to only provide relationship coaching advice. The system prompt explicitly refuses to answer questions about: medical advice, mental health therapy, legal matters, financial planning, career counseling, technical support, or any topics unrelated to relationships. When asked off-topic questions, the coach politely declines and redirects to appropriate professionals while optionally offering to discuss how the issue affects the relationship.

**AI Integration:** OpenAI GPT for coaching, retreat/date night planning, and attachment analysis. Custom system prompts for AI personas. Streaming responses for chat. Structured JSON responses with Zod validation for attachment analysis.

### Data Storage Solutions

**Database:** PostgreSQL via Neon serverless, Drizzle ORM for type-safe queries, schema-first design with Zod validation.

**Data Models:** Users (authentication, lifetime access, Stripe ID, email verification, newsletter), Subscriptions (Stripe details), ChatSessions, WeeklySummaries, GeneralFeedback (type, category, description, rating), SessionFeedback (star rating, optional text), RelationshipProgress, RetreatItineraries (with vision planning), DateNights, Assessments (responses, AI results, share tokens), AccessLogs (IP, geolocation), ConversionEvents (subscription lifecycle tracking: free_to_paid, paid_to_free, subscription_renewed, subscription_canceled with revenue impact), SubscriptionEvents (full Stripe event log: created, updated, deleted, payment_succeeded, payment_failed with metadata).

**Feedback Reporting (Admin Only):** Comprehensive feedback analytics dashboard at `/feedback-report` showing:
- Summary statistics: total general feedback, total session ratings, average session rating
- Feedback distribution: by type (general, bug, feature) and category (feature, usability, content, technical, other)
- General feedback table: user info, type, category, rating, description, timestamp
- Session feedback table: user info, star ratings (1-5), optional comments, timestamp
- All data enriched with user information (name, email) for context
- Admin access control using same authorization as Reports and Analytics pages

**Storage Pattern:** Interface-based abstraction, Drizzle with PostgreSQL connection pooling, UUID primary keys.

### Authentication & Authorization

**Freemium Model (Updated February 2025):** Authentication-required freemium with 7-day trial. All users must create an account to access features, improving conversion tracking and lead quality. No anonymous access eliminates abuse and cost overruns while capturing user emails early in the funnel.

**Authentication Flow:**
- All visitors must sign up via Replit Auth (OIDC) to access any features
- Signup process collects email and creates user account immediately
- 7-day free trial begins automatically upon signup (no credit card required)
- Session-based authentication with PostgreSQL session store (`connect-pg-simple`)
- Multi-domain support with strict allowlist (`twangle.org`, `www.twangle.org`, `REPLIT_DOMAINS`)

**Free Trial Access (7 Days, Full Access):**
- All premium features unlocked during trial period
- **Unlimited AI Coach Charles**: Full access to relationship coaching
- **All Assessments**: Complete and save attachment style assessments
- **Retreat Builder**: Create and save personalized retreat itineraries
- **Exercises Library**: Full access to all research-based exercises
- **Date Night Planner**: Generate and save AI date night ideas
- **Weekly Summaries**: Get coaching session summaries and insights

**Pricing Tiers:**
1. **Couples Starter** ($12/month) - Limited saved retreats (3), AI Coach access, basic exercises
2. **Premium Plan** ($20/month) - Unlimited everything, weekly summaries, priority support (POPULAR)
3. **Annual Plan** ($180/year) - All Premium features, save $60/year, 2 months free (BEST VALUE)
4. **Lifetime Access** ($497 one-time) - All features forever, grandfathered pricing

**Landing Page Strategy:**
- "Start your 7-day free trial" messaging replaces "try before signup"
- Clear value propositions: unlimited coaching, saved progress, weekly insights
- No credit card required for trial reduces friction
- Sign-up CTA redirects to `/api/signup` for account creation

**Trial System Implementation:**
- New users automatically receive 7-day trial on signup (no payment method required)
- Trial timestamps (`trialStartedAt`, `trialEndsAt`) set in `upsertUser()` function
- `/api/billing/status` endpoint checks trial expiration server-side
- `usePlan` hook returns `onTrial`, `trialEndsAt`, and `hasAccess` flags
- Trial users get full premium access without Stripe subscription
- After trial expires, paywall appears requiring payment to continue
- Existing users with lifetime access are preserved during authentication

**Trial Progress Tracker System (Conversion Optimization):**
- **Purpose:** Maximize trial-to-paid conversion using loss aversion psychology and value accumulation
- **Backend API** (`/api/trial/progress`): Aggregates user's accumulated value (chat sessions, assessments, retreats, date nights) during trial period
- **Session Tracking:** Multi-message chat conversations correctly tracked as single sessions (Coach.tsx persists `sessionId` across messages)
- **Assessment Counting:** Handles JSONB response objects correctly (`Object.keys()` instead of `.length`)
- **UI Components:**
  - `TrialCountdownBanner`: Global banner showing days remaining with progress bar, visible on all authenticated pages
  - `TrialValueDashboard`: Home page widget displaying accumulated activity metrics (coaching conversations, assessments completed, retreats planned, date nights saved)
  - `TrialExpiringModal`: Urgent conversion modal that triggers when 2 or fewer days remain, showing accumulated value and subscription CTA
- **React Query Configuration:** All trial components use `staleTime: 0`, `refetchOnMount: true`, `refetchOnWindowFocus: true` for real-time data synchronization
- **Conversion Psychology Flow:**
  1. User creates activity (chat, assessment, retreat, date night)
  2. Value accumulates and displays in real-time across all trial UI
  3. Countdown creates urgency as trial progresses
  4. Expiration modal triggers at 2 days with loss aversion messaging
  5. User sees concrete value they'll lose if trial expires without subscribing

**Backend Security:**
- All API endpoints require `isAuthenticated` middleware (no anonymous access)
- Landing page accessible to unauthenticated users via custom `useAuth` queryFn
- No chat message limits during trial or for paid subscribers
- Email verification with SendGrid transactional emails
- IP-based geolocation blocking (Russia, China)

**Email Verification System:** SendGrid for transactional emails, 24-hour expiring tokens. Banner prompts unverified users.

**Newsletter Subscription:** User opt-in/opt-out via Profile page.

**Subscription & Access Control:** Multi-tier pricing with trial-to-paid conversion focus. Premium features gated by `RequirePlan` component during trial expiration. `usePlan` hook provides status to frontend with trial tracking.

**Admin Access Control:** Reports and Analytics features restricted to specific admin emails (e.g., charle.watson@wholewellness-coaching.org). Frontend conditional display, backend `isAdmin` middleware. Analytics dashboard provides revenue metrics (MRR, ARR, total revenue, active subscriptions), conversion funnel analysis (signups → paid conversions with conversion rate and avg time to convert), customer distribution (subscriptions vs. lifetime access), and recent conversion event history.

**Security Considerations:** Host-header validation, HTTPS-only cookies, `connect-pg-simple` session store, Stripe webhook signature verification, IP-based geolocation blocking.

### Build & Deployment

**Development:** `npm run dev` (TSX, Vite).
**Production:** `npm run build` (Vite, esbuild).
**Database Migrations:** `npm run db:push`.

**Production Deployment Configuration:** Requires `OPENAI_API_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLIC_KEY`, and Gmail connection secrets. Optional `REPLIT_DOMAINS` and `FROM_EMAIL`.

## External Dependencies

**Third-Party Services:**
- **OpenAI API**: For AI coaching, assessment analysis, and summarization.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Gmail**: Transactional email service for verification and welcome emails (via Replit integration).
- **ip-api.com**: Free geolocation API for IP lookups and access restrictions.

**Key NPM Packages:**
- **UI/UX**: `@radix-ui/*`, `recharts`, `embla-carousel`.
- **Forms**: `react-hook-form`, `@hookform/resolvers`.
- **Database**: `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`.
- **Date Handling**: `date-fns`.
- **Stripe Integration**: For payment processing and subscription management.