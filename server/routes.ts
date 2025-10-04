// Reference: blueprint:javascript_log_in_with_replit
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";
import Stripe from "stripe";
import { 
  insertGeneralFeedbackSchema, 
  insertRetreatItinerarySchema,
  insertAssessmentSchema,
  attachmentStyleResultSchema,
  type AttachmentStyleResult
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

  // Auth routes (Reference: blueprint:javascript_log_in_with_replit)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.post("/api/assessments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertAssessmentSchema.safeParse({ 
        userId,
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

  // Connection Questions - "Strengthen Your Connection" feature
  
  // Debug endpoint to check connection questions status
  app.get("/api/connection/debug", isAuthenticated, async (req: any, res) => {
    try {
      const topics = await storage.getConnectionTopics();
      const allQuestions = await storage.getConnectionQuestions();
      
      const questionsByTopic: Record<string, number> = {};
      for (const topic of topics) {
        const topicQuestions = allQuestions.filter(q => q.topicId === topic.id);
        questionsByTopic[topic.name] = topicQuestions.length;
      }
      
      res.json({
        openaiConfigured: !!process.env.OPENAI_API_KEY,
        topicCount: topics.length,
        totalQuestions: allQuestions.length,
        questionsByTopic,
        topics: topics.map(t => ({ id: t.id, name: t.name })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Migration endpoint to clear old static questions and enable AI generation
  app.post("/api/connection/migrate-to-ai", isAuthenticated, async (req: any, res) => {
    try {
      // Delete all existing questions and responses to enable fresh AI generation
      const deletedResponses = await storage.deleteAllConnectionResponses();
      const deletedQuestions = await storage.deleteAllConnectionQuestions();
      
      res.json({ 
        message: "Migration complete. Old questions cleared. AI will generate new questions on demand.",
        deletedQuestions,
        deletedResponses,
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      res.status(500).json({
        error: "Failed to migrate to AI questions",
        details: error.message,
      });
    }
  });

  app.post("/api/connection/seed", isAuthenticated, async (req: any, res) => {
    try {
      const { connectionTopicsData } = await import('./connectionQuestionsData');
      
      // Check if topics already exist
      const existingTopics = await storage.getConnectionTopics();
      
      if (existingTopics.length > 0) {
        return res.json({ 
          message: "Connection topics already seeded",
          topicsCount: existingTopics.length,
          skipped: true,
        });
      }

      // Create topics only - questions will be AI-generated on demand
      const createdTopics = [];
      for (const topicData of connectionTopicsData) {
        const topic = await storage.createConnectionTopic(topicData);
        createdTopics.push(topic);
      }

      res.json({ 
        message: "Connection topics seeded successfully. Questions will be AI-generated when needed.",
        topicsCount: createdTopics.length,
        skipped: false,
      });
    } catch (error: any) {
      console.error("Seed connection questions error:", error);
      res.status(500).json({
        error: "Failed to seed connection questions",
        details: error.message,
      });
    }
  });

  app.get("/api/connection/topics", isAuthenticated, async (req: any, res) => {
    try {
      const topics = await storage.getConnectionTopics();
      res.json(topics);
    } catch (error: any) {
      console.error("Get topics error:", error);
      res.status(500).json({
        error: "Failed to get topics",
        details: error.message,
      });
    }
  });

  app.get("/api/connection/topics/:topicId/questions", isAuthenticated, async (req: any, res) => {
    console.log(`[CONNECTION QUESTIONS] Request received for topic: ${req.params.topicId}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log("[CONNECTION QUESTIONS] ERROR: OpenAI API key not configured");
      return res.status(501).json({ 
        error: "AI question generation not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const { topicId } = req.params;
      const userId = req.user.claims.sub;
      console.log(`[CONNECTION QUESTIONS] User: ${userId}, Topic: ${topicId}`);
      
      // Get the topic
      const topic = await storage.getConnectionTopic(topicId);
      if (!topic) {
        console.log(`[CONNECTION QUESTIONS] ERROR: Topic not found: ${topicId}`);
        return res.status(404).json({ error: "Topic not found" });
      }
      console.log(`[CONNECTION QUESTIONS] Found topic: ${topic.name}`);

      // Check if we already have questions for this topic
      let questions = await storage.getConnectionQuestions(topicId);
      console.log(`[CONNECTION QUESTIONS] Existing questions: ${questions.length}`);
      
      // If no questions exist, generate them with AI
      if (questions.length === 0) {
        console.log(`[CONNECTION QUESTIONS] Generating AI questions for topic: ${topic.name}`);
        const questionPrompt = `You are an expert relationship therapist. Generate 5 thoughtful, open-ended questions about "${topic.name}" that will help couples deepen their connection and understanding.

Topic: ${topic.name}
Description: ${topic.description}

The questions should:
- Be research-backed based on relationship science (Gottman Method, EFT, Attachment Theory)
- Encourage vulnerability and honest communication
- Help couples identify patterns and growth areas
- Be specific enough to generate meaningful responses
- Avoid yes/no questions
- Be relevant to building a solid, healthy relationship

Respond with a JSON object containing an array of exactly 5 questions:
{
  "questions": [
    "Question 1 text here?",
    "Question 2 text here?",
    "Question 3 text here?",
    "Question 4 text here?",
    "Question 5 text here?"
  ]
}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert relationship therapist who creates thoughtful questions to help couples strengthen their connection. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: questionPrompt,
            },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
        });

        const generatedContent = completion.choices[0].message.content || "{}";
        let generatedQuestions: string[] = [];
        
        try {
          const parsed = JSON.parse(generatedContent);
          generatedQuestions = parsed.questions || [];
        } catch (e) {
          console.error("Failed to parse AI questions:", e);
          return res.status(500).json({ error: "Failed to generate questions" });
        }

        // Save generated questions to database
        console.log(`[CONNECTION QUESTIONS] Saving ${generatedQuestions.length} questions to database`);
        for (let i = 0; i < generatedQuestions.length && i < 5; i++) {
          const question = await storage.createConnectionQuestion({
            topicId,
            question: generatedQuestions[i],
            order: i + 1,
            description: "",
          });
          questions.push(question);
        }
        console.log(`[CONNECTION QUESTIONS] Successfully created ${questions.length} questions`);
      }
      
      // Get user's responses for these questions
      const responses = await storage.getConnectionResponsesByTopic(userId, topicId);
      const responseMap = new Map(responses.map(r => [r.questionId, r]));
      console.log(`[CONNECTION QUESTIONS] Found ${responses.length} existing responses`);
      
      // Combine questions with responses
      const questionsWithResponses = questions.map(q => ({
        ...q,
        userResponse: responseMap.get(q.id) || null,
      }));
      
      console.log(`[CONNECTION QUESTIONS] Returning ${questionsWithResponses.length} questions with responses`);
      res.json(questionsWithResponses);
    } catch (error: any) {
      console.error("[CONNECTION QUESTIONS] ERROR:", error);
      console.error("[CONNECTION QUESTIONS] Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to get questions",
        details: error.message,
      });
    }
  });

  app.post("/api/connection/responses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { questionId, response } = req.body;

      if (!questionId || !response) {
        return res.status(400).json({ error: "questionId and response are required" });
      }

      // Check if response already exists
      const existing = await storage.getConnectionResponses(userId, questionId);
      
      let result;
      if (existing.length > 0) {
        // Update existing response
        result = await storage.updateConnectionResponse(existing[0].id, { response });
      } else {
        // Create new response
        result = await storage.createConnectionResponse({
          userId,
          questionId,
          response,
          isShared: 0,
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Save response error:", error);
      res.status(500).json({
        error: "Failed to save response",
        details: error.message,
      });
    }
  });

  app.get("/api/connection/responses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicId = req.query.topicId as string | undefined;
      
      let responses;
      if (topicId) {
        responses = await storage.getConnectionResponsesByTopic(userId, topicId);
      } else {
        responses = await storage.getConnectionResponses(userId);
      }
      
      res.json(responses);
    } catch (error: any) {
      console.error("Get responses error:", error);
      res.status(500).json({
        error: "Failed to get responses",
        details: error.message,
      });
    }
  });

  app.post("/api/connection/analyze/:topicId", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(501).json({ 
        error: "AI analysis not configured", 
        message: "OpenAI API key is not available" 
      });
    }

    try {
      const userId = req.user.claims.sub;
      const { topicId } = req.params;
      
      // Get topic and questions
      const topic = await storage.getConnectionTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      
      const questions = await storage.getConnectionQuestions(topicId);
      const responses = await storage.getConnectionResponsesByTopic(userId, topicId);
      
      if (responses.length === 0) {
        return res.status(400).json({ error: "No responses to analyze for this topic" });
      }
      
      // Build context for AI
      const questionResponsePairs = responses.map(r => {
        const question = questions.find(q => q.id === r.questionId);
        return {
          question: question?.question || "",
          response: r.response,
        };
      });
      
      const analysisPrompt = `You are an expert relationship therapist analyzing a couple's responses about ${topic.name}.

Topic: ${topic.name}
Description: ${topic.description}

Their responses:
${questionResponsePairs.map((pair, i) => `
${i + 1}. ${pair.question}
   Answer: ${pair.response}
`).join('\n')}

Based on these responses, provide:
1. A brief summary of their current state in this area (2-3 sentences)
2. 3 key insights about patterns, strengths, or concerns you notice
3. 3 specific, actionable recommendations to improve in this area

Format your response as JSON with this structure:
{
  "summary": "Brief 2-3 sentence summary",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a relationship expert providing compassionate, evidence-based analysis and guidance.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const analysisResult = JSON.parse(completion.choices[0].message.content || "{}");
      
      // Save summary to database
      const summary = await storage.createConnectionSummary({
        userId,
        topicId,
        summary: analysisResult.summary,
        insights: analysisResult.insights || [],
        recommendations: analysisResult.recommendations || [],
      });

      res.json(summary);
    } catch (error: any) {
      console.error("AI analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze responses",
        details: error.message,
      });
    }
  });

  app.get("/api/connection/summaries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const topicId = req.query.topicId as string | undefined;
      
      const summaries = await storage.getConnectionSummaries(userId, topicId);
      res.json(summaries);
    } catch (error: any) {
      console.error("Get summaries error:", error);
      res.status(500).json({
        error: "Failed to get summaries",
        details: error.message,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
