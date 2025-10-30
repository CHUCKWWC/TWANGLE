# Twangle - Relationship Coaching Platform

## Overview

Twangle ("Two Tangled Together") is a couples' relationship wellness application that combines psychological assessments, AI-powered coaching, and relationship-building tools. The platform helps couples understand their attachment styles, identify relationship patterns, and receive personalized guidance based on research-backed frameworks including Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The application provides:
- Attachment Style Assessment: 20-question comprehensive assessment with AI-powered analysis.
- AI relationship coach (Coach Charles).
- Research-based relationship exercises library.
- DIY couples retreat builder with AI-generated itineraries.
- AI-powered Date Night planner with personalized recommendations.
- Weekly coaching session summaries.
- User feedback system with lifetime access incentive.
- Comprehensive access and usage reporting with geographic tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React 18 with TypeScript.
- Vite as build tool.
- Wouter for client-side routing.
- TanStack Query for server state management.

**UI Component System:**
- Shadcn/ui with Radix UI primitives.
- Tailwind CSS for styling.
- Custom theme system supporting light/dark modes.
- Responsive design with mobile-first approach.

**Design System:**
- Typography: Poppins (headings), Inter (body), Quicksand (accents).
- Color palette: Warm rose/mauve primary (HSL: 340 45% 55%), terracotta secondary.
- Warm, organic aesthetic prioritizing emotional safety.
- Progressive intimacy model.

**Key UI Components:**
- Dashboard: Shows user progress, stats, quick action cards with FREE/PREMIUM badges, and next steps.
- AppHeader: Navigation with FREE/PREMIUM badges on feature links for clear subscription messaging.
- EmailVerificationBanner: Alert banner for unverified users with "Send Verification Email" button. Shows on Home and Profile pages for authenticated users who haven't verified their email.
- Profile: User profile page showing email verification status, newsletter subscription toggle, account info, and activity stats.
- AssessmentQuestion: Multi-step questionnaire with progress tracking.
- AttachmentResults: Visualization of attachment scores using Recharts.
- AICoachChat: Real-time chat interface.
- RetreatBuilder: Multi-step retreat planning wizard with vision planning capabilities.
- VisionPlanning: Multiple-choice future planning component with timeline selections (6mo, 1yr, 5yr, 10yr) and life dimension buttons (financial, intimacy, health, career, business, spiritual, ministry, family, personal, community, legacy). Uses safe spreading pattern `...(value || {})` to prevent runtime errors on first selection.
- RetreatItinerary: Displays personalized AI-generated retreat plans incorporating vision and goals with explicit framework citations (Gottman Method, EFT, Attachment Theory).
- DateNightPlanner: AI-powered date night planning form with customizable preferences.
- ExercisesLibrary: Accordion-based exercise browser.
- WeeklySummaries: Session summary viewer.
- FeedbackForm: User feedback collection.
- RequirePlan: Premium feature gate component with upgrade prompts.
- Paywall: Stripe hosted pricing table for subscription purchases.
- SubscriptionCheckout: Custom payment form with individual card input fields for card number, expiration, and CVC. Supports browser autofill with proper spacing to prevent overlap.
- Reports: Comprehensive access and usage analytics with charts and geographic distribution.

### Backend Architecture

**Server Framework:**
- Express.js on Node.js with TypeScript.
- ESM module system.

**API Design:**
- RESTful endpoints under `/api` prefix.
- Endpoints for chat, retreat itinerary generation/retrieval, date night plan generation/retrieval, user eligibility, feedback, and attachment assessments (create, analyze, share, view shared).
- Billing endpoints: `/api/billing/status` (subscription status), `/api/billing/checkout` (create Stripe session), `/api/billing/portal` (customer portal).
- Reporting endpoints: `/api/reports/access-logs`, `/api/reports/access-stats-country`, `/api/reports/access-stats-user`, `/api/reports/access-summary` (all authenticated).
- Admin endpoints: `/api/admin/grant-access` (POST, admin-only endpoint to grant lifetime access to test accounts by email).
- Email verification endpoints: `/api/send-verification-email` (POST, authenticated - sends verification email with token), `/api/verify-email` (GET, public - verifies token and marks email as verified, redirects to home).
- Newsletter endpoints: `/api/newsletter/subscribe` (POST, authenticated), `/api/newsletter/unsubscribe` (POST, authenticated).
- Webhook handler: `/webhooks/stripe` for subscription events (checkout completed, subscription created/updated/deleted).
- Session management for chat continuity.
- JSON request/response format with validation and error handling.
- Ownership verification on protected resources.
- Access logging middleware captures user access with IP geolocation on authenticated endpoints.

