import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import Stripe from "stripe";
import { storage } from "./storage";

const app = express();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

// Helper function to determine plan tier from price ID
function getPlanTier(priceId: string | null | undefined): 'free' | 'premium' {
  // If there's a price ID from Stripe, user is on a premium plan
  // Users without a subscription (no priceId) are on free tier
  return priceId ? 'premium' : 'free';
}

// Helper function to extract subscription data
function getSubscriptionData(subscription: any) {
  const priceId = subscription.items?.data?.[0]?.price?.id || null;
  const planTier = getPlanTier(priceId);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end ? 1 : 0;
  
  return {
    priceId,
    planTier,
    cancelAtPeriodEnd,
    currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
  };
}

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('No signature');
  }

  // Enforce webhook signature verification
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          const customer = await stripe.customers.retrieve(customerId);
          if (customer.deleted) break;
          
          let userId = customer.metadata?.userId;
          let user;
          
          // Try to find user by multiple methods
          if (userId) {
            // User ID exists in metadata, fetch the user
            user = await storage.getUser(userId);
          } else {
            // First, try client_reference_id from session
            if (session.client_reference_id) {
              user = await storage.getUser(session.client_reference_id);
              if (user) {
                userId = user.id;
              }
            }
            
            // Fallback to finding by stripeCustomerId
            if (!userId) {
              user = await storage.getUserByStripeCustomerId(customerId);
              if (user) {
                userId = user.id;
              }
            }
            
            if (!userId || !user) {
              console.error(`Webhook: No user found for customer ${customerId}, session ${session.id}`);
              break;
            }
            
            // Update Stripe customer metadata with userId for future events
            await stripe.customers.update(customerId, { metadata: { userId } });
          }

          // Final validation
          if (!user) {
            console.error(`Webhook: User ${userId} not found in database`);
            break;
          }

          // Persist stripeCustomerId if not already set
          if (!user.stripeCustomerId) {
            await storage.updateUser(userId, { stripeCustomerId: customerId });
          }

          const subscriptionData = getSubscriptionData(subscription);
          await storage.upsertSubscription({
            userId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            ...subscriptionData,
          });

          // Track conversion event: free_to_paid
          const amount = session.amount_total || 0;
          await storage.createConversionEvent({
            userId,
            email: user.email,
            eventType: 'free_to_paid',
            fromPlan: 'free',
            toPlan: 'premium',
            revenueImpact: amount,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            metadata: {
              sessionId: session.id,
              priceId: subscriptionData.priceId,
            },
          });

          // Track subscription event: created
          await storage.createSubscriptionEvent({
            userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            eventType: 'created',
            status: subscription.status,
            priceId: subscriptionData.priceId,
            amount,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
            metadata: event.data.object,
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription: any = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        let userId = customer.metadata?.userId;
        let user;
        
        if (userId) {
          // User ID exists in metadata, fetch the user
          user = await storage.getUser(userId);
        } else {
          user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) {
            console.warn(`Webhook: No user found for customer ${customerId}, skipping subscription update`);
            break;
          }
          userId = user.id;
          await stripe.customers.update(customerId, { metadata: { userId } });
        }

        // Final validation
        if (!user) {
          console.error(`Webhook: User ${userId} not found in database`);
          break;
        }

        // Persist stripeCustomerId if not already set
        if (!user.stripeCustomerId) {
          await storage.updateUser(userId, { stripeCustomerId: customerId });
        }

        const subscriptionData = getSubscriptionData(subscription);
        await storage.upsertSubscription({
          userId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          ...subscriptionData,
        });

        // Track subscription event
        const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
        await storage.createSubscriptionEvent({
          userId,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          eventType: event.type === 'customer.subscription.created' ? 'created' : 'updated',
          status: subscription.status,
          priceId: subscriptionData.priceId,
          amount,
          currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
          cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
          metadata: event.data.object,
        });

        // Track conversion event if subscription was canceled
        if (subscription.cancel_at_period_end && event.type === 'customer.subscription.updated') {
          await storage.createConversionEvent({
            userId,
            email: user.email,
            eventType: 'subscription_canceled',
            fromPlan: 'premium',
            toPlan: 'premium', // Still active until period end
            revenueImpact: 0,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            metadata: {
              cancelAtPeriodEnd: true,
              currentPeriodEnd: subscriptionData.currentPeriodEnd,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        const subscriptionData = getSubscriptionData(subscription);
        
        await storage.updateSubscriptionStatus(
          subscription.id,
          'canceled',
          subscriptionData.currentPeriodEnd
        );

        // Get subscription record to find user
        const subRecord = await storage.getSubscriptionByStripeId(subscription.id);
        if (subRecord) {
          // Get user details for email
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
            priceId: subscriptionData.priceId,
            amount: 0,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
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
          await storage.updateSubscriptionStatus(
            subscriptionId,
            'past_due'
          );

          // Track subscription event: payment failed
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

          // Track subscription event: payment succeeded
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
              currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
              metadata: event.data.object,
            });

            // Track conversion event: subscription renewed (only for actual renewals, not first payment)
            // First payment is already tracked in checkout.session.completed
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
