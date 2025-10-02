# Twangle - Relationship Coaching Platform

## Overview

Twangle ("Two Tangled Together") is a couples' relationship wellness application that combines psychological assessments, AI-powered coaching, and relationship-building tools. The platform helps couples understand their attachment styles, identify relationship patterns, and receive personalized guidance based on research-backed frameworks including Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory.

The application provides:
- Interactive attachment style assessments
- AI relationship coach (Coach Charles) powered by OpenAI
- Research-based relationship exercises library
- DIY couples retreat builder with timeline scheduling
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
- RetreatBuilder: Multi-step retreat planning wizard with timeline generation
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
- GET `/api/user/eligibility` - Check user eligibility for lifetime access
- POST `/api/feedback/general` - Submit user feedback (with Zod validation)
- Session management for chat continuity
- JSON request/response format with proper validation and error handling

**AI Integration:**
- OpenAI GPT integration for relationship coaching
- Custom system prompt defining Coach Charles persona with:
  - Research-backed methodologies (Gottman, EFT, Attachment Theory)
  - Christian-informed values without explicit religious messaging
  - Mobile-optimized response formatting
- Streaming responses for real-time chat experience

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