# Conversion Tracking & Revenue Analytics Implementation Guide

## Overview

This document provides a complete implementation guide for adding conversion tracking, revenue analytics, and subscription lifecycle monitoring to a SaaS application using Stripe, PostgreSQL, and React.

**What This Implements:**
- Full subscription lifecycle tracking (free→paid, renewals, cancellations, downgrades)
- Revenue analytics dashboard (MRR, ARR, total revenue, conversion rates)
- Conversion funnel visualization
- Admin-only analytics access control
- Real-time event tracking via Stripe webhooks

**Tech Stack:**
- Backend: Express.js + TypeScript
- Database: PostgreSQL (via Drizzle ORM)
- Frontend: React + TanStack Query + Recharts
- Payment Processing: Stripe
- Authentication: Any auth system with user emails

---

## Phase 1: Database Schema

### 1.1 Conversion Events Table

Tracks all subscription lifecycle changes and their revenue impact.

```typescript
// shared/schema.ts

export const conversionEvents = pgTable("conversion_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: varchar("email"),
  eventType: varchar("event_type").notNull(), // free_to_paid, paid_to_free, subscription_renewed, subscription_canceled
  fromPlan: varchar("from_plan"),
  toPlan: varchar("to_plan"),
  revenueImpact: integer("revenue_impact").notNull().default(0), // Amount in cents
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversionEventSchema = createInsertSchema(conversionEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;
export type ConversionEvent = typeof conversionEvents.$inferSelect;
```

### 1.2 Subscription Events Table

Logs all Stripe webhook events for audit trail and debugging.

```typescript
// shared/schema.ts

export const subscriptionEvents = pgTable("subscription_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  eventType: varchar("event_type").notNull(), // created, updated, deleted, payment_succeeded, payment_failed
  status: varchar("status"),
  priceId: text("price_id"),
  amount: integer("amount"), // Amount in cents
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
```

### 1.3 Run Migration

```bash
npm run db:push
# If you get data-loss warnings:
npm run db:push --force
```

---

## Phase 2: Storage Layer

### 2.1 Interface Definition

```typescript
// server/storage.ts

export interface IStorage {
  // ... existing methods ...
  
  // Conversion Events
  createConversionEvent(event: InsertConversionEvent): Promise<ConversionEvent>;
  getConversionEvents(userId?: string, limit?: number): Promise<ConversionEvent[]>;
  getConversionEventsByType(eventType: string, limit?: number): Promise<ConversionEvent[]>;
  
  // Subscription Events
  createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent>;
  getSubscriptionEvents(userId?: string, stripeSubscriptionId?: string, limit?: number): Promise<SubscriptionEvent[]>;
  
  // Analytics
  getRevenueMetrics(): Promise<{
    mrr: number;
    arr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    lifetimeCustomers: number;
  }>;
  getConversionFunnel(): Promise<{
    totalSignups: number;
    freeToPaidConversions: number;
    conversionRate: number;
    averageTimeToConvert: number;
  }>;
}
```

### 2.2 Implementation

