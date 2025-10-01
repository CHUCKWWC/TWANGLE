import { type User, type InsertUser, type ChatSession, type InsertChatSession, type WeeklySummary, type InsertWeeklySummary } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private weeklySummaries: Map<string, WeeklySummary>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.weeklySummaries = new Map();
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
}

export const storage = new MemStorage();
