# Twanglement Subscriptions Kit — Stripe + Supabase (Web Paywall)

This bundle gives you an end‑to‑end, production‑ready paywall using **Stripe Checkout + Customer Portal**, **Node/Express (TypeScript)**, **Supabase** for user data, and **React/Vite** gating. Copy/paste into your repo and deploy.

---

## 0) What you’ll get
- Backend API (Express/TypeScript)
  - `POST /api/checkout` → creates a Stripe Checkout Session
  - `POST /api/portal` → opens Stripe Customer Portal
  - `POST /api/webhooks/stripe` → syncs entitlements on subscription changes
- Supabase schema + RLS for `profiles` and `subscriptions`
- React/Vite front‑end hooks/components for **upgrade**, **account**, and **route gating**
- Environment variables and deployment checklist

---

## 1) Stripe configuration (Dashboard)
1. Create **Products**
   - `Twanglement Core` – Monthly and Annual recurring prices
   - `Twanglement Pro` – Monthly and Annual recurring prices
2. Copy the **Price IDs** (e.g., `price_123`) for each tier.
3. In **Customer Portal** settings, enable: update payment methods, cancel, switch plans.
4. In **Developers → Webhooks** add an endpoint pointing to your public URL `/api/webhooks/stripe`. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** (e.g., `whsec_...`).

> Tip: For dev, use `stripe listen --forward-to localhost:5173/api/webhooks/stripe` or your API port.

---

## 2) Environment variables (`.env`)
Create this in **both** backend and frontend as needed.

```dotenv
# Backend
STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service role ONLY on server

# Price IDs from Stripe
PRICE_CORE_MONTHLY=price_xxx
PRICE_CORE_ANNUAL=price_xxx
PRICE_PRO_MONTHLY=price_xxx
PRICE_PRO_ANNUAL=price_xxx
```

On the **frontend** add:
```dotenv
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:3000
```

---

## 3) Supabase schema (SQL)
Run in Supabase SQL editor.

```sql
-- Profiles: one row per user (assuming you use Supabase Auth or map your auth to this table)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  stripe_customer_id text,
  plan text default 'free' check (plan in ('free','core','pro')),
  updated_at timestamptz default now()
);

-- Subscriptions table tracks Stripe state
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  price_id text,
  status text,
  current_period_end timestamptz,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

create policy "read own profile" on public.profiles for select
  using (auth.uid() = id);
create policy "update own profile" on public.profiles for update
  using (auth.uid() = id);

create policy "read own subscriptions" on public.subscriptions for select
  using (auth.uid() = user_id);

-- Helper function to set plan cleanly
create or replace function public.set_user_plan(p_user uuid, p_plan text)
returns void language plpgsql security definer as $$
begin
  update public.profiles
    set plan = p_plan,
        updated_at = now()
  where id = p_user;
end;$$;
```

> If you’re not using Supabase Auth yet, keep the same tables but insert rows via your auth flow (ensure `profiles.id` equals your user UUID).

---

## 4) Backend — Express + TypeScript
**File tree:**
```
server/
  src/
    env.ts
    stripe.ts
    supabase.ts
    auth.ts
    routes.ts
    webhooks.ts
    index.ts
  package.json
  tsconfig.json
```

### `package.json`
```json
{
  "name": "twanglement-subscriptions-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p .",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "stripe": "^16.6.0",
    "body-parser": "^1.20.3",
    "@supabase/supabase-js": "^2.45.4"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

### `src/env.ts`
```ts
import 'dotenv/config';

export const env = {
  stripeSecret: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  frontendUrl: process.env.FRONTEND_URL!,
  backendUrl: process.env.BACKEND_URL!,
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  priceCoreMonthly: process.env.PRICE_CORE_MONTHLY!,
  priceCoreAnnual: process.env.PRICE_CORE_ANNUAL!,
  priceProMonthly: process.env.PRICE_PRO_MONTHLY!,
  priceProAnnual: process.env.PRICE_PRO_ANNUAL!
};
```

### `src/stripe.ts`
```ts
import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = new Stripe(env.stripeSecret, {
  apiVersion: '2024-06-20'
});
```

### `src/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { persistSession: false }
});
```

### `src/auth.ts`
```ts
import { Request, Response, NextFunction } from 'express';