```typescript
// server/storage.ts

class DbStorage implements IStorage {
  // ... existing code ...

  async createConversionEvent(event: InsertConversionEvent): Promise<ConversionEvent> {
    const result = await this.db.insert(conversionEvents).values(event).returning();
    return result[0];
  }

  async getConversionEvents(userId?: string, limit: number = 100): Promise<ConversionEvent[]> {
    let query = this.db.select().from(conversionEvents);
    if (userId) {
      query = query.where(eq(conversionEvents.userId, userId));
    }
    return await query.orderBy(desc(conversionEvents.createdAt)).limit(limit);
  }

  async getConversionEventsByType(eventType: string, limit: number = 100): Promise<ConversionEvent[]> {
    return await this.db
      .select()
      .from(conversionEvents)
      .where(eq(conversionEvents.eventType, eventType))
      .orderBy(desc(conversionEvents.createdAt))
      .limit(limit);
  }

  async createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const result = await this.db.insert(subscriptionEvents).values(event).returning();
    return result[0];
  }

  async getSubscriptionEvents(
    userId?: string, 
    stripeSubscriptionId?: string, 
    limit: number = 100
  ): Promise<SubscriptionEvent[]> {
    let query = this.db.select().from(subscriptionEvents);
    const conditions = [];
    
    if (userId) conditions.push(eq(subscriptionEvents.userId, userId));
    if (stripeSubscriptionId) conditions.push(eq(subscriptionEvents.stripeSubscriptionId, stripeSubscriptionId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(subscriptionEvents.createdAt)).limit(limit);
  }

  async getRevenueMetrics() {
    // Calculate MRR from active subscriptions
    const activeSubsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    const activeSubscriptions = Number(activeSubsResult[0]?.count || 0);
    
    // Assuming $20/month subscription (adjust to your pricing)
    const SUBSCRIPTION_PRICE = 2000; // in cents
    const mrr = activeSubscriptions * SUBSCRIPTION_PRICE;
    const arr = mrr * 12;

    // Calculate total revenue from conversion events
    const revenueResult = await this.db
      .select({ total: sql<number>`COALESCE(SUM(revenue_impact), 0)` })
      .from(conversionEvents);
    
    const totalRevenue = Number(revenueResult[0]?.total || 0);

    // Count lifetime access customers
    const lifetimeResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.hasLifetimeAccess, 1));
    
    const lifetimeCustomers = Number(lifetimeResult[0]?.count || 0);

    return {
      mrr,
      arr,
      totalRevenue,
      activeSubscriptions,
      lifetimeCustomers,
    };
  }

  async getConversionFunnel() {
    // Total signups
    const totalSignupsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalSignups = Number(totalSignupsResult[0]?.count || 0);

    // Free to paid conversions
    const conversionsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(conversionEvents)
      .where(eq(conversionEvents.eventType, 'free_to_paid'));
    const freeToPaidConversions = Number(conversionsResult[0]?.count || 0);

    // Conversion rate
    const conversionRate = totalSignups > 0 
      ? (freeToPaidConversions / totalSignups) * 100 
      : 0;

    // Average time to convert (in days)
    const avgTimeResult = await this.db
      .select({
        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (ce.created_at - u.created_at)) / 86400)`
      })
      .from(conversionEvents)
      .innerJoin(users, eq(conversionEvents.userId, users.id))
      .where(eq(conversionEvents.eventType, 'free_to_paid'));
    
    const averageTimeToConvert = Number(avgTimeResult[0]?.avgDays || 0);

    return {
      totalSignups,
      freeToPaidConversions,
      conversionRate,
      averageTimeToConvert,
    };
  }
}
```

---

## Phase 3: Stripe Webhook Handler

### 3.1 Enhanced Webhook Processing

```typescript
// server/index.ts

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const user = await storage.getUserByStripeCustomerId(customerId);
          
          if (user) {
            // Track conversion event: free_to_paid
            await storage.createConversionEvent({
              userId: user.id,
              email: user.email || null,
              eventType: 'free_to_paid',
              fromPlan: 'free',
              toPlan: 'premium',
              revenueImpact: session.amount_total || 0,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId,
              metadata: {
                sessionId: session.id,
              },
            });

            // Save subscription
            await storage.upsertSubscription({
              userId: user.id,
              stripeSubscriptionId: subscriptionId,
              priceId: subscription.items.data[0].price.id,
              planTier: 'premium',
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription: any = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;

        await storage.updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
        );

        // Track subscription event
        const user = await storage.getUserByStripeCustomerId(customerId);
        if (user) {
          await storage.createSubscriptionEvent({
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            eventType: event.type === 'customer.subscription.created' ? 'created' : 'updated',
            status: subscription.status,
            priceId: subscription.items.data[0]?.price?.id,
            amount: subscription.items.data[0]?.price?.unit_amount || 0,
            currentPeriodStart: subscription.current_period_start 
              ? new Date(subscription.current_period_start * 1000) 
              : undefined,
            currentPeriodEnd: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000) 
              : undefined,
            metadata: event.data.object,
          });
        }

        // Track cancellation intent
        if (subscription.cancel_at_period_end && event.type === 'customer.subscription.updated') {
          const sub = await storage.getSubscriptionByStripeId(subscription.id);
          if (sub) {
            await storage.createConversionEvent({
              userId: sub.userId,
              email: null,
              eventType: 'subscription_canceled',
              fromPlan: 'premium',
              toPlan: 'premium',
              revenueImpact: 0,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: customerId,
              metadata: {
                reason: 'cancel_at_period_end',
                cancelAt: subscription.cancel_at,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
        
        await storage.updateSubscriptionStatus(
          subscription.id,
          'canceled',
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
        );

        const subRecord = await storage.getSubscriptionByStripeId(subscription.id);
        if (subRecord) {
          const user = await storage.getUser(subRecord.userId);
          
          // Track conversion event: paid_to_free (actual downgrade/churn)
          await storage.createConversionEvent({
            userId: subRecord.userId,
            email: user?.email || null,
            eventType: 'paid_to_free',
            fromPlan: 'premium',
            toPlan: 'free',
            revenueImpact: 0,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            metadata: {
              reason: 'subscription_deleted',
              canceledAt: subscription.canceled_at,
            },
          });

          // Track subscription event: deleted
          await storage.createSubscriptionEvent({
            userId: subRecord.userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            eventType: 'deleted',
            status: 'canceled',
            priceId: subscription.items.data[0]?.price?.id,
            amount: 0,
            currentPeriodStart: subscription.current_period_start 
              ? new Date(subscription.current_period_start * 1000) 
              : undefined,
            currentPeriodEnd: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000) 
              : undefined,
            canceledAt: new Date(),
            metadata: event.data.object,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice: any = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        
        if (subscriptionId) {
          await storage.updateSubscriptionStatus(subscriptionId, 'past_due');

          const sub = await storage.getSubscriptionByStripeId(subscriptionId);
          if (sub) {
            await storage.createSubscriptionEvent({
              userId: sub.userId,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: invoice.customer as string,
              eventType: 'payment_failed',
              status: 'past_due',
              priceId: sub.priceId,
              amount: invoice.amount_due || 0,
              metadata: event.data.object,
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice: any = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        
        if (subscriptionId) {
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          await storage.updateSubscriptionStatus(
            subscription.id,
            subscription.status,
            subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
          );

          const sub = await storage.getSubscriptionByStripeId(subscriptionId);
          if (sub) {
            await storage.createSubscriptionEvent({
              userId: sub.userId,
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: invoice.customer as string,
              eventType: 'payment_succeeded',
              status: subscription.status,
              priceId: sub.priceId,
              amount: invoice.amount_paid || 0,
              currentPeriodStart: subscription.current_period_start 
                ? new Date(subscription.current_period_start * 1000) 
                : undefined,
              currentPeriodEnd: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000) 
                : undefined,
              metadata: event.data.object,
            });

            // Track conversion event: subscription renewed (only for actual renewals, not first payment)
            if (invoice.billing_reason === 'subscription_cycle') {
              await storage.createConversionEvent({
                userId: sub.userId,
                email: null,
                eventType: 'subscription_renewed',
                fromPlan: 'premium',
                toPlan: 'premium',
                revenueImpact: invoice.amount_paid || 0,
                stripeSubscriptionId: subscriptionId,
                stripeCustomerId: invoice.customer as string,
                metadata: {
                  invoiceId: invoice.id,
                  billingReason: invoice.billing_reason,
                },
              });
            }
          }
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Phase 4: API Endpoints

### 4.1 Admin Access Control

```typescript
// shared/adminAccess.ts

const ADMIN_EMAILS = [
  'your-admin@example.com',
  // Add more admin emails here
];

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
```

```typescript
// server/middleware.ts

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!user || !isAdminUser(user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
```

### 4.2 Analytics Routes

```typescript
// server/routes.ts

app.get('/api/analytics/revenue-metrics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const metrics = await storage.getRevenueMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/conversion-funnel', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const funnel = await storage.getConversionFunnel();
    res.json(funnel);
  } catch (error: any) {
    console.error('Error fetching conversion funnel:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/conversion-events', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const events = await storage.getConversionEvents(userId, limit);
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching conversion events:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/subscription-events', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.query.userId as string | undefined;
    const stripeSubscriptionId = req.query.stripeSubscriptionId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const events = await storage.getSubscriptionEvents(userId, stripeSubscriptionId, limit);
    res.json(events);
  } catch (error: any) {
    console.error('Error fetching subscription events:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Phase 5: Frontend Analytics Dashboard

### 5.1 Analytics Page Component

```typescript
// client/src/pages/Analytics.tsx

import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, Target, Lock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";

interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  lifetimeCustomers: number;
}

interface ConversionFunnel {
  totalSignups: number;
  freeToPaidConversions: number;
  conversionRate: number;
  averageTimeToConvert: number;
}

interface ConversionEvent {
  id: string;
  userId: string;
  email: string | null;
  eventType: string;
  fromPlan: string | null;
  toPlan: string | null;
  revenueImpact: number;
  createdAt: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Analytics() {
  const { user } = useAuth();
  const hasAccess = isAdminUser(user?.email);

  const { data: revenueMetrics } = useQuery<RevenueMetrics>({
    queryKey: ['/api/analytics/revenue-metrics'],
    enabled: hasAccess,
  });

  const { data: conversionFunnel } = useQuery<ConversionFunnel>({
    queryKey: ['/api/analytics/conversion-funnel'],
    enabled: hasAccess,
  });

  const { data: conversionEvents = [] } = useQuery<ConversionEvent[]>({
    queryKey: ['/api/analytics/conversion-events'],
    enabled: hasAccess,
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto p-6">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Lock className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle data-testid="text-access-denied">Access Denied</CardTitle>
              <CardDescription data-testid="text-access-denied-message">
                You don't have permission to view analytics. This page is only available to authorized administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const funnelData = conversionFunnel ? [
    { name: 'Total Signups', value: conversionFunnel.totalSignups, fill: COLORS[0] },
    { name: 'Paid Conversions', value: conversionFunnel.freeToPaidConversions, fill: COLORS[1] },
  ] : [];

  const planDistribution = revenueMetrics ? [
    { name: 'Active Subscriptions', value: revenueMetrics.activeSubscriptions, fill: COLORS[2] },
    { name: 'Lifetime Access', value: revenueMetrics.lifetimeCustomers, fill: COLORS[3] },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-analytics-title">
            Revenue & Conversion Analytics
          </h1>
          <p className="text-muted-foreground" data-testid="text-analytics-description">
            Track revenue metrics, conversion rates, and business growth
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-mrr">
                {formatCurrency(revenueMetrics?.mrr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Predictable monthly income</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-arr">
                {formatCurrency(revenueMetrics?.arr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">MRR × 12</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">
                {formatCurrency(revenueMetrics?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                {conversionFunnel?.conversionRate.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Free → Paid conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Signups vs. paid conversions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average time to convert:</span>
                  <span className="font-medium">
                    {conversionFunnel?.averageTimeToConvert.toFixed(0) || 0} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Distribution</CardTitle>
              <CardDescription>Active subscriptions vs. lifetime access</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversion Events</CardTitle>
            <CardDescription>Latest subscription lifecycle changes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead className="text-right">Revenue Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversionEvents.slice(0, 20).map((event) => (
                  <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(event.createdAt), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>{event.email || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        event.eventType === 'free_to_paid' 
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : event.eventType === 'paid_to_free'
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                          : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                      }`}>
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.fromPlan || 'null'} → {event.toPlan || 'null'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      event.revenueImpact > 0 ? 'text-green-600' : event.revenueImpact < 0 ? 'text-red-600' : ''
                    }`}>
                      {event.revenueImpact > 0 ? '+' : ''}{formatCurrency(event.revenueImpact)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

### 5.2 Add Route

```typescript
// client/src/App.tsx

import Analytics from "@/pages/Analytics";

function Router() {
  return (
    <Switch>
      {/* ... other routes ... */}
      <Route path="/analytics" component={Analytics} />
      {/* ... */}
    </Switch>
  );
}
```

---

## Phase 6: Testing

### 6.1 Test Stripe Webhooks

Use Stripe CLI to test locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### 6.2 Verify Data

Check your database:

```sql
-- View conversion events
SELECT * FROM conversion_events ORDER BY created_at DESC LIMIT 10;

-- View subscription events
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;

-- Check revenue metrics
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_subs,
  SUM(revenue_impact) FILTER (WHERE event_type = 'free_to_paid') as total_revenue
FROM subscriptions
CROSS JOIN conversion_events;
```

---

## Configuration Checklist

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Optional
SESSION_SECRET=your-random-secret
```

### Stripe Configuration

1. **Create Products & Prices** in Stripe Dashboard
2. **Configure Webhook Endpoint**: Add `https://your-domain.com/webhooks/stripe`
3. **Select Events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy Webhook Secret** to `.env`

### Admin Access

Update `shared/adminAccess.ts` with your admin email addresses.

---

## Common Issues & Solutions

### Issue: Duplicate Email Constraint Error

**Symptom**: `duplicate key value violates unique constraint "users_email_unique"`

**Solution**: Update `upsertUser` to check for existing email first:

```typescript
async upsertUser(userData: UpsertUser): Promise<User> {
  // Check if user exists by email first (since email is unique)
  if (userData.email) {
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      // Update existing user by ID
      const result = await this.db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return result[0];
    }
  }
  
  // Insert new user...
}
```

### Issue: Webhook Events Not Firing

**Checklist**:
1. Verify webhook endpoint is publicly accessible
2. Check Stripe dashboard for webhook delivery attempts
3. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
4. Check server logs for signature verification errors

### Issue: MRR Calculation Incorrect

**Solution**: Adjust `SUBSCRIPTION_PRICE` constant in `getRevenueMetrics()` to match your actual pricing. For dynamic pricing, query from Stripe or store price in subscription record.

---

## Next Steps

1. **Add Cohort Analysis**: Track conversion rates by signup month/quarter
2. **Implement Churn Prediction**: ML model to identify at-risk customers
3. **Email Automation**: Trigger re-engagement campaigns based on conversion events
4. **A/B Testing**: Track pricing experiments and their impact on conversions
5. **Referral Tracking**: Tie conversion events to referral sources

---

## License

MIT - Feel free to use this in your own projects!

---

## Credits

Implementation guide based on Twangle's conversion tracking system.
Built with Stripe, PostgreSQL, Drizzle ORM, React, and TanStack Query.
