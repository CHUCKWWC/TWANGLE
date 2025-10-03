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
  type RetreatItinerary,
  type InsertRetreatItinerary,
  type Assessment,
  type InsertAssessment,
  type AttachmentStyleResult,
  type ConnectionTopic,
  type InsertConnectionTopic,
  type ConnectionQuestion,
  type InsertConnectionQuestion,
  type ConnectionResponse,
  type InsertConnectionResponse,
  type ConnectionSummary,
  type InsertConnectionSummary,
  users,
  subscriptions,
  chatSessions,
  weeklySummaries,
  sessionFeedback,
  relationshipProgress,
  generalFeedback,
  retreatItineraries,
  assessments,
  connectionTopics,
  connectionQuestions,
  connectionResponses,
  connectionSummaries
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
  
  createRetreatItinerary(itinerary: InsertRetreatItinerary): Promise<RetreatItinerary>;
  getRetreatItinerary(id: string): Promise<RetreatItinerary | undefined>;
  getRetreatItineraries(userId?: string): Promise<RetreatItinerary[]>;
  
  createAssessment(data: InsertAssessment): Promise<Assessment>;
  getAssessment(id: string): Promise<Assessment | undefined>;
  updateAssessmentResult(id: string, result: AttachmentStyleResult): Promise<Assessment | undefined>;
  enableSharing(id: string): Promise<Assessment | undefined>;
  getSharedAssessment(shareToken: string): Promise<Assessment | undefined>;
  
  // Connection Questions operations
  createConnectionTopic(topic: InsertConnectionTopic): Promise<ConnectionTopic>;
  getConnectionTopics(): Promise<ConnectionTopic[]>;
  getConnectionTopic(id: string): Promise<ConnectionTopic | undefined>;
  
  createConnectionQuestion(question: InsertConnectionQuestion): Promise<ConnectionQuestion>;
  getConnectionQuestions(topicId?: string): Promise<ConnectionQuestion[]>;
  getConnectionQuestion(id: string): Promise<ConnectionQuestion | undefined>;
  
  createConnectionResponse(response: InsertConnectionResponse): Promise<ConnectionResponse>;
  updateConnectionResponse(id: string, updates: Partial<ConnectionResponse>): Promise<ConnectionResponse | undefined>;
  getConnectionResponses(userId: string, questionId?: string): Promise<ConnectionResponse[]>;
  getConnectionResponsesByTopic(userId: string, topicId: string): Promise<ConnectionResponse[]>;
  
  createConnectionSummary(summary: InsertConnectionSummary): Promise<ConnectionSummary>;
  getConnectionSummaries(userId: string, topicId?: string): Promise<ConnectionSummary[]>;
  getLatestConnectionSummary(userId: string, topicId: string): Promise<ConnectionSummary | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private weeklySummaries: Map<string, WeeklySummary>;
  private sessionFeedback: Map<string, SessionFeedback>;
  private relationshipProgress: Map<string, RelationshipProgress>;
  private generalFeedback: Map<string, GeneralFeedback>;
  private subscriptions: Map<string, Subscription>;
  private retreatItineraries: Map<string, RetreatItinerary>;
  private assessments: Map<string, Assessment>;
  private connectionTopics: Map<string, ConnectionTopic>;
  private connectionQuestions: Map<string, ConnectionQuestion>;
  private connectionResponses: Map<string, ConnectionResponse>;
  private connectionSummaries: Map<string, ConnectionSummary>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.weeklySummaries = new Map();
    this.sessionFeedback = new Map();
    this.relationshipProgress = new Map();
    this.generalFeedback = new Map();
    this.subscriptions = new Map();
    this.retreatItineraries = new Map();
    this.assessments = new Map();
    this.connectionTopics = new Map();
    this.connectionQuestions = new Map();
    this.connectionResponses = new Map();
    this.connectionSummaries = new Map();
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

  async createRetreatItinerary(insertItinerary: InsertRetreatItinerary): Promise<RetreatItinerary> {
    const id = randomUUID();
    const itinerary: RetreatItinerary = {
      id,
      userId: insertItinerary.userId,
      vibe: insertItinerary.vibe,
      goal: insertItinerary.goal,
      startTime: insertItinerary.startTime,
      duration: insertItinerary.duration,
      location: insertItinerary.location,
      budget: insertItinerary.budget,
      focuses: insertItinerary.focuses,
      currentCity: insertItinerary.currentCity ?? null,
      retreatDestination: insertItinerary.retreatDestination ?? null,
      startDate: insertItinerary.startDate ?? null,
      generatedItinerary: insertItinerary.generatedItinerary,
      createdAt: new Date(),
    };
    this.retreatItineraries.set(id, itinerary);
    return itinerary;
  }

  async getRetreatItinerary(id: string): Promise<RetreatItinerary | undefined> {
    return this.retreatItineraries.get(id);
  }

  async getRetreatItineraries(userId?: string): Promise<RetreatItinerary[]> {
    const itineraries = Array.from(this.retreatItineraries.values());
    if (userId) {
      return itineraries.filter(i => i.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return itineraries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const id = randomUUID();
    const now = new Date();
    const assessment: Assessment = {
      id,
      userId: insertAssessment.userId ?? null,
      responses: insertAssessment.responses,
      result: insertAssessment.result ?? null,
      shareToken: insertAssessment.shareToken ?? null,
      isShared: insertAssessment.isShared ?? 0,
      createdAt: now,
    };
    this.assessments.set(id, assessment);
    return assessment;
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async updateAssessmentResult(id: string, result: AttachmentStyleResult): Promise<Assessment | undefined> {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;
    
    const updated: Assessment = {
      ...assessment,
      result: result as any,
    };
    this.assessments.set(id, updated);
    return updated;
  }

  async enableSharing(id: string): Promise<Assessment | undefined> {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;
    
    const shareToken = randomUUID();
    const updated: Assessment = {
      ...assessment,
      shareToken,
      isShared: 1,
    };
    this.assessments.set(id, updated);
    return updated;
  }

  async getSharedAssessment(shareToken: string): Promise<Assessment | undefined> {
    return Array.from(this.assessments.values()).find(
      (assessment) => assessment.shareToken === shareToken && assessment.isShared === 1
    );
  }

  // Connection Questions operations
  async createConnectionTopic(insertTopic: InsertConnectionTopic): Promise<ConnectionTopic> {
    const id = randomUUID();
    const topic: ConnectionTopic = { id, ...insertTopic };
    this.connectionTopics.set(id, topic);
    return topic;
  }

  async getConnectionTopics(): Promise<ConnectionTopic[]> {
    return Array.from(this.connectionTopics.values()).sort((a, b) => a.order - b.order);
  }

  async getConnectionTopic(id: string): Promise<ConnectionTopic | undefined> {
    return this.connectionTopics.get(id);
  }

  async createConnectionQuestion(insertQuestion: InsertConnectionQuestion): Promise<ConnectionQuestion> {
    const id = randomUUID();
    const question: ConnectionQuestion = {
      id,
      ...insertQuestion,
      description: insertQuestion.description ?? null,
    };
    this.connectionQuestions.set(id, question);
    return question;
  }

  async getConnectionQuestions(topicId?: string): Promise<ConnectionQuestion[]> {
    const questions = Array.from(this.connectionQuestions.values());
    const filtered = topicId
      ? questions.filter(q => q.topicId === topicId)
      : questions;
    return filtered.sort((a, b) => a.order - b.order);
  }

  async getConnectionQuestion(id: string): Promise<ConnectionQuestion | undefined> {
    return this.connectionQuestions.get(id);
  }

  async createConnectionResponse(insertResponse: InsertConnectionResponse): Promise<ConnectionResponse> {
    const id = randomUUID();
    const now = new Date();
    const response: ConnectionResponse = {
      id,
      ...insertResponse,
      isShared: insertResponse.isShared ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.connectionResponses.set(id, response);
    return response;
  }

  async updateConnectionResponse(id: string, updates: Partial<ConnectionResponse>): Promise<ConnectionResponse | undefined> {
    const response = this.connectionResponses.get(id);
    if (!response) return undefined;
    
    const updated: ConnectionResponse = {
      ...response,
      ...updates,
      updatedAt: new Date(),
    };
    this.connectionResponses.set(id, updated);
    return updated;
  }

  async getConnectionResponses(userId: string, questionId?: string): Promise<ConnectionResponse[]> {
    const responses = Array.from(this.connectionResponses.values());
    return responses.filter(r => {
      if (r.userId !== userId) return false;
      if (questionId && r.questionId !== questionId) return false;
      return true;
    });
  }

  async getConnectionResponsesByTopic(userId: string, topicId: string): Promise<ConnectionResponse[]> {
    const questions = await this.getConnectionQuestions(topicId);
    const questionIds = questions.map(q => q.id);
    const responses = Array.from(this.connectionResponses.values());
    return responses.filter(r => r.userId === userId && questionIds.includes(r.questionId));
  }

  async createConnectionSummary(insertSummary: InsertConnectionSummary): Promise<ConnectionSummary> {
    const id = randomUUID();
    const now = new Date();
    const summary: ConnectionSummary = {
      id,
      ...insertSummary,
      createdAt: now,
    };
    this.connectionSummaries.set(id, summary);
    return summary;
  }

  async getConnectionSummaries(userId: string, topicId?: string): Promise<ConnectionSummary[]> {
    const summaries = Array.from(this.connectionSummaries.values());
    return summaries
      .filter(s => {
        if (s.userId !== userId) return false;
        if (topicId && s.topicId !== topicId) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLatestConnectionSummary(userId: string, topicId: string): Promise<ConnectionSummary | undefined> {
    const summaries = await this.getConnectionSummaries(userId, topicId);
    return summaries[0];
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

  async createRetreatItinerary(insertItinerary: InsertRetreatItinerary): Promise<RetreatItinerary> {
    const result = await this.db.insert(retreatItineraries).values(insertItinerary).returning();
    return result[0];
  }

  async getRetreatItinerary(id: string): Promise<RetreatItinerary | undefined> {
    const result = await this.db.select().from(retreatItineraries).where(eq(retreatItineraries.id, id)).limit(1);
    return result[0];
  }

  async getRetreatItineraries(userId?: string): Promise<RetreatItinerary[]> {
    if (userId) {
      return await this.db.select().from(retreatItineraries).where(eq(retreatItineraries.userId, userId)).orderBy(desc(retreatItineraries.createdAt));
    }
    return await this.db.select().from(retreatItineraries).orderBy(desc(retreatItineraries.createdAt));
  }

  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const result = await this.db.insert(assessments).values(insertAssessment).returning();
    return result[0];
  }

  async getAssessment(id: string): Promise<Assessment | undefined> {
    const result = await this.db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
    return result[0];
  }

  async updateAssessmentResult(id: string, result: AttachmentStyleResult): Promise<Assessment | undefined> {
    const updated = await this.db.update(assessments)
      .set({ result: result as any })
      .where(eq(assessments.id, id))
      .returning();
    return updated[0];
  }

  async enableSharing(id: string): Promise<Assessment | undefined> {
    const shareToken = randomUUID();
    const updated = await this.db.update(assessments)
      .set({ shareToken, isShared: 1 })
      .where(eq(assessments.id, id))
      .returning();
    return updated[0];
  }

  async getSharedAssessment(shareToken: string): Promise<Assessment | undefined> {
    const result = await this.db.select().from(assessments)
      .where(and(eq(assessments.shareToken, shareToken), eq(assessments.isShared, 1)))
      .limit(1);
    return result[0];
  }

  // Connection Questions operations
  async createConnectionTopic(insertTopic: InsertConnectionTopic): Promise<ConnectionTopic> {
    const result = await this.db.insert(connectionTopics).values(insertTopic).returning();
    return result[0];
  }

  async getConnectionTopics(): Promise<ConnectionTopic[]> {
    return await this.db.select().from(connectionTopics).orderBy(connectionTopics.order);
  }

  async getConnectionTopic(id: string): Promise<ConnectionTopic | undefined> {
    const result = await this.db.select().from(connectionTopics).where(eq(connectionTopics.id, id)).limit(1);
    return result[0];
  }

  async createConnectionQuestion(insertQuestion: InsertConnectionQuestion): Promise<ConnectionQuestion> {
    const result = await this.db.insert(connectionQuestions).values(insertQuestion).returning();
    return result[0];
  }

  async getConnectionQuestions(topicId?: string): Promise<ConnectionQuestion[]> {
    if (topicId) {
      return await this.db.select().from(connectionQuestions)
        .where(eq(connectionQuestions.topicId, topicId))
        .orderBy(connectionQuestions.order);
    }
    return await this.db.select().from(connectionQuestions).orderBy(connectionQuestions.order);
  }

  async getConnectionQuestion(id: string): Promise<ConnectionQuestion | undefined> {
    const result = await this.db.select().from(connectionQuestions).where(eq(connectionQuestions.id, id)).limit(1);
    return result[0];
  }

  async createConnectionResponse(insertResponse: InsertConnectionResponse): Promise<ConnectionResponse> {
    const result = await this.db.insert(connectionResponses).values(insertResponse).returning();
    return result[0];
  }

  async updateConnectionResponse(id: string, updates: Partial<ConnectionResponse>): Promise<ConnectionResponse | undefined> {
    const result = await this.db.update(connectionResponses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(connectionResponses.id, id))
      .returning();
    return result[0];
  }

  async getConnectionResponses(userId: string, questionId?: string): Promise<ConnectionResponse[]> {
    if (questionId) {
      return await this.db.select().from(connectionResponses)
        .where(and(eq(connectionResponses.userId, userId), eq(connectionResponses.questionId, questionId)));
    }
    return await this.db.select().from(connectionResponses).where(eq(connectionResponses.userId, userId));
  }

  async getConnectionResponsesByTopic(userId: string, topicId: string): Promise<ConnectionResponse[]> {
    const questions = await this.getConnectionQuestions(topicId);
    const questionIds = questions.map(q => q.id);
    
    if (questionIds.length === 0) return [];
    
    return await this.db.select().from(connectionResponses)
      .where(and(
        eq(connectionResponses.userId, userId),
        or(...questionIds.map(qId => eq(connectionResponses.questionId, qId)))
      ));
  }

  async createConnectionSummary(insertSummary: InsertConnectionSummary): Promise<ConnectionSummary> {
    const result = await this.db.insert(connectionSummaries).values(insertSummary).returning();
    return result[0];
  }

  async getConnectionSummaries(userId: string, topicId?: string): Promise<ConnectionSummary[]> {
    if (topicId) {
      return await this.db.select().from(connectionSummaries)
        .where(and(eq(connectionSummaries.userId, userId), eq(connectionSummaries.topicId, topicId)))
        .orderBy(desc(connectionSummaries.createdAt));
    }
    return await this.db.select().from(connectionSummaries)
      .where(eq(connectionSummaries.userId, userId))
      .orderBy(desc(connectionSummaries.createdAt));
  }

  async getLatestConnectionSummary(userId: string, topicId: string): Promise<ConnectionSummary | undefined> {
    const result = await this.db.select().from(connectionSummaries)
      .where(and(eq(connectionSummaries.userId, userId), eq(connectionSummaries.topicId, topicId)))
      .orderBy(desc(connectionSummaries.createdAt))
      .limit(1);
    return result[0];
  }
}

export const storage = new DbStorage();
