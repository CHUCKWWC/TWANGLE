// Reference: blueprint:javascript_log_in_with_replit
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { detectFacebookReferral, optionalAuth } from "./anonymousAuth";
import OpenAI from "openai";
import Stripe from "stripe";
import { 
  insertGeneralFeedbackSchema, 
  insertRetreatItinerarySchema,
  insertAssessmentSchema,
  attachmentStyleResultSchema,
  type AttachmentStyleResult,
  insertDateNightSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Stripe is optional for development/testing
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

const SYSTEM_PROMPT = `You are Coach Charles, an expert relationship coach trained in research-backed methods including:
- The Gottman Method (Dr. John Gottman's research on relationship stability)
- Emotionally Focused Therapy - EFT (Dr. Sue Johnson's attachment-based approach)
- Attachment Theory (Bowlby, Ainsworth)
- Positive Psychology principles

Your coaching style:
- Evidence-based: Ground advice in scientific research
- Practical: Provide actionable steps and exercises
- Empathetic: Validate emotions while guiding toward solutions
- Balanced: Consider both partners' perspectives
- Clear: Format responses with paragraphs, bullet points, and numbered steps for easy reading

Your values core:
- You have a Christian principles foundation that guides your understanding of commitment, grace, and unconditional love
- However, you do NOT mention spiritual or religious beliefs unless the user specifically asks about faith-based guidance
- Focus on universal relationship principles that apply to all couples

Key areas you help with:
- Communication and conflict resolution
- Attachment styles and emotional security
- Intimacy and connection building
- Trust repair and forgiveness
- Managing life transitions together

Format your responses for mobile readability:
- Use short paragraphs (2-3 sentences max)
- Break up long content with bullet points or numbered lists
- Include practical exercises when appropriate
- End with a reflection question or next step`;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (Reference: blueprint:javascript_log_in_with_replit)
  await setupAuth(app);
  
  // Setup Facebook referral detection for anonymous sessions
  app.use(detectFacebookReferral);

  // Auth routes (Reference: blueprint:javascript_log_in_with_replit)
  app.get('/api/auth/user', optionalAuth, async (req: any, res) => {
    try {
      // If authenticated user, return user data
      if (req.isAuthenticated?.() && req.user) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        return res.json(user);
      }
      
      // If anonymous user, return anonymous session data
      if (req.anonymousUser) {
        return res.json({
          id: req.anonymousUser.anonId,
          isAnonymous: true,
          source: req.anonymousUser.source,
        });
      }
      
      // No session at all
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User stats endpoint
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const assessments = await storage.getAssessmentsByUser(userId);
      const chatSessions = await storage.getChatSessionsByUser(userId);
      const retreats = await storage.getRetreatItineraries(userId);
      const subscription = await storage.getSubscriptionByUserId(userId);
      
      res.json({
        assessmentCount: assessments.length,
        chatSessionCount: chatSessions.length,
        retreatCount: retreats.length,
        subscriptionStatus: subscription?.status || 'none',
        subscriptionTier: subscription?.planTier || 'free',
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Update user profile
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { displayName } = req.body;

      if (displayName !== undefined && typeof displayName !== 'string') {
        return res.status(400).json({ message: "Display name must be a string" });
      }

      const updatedUser = await storage.updateUser(userId, { displayName });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Chat endpoint (protected)
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI chat not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseMessage = completion.choices[0].message.content;

      res.json({
        message: {
          role: "assistant",
          content: responseMessage,
        },
      });
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      res.status(500).json({
        error: "Failed to get response from AI coach",
        details: error.message,
      });
    }
  });

  app.post("/api/summaries/generate", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI summaries not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      const { messages, sessionId } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await storage.createChatSession({
          userId,
          messageCount: messages.length,
        });
        currentSessionId = session.id;
      } else {
        const existingSession = await storage.getChatSession(currentSessionId);
        if (!existingSession || existingSession.userId !== userId) {
          return res.status(403).json({ error: "Access denied to this session" });
        }
        
        await storage.updateChatSession(currentSessionId, {
          lastMessageAt: new Date(),
          messageCount: messages.length,
        });
      }

      const conversationText = messages
        .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Coach Charles'}: ${msg.content}`)
        .join('\n\n');

      const summaryPrompt = `As Coach Charles, analyze this coaching conversation and provide:

1. A concise summary of the main topics discussed and insights shared (2-3 paragraphs)
2. A list of 3-5 specific, actionable steps this couple should work on during the upcoming week

Format your response as JSON with this structure:
{
  "summary": "The summary text here...",
  "actionItems": [
    "Specific action item 1",
    "Specific action item 2",
    "Specific action item 3"
  ]
}

Conversation:
${conversationText}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Coach Charles, an expert relationship coach. Generate summaries and action items in JSON format.",
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0].message.content;
      const parsedResponse = JSON.parse(responseContent || "{}");

      const weeklySummary = await storage.createWeeklySummary({
        sessionId: currentSessionId,
        userId,
        summary: parsedResponse.summary || "",
        actionItems: parsedResponse.actionItems || [],
      });

      res.json({
        summary: weeklySummary,
      });
    } catch (error: any) {
      console.error("Summary generation error:", error);
      res.status(500).json({
        error: "Failed to generate weekly summary",
        details: error.message,
      });
    }
  });

  app.get("/api/summaries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summaries = await storage.getWeeklySummaries(userId);
      res.json({ summaries });
    } catch (error: any) {
      console.error("Get summaries error:", error);
      res.status(500).json({
        error: "Failed to get summaries",
        details: error.message,
      });
    }
  });

  app.post("/api/feedback/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, rating, feedbackText } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      if (sessionId) {
        const session = await storage.getChatSession(sessionId);
        if (!session || session.userId !== userId) {
          return res.status(403).json({ error: "Access denied to this session" });
        }
      }

      const feedback = await storage.createSessionFeedback({
        sessionId: sessionId || null,
        userId,
        rating,
        feedbackText: feedbackText || null,
      });

      res.json({ feedback });
    } catch (error: any) {
      console.error("Session feedback error:", error);
      res.status(500).json({
        error: "Failed to save session feedback",
        details: error.message,
      });
    }
  });

  app.get("/api/feedback/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedback = await storage.getSessionFeedback(userId);
      res.json({ feedback });
    } catch (error: any) {
      console.error("Get session feedback error:", error);
      res.status(500).json({
        error: "Failed to get session feedback",
        details: error.message,
      });
    }
  });

  app.post("/api/feedback/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { weekStartDate, relationshipScore, improvementNotes } = req.body;

      if (!weekStartDate) {
        return res.status(400).json({ error: "Week start date is required" });
      }

      if (!relationshipScore || relationshipScore < 1 || relationshipScore > 5) {
        return res.status(400).json({ error: "Relationship score must be between 1 and 5" });
      }

      const progress = await storage.createRelationshipProgress({
        userId,
        weekStartDate: new Date(weekStartDate),
        relationshipScore,
        improvementNotes: improvementNotes || null,
      });

      res.json({ progress });
    } catch (error: any) {
      console.error("Relationship progress error:", error);
      res.status(500).json({
        error: "Failed to save relationship progress",
        details: error.message,
      });
    }
  });

  app.get("/api/feedback/progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getRelationshipProgress(userId);
      res.json({ progress });
    } catch (error: any) {
      console.error("Get relationship progress error:", error);
      res.status(500).json({
        error: "Failed to get relationship progress",
        details: error.message,
      });
    }
  });

  app.get("/api/user/eligibility", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const lifetimeAccessCount = await storage.getLifetimeAccessCount();
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isEligibleForLifetime = lifetimeAccessCount < 100 && !user.hasLifetimeAccess;
      const usersRemaining = Math.max(0, 100 - lifetimeAccessCount);
      
      res.json({ 
        hasLifetimeAccess: user.hasLifetimeAccess === 1,
        isEligibleForLifetime,
        usersRemaining,
        userNumber: user.userNumber
      });
    } catch (error: any) {
      console.error("User eligibility error:", error);
      res.status(500).json({
        error: "Failed to get user eligibility",
        details: error.message,
      });
    }
  });

  app.post("/api/feedback/general", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = insertGeneralFeedbackSchema.safeParse({
        userId,
        ...req.body,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: fromZodError(validationResult.error).message 
        });
      }

      const feedback = await storage.createGeneralFeedback(validationResult.data);

      const user = await storage.getUser(userId);
      const lifetimeAccessCount = await storage.getLifetimeAccessCount();
      
      let lifetimeAccessGranted = false;
      if (user && lifetimeAccessCount < 100 && !user.hasLifetimeAccess) {
        await storage.updateUser(userId, { 
          hasLifetimeAccess: 1,
          userNumber: lifetimeAccessCount + 1
        });
        lifetimeAccessGranted = true;
      }

      res.json({ 
        feedback,
        lifetimeAccessGranted
      });
    } catch (error: any) {
      console.error("General feedback error:", error);
      res.status(500).json({
        error: "Failed to save general feedback",
        details: error.message,
      });
    }
  });

  app.get("/api/feedback/general", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackType = req.query.feedbackType as string | undefined;
      const feedback = await storage.getGeneralFeedback(userId, feedbackType);
      res.json({ feedback });
    } catch (error: any) {
      console.error("Get general feedback error:", error);
      res.status(500).json({
        error: "Failed to get general feedback",
        details: error.message,
      });
    }
  });

  app.post("/api/billing/checkout", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured", 
        message: "Stripe integration is not available" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name,
          metadata: { userId: user.id },
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customer.id });
      }

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/pay/cancel`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout creation error:", error);
      res.status(500).json({
        error: "Failed to create checkout session",
        details: error.message,
      });
    }
  });

  app.post("/api/billing/portal", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured", 
        message: "Stripe integration is not available" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ error: "No billing account found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.headers.origin}/`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Portal creation error:", error);
      res.status(500).json({
        error: "Failed to create billing portal session",
        details: error.message,
      });
    }
  });

  app.get("/api/billing/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const subscription = await storage.getSubscriptionByUserId(userId);

      const hasLifetimeAccess = user?.hasLifetimeAccess === 1;

      if (!subscription) {
        return res.json({
          tier: hasLifetimeAccess ? "premium" : "free",
          isActive: false,
          hasLifetimeAccess,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        });
      }

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const tier = isActive || hasLifetimeAccess ? "premium" : "free";

      res.json({
        tier,
        isActive,
        hasLifetimeAccess,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 1,
      });
    } catch (error: any) {
      console.error("Get billing status error:", error);
      res.status(500).json({
        error: "Failed to get billing status",
        details: error.message,
      });
    }
  });

  app.get("/api/billing/config", async (req, res) => {
    res.json({
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY,
    });
  });

  app.get("/api/billing/prices", async (req, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured" 
      });
    }

    try {
      const prices = [
        {
          id: 'monthly',
          priceId: process.env.STRIPE_PRICE_MONTHLY_ID,
          name: 'Monthly Plan',
          price: 7.99,
          interval: 'month',
          trialDays: 7,
        },
        {
          id: 'annual',
          priceId: process.env.STRIPE_PRICE_ANNUAL_ID,
          name: 'Annual Plan',
          price: 59.99,
          interval: 'year',
          trialDays: 7,
          savings: '25% savings',
        },
      ];

      res.json({ prices });
    } catch (error: any) {
      console.error("Get prices error:", error);
      res.status(500).json({
        error: "Failed to get prices",
        details: error.message,
      });
    }
  });

  app.post("/api/billing/create-subscription", isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      const { paymentMethodId, priceId } = req.body;

      if (!paymentMethodId || !priceId) {
        return res.status(400).json({ 
          error: "Missing required fields: paymentMethodId and priceId" 
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined;
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name,
          metadata: { userId: user.id },
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customer.id });
      } else {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        trial_period_days: 7,
        expand: ['latest_invoice.payment_intent'],
      });

      const subscriptionPriceId = subscription.items?.data?.[0]?.price?.id || null;
      const planTier = subscriptionPriceId ? 'premium' : 'free';
      const subscriptionData: any = subscription;
      
      await storage.upsertSubscription({
        userId: userId,
        stripeSubscriptionId: subscription.id,
        priceId: subscriptionPriceId,
        planTier,
        status: subscription.status,
        currentPeriodEnd: subscriptionData.current_period_end 
          ? new Date(subscriptionData.current_period_end * 1000) 
          : undefined,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end ? 1 : 0,
      });

      res.json({ 
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error("Create subscription error:", error);
      res.status(500).json({
        error: "Failed to create subscription",
        details: error.message,
      });
    }
  });

  app.post("/api/retreat/generate-itinerary", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI itinerary generation not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      
      const requestData = {
        userId,
        ...req.body,
        generatedItinerary: "",
      };

      if (requestData.startDate && typeof requestData.startDate === 'string') {
        requestData.startDate = new Date(requestData.startDate);
      }
      
      const validationResult = insertRetreatItinerarySchema.safeParse(requestData);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: fromZodError(validationResult.error).message 
        });
      }

      const { retreatDestination, startDate, vibe, goal, duration, budget, focuses, streetAddress, travelDistance } = validationResult.data;

      const formattedDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }) : "your selected dates";

      const locationDetails = streetAddress ? `\n- Retreat Address: ${streetAddress}` : '';
      const travelPreferences = travelDistance ? `\n- Travel Distance Preference: They're willing to travel ${travelDistance} for dining and excursions` : '';

      const itineraryPrompt = `Create a personalized couples retreat itinerary for ${retreatDestination} starting ${formattedDate}.

Retreat Details:
- Vibe: ${vibe}
- Goal: ${goal}
- Duration: ${duration}
- Budget: ${budget}
- Focus areas: ${focuses.join(', ')}${locationDetails}${travelPreferences}

Format the itinerary as a beautiful, actionable plan with:
1. A warm introduction welcoming them to their retreat
2. Day-by-day schedule with specific timing suggestions
3. Recommended activities that match their vibe and goals
4. Meal suggestions (breakfast, lunch, dinner) with restaurant recommendations within their travel distance preference
5. Relationship exercises integrated into each day
6. Evening reflection prompts for deeper connection
7. Local attraction recommendations within their preferred travel distance
8. A closing message with encouragement

Make it feel personal, romantic, and research-backed. Include practical tips like what to bring, how to prepare, and conversation starters.${travelDistance ? `\n\nIMPORTANT: When recommending restaurants and attractions, keep them within ${travelDistance} of their retreat location.` : ''}

Use clear formatting with headers, bullet points, and emojis where appropriate to make it engaging and easy to follow.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Coach Charles, an expert relationship coach who creates personalized retreat itineraries. Your itineraries blend research-backed relationship exercises with practical travel planning.",
          },
          {
            role: "user",
            content: itineraryPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2500,
      });

      const generatedItinerary = completion.choices[0].message.content || "Unable to generate itinerary";

      const savedItinerary = await storage.createRetreatItinerary({
        ...validationResult.data,
        generatedItinerary,
      });

      res.json({ 
        itinerary: savedItinerary
      });
    } catch (error: any) {
      console.error("Retreat itinerary generation error:", error);
      res.status(500).json({
        error: "Failed to generate retreat itinerary",
        details: error.message,
      });
    }
  });

  app.get("/api/retreat/itineraries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itineraries = await storage.getRetreatItineraries(userId);
      res.json({ itineraries });
    } catch (error: any) {
      console.error("Get retreat itineraries error:", error);
      res.status(500).json({
        error: "Failed to get retreat itineraries",
        details: error.message,
      });
    }
  });

  app.get("/api/retreat/itinerary/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itinerary = await storage.getRetreatItinerary(req.params.id);
      
      if (!itinerary) {
        return res.status(404).json({ error: "Itinerary not found" });
      }

      if (itinerary.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this itinerary" });
      }

      res.json({ itinerary });
    } catch (error: any) {
      console.error("Get retreat itinerary error:", error);
      res.status(500).json({
        error: "Failed to get retreat itinerary",
        details: error.message,
      });
    }
  });

  app.post("/api/datenight/generate", optionalAuth, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI date night planning not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      // Determine userId or anonId
      const userId = req.isAuthenticated?.() && req.user ? req.user.claims.sub : null;
      const anonId = req.anonymousUser?.anonId || null;
      
      if (!userId && !anonId) {
        return res.status(401).json({ error: "Authentication or anonymous session required" });
      }
      
      const validationResult = insertDateNightSchema.safeParse({
        userId,
        anonId,
        ...req.body,
        generatedPlan: "",
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: fromZodError(validationResult.error).message 
        });
      }

      const { budget, vibe, duration, location, interests, dietaryRestrictions, transportation, specialOccasion } = validationResult.data;

      const dietaryInfo = dietaryRestrictions ? `\n- Dietary restrictions/preferences: ${dietaryRestrictions}` : '';
      const transportInfo = transportation ? `\n- Transportation: ${transportation}` : '';
      const occasionInfo = specialOccasion ? `\n\nSpecial Occasion: ${specialOccasion} - Make this extra special and memorable!` : '';

      const dateNightPrompt = `Create a personalized date night plan for a couple.

