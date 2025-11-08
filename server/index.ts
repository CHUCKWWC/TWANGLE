import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import Stripe from "stripe";
import { storage } from "./storage";

const app = express();

// Health check endpoint - MUST be first before any middleware
app.get('/health', async (_req, res) => {
  try {
    // Basic health info
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      port: process.env.PORT || '5000',
      nodeVersion: process.version,
      services: {
        stripe: !!stripe,
        database: false
      }
    };
    
    // Check database connectivity
    try {
      // Quick database ping
      await storage.getUser('health-check-test-id');
      health.services.database = true;
    } catch (dbError) {
      // Database may not be fully ready yet, but server is running
      health.services.database = false;
      health.warnings = ['Database connectivity check failed'];
    }
    
    res.status(200).json(health);
  } catch (error: any) {
    // Even if health check has issues, respond with minimal health info
    res.status(200).json({ 
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Gracefully handle missing Stripe key (warn but don't crash)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    });
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('⚠️  Failed to initialize Stripe:', error);
    stripe = null;
  }
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured. Payment features will be disabled.');
}

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
  // Return early if Stripe is not configured
  if (!stripe) {
    console.warn('Stripe webhook received but Stripe is not configured');
    return res.status(200).json({ received: true, processed: false });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('No signature');
  }

  // Handle webhook without verification if secret is missing (development mode)
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured - skipping webhook verification');
    return res.status(200).json({ received: true, processed: false });
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
          
          const existingCouple = await storage.getCoupleByStripeSubscriptionId(subscription.id);
          if (existingCouple) {
            await storage.updateCouple(existingCouple.id, {
              status: subscription.status,
              priceId: subscriptionData.priceId || undefined,
              currentPeriodEnd: subscriptionData.currentPeriodEnd,
              cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
            });
          } else {
            await storage.upsertSubscription({
              userId,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              ...subscriptionData,
            });
          }

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
        
        const existingCouple = await storage.getCoupleByStripeSubscriptionId(subscription.id);
        if (existingCouple) {
          await storage.updateCouple(existingCouple.id, {
            status: subscription.status,
            priceId: subscriptionData.priceId || undefined,
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
          });
        } else {
          await storage.upsertSubscription({
            userId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            ...subscriptionData,
          });
        }

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
        
        const existingCouple = await storage.getCoupleByStripeSubscriptionId(subscription.id);
        if (existingCouple) {
          await storage.updateCouple(existingCouple.id, {
            status: 'canceled',
            currentPeriodEnd: subscriptionData.currentPeriodEnd,
            cancelAtPeriodEnd: 0,
          });
        } else {
          await storage.updateSubscriptionStatus(
            subscription.id,
            'canceled',
            subscriptionData.currentPeriodEnd
          );
        }

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

// Add CORS headers for production environment
app.use((req, res, next) => {
  // Allow credentials to be included in requests
  const origin = req.headers.origin;
  
  // In production, allow the deployed domain and localhost for development
  const allowedOrigins = [
    'https://twangle.org',
    'https://www.twangle.org', 
    'https://*.replit.app',
    'https://*.replit.dev',
    'http://localhost:5000',
    'http://localhost:3000'
  ];
  
  // Check if origin matches any allowed pattern
  const isAllowed = origin && allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      return new RegExp(pattern).test(origin);
    }
    return allowed === origin;
  });
  
  if (isAllowed || !origin) { // Allow requests with no origin (server-side)
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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
  try {
    console.log('🚀 Starting server initialization...');
    console.log('Environment:', process.env.NODE_ENV || 'production');
    console.log('Node version:', process.version);
    console.log('Port configuration:', process.env.PORT || '5000');
    
    // Check critical environment variables
    if (!process.env.DATABASE_URL) {
      console.error('⚠️  DATABASE_URL not set - database features may be limited');
    }
    if (!process.env.SESSION_SECRET) {
      console.warn('⚠️  SESSION_SECRET not set - using fallback (not recommended for production)');
    }
    
    // Register routes with error handling
    let server;
    try {
      server = await registerRoutes(app);
      console.log('✅ Routes registered successfully');
    } catch (routeError: any) {
      console.error('❌ Failed to register routes:', routeError.message);
      throw routeError;
    }

    // Global error handler middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Request error:', err);
    });

    // Setup static file serving based on environment
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
        console.log('✅ Development server (Vite) setup complete');
      } else {
        serveStatic(app);
        console.log('✅ Production static files configured');
      }
    } catch (staticError: any) {
      console.error('⚠️  Failed to setup static files:', staticError.message);
      // Continue anyway - the server can still handle API requests
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Create promise for server startup
    const serverStartup = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Server startup timeout after 30 seconds`));
      }, 30000);
      
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        clearTimeout(timeout);
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`✅ Server is healthy and listening on 0.0.0.0:${port}`);
        console.log(`Health check available at: http://0.0.0.0:${port}/health`);
        console.log('═══════════════════════════════════════════════════════════');
        
        // Log important configuration status
        if (!stripe) {
          console.warn('⚠️  Stripe payment features are disabled (STRIPE_SECRET_KEY not set)');
        }
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          console.warn('⚠️  Stripe webhooks verification disabled (STRIPE_WEBHOOK_SECRET not set)');
        }
        
        resolve();
      });
      
      server.on('error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    await serverStartup;
    
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ CRITICAL: Failed to start server');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Provide specific diagnostic information
    if (error.message?.includes('database') || error.message?.includes('DATABASE_URL')) {
      console.error('➡️  Database issue detected. Ensure DATABASE_URL is properly set.');
    }
    if (error.message?.includes('EADDRINUSE')) {
      console.error(`➡️  Port ${process.env.PORT || '5000'} is already in use.`);
    }
    if (error.message?.includes('EACCES')) {
      console.error(`➡️  Permission denied for port ${process.env.PORT || '5000'}.`);
    }
    if (error.message?.includes('timeout')) {
      console.error('➡️  Server startup timed out. Check for blocking operations.');
    }
    
    // Exit with error code to signal deployment failure
    process.exit(1);
  }
})();