// Minimal auth shim.
// Expect a header 'x-user-id' (UUID) from your frontend after Supabase login
// In production, validate a JWT instead and extract user id.
export function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ error: 'Missing user auth' });
  (req as any).userId = userId;
  next();
}
```

### `src/routes.ts`
```ts
import { Router } from 'express';
import { stripe } from './stripe.js';
import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';
import { requireUser } from './auth.js';

export const router = Router();

router.post('/checkout', requireUser, async (req, res) => {
  try {
    const { priceId, successPath = '/account', cancelPath = '/pricing' } = req.body as {
      priceId: string; successPath?: string; cancelPath?: string;
    };
    const userId = (req as any).userId as string;

    // Ensure profile and stripe customer id
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles').select('*').eq('id', userId).single();
    if (pErr || !profile) return res.status(400).json({ error: 'Profile missing' });

    let customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId },
        email: profile.email || undefined,
        name: profile.full_name || undefined
      });
      customerId = customer.id;
      await supabaseAdmin.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.frontendUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.frontendUrl}${cancelPath}`,
      allow_promotion_codes: true
    });

    res.json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/portal', requireUser, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { data: profile, error } = await supabaseAdmin
      .from('profiles').select('*').eq('id', userId).single();
    if (error || !profile?.stripe_customer_id) return res.status(400).json({ error: 'No Stripe customer' });

    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${env.frontendUrl}/account`
    });

    res.json({ url: portal.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
```

### `src/webhooks.ts`
```ts
import { Router } from 'express';
import Stripe from 'stripe';
import { stripe } from './stripe.js';
import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';

export const webhooks = Router();

// Stripe requires raw body
webhooks.post('/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig, env.stripeWebhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  (async () => {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === 'subscription' && s.customer && s.subscription) {
          const customerId = s.customer as string;
          const subId = s.subscription as string;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubFromStripe(sub, customerId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await upsertSubFromStripe(sub, customerId);
        break;
      }
      case 'invoice.payment_failed': {
        // Optional: notify user
        break;
      }
    }
  })().catch((e) => console.error(e));

  res.json({ received: true });
});

async function upsertSubFromStripe(sub: Stripe.Subscription, customerId: string) {
  const priceId = typeof sub.items.data[0]?.price?.id === 'string' ? sub.items.data[0].price.id : null;
  const status = sub.status; // active, trialing, past_due, canceled, incomplete, etc.
  const currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();

  // Find user by customer id
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('id').eq('stripe_customer_id', customerId).single();
  if (!prof?.id) return;

  // Map price → plan name
  const plan = mapPlan(priceId);

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: prof.id,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    price_id: priceId || null,
    status,
    current_period_end: currentPeriodEnd,
    raw: sub as any,
    updated_at: new Date().toISOString()
  }, { onConflict: 'stripe_subscription_id' });

  // Update profile plan (entitlement)
  await supabaseAdmin.rpc('set_user_plan', { p_user: prof.id, p_plan: plan });
}

function mapPlan(priceId: string | null): 'free' | 'core' | 'pro' {
  if (!priceId) return 'free';
  switch (priceId) {
    case process.env.PRICE_CORE_MONTHLY:
    case process.env.PRICE_CORE_ANNUAL:
      return 'core';
    case process.env.PRICE_PRO_MONTHLY:
    case process.env.PRICE_PRO_ANNUAL:
      return 'pro';
    default:
      return 'free';
  }
}
```

### `src/index.ts`
```ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { router } from './routes.js';
import { webhooks } from './webhooks.js';
import { env } from './env.js';

const app = express();

// Raw body ONLY for webhooks route
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), (req, res, next) => {
  (req as any).rawBody = req.body;
  next();
}, webhooks);

// JSON body for everything else
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(bodyParser.json());
app.use('/api', router);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on :${port}`));
```

---

## 5) Frontend — React/Vite (TypeScript)
**File tree:**
```
src/
  lib/supabase.ts
  lib/api.ts
  hooks/usePlan.ts
  components/Paywall.tsx
  components/RequirePlan.tsx
  pages/Pricing.tsx
  pages/Account.tsx
```

