# Twangle - Relationship Coaching Platform

## Overview

Twangle ("Two Tangled Together") is a couples' relationship wellness application that combines psychological assessments, AI-powered coaching, and relationship-building tools. The platform helps couples understand their attachment styles, identify relationship patterns, and receive personalized guidance based on research-backed frameworks including Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The application provides:
- **Attachment Style Assessment**: 10-question comprehensive assessment with AI-powered analysis using OpenAI GPT-4o-mini
  - Questions cover relationship patterns, conflict resolution, intimacy, and emotional regulation
  - AI generates personalized insights including strengths, growth areas, and detailed analysis
  - Results can be shared via unique shareable links with full ownership verification
- AI relationship coach (Coach Charles) powered by OpenAI
- Research-based relationship exercises library
- DIY couples retreat builder with timeline scheduling and AI-generated itineraries
- Weekly coaching session summaries
- User feedback system with lifetime access incentive (first 100 users)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React 18 with TypeScript for type safety
- Vite as build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management

**UI Component System:**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Custom theme system supporting light/dark modes
- Responsive design with mobile-first approach

**Design System:**
- Typography: Poppins (headings), Inter (body), Quicksand (accents)
- Color palette: Warm rose/mauve primary (HSL: 340 45% 55%), terracotta secondary
- Warm, organic aesthetic prioritizing emotional safety over clinical appearance
- Progressive intimacy model - UI deepens as user engagement increases

**Key UI Components:**
- WelcomeHero: Full-screen landing with hero image
- AssessmentQuestion: Multi-step questionnaire interface with progress tracking
- AttachmentResults: Visualization of attachment scores using Recharts pie charts
- AICoachChat: Real-time chat interface with message history and suggested prompts
- RetreatBuilder: Multi-step retreat planning wizard with location/date collection and AI itinerary generation
- RetreatItinerary: Dedicated page displaying personalized AI-generated retreat plans with local recommendations
- ExercisesLibrary: Accordion-based exercise browser with categorization
- WeeklySummaries: Session summary viewer with action items
- FeedbackForm: User feedback collection with lifetime access incentive banner

### Backend Architecture

**Server Framework:**
- Express.js on Node.js
- TypeScript for type safety across frontend/backend
- ESM module system

**API Design:**
- RESTful endpoints under `/api` prefix
- POST `/api/chat` - OpenAI streaming chat completions
- POST `/api/retreat/generate-itinerary` - Generate AI-powered personalized retreat itinerary
- GET `/api/retreat/itineraries` - Retrieve user's saved retreat itineraries
- GET `/api/retreat/itinerary/:id` - Retrieve specific retreat itinerary with access control
- GET `/api/user/eligibility` - Check user eligibility for lifetime access
- POST `/api/feedback/general` - Submit user feedback (with Zod validation)
- **POST `/api/assessments`** - Create new attachment assessment with user responses
- **POST `/api/assessments/:id/analyze`** - AI analysis of assessment using GPT-4o-mini (3-10 seconds)
- **POST `/api/assessments/:id/share`** - Generate shareable link with ownership verification
- **GET `/api/shared/:shareToken`** - Public endpoint to view shared assessment results
- Session management for chat continuity
- JSON request/response format with proper validation and error handling
- Ownership verification on all protected resources

**AI Integration:**
- OpenAI GPT integration for relationship coaching, retreat planning, and attachment analysis
- Custom system prompts for different use cases:
  - Coach Charles persona for conversational coaching with research-backed methodologies
  - Retreat itinerary generation with personalized recommendations based on preferences
  - **Attachment theory expert persona** for analyzing assessment responses with JSON-structured output
  - Christian-informed values without explicit religious messaging
  - Mobile-optimized response formatting
- Streaming responses for real-time chat experience
- **Structured JSON responses** for attachment analysis with Zod validation (primaryStyle, stylePercentages, description, strengths, growthAreas, analysis)

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless
- Drizzle ORM for type-safe database queries
- Schema-first design with Zod validation

**Data Models:**
- Users: Authentication with Replit Auth, includes hasLifetimeAccess and userNumber fields
- ChatSessions: Tracking conversation threads with message counts and timestamps
- WeeklySummaries: AI-generated session summaries with action items array
- GeneralFeedback: User feedback submissions with type, category, description, and rating
- SessionFeedback: Session-specific feedback ratings
- RelationshipProgress: Weekly relationship score tracking
- RetreatItineraries: Stored retreat configurations and AI-generated itineraries with location/date details
- **Assessments**: Attachment style assessments with user responses (JSONB), AI-generated results, share tokens, and ownership tracking
  - Responses stored as question-answer pairs
  - AI analysis includes: primaryStyle, stylePercentages (4 attachment types), description, strengths array, growthAreas array, detailed analysis
  - Sharing enabled via unique UUID tokens with isShared flag and ownership verification

**Storage Pattern:**
- Interface-based storage abstraction (IStorage)
- MemStorage implementation for development/testing
- Production uses Drizzle with PostgreSQL connection pooling
- UUID primary keys generated at database level

### Authentication & Authorization

**Current Implementation:**
- Replit Auth (OIDC-based authentication)
- Session-based authentication with isAuthenticated middleware
- User tracking with lifetime access feature for first 100 feedback submitters
- All API endpoints protected with authentication

**Security Considerations:**
- HTTPS-only cookies planned
- Session store using connect-pg-simple for PostgreSQL
- Password hashing not yet implemented (requires bcrypt/argon2)

### External Dependencies

**Third-Party Services:**
- **OpenAI API**: GPT chat completions for AI coaching functionality
  - Requires OPENAI_API_KEY environment variable
  - Used for conversational coaching and session summarization

- **Neon Database**: Serverless PostgreSQL hosting
  - Requires DATABASE_URL environment variable
  - Provides scalable database with connection pooling

**Key NPM Packages:**
- **UI/UX**: @radix-ui/* components, recharts for data visualization, embla-carousel
- **Forms**: react-hook-form with @hookform/resolvers for validation
- **Database**: drizzle-orm, drizzle-zod, @neondatabase/serverless
- **Development**: vite, tsx for dev server, esbuild for production builds
- **Date Handling**: date-fns for timestamp formatting

**Build & Deployment:**
- Development: `npm run dev` - TSX watches server, Vite serves client
- Production: `npm run build` - Vite bundles client, esbuild bundles server
- Database Migrations: `npm run db:push` - Drizzle schema push to PostgreSQL

**Environment Requirements:**
- Node.js with ESM support
- Environment variables: DATABASE_URL, OPENAI_API_KEY
- PostgreSQL database (recommended: Neon serverless)

## Recent Changes

### October 3, 2025 - Comprehensive Attachment Assessment System
- **Complete rebuild of attachment assessment feature**:
  - Created 10-question assessment covering relationship patterns, conflict resolution, intimacy, and emotional regulation
  - Implemented AI-powered analysis using OpenAI GPT-4o-mini with specialized attachment theory prompt
  - Added secure sharing functionality with full UUID tokens and ownership verification
  - Enhanced results display with AI-generated strengths, growth areas, and personalized analysis
- **Database schema**: Added assessments table with responses (JSONB), results, share tokens, and userId for ownership
- **Backend API**: 4 new endpoints for assessment creation, AI analysis, sharing, and public shared view
- **Frontend components**: Updated Home.tsx flow, enhanced AttachmentResults with AI insights and sharing UI
- **Security**: Ownership verification on share endpoint, authenticated-only assessment creation, full UUID share tokens
- **Testing**: End-to-end test passed covering complete flow from assessment to AI analysis to sharing