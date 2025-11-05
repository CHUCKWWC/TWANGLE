# Twangle - Relationship Coaching Platform

## Overview

Twangle is a couples' relationship wellness platform designed to provide psychological assessments, AI-powered coaching, and relationship-building tools. It aims to help couples understand attachment styles, identify relationship patterns, and offer personalized guidance based on established therapeutic frameworks. Key features include an AI relationship coach, an Attachment Style Assessment, a library of research-based exercises, a DIY couples retreat builder, and an AI-powered date night planner. The platform's core purpose is to foster healthier relationships through personalized, data-driven insights and interactive tools, maximizing user sign-ups and trial-to-paid conversions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, utilizing Vite, Wouter for routing, and TanStack Query for server state management. UI components are developed with Shadcn/ui, Radix UI primitives, and Tailwind CSS, following a warm, organic aesthetic with a responsive mobile-first design. Key UI elements include a Dashboard, AI Coach Chat, Retreat Builder, Date Night Planner, Exercises Library, and various engagement features like a Relationship Health Score, Partner Connection System, AI-Powered Relationship Journal, and Daily Conversations. Conversion optimization features include Social Proof Statistics, an Exit Intent Popup, a Comparison Table, and an Interactive Coach Demo. SEO is implemented with dynamic meta tags, Open Graph, Twitter Cards, and JSON-LD structured data.

### Backend

The backend is an Express.js application on Node.js with TypeScript, providing RESTful APIs for core functionalities such as chat, planning, assessments, billing, and reporting. API security includes JSON request/response validation, ownership verification, and IP-based rate limiting for anonymous endpoints. An AI Coach ("Coach Charles") uses strict system prompts to provide relationship-only advice. AI integration leverages OpenAI GPT for coaching, planning, and assessment analysis, using streaming responses and Zod-validated structured JSON.

### Data Storage

PostgreSQL, managed via Neon serverless and Drizzle ORM, serves as the primary database. It stores comprehensive data models for users, subscriptions, chat sessions, assessments, and engagement features like Health Scores, Journal Entries, and Conversation Responses.

### Authentication & Authorization

Twangle uses a custom email/password authentication system built with Passport.js and bcrypt. It supports a freemium model with a 7-day free trial that automatically starts upon registration. The platform offers various pricing tiers, including individual, couple, annual, and lifetime access plans. Authentication features include PostgreSQL-backed session management, token-based password reset, email verification, and IP-based geolocation blocking.

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