**AI Integration:**
- OpenAI GPT integration for relationship coaching, retreat planning, date night planning, and attachment analysis.
- Custom system prompts for Coach Charles persona, retreat itinerary generation, date night recommendations, and attachment theory expert analysis.
- Streaming responses for real-time chat.
- Structured JSON responses for attachment analysis with Zod validation.

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless.
- Drizzle ORM for type-safe queries.
- Schema-first design with Zod validation.

**Data Models:**
- Users: Authentication, lifetime access, Stripe customer ID, email verification status (emailVerified, emailVerificationToken, emailVerificationExpires), newsletter subscription preference (newsletterSubscribed).
- Subscriptions: Stripe subscription details (subscription ID, price ID, plan tier, status, period end, cancellation status).
- ChatSessions: Conversation threads.
- WeeklySummaries: AI-generated session summaries.
- GeneralFeedback: User feedback.
- SessionFeedback: Session-specific feedback ratings.
- RelationshipProgress: Weekly relationship score tracking.
- RetreatItineraries: Stored retreat configurations, vision planning data (timelines and life dimensions), and AI-generated itineraries.
- DateNights: AI-generated date night plans with user preferences (budget, vibe, duration, location, interests, dietary restrictions, transportation, special occasion).
- Assessments: Attachment style assessments with user responses (JSONB), AI-generated results, share tokens, and ownership tracking.
- AccessLogs: User access tracking with IP address, geolocation data (country, city, region), user agent, path, and access type (authenticated/anonymous).

**Storage Pattern:**
- Interface-based storage abstraction.
- Production uses Drizzle with PostgreSQL connection pooling.
- UUID primary keys.

### Authentication & Authorization

**Current Implementation:**
- Replit Auth (OIDC-based) with dynamic domain strategy registration.
- Session-based authentication with `isAuthenticated` middleware.
- User tracking with lifetime access feature.
- All API endpoints protected with authentication.

**Multi-Domain Authentication:**
- Dynamic OIDC strategy registration supports multiple deployment domains.
- Strict domain allowlist prevents host-header injection attacks.
- Allowed domains: `twangle.org`, `www.twangle.org`, and domains listed in `REPLIT_DOMAINS` environment variable.
- Unauthorized domain login attempts return 403 with logging for security monitoring.
- Production domain (twangle.org) hardcoded in allowlist for reliable deployment.

**Email Verification System:**
- SendGrid integration for transactional verification emails.
- 24-hour expiring verification tokens stored in database.
- EmailVerificationBanner prompts unverified users on Home and Profile pages.
- Verification flow: Send email → Click link → Email verified → Welcome email sent.
- Database fields: `emailVerified`, `emailVerificationToken`, `emailVerificationExpires`.

**Newsletter Subscription:**
- User-controlled newsletter opt-in/opt-out via Profile page toggle.
- API endpoints: `/api/newsletter/subscribe`, `/api/newsletter/unsubscribe`.
- Database field: `newsletterSubscribed` (0/1 integer flag).

**Subscription & Access Control:**
- Two-tier system: Free and Premium.
- Premium features gated using `RequirePlan` component.
- Access granted via active subscription (status: 'active' or 'trialing') OR lifetime access flag.
- Free features: Attachment assessments, exercises library, date night planner.
- Premium pages: Coach (AI coaching), Retreat (DIY retreat builder), Summaries (weekly summaries).
- `usePlan` hook provides subscription status to frontend components.