Date Night Details:
- Budget: ${budget}
- Vibe: ${vibe}
- Duration: ${duration}
- Location preference: ${location}
- Shared interests: ${interests.join(', ')}${dietaryInfo}${transportInfo}${occasionInfo}

Format the date night plan as a warm, romantic, and actionable itinerary with:
1. A welcoming introduction that sets the mood
2. Detailed timeline with specific suggestions (e.g., "6:00 PM - Aperitivo at...")
3. Restaurant recommendations that match their vibe, budget, and dietary needs
4. Activity suggestions based on their interests
5. Conversation starters and connection exercises woven throughout the evening
6. Practical tips (what to wear, how to get there, reservations needed)
7. A sweet closing message with encouragement for their relationship

Make it feel personal, achievable, and designed to deepen their connection. Include specific venue suggestions when possible, backup options, and little romantic touches that make the evening memorable.

Use clear formatting with headers, bullet points, and a warm tone that feels like advice from a trusted friend.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Coach Charles, an expert relationship coach who creates personalized date night plans. Your plans blend romance with research-backed connection exercises, making every date both fun and meaningful for the couple's relationship.",
          },
          {
            role: "user",
            content: dateNightPrompt,
          },
        ],
        temperature: 0.8,
      });

      const generatedPlan = completion.choices[0].message.content || "Unable to generate plan";
      
      const savedDateNight = await storage.createDateNight({
        ...validationResult.data,
        generatedPlan
      });

      res.json({
        dateNightId: savedDateNight.id,
        plan: savedDateNight
      });
    } catch (error: any) {
      console.error("Date night generation error:", error);
      res.status(500).json({
        error: "Failed to generate date night plan",
        details: error.message,
      });
    }
  });

  app.get("/api/datenight/plans", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.claims.sub : null;
      const anonId = req.anonymousUser?.anonId || null;
      
      if (!userId && !anonId) {
        return res.json({ plans: [] });
      }
      
      const plans = userId 
        ? await storage.getDateNights(userId)
        : await storage.getDateNightsByAnonId(anonId!);
      res.json({ plans });
    } catch (error: any) {
      console.error("Get date night plans error:", error);
      res.status(500).json({
        error: "Failed to get date night plans",
        details: error.message,
      });
    }
  });

  app.get("/api/datenight/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plan = await storage.getDateNight(req.params.id);
      
      if (!plan) {
        return res.status(404).json({ error: "Date night plan not found" });
      }

      if (plan.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this date night plan" });
      }

      res.json({ plan });
    } catch (error: any) {
      console.error("Get date night plan error:", error);
      res.status(500).json({
        error: "Failed to get date night plan",
        details: error.message,
      });
    }
  });

  app.post("/api/assessments", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.claims.sub : null;
      const anonId = req.anonymousUser?.anonId || null;
      
      if (!userId && !anonId) {
        return res.status(401).json({ error: "Authentication or anonymous session required" });
      }
      
      const validationResult = insertAssessmentSchema.safeParse({ 
        userId,
        anonId,
        responses: req.body.responses 
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: fromZodError(validationResult.error).message 
        });
      }

      const assessment = await storage.createAssessment(validationResult.data);
      res.json({ assessmentId: assessment.id });
    } catch (error: any) {
      console.error("Create assessment error:", error);
      res.status(500).json({
        error: "Failed to create assessment",
        details: error.message,
      });
    }
  });

  app.get("/api/assessments/:id", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.claims.sub : null;
      const anonId = req.anonymousUser?.anonId || null;
      const assessment = await storage.getAssessment(req.params.id);
      
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Allow access if user owns it or anon user owns it
      if (assessment.userId && assessment.userId !== userId) {
        return res.status(403).json({ error: "Access denied to this assessment" });
      }
      if (assessment.anonId && assessment.anonId !== anonId) {
        return res.status(403).json({ error: "Access denied to this assessment" });
      }

      res.json({ assessment });
    } catch (error: any) {
      console.error("Get assessment error:", error);
      res.status(500).json({
        error: "Failed to get assessment",
        details: error.message,
      });
    }
  });

  app.post("/api/assessments/:id/analyze", optionalAuth, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI analysis not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      
      if (assessment.result) {
        return res.json({ result: assessment.result });
      }

      const responses = assessment.responses as Record<string, string>;
      const prompt = `You are an expert in attachment theory psychology. Analyze these attachment style assessment responses and return a comprehensive analysis in JSON format.

Responses:
${Object.entries(responses).map(([q, a]) => `Question ${q}: ${a}`).join('\n')}

Return this exact JSON structure with your analysis:
{
  "primaryStyle": "secure" | "anxious" | "avoidant" | "fearful",
  "stylePercentages": {
    "secure": <number 0-100>,
    "anxious": <number 0-100>,
    "avoidant": <number 0-100>,
    "fearful": <number 0-100>
  },
  "description": "<comprehensive description of their primary attachment style>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "growthAreas": ["<growth area 1>", "<growth area 2>", "<growth area 3>"],
  "analysis": "<detailed analysis of their attachment patterns, including how they show up in relationships and suggestions for growth>"
}

Make sure the percentages add up to 100. Base your analysis on established attachment theory research.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a compassionate attachment theory expert with deep knowledge of relationship psychology." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const resultText = completion.choices[0].message.content || "{}";
      const parsedResult = JSON.parse(resultText);
      
      const validationResult = attachmentStyleResultSchema.safeParse(parsedResult);
      if (!validationResult.success) {
        console.error("AI response validation error:", fromZodError(validationResult.error));
        return res.status(500).json({ 
          error: "Failed to validate AI analysis",
          details: fromZodError(validationResult.error).message
        });
      }

      await storage.updateAssessmentResult(req.params.id, validationResult.data);
      res.json({ result: validationResult.data });
    } catch (error: any) {
      console.error("Assessment analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze assessment",
        details: error.message,
      });
    }
  });

  app.post("/api/assessments/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessment = await storage.getAssessment(req.params.id);
      
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      if (assessment.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.enableSharing(req.params.id);
      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${updated?.shareToken}`;
      
      res.json({ 
        shareToken: updated?.shareToken,
        shareUrl
      });
    } catch (error: any) {
      console.error("Enable sharing error:", error);
      res.status(500).json({
        error: "Failed to enable sharing",
        details: error.message,
      });
    }
  });

  app.get("/api/shared/:shareToken", async (req: any, res) => {
    try {
      const assessment = await storage.getSharedAssessment(req.params.shareToken);
      
      if (!assessment || !assessment.isShared) {
        return res.status(404).json({ error: "Shared assessment not found" });
      }

      res.json({ result: assessment.result });
    } catch (error: any) {
      console.error("Get shared assessment error:", error);
      res.status(500).json({
        error: "Failed to get shared assessment",
        details: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