### `src/lib/supabase.ts`
(Use your existing client; example shown)
```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!);
```

### `src/lib/api.ts`
```ts
export async function api(path: string, opts: RequestInit = {}) {
  const userId = await getUserIdHeader();
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId ?? '',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getUserIdHeader() {
  // If you’re using Supabase Auth:
  // const { data: { user } } = await supabase.auth.getUser();
  // return user?.id;
  // For demo, return from localStorage
  return localStorage.getItem('user_id');
}
```

### `src/hooks/usePlan.ts`
```ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Plan = 'free' | 'core' | 'pro';

export function usePlan() {
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPlan('free'); setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single();
      setPlan((data?.plan as Plan) || 'free');
      setLoading(false);
    })();
  }, []);

  return { plan, loading };
}
```

### `src/components/Paywall.tsx`
```tsx
import { api } from '../lib/api';

export function Paywall({ tier = 'core' }: { tier?: 'core'|'pro' }) {
  const priceVar = tier === 'core' ? 'PRICE_CORE_MONTHLY' : 'PRICE_PRO_MONTHLY';
  const priceId = import.meta.env[priceVar as any] as string | undefined;

  async function upgrade() {
    const { url } = await api('/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId })
    });
    window.location.href = url;
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border p-6 shadow">
      <h2 className="text-2xl font-bold">Unlock {tier === 'core' ? 'Core' : 'Pro'}</h2>
      <p className="mt-2 text-sm opacity-80">Guided journeys, full reports, and saved progress.</p>
      <button onClick={upgrade} className="mt-4 rounded-xl bg-black px-5 py-3 text-white">Upgrade</button>
    </div>
  );
}
```

### `src/components/RequirePlan.tsx`
```tsx
import { ReactNode } from 'react';
import { usePlan } from '../hooks/usePlan';
import { Paywall } from './Paywall';

type Plan = 'free'|'core'|'pro';

function rank(p: Plan) { return p === 'pro' ? 2 : p === 'core' ? 1 : 0; }

export function RequirePlan({ min = 'core', children }: { min?: Plan; children: ReactNode; }) {
  const { plan, loading } = usePlan();
  if (loading) return null;
  return rank(plan) >= rank(min) ? <>{children}</> : <Paywall tier={min === 'pro' ? 'pro' : 'core'} />;
}
```

### `src/pages/Pricing.tsx`
```tsx
import { api } from '../lib/api';

const PRICES = [
  { key: 'Core', varM: 'PRICE_CORE_MONTHLY', varY: 'PRICE_CORE_ANNUAL' },
  { key: 'Pro',  varM: 'PRICE_PRO_MONTHLY',  varY: 'PRICE_PRO_ANNUAL' }
];

export default function Pricing() {
  async function buy(priceId: string) {
    const { url } = await api('/checkout', { method: 'POST', body: JSON.stringify({ priceId }) });
    window.location.href = url;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {PRICES.map((p) => {
        const m = import.meta.env[p.varM as any] as string | undefined;
        const y = import.meta.env[p.varY as any] as string | undefined;
        return (
          <div key={p.key} className="rounded-2xl border p-6 shadow">
            <h3 className="text-xl font-semibold">{p.key}</h3>
            <div className="mt-4 flex gap-3">
              <button onClick={() => buy(m!)} className="rounded-xl bg-black px-4 py-2 text-white">Monthly</button>
              <button onClick={() => buy(y!)} className="rounded-xl border px-4 py-2">Annual</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### `src/pages/Account.tsx`
```tsx
import { api } from '../lib/api';
import { usePlan } from '../hooks/usePlan';

export default function Account() {
  const { plan } = usePlan();
  async function openPortal() {
    const { url } = await api('/portal', { method: 'POST' });
    window.location.href = url;
  }
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Account</h1>
      <p className="mt-2">Your plan: <b>{plan}</b></p>
      <button onClick={openPortal} className="mt-4 rounded-xl bg-black px-4 py-2 text-white">Manage billing</button>
    </div>
  );
}
```

> Use `<RequirePlan min="core">...</RequirePlan>` to gate any premium page or component.

---

## 6) Gating examples in your app
```tsx
// Example: lock the full report behind Core
import { RequirePlan } from '@/components/RequirePlan';