**Admin Access Control:**
- Reports feature restricted to specific admin emails only.
- Admin whitelist includes: charle.watson@wholewellness-coaching.org, charles.watson@wholewellness-coaching.org, charles.watsn@gmail.com.
- Frontend: Reports link conditionally shown in AppHeader, access denied UI on Reports page for non-admins.
- Backend: isAdmin middleware protects all /api/reports/* endpoints with 403 responses for unauthorized users.

**Security Considerations:**
- Host-header validation on all authentication endpoints.
- HTTPS-only cookies in production.
- Session store using `connect-pg-simple` with PostgreSQL.
- Stripe webhook signature verification for subscription events.
- IP-based geolocation blocking for restricted countries (Russia, China).

### Build & Deployment

- Development: `npm run dev` (TSX watches server, Vite serves client).
- Production: `npm run build` (Vite bundles client, esbuild bundles server).
- Database Migrations: `npm run db:push`.

**Production Deployment Configuration:**

**Required Secrets (must be set in Deployment settings):**
1. **OPENAI_API_KEY** - Required for AI coaching, attachment analysis, retreat planning
   - Get from: https://platform.openai.com/api-keys
   - Used by: Coach Charles, attachment assessments, retreat itineraries
   
2. **DATABASE_URL** - PostgreSQL connection string
   - Automatically provided by Replit database integration
   - Format: `postgresql://user:password@host:port/database`
   
3. **STRIPE_SECRET_KEY** - Stripe payment processing
   - Get from: Stripe Dashboard → Developers → API Keys
   - Used for: Subscription checkout, customer portal, webhook verification
   
4. **STRIPE_WEBHOOK_SECRET** - Stripe webhook signature verification
   - Get from: Stripe Dashboard → Developers → Webhooks
   - Used for: Secure webhook event processing
   
5. **VITE_STRIPE_PUBLIC_KEY** - Stripe frontend integration
   - Get from: Stripe Dashboard → Developers → API Keys (publishable key)
   - Used by: Frontend checkout form
   
6. **SENDGRID_API_KEY** - Email verification and welcome emails
   - Automatically provided by SendGrid integration
   - Used for: Transactional email delivery

**Optional Secrets:**
- **REPLIT_DOMAINS** - Comma-separated list of allowed authentication domains
  - Default: `twangle.org` and `www.twangle.org` are hardcoded
  - Add development/staging domains if needed
  - Example: `twangle.org,staging.twangle.org`

**Environment Variables (auto-provided by Replit):**
- `REPL_ID` - Replit workspace identifier (required for OIDC)
- `ISSUER_URL` - OIDC issuer URL (defaults to https://replit.com/oidc)
- `SESSION_SECRET` - Session encryption key (auto-generated)
- `NODE_ENV` - Set to `production` in deployment

**Deployment Steps:**
1. Go to Deployments pane in Replit
2. Click "Secrets" or "Environment Variables"
3. Add all required secrets listed above
4. Deploy or redeploy the application
5. Verify logs show no missing secret errors

**Common Deployment Issues:**
- **"Missing OpenAI API key"** → Add OPENAI_API_KEY secret
- **"Unknown authentication strategy"** → REPLIT_DOMAINS not configured (should auto-resolve with hardcoded domains)
- **Database connection error** → DATABASE_URL not set
- **Stripe errors** → Check all three Stripe secrets are configured

## External Dependencies

**Third-Party Services:**
- **OpenAI API**: GPT chat completions for AI coaching, assessment analysis, and summarization.
- **Neon Database**: Serverless PostgreSQL hosting.
- **SendGrid**: Transactional email service for verification emails and welcome emails. Connected via Replit integration.
- **ip-api.com**: Free geolocation API for IP address lookups and geographic access restrictions (blocking Russia and China).

**Key NPM Packages:**
- **UI/UX**: `@radix-ui/*` components, `recharts`, `embla-carousel`.
- **Forms**: `react-hook-form` with `@hookform/resolvers`.
- **Database**: `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`.
- **Development**: `vite`, `tsx`, `esbuild`.
- **Date Handling**: `date-fns`.
- **Stripe Integration**: For payment processing and subscription management via hosted pricing table and webhooks.