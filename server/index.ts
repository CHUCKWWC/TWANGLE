import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
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
          
          if (!userId) {
            const user = await storage.getUserByStripeCustomerId(customerId);
            if (!user) {
              console.warn(`Webhook: No user found for customer ${customerId}, skipping subscription creation`);
              break;
            }
            userId = user.id;
            await stripe.customers.update(customerId, { metadata: { userId } });
          }

          const subscriptionData = getSubscriptionData(subscription);
          await storage.upsertSubscription({
            userId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            ...subscriptionData,
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
        
        if (!userId) {
          const user = await storage.getUserByStripeCustomerId(customerId);
          if (!user) {
            console.warn(`Webhook: No user found for customer ${customerId}, skipping subscription update`);
            break;
          }
          userId = user.id;
          await stripe.customers.update(customerId, { metadata: { userId } });
        }

        const subscriptionData = getSubscriptionData(subscription);
        await storage.upsertSubscription({
          userId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          ...subscriptionData,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object as Stripe.Subscription;
        const subscriptionData = getSubscriptionData(subscription);
        await storage.updateSubscriptionStatus(
          subscription.id,
          'canceled',
          subscriptionData.currentPeriodEnd
        );
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

// Require SESSION_SECRET in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "twangle-dev-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

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
