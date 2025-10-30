// Reference: blueprint:javascript_log_in_with_replit
import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { detectFacebookReferral, optionalAuth, ensureAnonymousSession } from "./anonymousAuth";
import { logUserAccess } from "./accessLogger";
import { sendVerificationEmail, sendWelcomeEmail } from "./gmail";
import OpenAI from "openai";
import Stripe from "stripe";
import { trackSubscribe, trackCompleteRegistration } from "./facebookConversions";
import { 
  insertGeneralFeedbackSchema, 
  insertRetreatItinerarySchema,
  insertAssessmentSchema,
  attachmentStyleResultSchema,
  type AttachmentStyleResult,
  insertDateNightSchema,
  type VisionPlanning
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { isAdminUser } from "@shared/adminAccess";
import { randomUUID } from "crypto";

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

// Admin authorization middleware
const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userEmail = req.user.claims.email;
  if (!isAdminUser(userEmail)) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth (Reference: blueprint:javascript_log_in_with_replit)
  await setupAuth(app);
  
  // Setup Facebook referral detection for anonymous sessions
  app.use(detectFacebookReferral);
  
  // Ensure all visitors have an anonymous session (freemium model)
  app.use(ensureAnonymousSession);

  // Auth routes (Reference: blueprint:javascript_log_in_with_replit)
  app.get('/api/auth/user', optionalAuth, logUserAccess, async (req: any, res) => {
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

  // Facebook login endpoint
  app.post('/api/auth/facebook', async (req: any, res) => {
    try {
      const { accessToken, userID, name, email, picture } = req.body;

      if (!accessToken || !userID) {
        return res.status(400).json({ message: "Facebook access token and user ID are required" });
      }

      // Validate the access token with Facebook's Graph API
      try {
        // Create app access token for secure validation
        const appId = process.env.VITE_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        
        if (!appId) {
          console.error('Facebook App ID not configured');
          return res.status(500).json({ message: "Facebook login not configured" });
        }

        const appAccessToken = appSecret ? `${appId}|${appSecret}` : accessToken;
        
        const tokenDebugResponse = await fetch(
          `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
        );
        
        if (!tokenDebugResponse.ok) {
          console.error('Facebook debug_token API error:', tokenDebugResponse.status);
          return res.status(401).json({ message: "Failed to validate token with Facebook" });
        }

        const tokenDebugData = await tokenDebugResponse.json();

        if (!tokenDebugData.data?.is_valid) {
          console.error('Invalid Facebook token:', tokenDebugData);
          return res.status(401).json({ message: "Invalid Facebook access token" });
        }

        // Verify the token is for our app (critical security check)
        if (appSecret && tokenDebugData.data.app_id !== appId) {
          console.error('Token app ID mismatch:', { expected: appId, actual: tokenDebugData.data.app_id });
          return res.status(401).json({ message: "Token not issued for this app" });
        }

        if (tokenDebugData.data.user_id !== userID) {
          console.error('Token user ID mismatch:', { expected: userID, actual: tokenDebugData.data.user_id });
          return res.status(401).json({ message: "Token user ID mismatch" });
        }

        // Fetch verified user data from Facebook
        const userResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );
        
        if (!userResponse.ok) {
          console.error('Facebook Graph API error:', userResponse.status);
          return res.status(401).json({ message: "Failed to fetch user data from Facebook" });
        }

        const fbUserData = await userResponse.json();

        if (fbUserData.error) {
          console.error('Facebook API error:', fbUserData.error);
          return res.status(401).json({ message: "Failed to fetch user data from Facebook" });
        }

        // Verify the user ID matches the token
        if (fbUserData.id !== tokenDebugData.data.user_id) {
          console.error('User ID mismatch between token and profile:', { 
            token: tokenDebugData.data.user_id, 
            profile: fbUserData.id 
          });
          return res.status(401).json({ message: "User data verification failed" });
        }

        if (!fbUserData.email) {
          return res.status(400).json({ message: "Facebook account must have an email address" });
        }

        // Check if user exists by email first
        let user = await storage.getUserByEmail(fbUserData.email);
        let isNewUser = false;
        
        if (!user) {
          // Create new user with verified Facebook data
          const nameParts = fbUserData.name ? fbUserData.name.split(' ') : ['', ''];
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          user = await storage.upsertUser({
            id: `facebook_${fbUserData.id}`,
            email: fbUserData.email,
            firstName,
            lastName,
            profileImageUrl: fbUserData.picture?.data?.url || null,
          });
          
          isNewUser = true;
          
          // Track Facebook conversion for new registration
          trackCompleteRegistration({
            email: user.email!,
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
          }).catch(err => console.error('Facebook conversion tracking error:', err));
        }

        // Create a session by logging in the user with Passport
        const sessionUser = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.profileImageUrl,
          }
        };

        req.logIn(sessionUser, (err: any) => {
          if (err) {
            console.error('Facebook login error:', err);
            return res.status(500).json({ message: "Failed to create session" });
          }

          res.json({ user });
        });
      } catch (fbError) {
        console.error('Facebook API validation error:', fbError);
        return res.status(401).json({ message: "Failed to validate Facebook credentials" });
      }
    } catch (error) {
      console.error("Facebook authentication error:", error);
      res.status(500).json({ message: "Facebook authentication failed" });
    }
  });

  // Test reviewer login endpoint (for Facebook App Review)
  app.post('/api/auth/reviewer-login', async (req: any, res) => {
    try {
      const { accessCode } = req.body;
      
      // Only allow this specific access code
      if (accessCode !== 'FB_REVIEW_2025_TWANGLE') {
        return res.status(401).json({ message: "Invalid access code" });
      }

      // Get the test reviewer account
      const user = await storage.getUser('facebook_test_reviewer_2025');
      
      if (!user) {
        return res.status(404).json({ message: "Test account not found" });
      }

      // Create a session for the test reviewer
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
        }
      };

      req.logIn(sessionUser, (err: any) => {
        if (err) {
          console.error('Reviewer login error:', err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        res.json({ user });
      });
    } catch (error) {
      console.error("Reviewer authentication error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Facebook deauthorize callback
  app.post('/api/auth/facebook/deauthorize', express.urlencoded({ extended: true }), async (req, res) => {
    try {
      const signedRequest = req.body.signed_request;
      
      if (!signedRequest || typeof signedRequest !== 'string') {
        console.error('Invalid deauthorize request: missing signed_request');
        return res.status(400).send('Invalid request');
      }

      // Parse the signed request
      const [encodedSig, payload] = signedRequest.split('.');
      
      if (!encodedSig || !payload) {
        console.error('Invalid signed request format');
        return res.status(400).send('Invalid request format');
      }

      // Decode payload
      const dataStr = Buffer.from(payload, 'base64').toString('utf-8');
      const data = JSON.parse(dataStr);

      // Verify algorithm
      if (data.algorithm?.toUpperCase() !== 'HMAC-SHA256') {
        console.error('Invalid algorithm:', data.algorithm);
        return res.status(400).send('Invalid algorithm');
      }

      // Verify signature (optional but recommended)
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (appSecret) {
        const crypto = await import('crypto');
        const hmac = crypto.createHmac('sha256', appSecret);
        const expectedSig = hmac.update(payload).digest('base64')
          .replace(/\//g, '_')
          .replace(/\+/g, '-')
          .replace(/={1,2}$/, '');
        
        if (encodedSig !== expectedSig) {
          console.error('Invalid signature');
          return res.status(400).send('Invalid signature');
        }
      }

      const facebookUserId = data.user_id;
      
      if (!facebookUserId) {
        console.error('No user_id in deauthorize request');
        return res.status(400).send('Missing user_id');
      }

      // Find and handle the user
      const userId = `facebook_${facebookUserId}`;
      const user = await storage.getUser(userId);
      
      if (user) {
        // Log the deauthorization
        console.log(`User deauthorized: ${user.email} (${userId})`);
        
        // Option 1: Delete the user (uncomment if you want to delete)
        // await storage.deleteUser(userId);
        
        // Option 2: Mark as deauthorized (keeping data for potential re-authorization)
        // You could add a 'deauthorized' flag to the user schema if needed
        
        // For now, we just log it and keep the data
      }

      // Must return 200 OK
      res.status(200).send('OK');
    } catch (error) {
      console.error('Deauthorize callback error:', error);
      // Still return 200 to Facebook
      res.status(200).send('OK');
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

      // Track Facebook conversion for subscription
      const priceAmount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
      const value = priceAmount / 100; // Convert cents to dollars
      trackSubscribe({
        email: user.email!,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
      }, value, 'USD').catch(err => console.error('Facebook conversion tracking error:', err));

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

      const { retreatDestination, startDate, vibe, goal, duration, budget, focuses, streetAddress, travelDistance, visionPlanning } = validationResult.data;

      const formattedDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }) : "your selected dates";

      const locationDetails = streetAddress ? `\n- Retreat Address: ${streetAddress}` : '';
      const travelPreferences = travelDistance ? `\n- Travel Distance Preference: They're willing to travel ${travelDistance} for dining and excursions` : '';

      // Build vision planning context
      let visionContext = '';
      let hasVisionPlanning = false;
      const visionData = visionPlanning as VisionPlanning;
      
      if (visionPlanning) {
        const focusTimelines = visionData?.focusTimelines;
        const focusDimensions = visionData?.focusDimensions;
        
        const timelineLabels: Record<string, string> = {
          sixMonths: '6 months',
          oneYear: '1 year',
          fiveYears: '5 years',
          tenYears: '10 years',
        };
        
        const dimensionLabels: Record<string, string> = {
          financial: 'Financial goals and money management',
          intimacy: 'Intimacy, romance, and emotional connection',
          health: 'Health, wellness, and physical fitness',
          career: 'Career paths and professional growth',
          business: 'Business ventures and entrepreneurship',
          spiritual: 'Spiritual life and faith journey',
          ministry: 'Ministry, service, and giving back',
          family: 'Family planning and parenting',
          personal: 'Personal growth and self-improvement',
          community: 'Community involvement and friendships',
          legacy: 'Long-term legacy and impact',
        };
        
        if ((focusTimelines && focusTimelines.length > 0) || (focusDimensions && focusDimensions.length > 0)) {
          hasVisionPlanning = true;
          visionContext += '\n\nVision Planning Focus:\nThe couple wants to explore and align on their future vision in these areas:';
          
          if (focusTimelines && focusTimelines.length > 0) {
            const timeframeList = focusTimelines.map(t => timelineLabels[t] || t).join(', ');
            visionContext += `\n- Time horizons they want to discuss: ${timeframeList}`;
          }
          
          if (focusDimensions && focusDimensions.length > 0) {
            visionContext += '\n- Life dimensions they want to align on:';
            focusDimensions.forEach(d => {
              visionContext += `\n  • ${dimensionLabels[d] || d}`;
            });
          }
          
          visionContext += '\n\nIMPORTANT: Include specific research-backed exercises in the itinerary to help them explore these areas together. Draw from Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory frameworks, citing these by name. Include conversation starters, reflection activities, and goal-setting exercises that guide them through answering vision planning questions during the retreat.';
        }
      }

      console.log('[Retreat Generation] Vision Planning Context:', {
        hasVisionPlanning,
        focusTimelines: visionData?.focusTimelines,
        focusDimensions: visionData?.focusDimensions,
        visionContextLength: visionContext.length
      });

      const itineraryPrompt = `Create a personalized couples retreat itinerary for ${retreatDestination} starting ${formattedDate}.

Retreat Details:
- Vibe: ${vibe}
- Goal: ${goal}
- Duration: ${duration}
- Budget: ${budget}
- Focus areas: ${focuses.join(', ')}${locationDetails}${travelPreferences}${visionContext}

Format the itinerary as a beautiful, actionable plan with:
1. A warm introduction welcoming them to their retreat
2. Day-by-day schedule with specific timing suggestions
3. Recommended activities that match their vibe and goals
4. Meal suggestions (breakfast, lunch, dinner) with restaurant recommendations within their travel distance preference
5. Relationship exercises integrated into each day${hasVisionPlanning ? ' - IMPORTANT: Include specific exercises that help them explore their selected vision planning areas. These should be structured activities with prompts and questions to guide their conversations.' : ''}
6. Evening reflection prompts for deeper connection${hasVisionPlanning ? ' - Include vision planning exercises with specific questions about their future in the areas they selected' : ''}
7. Local attraction recommendations within their preferred travel distance
8. A closing message with encouragement${hasVisionPlanning ? ' that acknowledges the vision planning work they did together' : ''}

Make it feel personal, romantic, and research-backed. Include practical tips like what to bring, how to prepare, and conversation starters.${travelDistance ? `\n\nIMPORTANT: When recommending restaurants and attractions, keep them within ${travelDistance} of their retreat location.` : ''}${hasVisionPlanning ? '\n\nCRITICAL: The couple has indicated they want to work on vision planning during the retreat. Throughout the itinerary, include specific exercises (with step-by-step instructions) that help them:\n- Discuss and align on their vision for the selected timeframes\n- Explore shared goals in their selected life dimensions\n- Answer vision planning questions together through guided activities\n- Create action plans based on their discussions\n\nThese exercises MUST be drawn from Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory frameworks. Cite these frameworks by name when introducing exercises (e.g., Gottman Dreams Within Conflict or EFT Attachment Conversation). Give them concrete tools to use during the retreat. Make the exercises feel natural and integrated into the flow of each day.' : ''}

Use clear formatting with headers, bullet points, and emojis where appropriate to make it engaging and easy to follow.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Coach Charles, an expert relationship coach who creates personalized retreat itineraries. Your itineraries blend research-backed relationship exercises from Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory with practical travel planning. Always cite these frameworks by name when suggesting exercises.",
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

  app.get("/api/datenight/:id", optionalAuth, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.claims.sub : null;
      const anonId = req.anonymousUser?.anonId || null;
      const plan = await storage.getDateNight(req.params.id);
      
      if (!plan) {
        return res.status(404).json({ error: "Date night plan not found" });
      }

      // Check ownership - either by userId or anonId
      const hasAccess = (userId && plan.userId === userId) || (anonId && plan.anonId === anonId);
      if (!hasAccess) {
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

  // Access reporting endpoints
  app.get("/api/reports/access-logs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getAccessLogs(limit);
      res.json(logs);
    } catch (error: any) {
      console.error("Get access logs error:", error);
      res.status(500).json({
        error: "Failed to get access logs",
        details: error.message,
      });
    }
  });

  app.get("/api/reports/access-stats-country", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAccessStatsByCountry();
      res.json(stats);
    } catch (error: any) {
      console.error("Get country stats error:", error);
      res.status(500).json({
        error: "Failed to get country statistics",
        details: error.message,
      });
    }
  });

  app.get("/api/reports/access-stats-user", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAccessStatsByUser();
      res.json(stats);
    } catch (error: any) {
      console.error("Get user stats error:", error);
      res.status(500).json({
        error: "Failed to get user statistics",
        details: error.message,
      });
    }
  });

  app.get("/api/reports/access-summary", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const [totalAccess, uniqueUsers] = await Promise.all([
        storage.getTotalAccessCount(),
        storage.getUniqueUserAccessCount(),
      ]);
      res.json({ totalAccess, uniqueUsers });
    } catch (error: any) {
      console.error("Get access summary error:", error);
      res.status(500).json({
        error: "Failed to get access summary",
        details: error.message,
      });
    }
  });

  // Admin endpoint to grant lifetime access to test accounts
  app.post("/api/admin/grant-access", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found with that email" });
      }

      const updated = await storage.updateUser(user.id, { hasLifetimeAccess: 1 });
      
      res.json({ 
        success: true, 
        message: `Lifetime access granted to ${email}`,
        user: updated
      });
    } catch (error: any) {
      console.error("Grant access error:", error);
      res.status(500).json({
        error: "Failed to grant access",
        details: error.message,
      });
    }
  });

  // Email verification endpoints
  app.post("/api/send-verification-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User email not found" });
      }

      if (user.emailVerified) {
        return res.json({ message: "Email already verified" });
      }

      const token = randomUUID();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      await storage.setEmailVerificationToken(userId, token, expires);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await sendVerificationEmail(user.email, token, baseUrl);
      
      res.json({ success: true, message: "Verification email sent" });
    } catch (error: any) {
      console.error("Send verification email error:", error);
      res.status(500).json({
        error: "Failed to send verification email",
        details: error.message,
      });
    }
  });

  app.get("/api/verify-email", async (req: any, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.redirect('/?verified=false&reason=missing');
      }

      const user = await storage.getUserByVerificationToken(token as string);
      
      if (!user) {
        return res.redirect('/?verified=false&reason=invalid');
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        await storage.setEmailVerificationToken(user.id, '', new Date(0));
        return res.redirect('/?verified=false&reason=expired');
      }

      await storage.markEmailVerified(user.id);
      
      if (user.email) {
        await sendWelcomeEmail(user.email, user.firstName ?? undefined);
      }
      
      res.redirect('/?verified=true');
    } catch (error: any) {
      console.error("Verify email error:", error);
      res.redirect('/?verified=false&reason=error');
    }
  });

  app.post("/api/newsletter/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateNewsletterSubscription(userId, true);
      res.json({ success: true, message: "Subscribed to newsletter" });
    } catch (error: any) {
      console.error("Newsletter subscribe error:", error);
      res.status(500).json({
        error: "Failed to subscribe to newsletter",
        details: error.message,
      });
    }
  });

  app.post("/api/newsletter/unsubscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.updateNewsletterSubscription(userId, false);
      res.json({ success: true, message: "Unsubscribed from newsletter" });
    } catch (error: any) {
      console.error("Newsletter unsubscribe error:", error);
      res.status(500).json({
        error: "Failed to unsubscribe from newsletter",
        details: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