export default function FullAssessmentReport() {
  return (
    <RequirePlan min="core">
      {/* premium content here */}
      <div>Beautiful charts, insights, and downloads…</div>
    </RequirePlan>
  );
}
```

---

## 7) Deployment checklist
- **Backend**: Deploy to Render/Fly.io/Vercel Functions. Ensure `STRIPE_WEBHOOK_SECRET` is set and route `/api/webhooks/stripe` is **raw body** enabled.
- **Frontend**: Set `VITE_BACKEND_URL` to your API URL. Add price IDs to env. Use your Supabase anon/env in the client.
- **Webhook test**: Create a test subscription → verify `profiles.plan` updates to `core`/`pro`.
- **Cancel test**: Cancel in portal → webhook should flip plan back to `free` at period end or immediately (adjust logic if you prefer grace periods).

---

## 8) Monetization patterns that convert
- **Free core flow** → graders/teasers everywhere → **Upgrade** CTAs at natural breakpoints.
- Trials on **annual** plans, money‑back guarantee in copy.
- A/B the paywall headline: promise outcomes, not features. Example: *“Turn conflict into signal. 14‑day journey to reconnection.”*

---

## 9) Security notes (no candy‑coating)
- Never expose Service Role key to the client. Server only.
- Replace the `x-user-id` shim with real JWT validation asap.
- Handle idempotency keys on webhook upserts if you scale traffic.
- Log webhook errors; Stripe retries automatically for 3 days.

---

## 10) Nice‑to‑haves (later)
- Stripe Tax enablement, receipts branding.
- Per‑feature flags (e.g., `features` table) instead of plan strings.
- Email hooks on `payment_failed` to proactively save churn.

---

**You’re live the moment you plug in real Price IDs and deploy.** Gate a couple of killer features, tune the copy, and let the subscription flywheel spin.



---

# Replit Integration Pack — Stripe Pricing Table + Supabase (Single Core Tier)

This add‑on section gives you a copy‑paste backend for **Replit** and exact steps to wire Stripe Pricing Table to your live Replit URL, keep **Supabase** in sync, and open the **Stripe Customer Portal**. It assumes one paid tier: **Core**.

## A) Repo layout on Replit
```
/ (replit root)
  index.html                 # your Pricing page (or integrate in your React app)
  server/
    src/
      env.ts
      stripe.ts
      supabase.ts
      routes.ts
      webhooks.ts
      index.ts
    package.json
    tsconfig.json
```
> If you already have a frontend (React/Vite/Next), just add the `<stripe-pricing-table …>` snippet in your pricing page and keep the server folder below as your API.

---

## B) Frontend: Stripe Pricing Table embed
Place the script and element on your pricing page (plain HTML example):
```html
<!-- index.html -->
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Twanglement — Pricing</title>
    <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
    <link rel="preconnect" href="https://js.stripe.com" />
    <style>body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:40px}</style>
  </head>
  <body>
    <h1>Unlock Core</h1>
    <p>Guided sessions, research‑backed exercises, and secure progress tracking.</p>

    <stripe-pricing-table
      pricing-table-id="prctbl_1SEr1uFHAup9QfDRlc63t1OH"
      publishable-key="pk_live_51RZWPDFHAup9QfDR9nOmIfophtS5wsyFRYf6rTzzB9jg1PjHYSWEAtzL8me4CLAo07aWY1UnnxGZ9dZni9A4WOzC00xaDMx9fU">
    </stripe-pricing-table>
  </body>
</html>
```
> For React/Vite, include the `<script …pricing-table.js>` in `index.html` and render the `<stripe-pricing-table>` element within your `Pricing.tsx`.

**In Stripe Dashboard → Pricing Tables → select your table → set URLs:**
- Success URL: `https://<your-repl-subdomain>.repl.co/account`
- Cancel URL: `https://<your-repl-subdomain>.repl.co/pricing`
(Replace with your custom domain if attached.)

---

## C) Backend (server) — Express + TypeScript (Replit‑ready)

