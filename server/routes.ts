import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { logUserAccess } from "./accessLogger";
import { sendVerificationEmail, sendWelcomeEmail, sendTrialReminder, sendPartnerInvitationEmail, sendPartnerInviteEmail } from "./gmail";
import OpenAI from "openai";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { trackSubscribe, trackCompleteRegistration } from "./facebookConversions";
import { 
  insertGeneralFeedbackSchema, 
  insertRetreatItinerarySchema,
  insertAssessmentSchema,
  attachmentStyleResultSchema,
  type AttachmentStyleResult,
  insertDateNightSchema,
  type VisionPlanning,
  insertPartnershipSchema,
  partnershipRequestSchema,
  insertJournalEntrySchema,
  journalEntryRequestSchema,
  insertConversationResponseSchema,
  conversationResponseRequestSchema,
  insertAnalyticsSnapshotSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { isAdminUser } from "@shared/adminAccess";
import { randomUUID } from "crypto";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Stripe is optional for development/testing
// IMPORTANT: API key must be provided in environment variables
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover", // Using latest Stripe API version
    })
  : null;

// IP-based rate limiter for anonymous chat to prevent API abuse
const anonymousChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 requests per IP per hour
  message: { 
    error: "Too many requests",
    message: "You've reached the maximum number of demo messages. Please sign up for unlimited access.",
    requiresAuth: true 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply rate limit to anonymous users
  skip: (req: any) => !!req.user?.id,
});

