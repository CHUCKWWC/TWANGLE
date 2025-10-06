# Twangle - Relationship Coaching Platform

## Overview

Twangle ("Two Tangled Together") is a couples' relationship wellness application that combines psychological assessments, AI-powered coaching, and relationship-building tools. The platform helps couples understand their attachment styles, identify relationship patterns, and receive personalized guidance based on research-backed frameworks including Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The application provides:
- Attachment Style Assessment: 20-question comprehensive assessment with AI-powered analysis.
- AI relationship coach (Coach Charles).
- Research-based relationship exercises library.
- DIY couples retreat builder with AI-generated itineraries.
- Weekly coaching session summaries.
- User feedback system with lifetime access incentive.

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
- Dashboard: Shows user progress, stats, quick action cards, and next steps.
- AssessmentQuestion: Multi-step questionnaire with progress tracking.
- AttachmentResults: Visualization of attachment scores using Recharts.
- AICoachChat: Real-time chat interface.
- RetreatBuilder: Multi-step retreat planning wizard.
- RetreatItinerary: Displays personalized AI-generated retreat plans.
- ExercisesLibrary: Accordion-based exercise browser.
- WeeklySummaries: Session summary viewer.
- FeedbackForm: User feedback collection.

### Backend Architecture

**Server Framework:**
- Express.js on Node.js with TypeScript.
- ESM module system.

**API Design:**
- RESTful endpoints under `/api` prefix.
- Endpoints for chat, retreat itinerary generation/retrieval, user eligibility, feedback, and attachment assessments (create, analyze, share, view shared).
- Session management for chat continuity.
- JSON request/response format with validation and error handling.
- Ownership verification on protected resources.

**AI Integration:**
- OpenAI GPT integration for relationship coaching, retreat planning, and attachment analysis.
- Custom system prompts for Coach Charles persona, retreat itinerary generation, and attachment theory expert analysis.
- Streaming responses for real-time chat.
- Structured JSON responses for attachment analysis with Zod validation.

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless.
- Drizzle ORM for type-safe queries.
- Schema-first design with Zod validation.

**Data Models:**
- Users: Authentication, lifetime access.
- ChatSessions: Conversation threads.
- WeeklySummaries: AI-generated session summaries.
- GeneralFeedback: User feedback.
- SessionFeedback: Session-specific feedback ratings.
- RelationshipProgress: Weekly relationship score tracking.
- RetreatItineraries: Stored retreat configurations and AI-generated itineraries.
- Assessments: Attachment style assessments with user responses (JSONB), AI-generated results, share tokens, and ownership tracking.

**Storage Pattern:**
- Interface-based storage abstraction.
- Production uses Drizzle with PostgreSQL connection pooling.
- UUID primary keys.

### Authentication & Authorization

**Current Implementation:**
- Replit Auth (OIDC-based).
- Session-based authentication with `isAuthenticated` middleware.
- User tracking with lifetime access feature.
- All API endpoints protected with authentication.

**Security Considerations:**
- HTTPS-only cookies planned.
- Session store using `connect-pg-simple`.

### Build & Deployment

- Development: `npm run dev` (TSX watches server, Vite serves client).
- Production: `npm run build` (Vite bundles client, esbuild bundles server).
- Database Migrations: `npm run db:push`.

**Environment Requirements:**
- Node.js with ESM support.
- Environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, `VITE_STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- PostgreSQL database.

## External Dependencies

**Third-Party Services:**
- **OpenAI API**: GPT chat completions for AI coaching, assessment analysis, and summarization.
- **Neon Database**: Serverless PostgreSQL hosting.
- **ip-api.com**: Free geolocation API for IP address lookups and geographic access restrictions (blocking Russia and China).

**Key NPM Packages:**
- **UI/UX**: `@radix-ui/*` components, `recharts`, `embla-carousel`.
- **Forms**: `react-hook-form` with `@hookform/resolvers`.
- **Database**: `drizzle-orm`, `drizzle-zod`, `@neondatabase/serverless`.
- **Development**: `vite`, `tsx`, `esbuild`.
- **Date Handling**: `date-fns`.
- **Stripe Integration**: For payment processing and subscription management via hosted pricing table and webhooks.