# Twangle - Relationship Coaching Platform

## Overview

Twangle ("Two Tangled Together") is a couples' relationship wellness application that combines psychological assessments, AI-powered coaching, and relationship-building tools. The platform helps couples understand their attachment styles, identify relationship patterns, and receive personalized guidance based on research-backed frameworks including Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The application provides:
- **Attachment Style Assessment**: 10-question comprehensive assessment with AI-powered analysis using OpenAI GPT-4o-mini
  - Questions cover relationship patterns, conflict resolution, intimacy, and emotional regulation
  - AI generates personalized insights including strengths, growth areas, and detailed analysis
  - Results can be shared via unique shareable links with full ownership verification
- **Strengthen Your Connection**: Topic-based question system with AI-generated questions and analysis
  - 8 relationship topics: Communication, Emotional Intimacy, Physical Intimacy, Conflict Resolution, Trust & Security, Shared Goals, Quality Time, Appreciation
  - 5 AI-generated questions per topic (dynamically created using GPT-4o-mini based on topic and relationship science)
  - AI-powered analysis generates personalized summaries, insights, and recommendations
  - Progress tracking and response history with partner sharing capability
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
- ConnectionQuestions: Topic-based question flow with multi-step wizard and AI analysis trigger
- ConnectionInsights: AI-generated insights and recommendations display with summary cards
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
- **POST `/api/connection/seed`** - Initialize connection topics (idempotent)
- **GET `/api/connection/topics`** - Retrieve all connection topics
- **GET `/api/connection/topics/:id/questions`** - Get/generate AI questions for specific topic with response status (generates 5 questions on first request using GPT-4o-mini)
- **POST `/api/connection/responses`** - Save user response to question
- **POST `/api/connection/analyze/:topicId`** - AI analysis of topic responses (3-10 seconds)
- **GET `/api/connection/summaries`** - Retrieve AI-generated summaries with optional topic filter
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
- **ConnectionTopics**: 8 relationship topics with icon, name, description, and ordering
- **ConnectionQuestions**: AI-generated questions (5 per topic, dynamically created using GPT-4o-mini on first topic access)
- **ConnectionResponses**: User responses to questions with sharing capability and timestamps
- **ConnectionSummaries**: AI-generated analysis with summary text, insights array (text[]), and recommendations array (text[])

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

### October 3, 2025 - AI-Generated Connection Questions
- **Pivoted from static to AI-generated questions**:
  - Changed from 40 curated static questions to dynamic AI generation using GPT-4o-mini
  - Questions now generated on-demand when user first selects a topic (3-10 second generation time)
  - Research-backed prompts ensure questions align with Gottman Method, EFT, and Attachment Theory
  - Questions cached per topic for performance on subsequent visits
- **Backend changes**:
  - Updated GET /api/connection/topics/:id/questions to generate questions with OpenAI if none exist
  - Seed endpoint now only initializes topics (POST /api/connection/seed)
  - Questions stored in database after generation for reuse
- **Database**: Cleared static questions; all questions now AI-generated and topic-specific
- **Testing**: End-to-end test passed - AI question generation, response saving, and navigation all working

### October 3, 2025 - Strengthen Your Connection Feature (Complete)
- **Full implementation of topic-based relationship question system**:
  - 8 relationship topics: Communication, Emotional Intimacy, Physical Intimacy, Conflict Resolution, Trust & Security, Shared Goals, Quality Time, Appreciation
  - Multi-step wizard interface with progress tracking and navigation
  - AI-powered analysis using GPT-4o-mini for personalized insights and recommendations
- **Database schema**: 4 new tables (connection_topics, connection_questions, connection_responses, connection_summaries)
  - Fixed schema alignment: insights and recommendations use text[] arrays (not JSONB)
  - Idempotent seed endpoint for safe initialization
- **Backend API**: 6 new endpoints for topics, questions, responses, AI analysis, and summaries
- **Frontend components**: ConnectionQuestions.tsx (multi-step wizard) and ConnectionInsights.tsx (results display)
  - Fixed apiRequest argument order: (method, url, data)
  - Navigation from Home.tsx and WelcomeHero
  - Real-time progress tracking and response persistence