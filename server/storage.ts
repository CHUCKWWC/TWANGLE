import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type ChatSession, 
  type InsertChatSession, 
  type WeeklySummary, 
  type InsertWeeklySummary,
  type SessionFeedback,
  type InsertSessionFeedback,
  type RelationshipProgress,
  type InsertRelationshipProgress,
  type GeneralFeedback,
  type InsertGeneralFeedback,
  type Subscription,
  type InsertSubscription,
  users,
  subscriptions,
  chatSessions,
  weeklySummaries,
  sessionFeedback,
  relationshipProgress,
  generalFeedback
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, or, desc, sql } from "drizzle-orm";
import ws from "ws";

// Configure Neon to use WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations (Reference: blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getTotalUserCount(): Promise<number>;
  getLifetimeAccessCount(): Promise<number>;
  
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
  
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  upsertSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionStatus(stripeSubscriptionId: string, status: string, currentPeriodEnd?: Date): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private weeklySummaries: Map<string, WeeklySummary>;
  private sessionFeedback: Map<string, SessionFeedback>;
  private relationshipProgress: Map<string, RelationshipProgress>;
  private generalFeedback: Map<string, GeneralFeedback>;
  private subscriptions: Map<string, Subscription>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.weeklySummaries = new Map();
    this.sessionFeedback = new Map();
    this.relationshipProgress = new Map();
    this.generalFeedback = new Map();
    this.subscriptions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  // Reference: blueprint:javascript_log_in_with_replit
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const now = new Date();
    
    if (existing) {
      const updated: User = {
        ...existing,
        ...userData,
        updatedAt: now,
      };
      this.users.set(userData.id!, updated);
      return updated;
    }

    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      stripeCustomerId: userData.stripeCustomerId ?? null,
      hasLifetimeAccess: userData.hasLifetimeAccess ?? 0,
      userNumber: userData.userNumber ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === stripeCustomerId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      stripeCustomerId: insertUser.stripeCustomerId ?? null,
      hasLifetimeAccess: insertUser.hasLifetimeAccess ?? 0,
      userNumber: insertUser.userNumber ?? null,
      createdAt: now,
      updatedAt: now,
    };
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

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getTotalUserCount(): Promise<number> {
    return this.users.size;
  }

  async getLifetimeAccessCount(): Promise<number> {
    return Array.from(this.users.values()).filter(u => u.hasLifetimeAccess === 1).length;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && (sub.status === 'active' || sub.status === 'trialing')
    );
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.stripeSubscriptionId === stripeSubscriptionId
    );
  }

  async upsertSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const existing = await this.getSubscriptionByStripeId(insertSubscription.stripeSubscriptionId);
    
    if (existing) {
      const updated: Subscription = {
        ...existing,
        ...insertSubscription,
        updatedAt: new Date(),
      };
      this.subscriptions.set(existing.id, updated);
      return updated;
    }

    const id = randomUUID();
    const now = new Date();
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      stripeSubscriptionId: insertSubscription.stripeSubscriptionId,
      status: insertSubscription.status,
      currentPeriodEnd: insertSubscription.currentPeriodEnd ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string, 
    status: string, 
    currentPeriodEnd?: Date
  ): Promise<Subscription | undefined> {
    const subscription = await this.getSubscriptionByStripeId(stripeSubscriptionId);
    if (!subscription) return undefined;

    const updated: Subscription = {
      ...subscription,
      status,
      currentPeriodEnd: currentPeriodEnd ?? subscription.currentPeriodEnd,
      updatedAt: new Date(),
    };
    this.subscriptions.set(subscription.id, updated);
    return updated;
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  // Reference: blueprint:javascript_log_in_with_replit
  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getTotalUserCount(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }

  async getLifetimeAccessCount(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.hasLifetimeAccess, 1));
    return Number(result[0]?.count || 0);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const result = await this.db.insert(chatSessions).values(insertSession).returning();
    return result[0];
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const result = await this.db.select().from(chatSessions).where(eq(chatSessions.id, id)).limit(1);
    return result[0];
  }

  async updateChatSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const result = await this.db.update(chatSessions).set(updates).where(eq(chatSessions.id, id)).returning();
    return result[0];
  }

  async createWeeklySummary(insertSummary: InsertWeeklySummary): Promise<WeeklySummary> {
    const result = await this.db.insert(weeklySummaries).values(insertSummary).returning();
    return result[0];
  }

  async getWeeklySummaries(userId?: string): Promise<WeeklySummary[]> {
    if (userId) {
      return await this.db.select().from(weeklySummaries).where(eq(weeklySummaries.userId, userId)).orderBy(desc(weeklySummaries.createdAt));
    }
    return await this.db.select().from(weeklySummaries).orderBy(desc(weeklySummaries.createdAt));
  }

  async getWeeklySummaryBySession(sessionId: string): Promise<WeeklySummary | undefined> {
    const result = await this.db.select().from(weeklySummaries).where(eq(weeklySummaries.sessionId, sessionId)).limit(1);
    return result[0];
  }

  async createSessionFeedback(insertFeedback: InsertSessionFeedback): Promise<SessionFeedback> {
    const result = await this.db.insert(sessionFeedback).values(insertFeedback).returning();
    return result[0];
  }

  async getSessionFeedback(userId?: string): Promise<SessionFeedback[]> {
    if (userId) {
      return await this.db.select().from(sessionFeedback).where(eq(sessionFeedback.userId, userId)).orderBy(desc(sessionFeedback.createdAt));
    }
    return await this.db.select().from(sessionFeedback).orderBy(desc(sessionFeedback.createdAt));
  }

  async createRelationshipProgress(insertProgress: InsertRelationshipProgress): Promise<RelationshipProgress> {
    const result = await this.db.insert(relationshipProgress).values(insertProgress).returning();
    return result[0];
  }

  async getRelationshipProgress(userId?: string): Promise<RelationshipProgress[]> {
    if (userId) {
      return await this.db.select().from(relationshipProgress).where(eq(relationshipProgress.userId, userId)).orderBy(desc(relationshipProgress.weekStartDate));
    }
    return await this.db.select().from(relationshipProgress).orderBy(desc(relationshipProgress.weekStartDate));
  }

  async createGeneralFeedback(insertFeedback: InsertGeneralFeedback): Promise<GeneralFeedback> {
    const result = await this.db.insert(generalFeedback).values(insertFeedback).returning();
    return result[0];
  }

  async getGeneralFeedback(userId?: string, feedbackType?: string): Promise<GeneralFeedback[]> {
    let query = this.db.select().from(generalFeedback);
    
    const conditions = [];
    if (userId) conditions.push(eq(generalFeedback.userId, userId));
    if (feedbackType) conditions.push(eq(generalFeedback.feedbackType, feedbackType));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(generalFeedback.createdAt));
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const result = await this.db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        or(eq(subscriptions.status, 'active'), eq(subscriptions.status, 'trialing'))
      ))
      .limit(1);
    return result[0];
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const result = await this.db.select().from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
    return result[0];
  }

  async upsertSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const existing = await this.getSubscriptionByStripeId(insertSubscription.stripeSubscriptionId);
    
    if (existing) {
      const result = await this.db.update(subscriptions)
        .set({ ...insertSubscription, updatedAt: new Date() })
        .where(eq(subscriptions.id, existing.id))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(subscriptions).values(insertSubscription).returning();
    return result[0];
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    status: string,
    currentPeriodEnd?: Date
  ): Promise<Subscription | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    if (currentPeriodEnd) {
      updates.currentPeriodEnd = currentPeriodEnd;
    }
    
    const result = await this.db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
