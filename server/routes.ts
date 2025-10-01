import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import Stripe from "stripe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
});

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
  app.post("/api/chat", async (req, res) => {
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

  app.post("/api/summaries/generate", async (req, res) => {
    try {
      const { messages, sessionId } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await storage.createChatSession({
          userId: null,
          messageCount: messages.length,
        });
        currentSessionId = session.id;
      } else {
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
        userId: null,
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

  app.get("/api/summaries", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
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

  app.post("/api/feedback/session", async (req, res) => {
    try {
      const { sessionId, userId, rating, feedbackText } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const feedback = await storage.createSessionFeedback({
        sessionId: sessionId || null,
        userId: userId || null,
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

  app.get("/api/feedback/session", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
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

  app.post("/api/feedback/progress", async (req, res) => {
    try {
      const { userId, weekStartDate, relationshipScore, improvementNotes } = req.body;

      if (!weekStartDate) {
        return res.status(400).json({ error: "Week start date is required" });
      }

      if (!relationshipScore || relationshipScore < 1 || relationshipScore > 5) {
        return res.status(400).json({ error: "Relationship score must be between 1 and 5" });
      }

      const progress = await storage.createRelationshipProgress({
        userId: userId || null,
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

  app.get("/api/feedback/progress", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
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

  app.post("/api/feedback/general", async (req, res) => {
    try {
      const { userId, feedbackType, category, description, rating } = req.body;

      if (!feedbackType || !category || !description) {
        return res.status(400).json({ error: "Feedback type, category, and description are required" });
      }

      const feedback = await storage.createGeneralFeedback({
        userId: userId || null,
        feedbackType,
        category,
        description,
        rating: rating || null,
      });

      res.json({ feedback });
    } catch (error: any) {
      console.error("General feedback error:", error);
      res.status(500).json({
        error: "Failed to save general feedback",
        details: error.message,
      });
    }
  });

  app.get("/api/feedback/general", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
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

  app.post("/api/auth/facebook", async (req, res) => {
    try {
      const origin = req.get("origin");
      const referer = req.get("referer");
      const allowedOrigins = [
        `http://localhost:${process.env.PORT || 5000}`,
        `https://localhost:${process.env.PORT || 5000}`,
      ];
      
      if (process.env.REPLIT_DOMAINS) {
        const replitDomains = process.env.REPLIT_DOMAINS.split(',');
        replitDomains.forEach(domain => {
          allowedOrigins.push(`https://${domain.trim()}`);
        });
      }

      if (!origin && !referer) {
        return res.status(403).json({ error: "Missing origin header" });
      }

      const requestOrigin = origin || (referer ? new URL(referer).origin : null);
      if (!requestOrigin || !allowedOrigins.some(allowed => requestOrigin.startsWith(allowed))) {
        return res.status(403).json({ error: "Invalid origin" });
      }

      const { accessToken, userID } = req.body;

      if (!accessToken || !userID) {
        return res.status(400).json({ error: "Access token and user ID are required" });
      }

      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`
      );

      if (!response.ok) {
        return res.status(401).json({ error: "Invalid Facebook token" });
      }

      const fbData = await response.json();

      if (fbData.id !== userID) {
        return res.status(401).json({ error: "Token user ID mismatch" });
      }

      let user = await storage.getUserByFacebookId(fbData.id);

      if (!user) {
        user = await storage.createUser({
          facebookId: fbData.id,
          name: fbData.name || null,
          email: fbData.email || null,
          profilePicture: fbData.picture?.data?.url || null,
          username: null,
          password: null,
        });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        (req.session as any).userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }

          res.json({ user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
          }});
        });
      });
    } catch (error: any) {
      console.error("Facebook auth error:", error);
      res.status(500).json({
        error: "Failed to authenticate with Facebook",
        details: error.message,
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any).userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      }});
    } catch (error: any) {
      console.error("Get current user error:", error);
      res.status(500).json({
        error: "Failed to get current user",
        details: error.message,
      });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to logout" });
        }
        res.json({ success: true });
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "Failed to logout",
        details: error.message,
      });
    }
  });

  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          name: user.name ?? undefined,
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

  app.post("/api/billing/portal", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

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

  app.get("/api/billing/status", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);

      if (!subscription) {
        return res.json({
          active: false,
          status: null,
          currentPeriodEnd: null,
        });
      }

      const isActive = subscription.status === 'active' || subscription.status === 'trialing';

      res.json({
        active: isActive,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      });
    } catch (error: any) {
      console.error("Get billing status error:", error);
      res.status(500).json({
        error: "Failed to get billing status",
        details: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