### `server/package.json`
```json
{
  "name": "twanglement-subscriptions-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc -p ."
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "body-parser": "^1.20.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "stripe": "^16.6.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}
```

### `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

### `server/src/env.ts`
```ts
import 'dotenv/config';

export const env = {
  stripeSecret: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  frontendUrl: process.env.FRONTEND_URL!,
  backendUrl: process.env.BACKEND_URL || '',
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  productCoreId: process.env.PRODUCT_CORE_ID || '',
  priceCoreMonthly: process.env.PRICE_CORE_MONTHLY || ''
};
```

### `server/src/stripe.ts`
```ts
import Stripe from 'stripe';
import { env } from './env.js';
export const stripe = new Stripe(env.stripeSecret, { apiVersion: '2024-06-20' });
```

### `server/src/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } });
```

### `server/src/routes.ts`
```ts
import { Router } from 'express';
import { stripe } from './stripe.js';
import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';

export const router = Router();

// Minimal auth shim: accept user id via header (replace with real JWT in prod)
function requireUser(req: any, res: any, next: any) {
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ error: 'Missing user auth' });
  req.userId = userId; next();
}

router.post('/checkout', requireUser, async (req, res) => {
  try {
    const userId = req.userId as string;

    // Ensure profile & stripe customer id
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles').select('*').eq('id', userId).single();
    if (pErr || !profile) return res.status(400).json({ error: 'Profile missing' });

    let customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId },
        email: profile.email || undefined,
        name: profile.full_name || undefined
      });
      customerId = customer.id;
      await supabaseAdmin.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Resolve price id: prefer env price; else use product default price
    let priceId = env.priceCoreMonthly;
    if (!priceId && env.productCoreId) {
      const product = await stripe.products.retrieve(env.productCoreId);
      const dp = product.default_price;
      if (!dp) throw new Error('No default price on product');
      priceId = typeof dp === 'string' ? dp : dp.id;
    }
    if (!priceId) throw new Error('Set PRICE_CORE_MONTHLY or PRODUCT_CORE_ID');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.frontendUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.frontendUrl}/pricing`,
      allow_promotion_codes: true
    });

    res.json({ url: session.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/portal', requireUser, async (req, res) => {
  try {
    const userId = req.userId as string;
    const { data: profile, error } = await supabaseAdmin
      .from('profiles').select('*').eq('id', userId).single();
    if (error || !profile?.stripe_customer_id) return res.status(400).json({ error: 'No Stripe customer' });

    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${env.frontendUrl}/account`
    });

    res.json({ url: portal.url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
```

### `server/src/webhooks.ts`
```ts
import { Router } from 'express';
import Stripe from 'stripe';
import { stripe } from './stripe.js';
import { env } from './env.js';
import { supabaseAdmin } from './supabase.js';

export const webhooks = Router();

webhooks.post('/stripe', (req: any, res: any) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, env.stripeWebhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  (async () => {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === 'subscription' && s.customer && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await upsertSubFromStripe(sub, s.customer as string);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubFromStripe(sub, sub.customer as string);
        break;
      }
    }
  })().catch(console.error);

  res.json({ received: true });
});

async function upsertSubFromStripe(sub: Stripe.Subscription, customerId: string) {
  const { data: prof } = await supabaseAdmin
    .from('profiles').select('id').eq('stripe_customer_id', customerId).single();
  if (!prof?.id) return;

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: prof.id,
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    price_id: sub.items.data[0]?.price?.id ?? null,
    status: sub.status,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    raw: sub as any,
    updated_at: new Date().toISOString()
  }, { onConflict: 'stripe_subscription_id' });

  // Single tier → any active sub = core; otherwise free
  const active = ['active','trialing','past_due','incomplete','incomplete_expired'].includes(sub.status) || false;
  await supabaseAdmin.rpc('set_user_plan', { p_user: prof.id, p_plan: active ? 'core' : 'free' });
}
```

### `server/src/index.ts`
```ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { router } from './routes.js';
import { webhooks } from './webhooks.js';
import { env } from './env.js';

const app = express();

// Stripe webhooks need raw body
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), (req: any, _res, next) => {
  req.rawBody = req.body; next();
}, webhooks);

