# Twangle - Relationship Coaching Platform

## Overview

Twangle is a couples' relationship wellness application that offers psychological assessments, AI-powered coaching, and relationship-building tools. It helps couples understand attachment styles, identify relationship patterns, and provides personalized guidance based on frameworks like Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The platform includes:
- An Attachment Style Assessment with AI analysis.
- An AI relationship coach ("Coach Charles").
- A library of research-based relationship exercises.
- A DIY couples retreat builder with AI-generated itineraries.
- An AI-powered Date Night planner.
- Weekly coaching session summaries.
- A user feedback system.
- Comprehensive access and usage reporting.
- Growth intelligence platform with conversion tracking, revenue analytics, and subscription lifecycle monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:** React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for server state.

**UI Component System:** Shadcn/ui with Radix UI primitives, Tailwind CSS, custom theme (light/dark modes), responsive mobile-first design.

**Design System:** Typography (Poppins, Inter, Quicksand), warm rose/mauve and terracotta color palette, warm/organic aesthetic, progressive intimacy model.

**Key UI Components:** Dashboard, AppHeader with feature badges, EmailVerificationBanner, Profile, AssessmentQuestion, AttachmentResults (Recharts), AICoachChat, RetreatBuilder (multi-step wizard with vision planning), RetreatItinerary (AI-generated with framework citations), DateNightPlanner, ExercisesLibrary, WeeklySummaries, FeedbackForm, RequirePlan (premium feature gate), Paywall (Stripe hosted), SubscriptionCheckout (custom form), Reports, Analytics (revenue dashboard with MRR/ARR, conversion funnel, customer distribution), FeatureCard (auth-aware navigation), SEO (dynamic meta tags), StructuredData (JSON-LD schemas), CoachCredentials (E-E-A-T compliance).

**SEO Implementation:** Comprehensive SEO system with dynamic meta tags (title, description, keywords), Open Graph and Twitter Card support, JSON-LD structured data (Organization, Service, Person, FAQ, Breadcrumb schemas), FAQ page optimized for featured snippets, and author credentials for E-E-A-T compliance. All major pages (Landing, Coach, Assessment, Retreat, Exercises, DateNight, Summaries) include unique, keyword-optimized metadata.

### Backend Architecture

**Server Framework:** Express.js on Node.js with TypeScript (ESM).

**API Design:** RESTful endpoints (`/api`) for chat, retreat/date night planning, user eligibility, feedback, attachment assessments, billing (Stripe), reporting, analytics (revenue metrics, conversion funnel, subscription/conversion events), admin functions, email verification, and newsletter subscriptions. Enhanced Stripe webhook handler (`/webhooks/stripe`) tracks full subscription lifecycle (checkout, renewals, cancellations, payment events) and writes conversion events (free_to_paid, paid_to_free, subscription_renewed, subscription_canceled) and subscription events (created, updated, deleted, payment_succeeded, payment_failed). JSON request/response with validation. Ownership verification on protected resources. Access logging with IP geolocation. Click-to-feature redirect flow.

**AI Integration:** OpenAI GPT for coaching, retreat/date night planning, and attachment analysis. Custom system prompts for AI personas. Streaming responses for chat. Structured JSON responses with Zod validation for attachment analysis.

### Data Storage Solutions

**Database:** PostgreSQL via Neon serverless, Drizzle ORM for type-safe queries, schema-first design with Zod validation.

**Data Models:** Users (authentication, lifetime access, Stripe ID, email verification, newsletter), Subscriptions (Stripe details), ChatSessions, WeeklySummaries, GeneralFeedback, SessionFeedback, RelationshipProgress, RetreatItineraries (with vision planning), DateNights, Assessments (responses, AI results, share tokens), AccessLogs (IP, geolocation), ConversionEvents (subscription lifecycle tracking: free_to_paid, paid_to_free, subscription_renewed, subscription_canceled with revenue impact), SubscriptionEvents (full Stripe event log: created, updated, deleted, payment_succeeded, payment_failed with metadata).

**Storage Pattern:** Interface-based abstraction, Drizzle with PostgreSQL connection pooling, UUID primary keys.

### Authentication & Authorization

**Current Implementation:** Replit Auth (OIDC) with dynamic domain registration. Session-based authentication. User tracking with lifetime access. All API endpoints protected.

**Multi-Domain Authentication:** Dynamic OIDC supports multiple deployment domains. Strict domain allowlist (`twangle.org`, `www.twangle.org`, `REPLIT_DOMAINS`).

**Click-to-Feature Redirect Flow:** Landing page components detect auth/feature type. Free features allow direct navigation. Premium features redirect anonymous users to `/api/login?returnTo=<destination>` which validates the `returnTo` URL.

**Email Verification System:** SendGrid for transactional emails, 24-hour expiring tokens. Banner prompts unverified users.

**Newsletter Subscription:** User opt-in/opt-out via Profile page.

**Subscription & Access Control:** Two-tier (Free/Premium). Premium features gated by `RequirePlan` component, requiring active subscription or lifetime access. `usePlan` hook provides status to frontend.

**Admin Access Control:** Reports and Analytics features restricted to specific admin emails (e.g., charle.watson@wholewellness-coaching.org). Frontend conditional display, backend `isAdmin` middleware. Analytics dashboard provides revenue metrics (MRR, ARR, total revenue, active subscriptions), conversion funnel analysis (signups → paid conversions with conversion rate and avg time to convert), customer distribution (subscriptions vs. lifetime access), and recent conversion event history.

**Security Considerations:** Host-header validation, HTTPS-only cookies, `connect-pg-simple` session store, Stripe webhook signature verification, IP-based geolocation blocking (Russia, China).

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