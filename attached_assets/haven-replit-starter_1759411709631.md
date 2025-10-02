# Haven — AI-Powered Couples Retreat Planner (Replit Starter)

**Goal:** Ship a mobile-first web app (PWA) that plans personalized DIY couples retreats. This starter gives you a working scaffold optimized for Replit: a Vite React (TypeScript) front end and a small Node/Express API for secure server-side calls to OpenAI and Supabase. It includes schema, RLS, and seed content packs.

## TL;DR — Run on Replit
1. Create a new Repl (Node.js) and upload this zip, then extract to the project root.
2. In the Replit Secrets panel, add:
   - `OPENAI_API_KEY` = your key
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE` = your service role key (server only; never in client)
   - `SUPABASE_ANON_KEY` = your anon public key (client ok)
3. In the shell:
   ```bash
   npm run setup
   npm run dev
   ```
   The dev script runs both web and server concurrently. Open the web preview URL.

4. Apply Supabase schema & RLS (see **Supabase Setup** below).

---

## Why this stack (for fastest adoption)
- **PWA over native first**: Mobile-first web deploys instantly, works offline, installable as “app” on phones. Adds no App Store friction while you validate demand.
- **Hyper-personalization** via AI planner + attachment-informed rules.
- **Privacy-first**: end-to-end mindset; journals shared only on explicit consent.
- **Offline-first**: retreat packs cache assets so the weekend flows without Wi‑Fi.
- **Quick iterate**: Vite + React + Tailwind + Express keep ship velocity high.

---

## Product Defaults (answered for market fit)
- **Intimacy content:** **Opt-in pack**, off by default in MVP; reduces friction while signaling maturity.
- **Content lanes:** Launch **secular default**; add **faith-based pack** at V1 as opt-in market segment (increases TAM without alienating either audience).
- **Payment model:** **Freemium** (free first retreat plan + core library). **Paid “Retreat Packs”** ($9–$29) and **Plus subscription** ($7–$12/mo) unlock advanced content, offline packs, and post-retreat 90-day plans. This balances low CAC and recurring revenue.
- **Platform:** **Mobile-first PWA** (now), optional native wrappers later if needed.
- **Biometrics:** **Optional** to open private journals (device-supported). Defaults off.
- **Analytics:** **Aggregate, privacy-preserving, opt-in** on onboarding; no ad SDKs.
- **AI transparency:** Each activity shows a short “Why it works” card with sources (Gottman/EFT/Attachment Theory—non-diagnostic).

---

## Supabase Setup
1. Create a project; copy `supabase/schema.sql` and run it in SQL editor.
2. Enable RLS on the listed tables (included in `schema.sql` and `rls.sql`). Apply both files.
3. In **Storage**, create a `packs` bucket for retreat assets (optional for MVP).
4. In **Auth**, enable email magic link (or OAuth later).

**Tables (high level)**: users, dyads, dyad_members, pacts, journals, checkins, plans, events.
**Row-Level Security** ensures each pair’s data is private by default; shared notes require explicit partner approval stored in a consent ledger.

---

## Scripts
- `npm run setup` installs root, web, and server deps.
- `npm run dev` runs web on 5173 and server on 8787 (adjust in `.replit` if desired).
- `npm run build` builds the web app; server is TS compiled to `server/dist`.

---

## Folder Structure
```
/web           # Vite React PWA (TS + Tailwind)
/server        # Express API (TypeScript) for OpenAI & Supabase secure ops
/supabase      # Schema + RLS
/content       # Seed content (modules, packs)
```

---

## MVP Scope (what's already scaffolded)
- Onboarding: vibe, goals, optional attachment mini-quiz.
- Planner: POST `/api/plan` → AI-crafted itinerary (balanced Play/Growth/Rest).
- Itinerary: responsive cards w/ “Why it works”, prompts, and flex blocks.
- Journal: private vs shared (requires partner approval).
- SOS: Time-out → repair → re-entry scripts.
- Offline: basic service worker + pack caching.

**Next (V1):** progress insights, localization (EN/ES), marketplace for content packs, 90-day follow-ups.

---

## Legal & Safety
- No diagnoses. Crisis keywords surface resource tiles immediately.
- Respectful, non-judgmental tone. Explicit consent for anything shared.

---

## Deploy notes
- Replit is great for build/iterate; for production, front-end can lift to Vercel and API to Fly.io/Render/Supabase Functions. Keep secrets on the server only.

Enjoy building Haven. Ship small, iterate boldly, protect the humans.