// JSON for everything else
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(bodyParser.json());
app.use('/api', router);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on :${port}`));
```

---

## D) Replit: Secrets & Run
In your Replit workspace:
1) **Create a new Repl → Node.js** (or add this `server/` folder to your existing Repl).
2) In the left sidebar → **Secrets** (lock icon), add:
   - `STRIPE_SECRET_KEY` = your Stripe secret (test first)
   - `STRIPE_WEBHOOK_SECRET` = from Stripe webhook endpoint (after step E)
   - `FRONTEND_URL` = `https://<your-repl-subdomain>.repl.co` (or your custom domain)
   - `SUPABASE_URL` = `https://pwuwmnivvdvdxdewynbo.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase **service role** key (server‑only)
   - `PRICE_CORE_MONTHLY` = `price_xxx` (or use `PRODUCT_CORE_ID = prod_TBDBqw8Gt2VtIo`)

3) Shell → `cd server && npm i` → `npm run dev` to test locally in Replit.
4) Set the Replit **Run command** to: `cd server && npm run dev` (or build/start if you prefer).

> If you also serve the `index.html`, you can host it via Replit’s static server or your own Express static route. Many teams keep frontend on Vite/Next and just call the Replit API.

---

## E) Stripe Webhooks (with your public Replit URL)
1) Copy your live Replit URL (e.g., `https://twanglement.replit.app` or `.repl.co`).
2) In **Stripe Dashboard → Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://<your-repl-subdomain>.repl.co/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`
3) After creating, copy the **Signing secret** (starts with `whsec_...`) and paste it into Replit Secret `STRIPE_WEBHOOK_SECRET`.

> You can also use Stripe CLI for local testing, but Replit already has a public URL—use that directly.

---

## F) Supabase schema (run once)
Run this SQL in Supabase (if you haven’t already):
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  stripe_customer_id text,
  plan text default 'free' check (plan in ('free','core')),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  price_id text,
  status text,
  current_period_end timestamptz,
  raw jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

create policy if not exists "read own profile" on public.profiles for select using (auth.uid() = id);
create policy if not exists "update own profile" on public.profiles for update using (auth.uid() = id);
create policy if not exists "read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);

create or replace function public.set_user_plan(p_user uuid, p_plan text)
returns void language plpgsql security definer as $$
begin
  update public.profiles set plan = p_plan, updated_at = now() where id = p_user;
end;$$;
```

---

## G) Frontend → Backend call (optional button)
If you want an explicit “Upgrade” button (instead of only the Pricing Table), call your API:
```html
<button onclick="upgrade()">Upgrade to Core</button>
<script>
async function upgrade(){
  const res = await fetch('/api/checkout', { method: 'POST', headers: { 'x-user-id': localStorage.getItem('user_id')||'' } });
  const data = await res.json();
  location.href = data.url;
}
</script>
```
> Replace the `x-user-id` shim with a real JWT auth header when you wire Supabase Auth on the client.

---

## H) Test flow (end‑to‑end)
1) Log in a user in your app so `profiles` has a row (or insert one manually for testing).
2) Visit `/pricing` and purchase via the Pricing Table.
3) Stripe redirects to `/account`.
4) Check Supabase: `profiles.plan = 'core'`, and `subscriptions` shows the sub as `active`.
5) Use a gated component/page to verify access is unlocked.
6) Click **Manage Billing** → confirm the Customer Portal opens and cancel/upgrade works.

---

## I) Copy for Product (shows in checkout/portal)
**Name:** Twanglement Core  
**Description:** *Untangle your love story.* Guided sessions, research‑backed exercises, and secure progress tracking that turn conflict into connection—one practical step at a time.

---

## J) Gotchas on Replit
- Replit sleeps on free tiers; consider Always‑On or move API to Render/Fly for reliability.
- Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` in client code—keep it in Replit Secrets (server only).
- If you enable a strict CSP, allow `https://js.stripe.com` and frames from `https://checkout.stripe.com`.

You now have a full Replit‑ready backend, Pricing Table embed, webhook sync, and portal access. Plug in your secrets, hit Run, and start charging for Core.

