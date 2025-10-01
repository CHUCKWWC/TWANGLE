import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

  const httpServer = createServer(app);

  return httpServer;
}