const SYSTEM_PROMPT = `You are AI Coach Charles, an expert relationship coach trained in research-backed methods including:
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

IMPORTANT BOUNDARIES - Stay within scope:
You are ONLY a relationship coach. You do NOT provide:
- Medical advice, diagnosis, or treatment recommendations
- Mental health therapy or clinical psychology services
- Legal advice about divorce, custody, or family law
- Financial planning or investment advice
- Career counseling unrelated to relationships
- Technical support or general knowledge questions
- Advice on topics unrelated to relationships and couples

If asked about topics outside your scope, politely decline and redirect:
"I'm a relationship coach focused on helping couples strengthen their connection. For [medical/legal/financial/etc.] matters, I recommend consulting a qualified [professional]. However, I'm happy to help with how [that situation] might be affecting your relationship. Would you like to explore that?"

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
  
  const userEmail = req.user.email;
  if (!isAdminUser(userEmail)) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  
  next();
};

async function checkUserPremiumAccess(userId: string): Promise<{
  hasPremiumAccess: boolean;
  source: 'individual_subscription' | 'couple_subscription' | 'lifetime' | 'trial' | 'none';
  subscription?: any;
  couple?: any;
}> {
  const user = await storage.getUser(userId);
  if (!user) {
    return { hasPremiumAccess: false, source: 'none' };
  }

  if (user.hasLifetimeAccess === 1) {
    return { hasPremiumAccess: true, source: 'lifetime' };
  }

  const now = new Date();
  const hasActiveTrial = user.trialStartedAt && user.trialEndsAt && now < user.trialEndsAt;
  if (hasActiveTrial) {
    return { hasPremiumAccess: true, source: 'trial' };
  }

  const subscription = await storage.getSubscriptionByUserId(userId);
  if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
    return { hasPremiumAccess: true, source: 'individual_subscription', subscription };
  }

  let couple = await storage.getCoupleByPrimaryUser(userId);
  let isCoupleUser = false;
  if (couple) {
    isCoupleUser = true;
  } else {
    couple = await storage.getCoupleByPartnerUser(userId);
    if (couple) {
      isCoupleUser = true;
    }
  }

  if (isCoupleUser && couple && (couple.status === 'active' || couple.status === 'trialing')) {
    return { hasPremiumAccess: true, source: 'couple_subscription', couple };
  }

  return { hasPremiumAccess: false, source: 'none' };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup custom Twangle authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      return res.json(user);
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
        // Pass the user object directly, not wrapped in claims
        // This matches how standard login/registration works
        req.logIn(user, (err: any) => {
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
      // Pass the user object directly, not wrapped in claims
      // This matches how standard login/registration works
      req.logIn(user, (err: any) => {
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
  app.get('/api/user/stats', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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

  // Public social proof statistics endpoint (no authentication required)
  app.get('/api/social-proof', async (req: any, res) => {
    try {
      // Query database for statistics
      const [userCount, messageCount, ratingData] = await Promise.all([
        storage.getTotalUserCount(),
        storage.getTotalMessageCount(),
        storage.getAverageSessionRating()
      ]);

      res.json({
        userCount,
        messageCount,
        avgRating: ratingData.avgRating > 0 ? Number(ratingData.avgRating.toFixed(1)) : 4.8,
        feedbackCount: ratingData.count
      });
    } catch (error) {
      console.error("Error fetching social proof statistics:", error);
      // Return fallback statistics on error
      res.json({
        userCount: 2300,
        messageCount: 12400,
        avgRating: 4.8,
        feedbackCount: 0
      });
    }
  });

  // Newsletter subscription endpoint (public, no auth required)
  app.post('/api/newsletter/subscribe', async (req: any, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Valid email is required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // Update existing user's newsletter subscription
        await storage.updateNewsletterSubscription(user.id, true);
        return res.json({ 
          message: "Successfully subscribed to newsletter",
          alreadyRegistered: true
        });
      } else {
        // Create a newsletter-only user (no full registration)
        user = await storage.createUser({
          email,
          newsletterSubscribed: 1,
        });
        
        return res.json({ 
          message: "Successfully subscribed to newsletter",
          alreadyRegistered: false
        });
      }
    } catch (error) {
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Update user profile
  app.put('/api/user/profile', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Chat endpoint (supports both authenticated and anonymous users)
  // Anonymous users are rate-limited by IP to prevent API abuse
  app.post("/api/chat", anonymousChatLimiter, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI chat not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const { messages, sessionId } = req.body;
      const userId = req.user?.claims?.sub;
      const isAnonymous = !userId;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Backend enforcement of freemium limits for anonymous users
      if (isAnonymous) {
        // Track message count in session for anonymous users
        if (!req.session.anonymousChatCount) {
          req.session.anonymousChatCount = 0;
        }
        
        // Enforce 3-message limit for anonymous users
        if (req.session.anonymousChatCount >= 3) {
          return res.status(403).json({ 
            error: "Free message limit reached",
            message: "You've used your 3 free messages. Sign in to continue chatting.",
            requiresAuth: true
          });
        }
        
        // Increment anonymous message count
        req.session.anonymousChatCount += 1;
      }

      // Track chat sessions for authenticated users (for trial progress tracking)
      let currentSessionId = sessionId;
      if (userId) {
        if (!currentSessionId) {
          // Create a new session
          const session = await storage.createChatSession({
            userId,
            messageCount: 1,
          });
          currentSessionId = session.id;
        } else {
          // Update existing session
          const existingSession = await storage.getChatSession(currentSessionId);
          if (existingSession && existingSession.userId === userId) {
            await storage.updateChatSession(currentSessionId, {
              messageCount: (existingSession.messageCount || 0) + 1,
            });
          }
        }
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
        sessionId: currentSessionId,
      });
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      res.status(500).json({
        error: "Failed to get response from AI coach",
        details: error.message,
      });
    }
  });

  app.post("/api/summaries/generate", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI summaries not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const userId = req.user.id;
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
        .map((msg: any) => `${msg.role === 'user' ? 'User' : 'AI Coach Charles'}: ${msg.content}`)
        .join('\n\n');

      const summaryPrompt = `As AI Coach Charles, analyze this coaching conversation and provide:

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
            content: "You are AI Coach Charles, an expert relationship coach. Generate summaries and action items in JSON format.",
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

  app.get("/api/summaries", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/feedback/session", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/feedback/session", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/feedback/progress", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/feedback/progress", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/user/eligibility", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/feedback/general", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
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

  app.get("/api/feedback/general", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/billing/checkout", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured", 
        message: "Stripe integration is not available" 
      });
    }

    try {
      const userId = req.user.id;
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

  app.post("/api/billing/portal", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured", 
        message: "Stripe integration is not available" 
      });
    }

    try {
      const userId = req.user.id;
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

  app.get("/api/billing/status", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const accessCheck = await checkUserPremiumAccess(userId);
      const subscription = await storage.getSubscriptionByUserId(userId);

      const hasLifetimeAccess = user.hasLifetimeAccess === 1;
      
      // Check if user has an active free trial
      const now = new Date();
      const hasActiveTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
      const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

      // Determine tier based on premium access check
      const tier = accessCheck.hasPremiumAccess ? "premium" : "free";
      
      // Get current period end and cancel status
      let currentPeriodEnd = trialEndsAt;
      let cancelAtPeriodEnd = false;
      
      if (accessCheck.source === 'individual_subscription' && subscription) {
        currentPeriodEnd = subscription.currentPeriodEnd || trialEndsAt;
        cancelAtPeriodEnd = subscription.cancelAtPeriodEnd === 1;
      } else if (accessCheck.source === 'couple_subscription' && accessCheck.couple) {
        currentPeriodEnd = accessCheck.couple.currentPeriodEnd || trialEndsAt;
        cancelAtPeriodEnd = accessCheck.couple.cancelAtPeriodEnd === 1;
      }

      res.json({
        tier,
        isActive: accessCheck.hasPremiumAccess,
        hasLifetimeAccess,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        onTrial: hasActiveTrial && accessCheck.source === 'trial',
        trialEndsAt,
        subscriptionSource: accessCheck.source,
        isCoupleMember: accessCheck.source === 'couple_subscription',
      });
    } catch (error: any) {
      console.error("Get billing status error:", error);
      res.status(500).json({
        error: "Failed to get billing status",
        details: error.message,
      });
    }
  });

  app.get("/api/trial/progress", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is on trial
      const now = new Date();
      const hasActiveTrial = user.trialEndsAt && new Date(user.trialEndsAt) > now;
      const trialStartedAt = user.trialStartedAt ? new Date(user.trialStartedAt) : null;
      const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

      // Calculate days remaining
      let daysRemaining = 0;
      let totalTrialDays = 7;
      if (trialEndsAt && hasActiveTrial) {
        const msRemaining = trialEndsAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      }

      // Get accumulated value metrics
      const chatSessions = await storage.getChatSessionsByUser(userId);
      const assessments = await storage.getAssessmentsByUser(userId);
      const retreats = await storage.getRetreatItineraries(userId);
      const dateNights = await storage.getDateNights(userId);

      // Count only completed assessments (responses is JSONB object, not array)
      const completedAssessments = assessments.filter((a: any) => 
        a.responses && typeof a.responses === 'object' && Object.keys(a.responses).length > 0
      ).length;

      res.json({
        onTrial: hasActiveTrial || false,
        trialStartedAt: trialStartedAt,
        trialEndsAt: trialEndsAt,
        daysRemaining,
        totalTrialDays,
        metrics: {
          chatSessions: chatSessions.length,
          assessments: completedAssessments,
          retreats: retreats.length,
          dateNights: dateNights.length,
        },
      });
    } catch (error: any) {
      console.error("Get trial progress error:", error);
      res.status(500).json({
        error: "Failed to get trial progress",
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
          id: 'couple',
          priceId: process.env.STRIPE_PRICE_COUPLE_ID || process.env.STRIPE_PRICE_MONTHLY_ID,
          name: 'Couple Plan',
          price: 19.99,
          interval: 'month',
          trialDays: 7,
          features: ['Full access for both partners', 'Unlimited everything', 'AI Coach access', 'Partner collaboration tools'],
          popular: true,
          bestValue: true,
        },
        {
          id: 'starter',
          priceId: process.env.STRIPE_PRICE_STARTER_ID,
          name: 'Couples Starter',
          price: 12.00,
          interval: 'month',
          trialDays: 7,
          features: ['Limited saved retreats (3)', 'AI Coach access', 'Basic exercises'],
        },
        {
          id: 'monthly',
          priceId: process.env.STRIPE_PRICE_MONTHLY_ID,
          name: 'Premium Plan',
          price: 20.00,
          interval: 'month',
          trialDays: 7,
          features: ['Unlimited everything', 'Weekly summaries', 'Priority support'],
        },
        {
          id: 'annual',
          priceId: process.env.STRIPE_PRICE_ANNUAL_ID,
          name: 'Annual Plan',
          price: 180.00,
          interval: 'year',
          trialDays: 7,
          savings: 'Save $60/year',
          features: ['All Premium features', 'Best value', '2 months free'],
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

  app.post("/api/billing/create-subscription", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!stripe) {
      return res.status(501).json({ 
        error: "Billing not configured" 
      });
    }

    try {
      const userId = req.user.id;
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
      
      const isCouplePlan = priceId === process.env.STRIPE_PRICE_COUPLE_ID;
      
      if (isCouplePlan) {
        const existingCouple = await storage.getCoupleByPrimaryUser(userId);
        
        if (existingCouple) {
          await storage.updateCouple(existingCouple.id, {
            stripeSubscriptionId: subscription.id,
            priceId: subscriptionPriceId || undefined,
            status: subscription.status,
            currentPeriodEnd: subscriptionData.current_period_end 
              ? new Date(subscriptionData.current_period_end * 1000) 
              : undefined,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end ? 1 : 0,
          });
        } else {
          const couple = await storage.createCouple({
            primaryUserId: userId,
            partnerUserId: null,
            stripeSubscriptionId: subscription.id,
            priceId: subscriptionPriceId || undefined,
            status: subscription.status,
            currentPeriodEnd: subscriptionData.current_period_end 
              ? new Date(subscriptionData.current_period_end * 1000) 
              : undefined,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end ? 1 : 0,
          });
          
          await storage.updateUser(userId, { coupleId: couple.id });
        }
      } else {
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
      }

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

  app.post("/api/retreat/generate-itinerary", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI itinerary generation not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const userId = req.user.id;
      
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
            content: "You are AI Coach Charles, an expert relationship coach who creates personalized retreat itineraries. Your itineraries blend research-backed relationship exercises from Gottman Method, Emotionally Focused Therapy (EFT), and Attachment Theory with practical travel planning. Always cite these frameworks by name when suggesting exercises.",
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

  app.get("/api/retreat/itineraries", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get("/api/retreat/itinerary/:id", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/datenight/generate", isAuthenticated, logUserAccess, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI date night planning not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      // Determine userId or anonId
      const userId = req.isAuthenticated?.() && req.user ? req.user.id : null;
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
            content: "You are AI Coach Charles, an expert relationship coach who creates personalized date night plans. Your plans blend romance with research-backed connection exercises, making every date both fun and meaningful for the couple's relationship.",
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

  app.get("/api/datenight/plans", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.id : null;
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

  app.get("/api/datenight/:id", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.id : null;
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

  app.post("/api/assessments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.id : null;
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

  app.get("/api/assessments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.isAuthenticated?.() && req.user ? req.user.id : null;
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

  app.post("/api/assessments/:id/analyze", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/assessments/:id/share", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Access reporting endpoints (no logUserAccess to avoid circular logging)
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

  // Feedback report endpoints (admin only)
  app.get("/api/reports/feedback-summary", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const [generalFeedback, sessionFeedback] = await Promise.all([
        storage.getGeneralFeedback(),
        storage.getSessionFeedback(),
      ]);
      
      // Calculate stats
      const totalGeneral = generalFeedback.length;
      const totalSessions = sessionFeedback.length;
      
      // Average session rating
      const avgSessionRating = sessionFeedback.length > 0
        ? sessionFeedback.reduce((sum, f) => sum + f.rating, 0) / sessionFeedback.length
        : 0;
      
      // General feedback by type
      const feedbackByType = generalFeedback.reduce((acc, f) => {
        acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // General feedback by category
      const feedbackByCategory = generalFeedback.reduce((acc, f) => {
        acc[f.category] = (acc[f.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      res.json({
        totalGeneral,
        totalSessions,
        avgSessionRating: parseFloat(avgSessionRating.toFixed(2)),
        feedbackByType,
        feedbackByCategory,
      });
    } catch (error: any) {
      console.error("Get feedback summary error:", error);
      res.status(500).json({
        error: "Failed to get feedback summary",
        details: error.message,
      });
    }
  });

  app.get("/api/reports/general-feedback", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const feedback = await storage.getGeneralFeedback();
      
      // Enrich with user info
      const enrichedFeedback = await Promise.all(
        feedback.map(async (f) => {
          if (f.userId) {
            const user = await storage.getUser(f.userId);
            return {
              ...f,
              userEmail: user?.email || null,
              userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
            };
          }
          return {
            ...f,
            userEmail: null,
            userName: null,
          };
        })
      );
      
      res.json({ feedback: enrichedFeedback });
    } catch (error: any) {
      console.error("Get general feedback error:", error);
      res.status(500).json({
        error: "Failed to get general feedback",
        details: error.message,
      });
    }
  });

  app.get("/api/reports/session-feedback", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const feedback = await storage.getSessionFeedback();
      
      // Enrich with user info
      const enrichedFeedback = await Promise.all(
        feedback.map(async (f) => {
          if (f.userId) {
            const user = await storage.getUser(f.userId);
            return {
              ...f,
              userEmail: user?.email || null,
              userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
            };
          }
          return {
            ...f,
            userEmail: null,
            userName: null,
          };
        })
      );
      
      res.json({ feedback: enrichedFeedback });
    } catch (error: any) {
      console.error("Get session feedback error:", error);
      res.status(500).json({
        error: "Failed to get session feedback",
        details: error.message,
      });
    }
  });

  // Revenue & conversion analytics endpoints
  app.get("/api/analytics/revenue-metrics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getRevenueMetrics();
      res.json(metrics);
    } catch (error: any) {
      console.error("Get revenue metrics error:", error);
      res.status(500).json({
        error: "Failed to get revenue metrics",
        details: error.message,
      });
    }
  });

  app.get("/api/analytics/conversion-funnel", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const funnel = await storage.getConversionFunnel();
      res.json(funnel);
    } catch (error: any) {
      console.error("Get conversion funnel error:", error);
      res.status(500).json({
        error: "Failed to get conversion funnel",
        details: error.message,
      });
    }
  });

  app.get("/api/analytics/conversion-events", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const userId = req.query.userId as string | undefined;
      const events = await storage.getConversionEvents(userId, limit);
      res.json(events);
    } catch (error: any) {
      console.error("Get conversion events error:", error);
      res.status(500).json({
        error: "Failed to get conversion events",
        details: error.message,
      });
    }
  });

  app.get("/api/analytics/subscription-events", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const userId = req.query.userId as string | undefined;
      const stripeSubscriptionId = req.query.stripeSubscriptionId as string | undefined;
      const events = await storage.getSubscriptionEvents(userId, stripeSubscriptionId, limit);
      res.json(events);
    } catch (error: any) {
      console.error("Get subscription events error:", error);
      res.status(500).json({
        error: "Failed to get subscription events",
        details: error.message,
      });
    }
  });

  // Email delivery monitoring endpoints
  app.get("/api/analytics/email-delivery-stats", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getEmailDeliveryStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      console.error("Get email delivery stats error:", error);
      res.status(500).json({
        error: "Failed to get email delivery stats",
        details: error.message,
      });
    }
  });

  app.get("/api/analytics/email-send-logs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const emailType = req.query.emailType as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const logs = await storage.getEmailSendLogs({ userId, emailType, status, limit });
      res.json(logs);
    } catch (error: any) {
      console.error("Get email send logs error:", error);
      res.status(500).json({
        error: "Failed to get email send logs",
        details: error.message,
      });
    }
  });

  // Admin endpoint to grant lifetime access to test accounts
  app.post("/api/admin/grant-access", isAuthenticated, logUserAccess, isAdmin, async (req: any, res) => {
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
  app.post("/api/send-verification-email", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/newsletter/subscribe", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.post("/api/newsletter/unsubscribe", isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Rate limiter for cron endpoints
  // Very strict: 5 requests per 24 hours (allows for retries)
  const cronRateLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many cron requests from this IP, please try again after 24 hours',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for cron endpoint from IP: ${req.ip}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. This endpoint can only be called 5 times per day.'
      });
    }
  });

  // Send trial expiration reminder emails
  // This endpoint should be called daily by an external cron service
  // Security: Requires header-based secret authentication + rate limiting
  app.post("/api/admin/send-trial-reminders", cronRateLimiter, async (req: any, res) => {
    try {
      // Header-based secret authentication for cron jobs
      const authHeader = req.headers.authorization;
      const CRON_SECRET = process.env.CRON_SECRET || "dev-secret-change-in-production";
      
      if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        console.warn(`Unauthorized trial reminder attempt from ${req.ip}`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const now = new Date();
      const emailsSent: { email: string; daysRemaining: number }[] = [];
      const emailsSkipped: { email: string; daysRemaining: number; reason: string }[] = [];
      const errors: { email: string; error: string }[] = [];

      // Get only trial users who need reminders (database-filtered for performance)
      const trialUsers = await storage.getTrialUsersNeedingReminders();
      
      console.log(`Processing ${trialUsers.length} trial users for reminders`);
      
      for (const user of trialUsers) {
        // Skip if no email or email not verified
        if (!user.email || !user.emailVerified) continue;
        
        // Calculate days remaining
        const trialEnd = new Date(user.trialEndsAt!);
        const diffTime = trialEnd.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Only send on days 2, 1, and 0
        if (daysRemaining !== 2 && daysRemaining !== 1 && daysRemaining !== 0) continue;
        
        // Idempotency check: Skip if we've already sent this reminder
        const subType = `days_${daysRemaining}`;
        const alreadySent = await storage.hasEmailBeenSent(user.id, 'trial_reminder', subType);
        
        if (alreadySent) {
          emailsSkipped.push({
            email: user.email,
            daysRemaining,
            reason: 'already_sent'
          });
          console.log(`Skipping ${user.email} - trial reminder for ${daysRemaining} days already sent`);
          continue;
        }
        
        try {
          // Get user's trial progress data
          const progress = await storage.getTrialProgress(user.id);
          
          await sendTrialReminder(user.email, {
            firstName: user.firstName ?? undefined,
            chatSessions: progress.chatSessions,
            assessments: progress.assessments,
            retreats: progress.retreats,
            dateNights: progress.dateNights,
            daysRemaining,
          }, baseUrl);
          
          // Log successful email send
          await storage.createEmailSendLog({
            userId: user.id,
            email: user.email,
            emailType: 'trial_reminder',
            subType,
            status: 'success',
            metadata: {
              chatSessions: progress.chatSessions,
              assessments: progress.assessments,
              retreats: progress.retreats,
              dateNights: progress.dateNights,
              daysRemaining,
            },
          });
          
          emailsSent.push({ 
            email: user.email, 
            daysRemaining 
          });
          
          console.log(`Trial reminder sent to ${user.email} (${daysRemaining} days remaining)`);
        } catch (error: any) {
          console.error(`Error sending trial reminder to ${user.email}:`, error);
          
          // Log failed email send attempt
          await storage.createEmailSendLog({
            userId: user.id,
            email: user.email,
            emailType: 'trial_reminder',
            subType,
            status: 'failed',
            errorMessage: error.message,
          });
          
          errors.push({ 
            email: user.email, 
            error: error.message 
          });
        }
      }

      res.json({ 
        success: true, 
        emailsSent: emailsSent.length,
        emailsSkipped: emailsSkipped.length,
        emails: emailsSent,
        skipped: emailsSkipped.length > 0 ? emailsSkipped : undefined,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Send trial reminders error:", error);
      res.status(500).json({
        error: "Failed to send trial reminders",
        details: error.message,
      });
    }
  });

  // ===== HEALTH SCORE ROUTES =====
  
  // Calculate and get latest health score
  app.post('/api/health-score/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const healthScore = await storage.calculateHealthScore(userId);
      res.json(healthScore);
    } catch (error: any) {
      console.error("Calculate health score error:", error);
      res.status(500).json({ message: "Failed to calculate health score" });
    }
  });

  // Get latest health score
  app.get('/api/health-score', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const healthScore = await storage.getLatestHealthScore(userId);
      res.json(healthScore || null);
    } catch (error: any) {
      console.error("Get health score error:", error);
      res.status(500).json({ message: "Failed to get health score" });
    }
  });

  // Get health score history
  app.get('/api/health-score/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 30;
      const scores = await storage.getHealthScores(userId, limit);
      res.json(scores);
    } catch (error: any) {
      console.error("Get health score history error:", error);
      res.status(500).json({ message: "Failed to get health score history" });
    }
  });

  // ===== PARTNERSHIP ROUTES =====
  
  // Create partnership invitation
  app.post('/api/partnerships', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body (client-supplied fields only)
      const validation = partnershipRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid partnership data", 
          error: fromZodError(validation.error).message 
        });
      }

      // Check if user already has an active partnership
      const existing = await storage.getActivePartnership(userId);
      if (existing) {
        return res.status(400).json({ message: "You already have an active partnership" });
      }

      // Get current user to include their name in the invitation
      const inviter = await storage.getUser(userId);
      if (!inviter) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create invite token
      const inviteToken = randomUUID();
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const partnership = await storage.createPartnership({
        user1Id: userId,
        user2Email: req.body.user2Email,
        inviteToken,
        inviteExpiresAt,
        sharedAssessments: req.body.sharedAssessments ?? 1,
        sharedProgress: req.body.sharedProgress ?? 1,
        sharedJournal: req.body.sharedJournal ?? 0,
      });

      // Send invitation email
      try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const inviterName = inviter.displayName || inviter.firstName || inviter.email?.split('@')[0] || 'Your partner';
        await sendPartnerInvitationEmail(req.body.user2Email, inviterName, inviteToken, baseUrl);
        console.log(`Partner invitation email sent to ${req.body.user2Email} from ${inviterName}`);
      } catch (emailError) {
        console.error("Failed to send partner invitation email:", emailError);
        // Don't fail the request if email sending fails - partnership is already created
        // User can still use the manual invitation link
      }

      res.json(partnership);
    } catch (error: any) {
      console.error("Create partnership error:", error);
      res.status(500).json({ message: "Failed to create partnership" });
    }
  });

  // Get active partnership
  app.get('/api/partnerships', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const partnership = await storage.getActivePartnership(userId);
      res.json(partnership || null);
    } catch (error: any) {
      console.error("Get partnership error:", error);
      res.status(500).json({ message: "Failed to get partnership" });
    }
  });

  // Get pending invites
  app.get('/api/partnerships/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invites = await storage.getPendingInvites(userId);
      res.json(invites);
    } catch (error: any) {
      console.error("Get pending invites error:", error);
      res.status(500).json({ message: "Failed to get pending invites" });
    }
  });

  // Get partnership invitation details (public endpoint for landing page)
  app.get('/api/partnerships/:token/details', async (req: any, res) => {
    try {
      const { token } = req.params;

      // Get partnership by token
      const partnership = await storage.getPartnershipByToken(token);
      if (!partnership) {
        return res.status(404).json({ message: "Invalid partnership invitation" });
      }

      // Check if token is expired
      if (partnership.inviteExpiresAt && new Date() > partnership.inviteExpiresAt) {
        return res.status(400).json({ message: "Partnership invitation has expired", expired: true });
      }

      // Check if already accepted (partnership status would be 'active')
      if (partnership.status === 'active') {
        return res.status(400).json({ message: "This invitation has already been accepted", alreadyAccepted: true });
      }

      // Get inviter's information
      const inviter = await storage.getUser(partnership.user1Id);
      if (!inviter) {
        return res.status(404).json({ message: "Inviter not found" });
      }

      // Return safe invitation details for landing page
      res.json({
        inviterName: inviter.displayName || inviter.email?.split('@')[0] || 'Your partner',
        inviterEmail: inviter.email,
        invitedEmail: partnership.user2Email,
        expiresAt: partnership.inviteExpiresAt,
        token: partnership.inviteToken
      });
    } catch (error: any) {
      console.error("Get partnership invite error:", error);
      res.status(500).json({ message: "Failed to get invitation details" });
    }
  });

  // Accept partnership invitation
  app.post('/api/partnerships/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.params;

      // Check if user already has an active partnership
      const existing = await storage.getActivePartnership(userId);
      if (existing) {
        return res.status(400).json({ message: "You already have an active partnership" });
      }

      // Get partnership by token
      const partnership = await storage.getPartnershipByToken(token);
      if (!partnership) {
        return res.status(404).json({ message: "Partnership invitation not found" });
      }

      // Check if token is expired
      if (partnership.inviteExpiresAt && new Date() > partnership.inviteExpiresAt) {
        return res.status(400).json({ message: "Partnership invitation has expired" });
      }

      // Accept partnership
      const accepted = await storage.acceptPartnership(token, userId);
      res.json(accepted);
    } catch (error: any) {
      console.error("Accept partnership error:", error);
      res.status(500).json({ message: "Failed to accept partnership" });
    }
  });

  // Update partnership settings
  app.patch('/api/partnerships/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Get partnership and verify ownership
      const partnership = await storage.getPartnership(id);
      if (!partnership) {
        return res.status(404).json({ message: "Partnership not found" });
      }

      if (partnership.user1Id !== userId && partnership.user2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this partnership" });
      }

      // Update only allowed fields
      const { sharedAssessments, sharedProgress, sharedJournal } = req.body;
      const updated = await storage.updatePartnership(id, {
        sharedAssessments,
        sharedProgress,
        sharedJournal,
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Update partnership error:", error);
      res.status(500).json({ message: "Failed to update partnership" });
    }
  });

  // ===== JOURNAL ROUTES =====
  
  // Create journal entry with AI insights
  app.post('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body (client-supplied fields only)
      const validation = journalEntryRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid journal entry", 
          error: fromZodError(validation.error).message 
        });
      }

      // Generate AI insights if requested
      let aiInsights = null;
      if (req.body.generateInsights && req.body.entry) {
        try {
          const insightCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an empathetic relationship coach analyzing a journal entry. Provide 2-3 brief, actionable insights about the relationship dynamics, patterns, or opportunities for growth you notice. Be supportive and constructive. Format as a JSON array of strings.`
              },
              {
                role: "user",
                content: req.body.entry
              }
            ],
            response_format: { type: "json_object" },
          });

          const responseContent = insightCompletion.choices[0].message.content;
          if (responseContent) {
            const parsed = JSON.parse(responseContent);
            aiInsights = parsed.insights || parsed.observations || null;
          }
        } catch (error) {
          console.error("AI insights generation error:", error);
          // Continue without AI insights if generation fails
        }
      }

      // Create journal entry
      const entry = await storage.createJournalEntry({
        userId,
        entry: req.body.entry,
        mood: req.body.mood,
        tags: req.body.tags,
        aiInsights,
        isPrivate: req.body.isPrivate ?? 1,
      });

      res.json(entry);
    } catch (error: any) {
      console.error("Create journal entry error:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  // Get journal entries
  app.get('/api/journal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const entries = await storage.getJournalEntries(userId, limit);
      res.json(entries);
    } catch (error: any) {
      console.error("Get journal entries error:", error);
      res.status(500).json({ message: "Failed to get journal entries" });
    }
  });

  // Get single journal entry
  app.get('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      // Verify ownership
      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this entry" });
      }

      res.json(entry);
    } catch (error: any) {
      console.error("Get journal entry error:", error);
      res.status(500).json({ message: "Failed to get journal entry" });
    }
  });

  // Update journal entry
  app.patch('/api/journal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Get entry and verify ownership
      const entry = await storage.getJournalEntry(id);
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      if (entry.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this entry" });
      }

      // Update only allowed fields
      const { entry: text, mood, tags, isPrivate } = req.body;
      const updated = await storage.updateJournalEntry(id, {
        entry: text,
        mood,
        tags,
        isPrivate,
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Update journal entry error:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  // ===== 40DAYTWANGLE CHALLENGE ROUTES =====

  // Get all challenges
  app.get('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const challenges = await storage.getAllChallenges();
      res.json(challenges);
    } catch (error: any) {
      console.error("Get challenges error:", error);
      res.status(500).json({ message: "Failed to get challenges" });
    }
  });

  // Start the challenge
  app.post('/api/challenges/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Check if user already has an active challenge
      const existing = await storage.getUserChallengeProgress(userId);
      if (existing) {
        return res.json(existing);
      }

      // Create new challenge progress
      const progress = await storage.createUserChallengeProgress({
        userId,
        currentDay: 1,
        lastCompletedDay: 0,
      });

      res.json(progress);
    } catch (error: any) {
      console.error("Start challenge error:", error);
      res.status(500).json({ message: "Failed to start challenge" });
    }
  });

  // Get user progress (must come before /:day route)
  app.get('/api/challenges/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getUserChallengeProgress(userId);
      
      if (!progress) {
        return res.json(null);
      }

      res.json(progress);
    } catch (error: any) {
      console.error("Get challenge progress error:", error);
      res.status(500).json({ message: "Failed to get challenge progress" });
    }
  });

  // Get user reflections (must come before /:day route)
  app.get('/api/challenges/reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reflections = await storage.getAllUserReflections(userId);
      res.json(reflections);
    } catch (error: any) {
      console.error("Get user reflections error:", error);
      res.status(500).json({ message: "Failed to get user reflections" });
    }
  });

  // Get specific day challenge (must come AFTER specific routes)
  app.get('/api/challenges/:day', isAuthenticated, async (req: any, res) => {
    try {
      const dayNumber = parseInt(req.params.day);
      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 40) {
        return res.status(400).json({ message: "Invalid day number" });
      }

      const challenge = await storage.getChallengeByDay(dayNumber);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      res.json(challenge);
    } catch (error: any) {
      console.error("Get challenge error:", error);
      res.status(500).json({ message: "Failed to get challenge" });
    }
  });

  // Complete a day with reflection
  app.post('/api/challenges/:day/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dayNumber = parseInt(req.params.day);
      const { reflectionText } = req.body;

      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 40) {
        return res.status(400).json({ message: "Invalid day number" });
      }

      // Make reflection validation more lenient - just require non-empty text
      if (!reflectionText || reflectionText.trim().length < 1) {
        return res.status(400).json({ message: "Please enter your reflection" });
      }

      // Get user progress
      const progress = await storage.getUserChallengeProgress(userId);
      if (!progress) {
        return res.status(400).json({ message: "Challenge not started" });
      }

      // Verify they're completing the current day
      if (dayNumber !== progress.currentDay) {
        return res.status(400).json({ message: "Can only complete current day" });
      }

      // Check if already reflected today
      const existing = await storage.getUserReflectionForDay(userId, dayNumber);
      if (existing) {
        return res.status(400).json({ message: "Day already completed" });
      }

      // Get challenge
      const challenge = await storage.getChallengeByDay(dayNumber);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }

      // Generate AI summary if OpenAI is available
      let aiSummary = null;
      try {
        if (process.env.OPENAI_API_KEY) {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are a supportive faith-based relationship coach. Provide a brief, encouraging 2-3 sentence response to this couple's reflection on their daily challenge. Be warm, affirming, and offer gentle guidance."
            }, {
              role: "user",
              content: `Challenge: ${challenge.title} - ${challenge.actionPrompt}\n\nReflection: ${reflectionText}`
            }],
            max_tokens: 150,
          });
          
          aiSummary = response.choices[0]?.message?.content || null;
        }
      } catch (aiError) {
        console.error("AI summary generation error:", aiError);
      }

      // Create reflection
      const reflection = await storage.createChallengeReflection({
        userId,
        challengeId: challenge.id,
        dayNumber,
        reflectionText,
        aiSummary,
      });

      // Mark day as complete and advance
      const updatedProgress = await storage.markDayComplete(userId, dayNumber);

      res.json({
        reflection,
        progress: updatedProgress,
      });
    } catch (error: any) {
      console.error("Complete day error:", error);
      res.status(500).json({ message: "Failed to complete day" });
    }
  });

  // Get all user reflections
  app.get('/api/challenges/reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reflections = await storage.getAllUserReflections(userId);
      res.json(reflections);
    } catch (error: any) {
      console.error("Get reflections error:", error);
      res.status(500).json({ message: "Failed to get reflections" });
    }
  });

  // Admin: Seed challenges (only if empty)
  app.post('/api/admin/seed-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getAllChallenges();
      if (existing.length > 0) {
        return res.json({ message: "Challenges already seeded", count: existing.length });
      }

      // Import and run seed
      const { seed40dayTwangle } = await import('./seeds/40dayTwangle');
      await seed40dayTwangle();
      
      const challenges = await storage.getAllChallenges();
      res.json({ message: "Challenges seeded successfully", count: challenges.length });
    } catch (error: any) {
      console.error("Seed challenges error:", error);
      res.status(500).json({ message: "Failed to seed challenges" });
    }
  });

  // ===== COUPLE SUBSCRIPTION ROUTES =====
  
  // Get current user's couple status
  app.get('/api/couples/me', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let couple = null;
      let isPrimaryUser = false;
      let isPartnerUser = false;

      const primaryCouple = await storage.getCoupleByPrimaryUser(userId);
      if (primaryCouple) {
        couple = primaryCouple;
        isPrimaryUser = true;
      } else {
        const partnerCouple = await storage.getCoupleByPartnerUser(userId);
        if (partnerCouple) {
          couple = partnerCouple;
          isPartnerUser = true;
        }
      }

      let primaryUser = null;
      let partnerUser = null;
      
      if (couple) {
        primaryUser = await storage.getUser(couple.primaryUserId);
        if (couple.partnerUserId) {
          partnerUser = await storage.getUser(couple.partnerUserId);
        }
      }

      res.json({
        couple,
        isPrimaryUser,
        isPartnerUser,
        primaryUser: primaryUser ? {
          id: primaryUser.id,
          email: primaryUser.email,
          firstName: primaryUser.firstName,
          lastName: primaryUser.lastName,
        } : null,
        partnerUser: partnerUser ? {
          id: partnerUser.id,
          email: partnerUser.email,
          firstName: partnerUser.firstName,
          lastName: partnerUser.lastName,
        } : null,
      });
    } catch (error: any) {
      console.error("Get couple status error:", error);
      res.status(500).json({ message: "Failed to get couple status" });
    }
  });

  // Generate partner invite token and send email
  app.post('/api/couples/invite', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { partnerEmail } = req.body;

      if (!partnerEmail) {
        return res.status(400).json({ message: "Partner email is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const couple = await storage.getCoupleByPrimaryUser(userId);
      if (!couple) {
        return res.status(404).json({ 
          message: "Couple subscription not found. Please subscribe to a couple plan first." 
        });
      }

      if (couple.partnerUserId) {
        return res.status(400).json({ 
          message: "A partner is already linked to this couple subscription" 
        });
      }

      const { token, couple: updatedCouple } = await storage.generatePartnerInviteToken(couple.id, partnerEmail, 72);

      const inviteUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/couples/accept/${token}`;
      
      await sendPartnerInviteEmail(partnerEmail, {
        inviterName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Your partner',
        inviteUrl,
      });

      await storage.createEmailSendLog({
        userId: userId,
        email: partnerEmail,
        emailType: 'couple_partner_invite',
        status: 'sent',
      });

      res.json({ 
        message: "Partner invite sent successfully",
        inviteToken: token,
        inviteUrl,
        expiresAt: updatedCouple.partnerInviteExpires,
      });
    } catch (error: any) {
      console.error("Send partner invite error:", error);
      res.status(500).json({ message: "Failed to send partner invite" });
    }
  });

  // Cancel pending partner invite
  app.post('/api/couples/cancel-invite', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const couple = await storage.getCoupleByPrimaryUser(userId);
      if (!couple) {
        return res.status(404).json({ message: "No couple subscription found" });
      }

      if (couple.primaryUserId !== userId) {
        return res.status(403).json({ message: "Only the primary user can cancel invitations" });
      }

      if (!couple.partnerInviteToken) {
        return res.status(400).json({ message: "No pending invitation to cancel" });
      }

      const updatedCouple = await storage.cancelPartnerInvite(couple.id);

      res.json({ 
        message: "Partner invitation cancelled successfully",
        couple: updatedCouple,
      });
    } catch (error: any) {
      console.error("Cancel partner invite error:", error);
      res.status(500).json({ message: "Failed to cancel partner invite" });
    }
  });

  // Accept partner invite
  app.post('/api/couples/accept/:token', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingPrimaryCouple = await storage.getCoupleByPrimaryUser(userId);
      if (existingPrimaryCouple) {
        return res.status(400).json({ 
          message: "You are already the primary user of a couple subscription" 
        });
      }

      const existingPartnerCouple = await storage.getCoupleByPartnerUser(userId);
      if (existingPartnerCouple) {
        return res.status(400).json({ 
          message: "You are already part of a couple subscription" 
        });
      }

      const couple = await storage.acceptPartnerInvite(token, userId);
      
      if (!couple) {
        return res.status(400).json({ 
          message: "Invalid or expired invitation token" 
        });
      }

      res.json({ 
        message: "Partner invite accepted successfully",
        couple,
      });
    } catch (error: any) {
      console.error("Accept partner invite error:", error);
      res.status(500).json({ message: "Failed to accept partner invite" });
    }
  });

  // Remove partner from couple
  app.delete('/api/couples/partner', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const couple = await storage.getCoupleByPrimaryUser(userId);
      if (!couple) {
        return res.status(404).json({ 
          message: "Couple subscription not found" 
        });
      }

      if (!couple.partnerUserId) {
        return res.status(400).json({ 
          message: "No partner is linked to this couple subscription" 
        });
      }

      const updatedCouple = await storage.removePartner(couple.id);

      res.json({ 
        message: "Partner removed successfully",
        couple: updatedCouple,
      });
    } catch (error: any) {
      console.error("Remove partner error:", error);
      res.status(500).json({ message: "Failed to remove partner" });
    }
  });

  // Get couple subscription details
  app.get('/api/couples/subscription', isAuthenticated, logUserAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;

      let couple = await storage.getCoupleByPrimaryUser(userId);
      if (!couple) {
        couple = await storage.getCoupleByPartnerUser(userId);
      }

      if (!couple) {
        return res.status(404).json({ 
          message: "No couple subscription found" 
        });
      }

      res.json({ couple });
    } catch (error: any) {
      console.error("Get couple subscription error:", error);
      res.status(500).json({ message: "Failed to get couple subscription" });
    }
  });

  // ===== CONVERSATION ROUTES =====
  
  // Get daily question (works for both solo and partnered users)
  app.get('/api/conversations/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user info to check subscription and usage
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription status including couple subscriptions
      const accessCheck = await checkUserPremiumAccess(userId);
      const isPaidUser = accessCheck.hasPremiumAccess;
      
      // Calculate remaining responses for free users
      const responseCount = user.conversationResponseCount || 0;
      const FREE_LIMIT = 3;
      const remainingResponses = isPaidUser ? 999 : Math.max(0, FREE_LIMIT - responseCount);
      const isLimitReached = !isPaidUser && responseCount >= FREE_LIMIT;
      
      // Check if user has an active partnership
      const partnership = await storage.getActivePartnership(userId);
      const hasPartnership = partnership && partnership.status === 'active';
      
      // Get daily question based on partnership status
      let question;
      let responses: any[] = [];
      let userResponse = null;
      let partnerResponse = null;
      let bothAnswered = false;
      
      if (hasPartnership) {
        // Partnered mode: Get question for the partnership
        question = await storage.getDailyQuestion(partnership.id);
        if (!question) {
          return res.status(404).json({ message: "No question available" });
        }
        
        // Get existing responses for this question
        responses = await storage.getConversationResponses(partnership.id, question.id);
        userResponse = responses.find(r => r.userId === userId) || null;
        partnerResponse = responses.find(r => r.userId !== userId) || null;
        
        // Double-blind: only show partner response if both have answered
        bothAnswered = responses.length >= 2;
      } else {
        // Solo mode: Get question for the individual user
        question = await storage.getSoloQuestion(userId);
        if (!question) {
          return res.status(404).json({ message: "No question available" });
        }
        
        // Get user's existing response
        responses = await storage.getSoloConversationResponses(userId, question.id);
        userResponse = responses[0] || null;
        bothAnswered = false; // No partner, so never "both answered"
      }

      res.json({
        question,
        userResponse,
        partnerResponse: bothAnswered ? partnerResponse : null,
        hasUserAnswered: !!userResponse,
        hasPartnerAnswered: !!partnerResponse,
        bothAnswered,
        remainingResponses,
        isLimitReached,
        isSoloMode: !hasPartnership,
      });
    } catch (error: any) {
      console.error("Get daily question error:", error);
      res.status(500).json({ message: "Failed to get daily question" });
    }
  });

  // Submit response to conversation question (works for both solo and partnered users)
  app.post('/api/conversations/respond', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { questionId, responseText } = req.body;

      if (!questionId || !responseText) {
        return res.status(400).json({ 
          message: "Missing required fields: questionId, responseText" 
        });
      }

      // Get user info to check subscription and usage limits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription status including couple subscriptions
      const accessCheck = await checkUserPremiumAccess(userId);
      const isPaidUser = accessCheck.hasPremiumAccess;
      
      // Enforce free user limits
      const FREE_LIMIT = 3;
      const responseCount = user.conversationResponseCount || 0;
      if (!isPaidUser && responseCount >= FREE_LIMIT) {
        return res.status(403).json({ 
          message: "You have reached the limit of 3 free conversation responses. Upgrade to continue." 
        });
      }

      // Automatically look up user's active partnership
      const partnership = await storage.getActivePartnership(userId);
      const partnershipId = partnership?.id || null;
      
      console.log('[DEBUG] Conversation Response - userId:', userId);
      console.log('[DEBUG] Conversation Response - partnership:', partnership);
      console.log('[DEBUG] Conversation Response - partnershipId:', partnershipId);
      
      // Determine if solo or partnered mode
      const isSoloMode = !partnershipId;
      
      if (!isSoloMode && partnership) {
        // Verify user is part of the partnership
        if (partnership.user1Id !== userId && partnership.user2Id !== userId) {
          return res.status(403).json({ message: "Not authorized for this partnership" });
        }

        // Check if user already responded
        const existingResponses = await storage.getConversationResponses(partnershipId, questionId);
        if (existingResponses.some(r => r.userId === userId)) {
          return res.status(400).json({ message: "You have already responded to this question" });
        }
      } else {
        // Solo mode: Check if user already responded
        const existingResponses = await storage.getSoloConversationResponses(userId, questionId);
        if (existingResponses.length > 0) {
          return res.status(400).json({ message: "You have already responded to this question" });
        }
      }

      // Create response
      const response = await storage.createConversationResponse({
        partnershipId: partnershipId || null,
        questionId,
        userId,
        responseText,
      });

      // Increment user's conversation response count
      await storage.incrementConversationResponseCount(userId);

      // Check if both partners have now answered (only for partnered mode)
      let bothAnswered = false;
      let partnerResponse = null;
      
      if (!isSoloMode) {
        const allResponses = await storage.getConversationResponses(partnershipId, questionId);
        bothAnswered = allResponses.length >= 2;
        partnerResponse = bothAnswered ? allResponses.find(r => r.userId !== userId) : null;
      }

      res.json({
        response,
        bothAnswered,
        partnerResponse,
        isSoloMode,
      });
    } catch (error: any) {
      console.error("Create response error:", error);
      res.status(500).json({ message: "Failed to create response" });
    }
  });

  // Get conversation history (works for both solo and partnered users)
  app.get('/api/conversations/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;

      // Check if user has an active partnership
      const partnership = await storage.getActivePartnership(userId);
      const hasPartnership = partnership && partnership.status === 'active';
      
      let history;
      if (hasPartnership) {
        // Partnered mode: Get partnership history
        history = await storage.getConversationHistory(partnership.id, limit);
      } else {
        // Solo mode: Get solo history
        history = await storage.getSoloConversationHistory(userId, limit);
      }

      res.json(history);
    } catch (error: any) {
      console.error("Get conversation history error:", error);
      res.status(500).json({ message: "Failed to get conversation history" });
    }
  });

  // Request help with a question (AI coaching, alternative question, or think time)
  app.post('/api/conversations/help', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { questionId, actionType } = req.body;

      if (!questionId || !actionType) {
        return res.status(400).json({ 
          message: "Missing required fields: questionId, actionType" 
        });
      }

      if (!['guidance', 'think_time', 'alternative'].includes(actionType)) {
        return res.status(400).json({ 
          message: "Invalid actionType. Must be: guidance, think_time, or alternative" 
        });
      }

      // Get the question
      const question = await storage.getRandomQuestion();
      const targetQuestion = question?.id === questionId ? question : await storage.getRandomQuestion();
      
      if (!targetQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }

      let aiResponse: any = null;

      if (actionType === 'guidance') {
        // Generate AI coaching guidance
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a warm, concise relationship coach. Offer 2 framing tips and 2 example answer starters to help someone thoughtfully respond to a relationship question. Be safe, neutral, and nonjudgmental. Keep your response under 150 words.`
            },
            {
              role: "user",
              content: `Category: ${targetQuestion.category}\nQuestion: ${targetQuestion.questionText}\nTherapy Prompt: ${targetQuestion.therapyPrompt || ''}\n\nHelp the user form a thoughtful answer with kind, helpful guidance.`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        aiResponse = {
          type: 'guidance',
          content: completion.choices[0].message.content,
        };
      } else if (actionType === 'alternative') {
        // Generate alternative easier questions
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Return two easier questions from the same category as the original: (1) a feelings-first question and (2) an action-first question. Keep each question under 20 words. Format as JSON: {"question1": "...", "question2": "..."}`
            },
            {
              role: "user",
              content: `Original Category: ${targetQuestion.category}\nOriginal Question: ${targetQuestion.questionText}\n\nProvide two gentler alternatives.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          response_format: { type: "json_object" },
        });

        const messageContent = completion.choices[0].message.content || '{}';
        console.log('[Conversations Help] Raw AI response for alternative:', messageContent);
        
        let parsedContent;
        try {
          parsedContent = JSON.parse(messageContent);
          console.log('[Conversations Help] Parsed alternative questions:', parsedContent);
          
          // Ensure the expected fields exist
          if (!parsedContent.question1 || !parsedContent.question2) {
            console.warn('[Conversations Help] Missing question fields in response:', parsedContent);
            parsedContent = {
              question1: parsedContent.question1 || "What's one small thing that made you feel closer to your partner recently?",
              question2: parsedContent.question2 || "What's one way you could show appreciation to your partner this week?"
            };
          }
        } catch (parseError) {
          console.error('[Conversations Help] Failed to parse alternative questions JSON:', parseError);
          parsedContent = {
            question1: "What's one small thing that made you feel closer to your partner recently?",
            question2: "What's one way you could show appreciation to your partner this week?"
          };
        }

        aiResponse = {
          type: 'alternative',
          content: parsedContent,
        };
      } else if (actionType === 'think_time') {
        aiResponse = {
          type: 'think_time',
          content: "Take the time you need. It's okay to need a moment to gather your thoughts. Your feelings matter, and thoughtful reflection leads to deeper connection.",
        };
      }

      // Log the help event
      await storage.createConversationHelpEvent({
        userId,
        questionId,
        actionType,
        aiResponse,
      });

      res.json(aiResponse);
    } catch (error: any) {
      console.error("Conversation help error:", error);
      res.status(500).json({ message: "Failed to get help" });
    }
  });

  // ===== ANALYTICS ROUTES =====
  
  // Generate analytics snapshot
  app.post('/api/analytics/snapshot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { periodType = 'weekly' } = req.body;

      // Get user progress data
      const progress = await storage.getTrialProgress(userId);
      const healthScore = await storage.getLatestHealthScore(userId);
      const journalEntries = await storage.getJournalEntries(userId, 100);

      // Calculate period dates
      const now = new Date();
      let periodStart: Date;
      switch (periodType) {
        case 'daily':
          periodStart = new Date(now);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          periodStart = new Date(now);
          periodStart.setMonth(now.getMonth() - 1);
          break;
        default:
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 7);
      }

      // Build metrics
      const metrics = {
        chatSessions: progress.chatSessions,
        assessments: progress.assessments,
        retreats: progress.retreats,
        dateNights: progress.dateNights,
        journalEntries: journalEntries.length,
        healthScore: healthScore?.overallScore || null,
      };

      // Generate insights based on metrics
      const insights = [];
      if (metrics.chatSessions > 5) {
        insights.push("You're actively engaging with coaching - great commitment to growth!");
      }
      if (metrics.journalEntries > 10) {
        insights.push("Consistent journaling shows dedication to self-reflection");
      }
      if (healthScore && healthScore.overallScore > 70) {
        insights.push("Your relationship health score is strong");
      }

      // Create snapshot
      const snapshot = await storage.createAnalyticsSnapshot({
        userId,
        period: now.toISOString(),
        periodType,
        metrics,
        insights: insights.length > 0 ? insights : null,
        benchmarks: null,
      });

      res.json(snapshot);
    } catch (error: any) {
      console.error("Generate analytics snapshot error:", error);
      res.status(500).json({ message: "Failed to generate analytics snapshot" });
    }
  });

  // Get latest analytics snapshot
  app.get('/api/analytics/snapshot/:periodType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { periodType } = req.params;

      const snapshot = await storage.getLatestAnalyticsSnapshot(userId, periodType);
      res.json(snapshot || null);
    } catch (error: any) {
      console.error("Get analytics snapshot error:", error);
      res.status(500).json({ message: "Failed to get analytics snapshot" });
    }
  });

  // Get analytics history
  app.get('/api/analytics/history/:periodType', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { periodType } = req.params;
      const snapshots = await storage.getAnalyticsSnapshots(userId, periodType);
      res.json(snapshots);
    } catch (error: any) {
      console.error("Get analytics history error:", error);
      res.status(500).json({ message: "Failed to get analytics history" });
    }
  });

  // ========================================
  // STRIPE CONNECT: PLATFORM MARKETPLACE
  // ========================================
  // These endpoints enable a marketplace where users can:
  // 1. Onboard as sellers (create connected accounts)
  // 2. Create products for sale
  // 3. Process payments with application fees

  /**
   * POST /api/stripe-connect/account
   * Create a connected account for a merchant
   * 
   * This creates a Stripe connected account where:
   * - Platform is responsible for pricing and fee collection
   * - Platform is responsible for losses/refunds/chargebacks
   * - Merchant gets access to Express dashboard for management
   */
  app.post('/api/stripe-connect/account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      // Validate Stripe is configured
      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured",
          message: "STRIPE_SECRET_KEY environment variable is missing. Please configure Stripe API keys."
        });
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a connected account
      const existingAccount = await storage.getConnectedAccountByUserId(userId);
      if (existingAccount) {
        return res.status(400).json({ 
          message: "User already has a connected account",
          accountId: existingAccount.stripeAccountId
        });
      }

      // Step 1: Create the connected account
      // Using controller properties as specified (NOT top-level type)
      const account = await stripe.accounts.create({
        controller: {
          // Platform is responsible for pricing and fee collection
          fees: {
            payer: 'application' as const
          },
          // Platform is responsible for losses / refunds / chargebacks
          losses: {
            payments: 'application' as const
          },
          // Give them access to the express dashboard for management
          stripe_dashboard: {
            type: 'express' as const
          }
        }
      });

      // Step 2: Store the connected account in database
      const connectedAccount = await storage.createConnectedAccount({
        userId,
        stripeAccountId: account.id,
        chargesEnabled: account.charges_enabled ? 1 : 0,
        detailsSubmitted: account.details_submitted ? 1 : 0,
        payoutsEnabled: account.payouts_enabled ? 1 : 0,
      });

      res.json({
        success: true,
        account: connectedAccount,
        message: "Connected account created successfully"
      });
    } catch (error: any) {
      console.error("Create connected account error:", error);
      res.status(500).json({ 
        error: "Failed to create connected account",
        details: error.message 
      });
    }
  });

  /**
   * POST /api/stripe-connect/account-link
   * Create an account link for onboarding
   * 
   * This generates a URL that redirects the merchant to Stripe's onboarding flow
   * where they can submit required information to start accepting payments
   */
  app.post('/api/stripe-connect/account-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured",
          message: "STRIPE_SECRET_KEY environment variable is missing"
        });
      }

      // Step 1: Get the user's connected account
      const connectedAccount = await storage.getConnectedAccountByUserId(userId);
      if (!connectedAccount) {
        return res.status(404).json({ message: "No connected account found" });
      }

      // Step 2: Create the account link
      // This link expires after the user completes the flow or after a timeout
      const accountLink = await stripe.accountLinks.create({
        account: connectedAccount.stripeAccountId,
        refresh_url: `${process.env.VITE_ROOT_URL || 'http://localhost:5000'}/merchant/onboard`,
        return_url: `${process.env.VITE_ROOT_URL || 'http://localhost:5000'}/merchant/onboard`,
        type: 'account_onboarding',
      });

      res.json({
        url: accountLink.url,
        expiresAt: accountLink.expires_at
      });
    } catch (error: any) {
      console.error("Create account link error:", error);
      res.status(500).json({ 
        error: "Failed to create account link",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/account-status
   * Get the current status of the user's connected account
   * 
   * Returns the current account state directly from Stripe API
   * Including charges_enabled, payouts_enabled, details_submitted
   */
  app.get('/api/stripe-connect/account-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured",
          message: "STRIPE_SECRET_KEY environment variable is missing"
        });
      }

      // Step 1: Get the user's connected account from database
      const connectedAccount = await storage.getConnectedAccountByUserId(userId);
      if (!connectedAccount) {
        return res.json({ hasAccount: false });
      }

      // Step 2: Fetch latest account status directly from Stripe
      const account = await stripe.accounts.retrieve(connectedAccount.stripeAccountId);

      // Step 3: Update local database with latest status
      await storage.updateConnectedAccount(connectedAccount.id, {
        chargesEnabled: account.charges_enabled ? 1 : 0,
        detailsSubmitted: account.details_submitted ? 1 : 0,
        payoutsEnabled: account.payouts_enabled ? 1 : 0,
      });

      res.json({
        hasAccount: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        requirementsCurrentlyDue: account.requirements?.currently_due || [],
        requirementsEventuallyDue: account.requirements?.eventually_due || [],
      });
    } catch (error: any) {
      console.error("Get account status error:", error);
      res.status(500).json({ 
        error: "Failed to get account status",
        details: error.message 
      });
    }
  });

  /**
   * POST /api/stripe-connect/product
   * Create a product at the platform level (one-time or subscription)
   * 
   * Products are created on the platform account, not the connected account
   * The mapping to the connected account is stored in the database
   */
  app.post('/api/stripe-connect/product', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        name, 
        description, 
        priceInCents, 
        currency = 'usd',
        productType = 'one_time',
        billingInterval,
        trialDays = 0
      } = req.body;

      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured",
          message: "STRIPE_SECRET_KEY environment variable is missing"
        });
      }

      // Validation
      if (!name || !priceInCents) {
        return res.status(400).json({ message: "Name and price are required" });
      }

      if (priceInCents < 50) {
        return res.status(400).json({ message: "Price must be at least $0.50 (50 cents)" });
      }

      // Validate productType
      if (!['one_time', 'subscription'].includes(productType)) {
        return res.status(400).json({ message: "Product type must be 'one_time' or 'subscription'" });
      }

      // Validate subscription fields
      if (productType === 'subscription') {
        if (!billingInterval || !['month', 'year'].includes(billingInterval)) {
          return res.status(400).json({ message: "Billing interval must be 'month' or 'year' for subscriptions" });
        }
      }

      // Step 1: Verify user has a connected account
      const connectedAccount = await storage.getConnectedAccountByUserId(userId);
      if (!connectedAccount) {
        return res.status(400).json({ 
          message: "You must create and onboard a connected account first" 
        });
      }

      // Step 2: Create product on the platform (not on the connected account)
      const product = await stripe.products.create({
        name: name,
        description: description,
      });

      // Step 3: Create price based on product type
      let priceParams: any = {
        product: product.id,
        unit_amount: priceInCents,
        currency: currency,
      };

      if (productType === 'subscription') {
        priceParams.recurring = {
          interval: billingInterval,
          trial_period_days: trialDays > 0 ? trialDays : undefined,
        };
      }

      const price = await stripe.prices.create(priceParams);

      // Step 4: Store product in database with connected account mapping
      // This mapping is critical for knowing which account receives payment
      const dbProduct = await storage.createProduct({
        userId,
        connectedAccountId: connectedAccount.id,
        stripeProductId: product.id,
        stripePriceId: price.id,
        name,
        description: description || null,
        priceInCents,
        currency,
        productType,
        billingInterval: productType === 'subscription' ? billingInterval : null,
        trialDays: productType === 'subscription' ? trialDays : null,
      });

      res.json({
        success: true,
        product: dbProduct,
        message: `${productType === 'subscription' ? 'Subscription' : 'One-time'} product created successfully`
      });
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ 
        error: "Failed to create product",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/products
   * Get all products across all connected accounts (storefront view)
   * 
   * Returns all products with their associated merchant information
   * This powers the public storefront where customers can browse and purchase
   */
  app.get('/api/stripe-connect/products', async (req: any, res) => {
    try {
      // Step 1: Get all products from database
      const products = await storage.getAllProducts();

      // Step 2: Enrich products with connected account information
      const enrichedProducts = await Promise.all(
        products.map(async (product) => {
          const connectedAccount = await storage.getConnectedAccountByStripeId(
            product.connectedAccountId
          );
          const user = connectedAccount 
            ? await storage.getUser(connectedAccount.userId)
            : null;

          return {
            ...product,
            merchantName: user?.displayName || user?.email || 'Unknown Merchant',
            merchantId: connectedAccount?.stripeAccountId,
          };
        })
      );

      res.json(enrichedProducts);
    } catch (error: any) {
      console.error("Get products error:", error);
      res.status(500).json({ 
        error: "Failed to get products",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/my-products
   * Get products created by the current user
   */
  app.get('/api/stripe-connect/my-products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error: any) {
      console.error("Get my products error:", error);
      res.status(500).json({ 
        error: "Failed to get products",
        details: error.message 
      });
    }
  });

  /**
   * POST /api/stripe-connect/checkout
   * Create a checkout session for a product with destination charge (one-time or subscription)
   * 
   * Uses destination charges to:
   * 1. Charge the customer on the platform account
   * 2. Collect an application fee (platform's cut)
   * 3. Transfer remaining funds to the connected account
   * 
   * For subscriptions, application_fee_percent is used on the subscription
   */
  app.post('/api/stripe-connect/checkout', async (req: any, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user?.claims?.sub; // Optional authenticated user

      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured",
          message: "STRIPE_SECRET_KEY environment variable is missing"
        });
      }

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // Step 1: Get product from database
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Step 2: Get connected account to determine destination
      const connectedAccount = await storage.getConnectedAccountByUserId(product.userId);
      if (!connectedAccount) {
        return res.status(400).json({ message: "Product merchant account not found" });
      }

      // Step 3: Handle subscription vs one-time purchase
      const isSubscription = product.productType === 'subscription';
      
      let sessionParams: any = {
        line_items: [
          {
            price: product.stripePriceId,
            quantity: quantity,
          },
        ],
        mode: isSubscription ? 'subscription' : 'payment',
        success_url: `${process.env.VITE_ROOT_URL || 'http://localhost:5000'}/storefront/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_ROOT_URL || 'http://localhost:5000'}/storefront`,
      };

      // Step 4: Add application fee based on product type
      if (isSubscription) {
        // For subscriptions, use application_fee_percent on recurring invoices
        sessionParams.subscription_data = {
          application_fee_percent: 10, // Platform takes 10%
          transfer_data: {
            destination: connectedAccount.stripeAccountId,
          },
        };
        
        // Store metadata to track user and product for webhook handling
        sessionParams.metadata = {
          productId: product.id,
          userId: userId || 'anonymous',
          connectedAccountId: connectedAccount.id,
        };
      } else {
        // For one-time payments, calculate application fee upfront
        const totalAmount = product.priceInCents * quantity;
        const applicationFeeAmount = Math.round(totalAmount * 0.10);
        
        sessionParams.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: connectedAccount.stripeAccountId,
          },
        };
      }

      // Step 5: Handle merchant customers for subscriptions
      if (isSubscription && userId) {
        // Check if we already have a customer ID for this user+merchant combo
        const existingCustomer = await storage.getMerchantCustomer(userId, connectedAccount.id);
        if (existingCustomer) {
          sessionParams.customer = existingCustomer.stripeCustomerId;
        } else {
          // Let Stripe create the customer and we'll store it in the webhook
          sessionParams.client_reference_id = userId; // For webhook to associate customer
        }
      }

      // Step 6: Create checkout session
      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ 
        error: "Failed to create checkout session",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/checkout-session/:sessionId
   * Retrieve checkout session details for success page
   */
  app.get('/api/stripe-connect/checkout-session/:sessionId', async (req: any, res) => {
    try {
      const { sessionId } = req.params;

      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe not configured"
        });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      res.json({
        status: session.status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (error: any) {
      console.error("Get checkout session error:", error);
      res.status(500).json({ 
        error: "Failed to retrieve checkout session",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/my-subscriptions
   * Get all subscriptions for the current user
   */
  app.get('/api/stripe-connect/my-subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscriptions = await storage.getMerchantSubscriptionsByUser(userId);
      
      // Enrich with product details
      const enrichedSubscriptions = await Promise.all(
        subscriptions.map(async (sub) => {
          const product = await storage.getProduct(sub.productId);
          return {
            ...sub,
            product,
          };
        })
      );
      
      res.json(enrichedSubscriptions);
    } catch (error: any) {
      console.error("Get my subscriptions error:", error);
      res.status(500).json({ 
        error: "Failed to get subscriptions",
        details: error.message 
      });
    }
  });

  /**
   * POST /api/stripe-connect/subscription/:id/cancel
   * Cancel a subscription (at period end)
   */
  app.post('/api/stripe-connect/subscription/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      // Get subscription from database
      const subscription = await storage.getMerchantSubscription(id);
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Verify ownership
      if (subscription.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this subscription" });
      }

      // Cancel in Stripe (at period end)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local record
      await storage.updateMerchantSubscription(id, {
        cancelAtPeriodEnd: 1,
      });

      res.json({
        success: true,
        message: "Subscription will be canceled at the end of the current billing period"
      });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ 
        error: "Failed to cancel subscription",
        details: error.message 
      });
    }
  });

  /**
   * GET /api/stripe-connect/merchant/subscription-metrics
   * Get subscription metrics for a merchant
   */
  app.get('/api/stripe-connect/merchant/subscription-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get connected account
      const connectedAccount = await storage.getConnectedAccountByUserId(userId);
      if (!connectedAccount) {
        return res.status(404).json({ message: "No connected account found" });
      }

      // Get all subscriptions for this merchant
      const subscriptions = await storage.getMerchantSubscriptionsByAccount(connectedAccount.id);
      
      // Calculate metrics
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      const totalSubscriptions = subscriptions.length;
      
      // Calculate MRR (Monthly Recurring Revenue)
      let mrr = 0;
      for (const sub of activeSubscriptions) {
        const product = await storage.getProduct(sub.productId);
        if (product && product.productType === 'subscription') {
          if (product.billingInterval === 'month') {
            mrr += product.priceInCents;
          } else if (product.billingInterval === 'year') {
            mrr += Math.round(product.priceInCents / 12);
          }
        }
      }
      
      res.json({
        totalSubscriptions,
        activeSubscriptions: activeSubscriptions.length,
        mrr: Math.round(mrr * 0.9), // Merchant gets 90%
        mrrGross: mrr,
      });
    } catch (error: any) {
      console.error("Get subscription metrics error:", error);
      res.status(500).json({ 
        error: "Failed to get metrics",
        details: error.message 
      });
    }
  });

  /**
   * POST /api/stripe-connect/webhook
   * Handle Stripe Connect marketplace subscription lifecycle events
   * 
   * This webhook listens for:
   * - checkout.session.completed: Create subscription record
   * - customer.subscription.created: Track new subscriptions
   * - customer.subscription.updated: Update subscription status
   * - customer.subscription.deleted: Mark subscriptions as canceled
   * - invoice.payment_succeeded: Track successful recurring payments
   * - invoice.payment_failed: Handle payment failures
   */
  app.post('/api/stripe-connect/webhook', express.raw({ type: 'application/json' }), async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      // Verify webhook signature
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log(`Received Stripe webhook event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          
          // Only process subscription checkouts
          if (session.mode === 'subscription') {
            const { metadata, customer, subscription: subscriptionId, client_reference_id } = session;
            const userId = metadata?.userId || client_reference_id;
            const productId = metadata?.productId;
            const connectedAccountId = metadata?.connectedAccountId;

            if (userId && productId && connectedAccountId) {
              // Store merchant customer if not exists
              const existingCustomer = await storage.getMerchantCustomer(userId, connectedAccountId);
              if (!existingCustomer && customer) {
                await storage.createMerchantCustomer({
                  userId,
                  connectedAccountId,
                  stripeCustomerId: customer as string,
                });
              }

              // Create subscription record
              if (subscriptionId) {
                const product = await storage.getProduct(productId);
                if (product) {
                  await storage.createMerchantSubscription({
                    userId,
                    connectedAccountId,
                    productId,
                    stripeSubscriptionId: subscriptionId as string,
                    stripeCustomerId: customer as string,
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Placeholder, will be updated
                    cancelAtPeriodEnd: 0,
                  });
                }
              }
            }
          }
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          
          // Update or create subscription record
          const existing = await storage.getMerchantSubscriptionByStripeId(subscription.id);
          
          if (existing) {
            await storage.updateMerchantSubscriptionByStripeId(subscription.id, {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
              endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          
          await storage.updateMerchantSubscriptionByStripeId(subscription.id, {
            status: 'canceled',
            canceledAt: new Date(),
            endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : new Date(),
          });
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          
          // Update last payment date for subscription
          if (invoice.subscription) {
            await storage.updateMerchantSubscriptionByStripeId(invoice.subscription, {
              lastPaymentAt: new Date(),
            });
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          
          // Optionally handle failed payments
          if (invoice.subscription) {
            console.log(`Payment failed for subscription ${invoice.subscription}`);
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook handler failed', details: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
