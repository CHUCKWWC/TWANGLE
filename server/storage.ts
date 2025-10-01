import { 
  type User, 
  type InsertUser, 
  type ChatSession, 
  type InsertChatSession, 
  type WeeklySummary, 
  type InsertWeeklySummary,
  type SessionFeedback,
  type InsertSessionFeedback,
  type RelationshipProgress,
  type InsertRelationshipProgress,
  type GeneralFeedback,
  type InsertGeneralFeedback
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  
  createWeeklySummary(summary: InsertWeeklySummary): Promise<WeeklySummary>;
  getWeeklySummaries(userId?: string): Promise<WeeklySummary[]>;
  getWeeklySummaryBySession(sessionId: string): Promise<WeeklySummary | undefined>;
  
  createSessionFeedback(feedback: InsertSessionFeedback): Promise<SessionFeedback>;
  getSessionFeedback(userId?: string): Promise<SessionFeedback[]>;
  
  createRelationshipProgress(progress: InsertRelationshipProgress): Promise<RelationshipProgress>;
  getRelationshipProgress(userId?: string): Promise<RelationshipProgress[]>;
  
  createGeneralFeedback(feedback: InsertGeneralFeedback): Promise<GeneralFeedback>;
  getGeneralFeedback(userId?: string, feedbackType?: string): Promise<GeneralFeedback[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private weeklySummaries: Map<string, WeeklySummary>;
  private sessionFeedback: Map<string, SessionFeedback>;
  private relationshipProgress: Map<string, RelationshipProgress>;
  private generalFeedback: Map<string, GeneralFeedback>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.weeklySummaries = new Map();
    this.sessionFeedback = new Map();
    this.relationshipProgress = new Map();
    this.generalFeedback = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const now = new Date();
    const session: ChatSession = {
      id,
      userId: insertSession.userId ?? null,
      startedAt: now,
      lastMessageAt: now,
      messageCount: insertSession.messageCount || 0,
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(id);
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = this.chatSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.chatSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createWeeklySummary(insertSummary: InsertWeeklySummary): Promise<WeeklySummary> {
    const id = randomUUID();
    const summary: WeeklySummary = {
      id,
      sessionId: insertSummary.sessionId,
      userId: insertSummary.userId ?? null,
      summary: insertSummary.summary,
      actionItems: insertSummary.actionItems,
      createdAt: new Date(),
    };
    this.weeklySummaries.set(id, summary);
    return summary;
  }

  async getWeeklySummaries(userId?: string): Promise<WeeklySummary[]> {
    const summaries = Array.from(this.weeklySummaries.values());
    if (userId) {
      return summaries.filter(s => s.userId === userId);
    }
    return summaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getWeeklySummaryBySession(sessionId: string): Promise<WeeklySummary | undefined> {
    return Array.from(this.weeklySummaries.values()).find(
      (summary) => summary.sessionId === sessionId,
    );
  }

  async createSessionFeedback(insertFeedback: InsertSessionFeedback): Promise<SessionFeedback> {
    const id = randomUUID();
    const feedback: SessionFeedback = {
      id,
      sessionId: insertFeedback.sessionId ?? null,
      userId: insertFeedback.userId ?? null,
      rating: insertFeedback.rating,
      feedbackText: insertFeedback.feedbackText ?? null,
      createdAt: new Date(),
    };
    this.sessionFeedback.set(id, feedback);
    return feedback;
  }

  async getSessionFeedback(userId?: string): Promise<SessionFeedback[]> {
    const feedback = Array.from(this.sessionFeedback.values());
    if (userId) {
      return feedback.filter(f => f.userId === userId);
    }
    return feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRelationshipProgress(insertProgress: InsertRelationshipProgress): Promise<RelationshipProgress> {
    const id = randomUUID();
    const progress: RelationshipProgress = {
      id,
      userId: insertProgress.userId ?? null,
      weekStartDate: insertProgress.weekStartDate,
      relationshipScore: insertProgress.relationshipScore,
      improvementNotes: insertProgress.improvementNotes ?? null,
      createdAt: new Date(),
    };
    this.relationshipProgress.set(id, progress);
    return progress;
  }

  async getRelationshipProgress(userId?: string): Promise<RelationshipProgress[]> {
    const progress = Array.from(this.relationshipProgress.values());
    if (userId) {
      return progress.filter(p => p.userId === userId);
    }
    return progress.sort((a, b) => b.weekStartDate.getTime() - a.weekStartDate.getTime());
  }

  async createGeneralFeedback(insertFeedback: InsertGeneralFeedback): Promise<GeneralFeedback> {
    const id = randomUUID();
    const feedback: GeneralFeedback = {
      id,
      userId: insertFeedback.userId ?? null,
      feedbackType: insertFeedback.feedbackType,
      category: insertFeedback.category,
      description: insertFeedback.description,
      rating: insertFeedback.rating ?? null,
      createdAt: new Date(),
    };
    this.generalFeedback.set(id, feedback);
    return feedback;
  }

  async getGeneralFeedback(userId?: string, feedbackType?: string): Promise<GeneralFeedback[]> {
    let feedback = Array.from(this.generalFeedback.values());
    if (userId) {
      feedback = feedback.filter(f => f.userId === userId);
    }
    if (feedbackType) {
      feedback = feedback.filter(f => f.feedbackType === feedbackType);
    }
    return feedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
