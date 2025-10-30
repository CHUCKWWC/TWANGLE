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
  type DateNight,
  type InsertDateNight,
  type AccessLog,
  type InsertAccessLog,
  type ConversionEvent,
  type InsertConversionEvent,
  type SubscriptionEvent,
  type InsertSubscriptionEvent,
  users,
  subscriptions,
  chatSessions,
  weeklySummaries,
  sessionFeedback,
  relationshipProgress,
  generalFeedback,
  retreatItineraries,
  assessments,
  dateNights,
  accessLogs,
  conversionEvents,
  subscriptionEvents
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
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getTotalUserCount(): Promise<number>;
  getLifetimeAccessCount(): Promise<number>;
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  markEmailVerified(userId: string): Promise<User | undefined>;
  updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  getChatSessionsByUser(userId: string): Promise<ChatSession[]>;
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
  getAssessmentsByUser(userId: string): Promise<Assessment[]>;
  updateAssessmentResult(id: string, result: AttachmentStyleResult): Promise<Assessment | undefined>;
  enableSharing(id: string): Promise<Assessment | undefined>;
  getSharedAssessment(shareToken: string): Promise<Assessment | undefined>;
  
  createDateNight(dateNight: InsertDateNight): Promise<DateNight>;
  getDateNight(id: string): Promise<DateNight | undefined>;
  getDateNights(userId?: string): Promise<DateNight[]>;
  getDateNightsByAnonId(anonId: string): Promise<DateNight[]>;
  getAssessmentsByAnonId(anonId: string): Promise<Assessment[]>;
  
  createAccessLog(log: InsertAccessLog): Promise<AccessLog>;
  getAccessLogs(limit?: number): Promise<AccessLog[]>;
  getAccessLogsByUser(userId: string): Promise<AccessLog[]>;
  getAccessStatsByCountry(): Promise<Array<{ country: string; countryCode: string; count: number }>>;
  getAccessStatsByUser(): Promise<Array<{ userId: string; email: string; displayName: string; count: number; lastAccess: Date }>>;
  getTotalAccessCount(): Promise<number>;
  getUniqueUserAccessCount(): Promise<number>;
  
  createConversionEvent(event: InsertConversionEvent): Promise<ConversionEvent>;
  getConversionEvents(userId?: string, limit?: number): Promise<ConversionEvent[]>;
  getConversionEventsByType(eventType: string, limit?: number): Promise<ConversionEvent[]>;
  
  createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent>;
  getSubscriptionEvents(userId?: string, stripeSubscriptionId?: string, limit?: number): Promise<SubscriptionEvent[]>;
  getSubscriptionEventsByType(eventType: string, limit?: number): Promise<SubscriptionEvent[]>;
  
  getRevenueMetrics(): Promise<{
    mrr: number;
    arr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    lifetimeCustomers: number;
  }>;
  getConversionFunnel(): Promise<{
    totalSignups: number;
    freeToPaidConversions: number;
    conversionRate: number;
    averageTimeToConvert: number;
  }>;
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
  private dateNights: Map<string, DateNight>;

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
    this.dateNights = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
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
      displayName: userData.displayName ?? null,
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
      displayName: insertUser.displayName ?? null,
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

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(session => session.userId === userId);
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

  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined> {
    return this.updateUser(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.emailVerificationToken === token
    );
  }

  async markEmailVerified(userId: string): Promise<User | undefined> {
    return this.updateUser(userId, {
      emailVerified: 1,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
  }

  async updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined> {
    return this.updateUser(userId, {
      newsletterSubscribed: subscribed ? 1 : 0,
    });
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
      priceId: insertSubscription.priceId ?? null,
      planTier: insertSubscription.planTier ?? null,
      status: insertSubscription.status,
      currentPeriodEnd: insertSubscription.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: insertSubscription.cancelAtPeriodEnd ?? 0,
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
      streetAddress: insertItinerary.streetAddress ?? null,
      travelDistance: insertItinerary.travelDistance ?? null,
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
      anonId: insertAssessment.anonId ?? null,
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

  async getAssessmentsByUser(userId: string): Promise<Assessment[]> {
    return Array.from(this.assessments.values()).filter(assessment => assessment.userId === userId);
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

  async createDateNight(insertDateNight: InsertDateNight): Promise<DateNight> {
    const id = randomUUID();
    const dateNight: DateNight = {
      id,
      userId: insertDateNight.userId ?? null,
      anonId: insertDateNight.anonId ?? null,
      budget: insertDateNight.budget,
      vibe: insertDateNight.vibe,
      duration: insertDateNight.duration,
      location: insertDateNight.location,
      interests: insertDateNight.interests,
      dietaryRestrictions: insertDateNight.dietaryRestrictions ?? null,
      transportation: insertDateNight.transportation ?? null,
      specialOccasion: insertDateNight.specialOccasion ?? null,
      generatedPlan: insertDateNight.generatedPlan,
      createdAt: new Date(),
    };
    this.dateNights.set(id, dateNight);
    return dateNight;
  }

  async getDateNight(id: string): Promise<DateNight | undefined> {
    return this.dateNights.get(id);
  }

  async getDateNights(userId?: string): Promise<DateNight[]> {
    const plans = Array.from(this.dateNights.values());
    if (userId) {
      return plans.filter(p => p.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getDateNightsByAnonId(anonId: string): Promise<DateNight[]> {
    const plans = Array.from(this.dateNights.values());
    return plans.filter(p => p.anonId === anonId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAssessmentsByAnonId(anonId: string): Promise<Assessment[]> {
    const assessmentList = Array.from(this.assessments.values());
    return assessmentList.filter(a => a.anonId === anonId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAccessLog(log: InsertAccessLog): Promise<AccessLog> {
    const id = randomUUID();
    const accessLog: AccessLog = {
      id,
      userId: log.userId ?? null,
      email: log.email ?? null,
      displayName: log.displayName ?? null,
      ipAddress: log.ipAddress,
      country: log.country ?? null,
      countryCode: log.countryCode ?? null,
      city: log.city ?? null,
      region: log.region ?? null,
      location: log.location ?? null,
      userAgent: log.userAgent ?? null,
      path: log.path ?? null,
      accessType: log.accessType,
      createdAt: new Date(),
    };
    return accessLog;
  }

  async getAccessLogs(limit: number = 100): Promise<AccessLog[]> {
    return [];
  }

  async getAccessLogsByUser(userId: string): Promise<AccessLog[]> {
    return [];
  }

  async getAccessStatsByCountry(): Promise<Array<{ country: string; countryCode: string; count: number }>> {
    return [];
  }

  async getAccessStatsByUser(): Promise<Array<{ userId: string; email: string; displayName: string; count: number; lastAccess: Date }>> {
    return [];
  }

  async getTotalAccessCount(): Promise<number> {
    return 0;
  }

  async getUniqueUserAccessCount(): Promise<number> {
    return 0;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  // Reference: blueprint:javascript_log_in_with_replit
  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by email first (since email is unique)
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        // Update existing user by ID
        const result = await this.db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return result[0];
      }
    }
    
    // For development/testing: Grant lifetime access to new users automatically
    // This allows testing premium features without setting up Stripe subscriptions
    const userDataWithLifetimeAccess = {
      ...userData,
      hasLifetimeAccess: userData.hasLifetimeAccess ?? 1, // Default to lifetime access for new users
    };
    
    // No existing user, insert new one
    const result = await this.db
      .insert(users)
      .values(userDataWithLifetimeAccess)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData, // Preserve explicit updates on conflict
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

  async setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);
    return result[0];
  }

  async markEmailVerified(userId: string): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        emailVerified: 1,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set({
        newsletterSubscribed: subscribed ? 1 : 0,
      })
      .where(eq(users.id, userId))
      .returning();
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

  async getChatSessionsByUser(userId: string): Promise<ChatSession[]> {
    return await this.db.select().from(chatSessions).where(eq(chatSessions.userId, userId));
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

  async getAssessmentsByUser(userId: string): Promise<Assessment[]> {
    return await this.db.select().from(assessments).where(eq(assessments.userId, userId));
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

  async createDateNight(insertDateNight: InsertDateNight): Promise<DateNight> {
    const result = await this.db.insert(dateNights).values(insertDateNight).returning();
    return result[0];
  }

  async getDateNight(id: string): Promise<DateNight | undefined> {
    const result = await this.db.select().from(dateNights).where(eq(dateNights.id, id)).limit(1);
    return result[0];
  }

  async getDateNights(userId?: string): Promise<DateNight[]> {
    if (userId) {
      return await this.db.select().from(dateNights).where(eq(dateNights.userId, userId)).orderBy(desc(dateNights.createdAt));
    }
    return await this.db.select().from(dateNights).orderBy(desc(dateNights.createdAt));
  }
  
  async getDateNightsByAnonId(anonId: string): Promise<DateNight[]> {
    return await this.db.select().from(dateNights).where(eq(dateNights.anonId, anonId)).orderBy(desc(dateNights.createdAt));
  }
  
  async getAssessmentsByAnonId(anonId: string): Promise<Assessment[]> {
    return await this.db.select().from(assessments).where(eq(assessments.anonId, anonId)).orderBy(desc(assessments.createdAt));
  }

  async createAccessLog(insertLog: InsertAccessLog): Promise<AccessLog> {
    const result = await this.db.insert(accessLogs).values(insertLog).returning();
    return result[0];
  }

  async getAccessLogs(limit: number = 100): Promise<AccessLog[]> {
    return await this.db.select().from(accessLogs).orderBy(desc(accessLogs.createdAt)).limit(limit);
  }

  async getAccessLogsByUser(userId: string): Promise<AccessLog[]> {
    return await this.db.select().from(accessLogs).where(eq(accessLogs.userId, userId)).orderBy(desc(accessLogs.createdAt));
  }

  async getAccessStatsByCountry(): Promise<Array<{ country: string; countryCode: string; count: number }>> {
    const result = await this.db.select({
      country: accessLogs.country,
      countryCode: accessLogs.countryCode,
      count: sql<number>`count(*)::int`,
    })
    .from(accessLogs)
    .where(sql`${accessLogs.country} IS NOT NULL`)
    .groupBy(accessLogs.country, accessLogs.countryCode)
    .orderBy(desc(sql`count(*)`));
    
    return result.map(r => ({
      country: r.country || 'Unknown',
      countryCode: r.countryCode || 'UNKNOWN',
      count: Number(r.count),
    }));
  }

  async getAccessStatsByUser(): Promise<Array<{ userId: string; email: string; displayName: string; count: number; lastAccess: Date }>> {
    const result = await this.db.select({
      userId: accessLogs.userId,
      email: accessLogs.email,
      displayName: accessLogs.displayName,
      count: sql<number>`count(*)::int`,
      lastAccess: sql<Date>`max(${accessLogs.createdAt})`,
    })
    .from(accessLogs)
    .where(sql`${accessLogs.userId} IS NOT NULL`)
    .groupBy(accessLogs.userId, accessLogs.email, accessLogs.displayName)
    .orderBy(desc(sql`max(${accessLogs.createdAt})`));
    
    return result.map(r => ({
      userId: r.userId || '',
      email: r.email || '',
      displayName: r.displayName || '',
      count: Number(r.count),
      lastAccess: r.lastAccess,
    }));
  }

  async getTotalAccessCount(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(accessLogs);
    return Number(result[0]?.count || 0);
  }

  async getUniqueUserAccessCount(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(DISTINCT ${accessLogs.userId})` }).from(accessLogs);
    return Number(result[0]?.count || 0);
  }

  async createConversionEvent(event: InsertConversionEvent): Promise<ConversionEvent> {
    const result = await this.db.insert(conversionEvents).values(event).returning();
    return result[0];
  }

  async getConversionEvents(userId?: string, limit: number = 100): Promise<ConversionEvent[]> {
    if (userId) {
      return await this.db.select().from(conversionEvents)
        .where(eq(conversionEvents.userId, userId))
        .orderBy(desc(conversionEvents.createdAt))
        .limit(limit);
    }
    return await this.db.select().from(conversionEvents)
      .orderBy(desc(conversionEvents.createdAt))
      .limit(limit);
  }

  async getConversionEventsByType(eventType: string, limit: number = 100): Promise<ConversionEvent[]> {
    return await this.db.select().from(conversionEvents)
      .where(eq(conversionEvents.eventType, eventType))
      .orderBy(desc(conversionEvents.createdAt))
      .limit(limit);
  }

  async createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const result = await this.db.insert(subscriptionEvents).values(event).returning();
    return result[0];
  }

  async getSubscriptionEvents(userId?: string, stripeSubscriptionId?: string, limit: number = 100): Promise<SubscriptionEvent[]> {
    const conditions = [];
    if (userId) conditions.push(eq(subscriptionEvents.userId, userId));
    if (stripeSubscriptionId) conditions.push(eq(subscriptionEvents.stripeSubscriptionId, stripeSubscriptionId));
    
    if (conditions.length > 0) {
      return await this.db.select().from(subscriptionEvents)
        .where(and(...conditions))
        .orderBy(desc(subscriptionEvents.createdAt))
        .limit(limit);
    }
    return await this.db.select().from(subscriptionEvents)
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit);
  }

  async getSubscriptionEventsByType(eventType: string, limit: number = 100): Promise<SubscriptionEvent[]> {
    return await this.db.select().from(subscriptionEvents)
      .where(eq(subscriptionEvents.eventType, eventType))
      .orderBy(desc(subscriptionEvents.createdAt))
      .limit(limit);
  }

  async getRevenueMetrics(): Promise<{
    mrr: number;
    arr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    lifetimeCustomers: number;
  }> {
    // Get active subscriptions count
    const activeSubsResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    const activeSubscriptions = Number(activeSubsResult[0]?.count || 0);

    // Get lifetime access users count
    const lifetimeResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.hasLifetimeAccess, 1));
    const lifetimeCustomers = Number(lifetimeResult[0]?.count || 0);

    // Calculate total revenue from conversion events (sum of positive revenue impacts)
    const revenueResult = await this.db.select({
      total: sql<number>`COALESCE(SUM(${conversionEvents.revenueImpact}), 0)`
    }).from(conversionEvents);
    const totalRevenue = Number(revenueResult[0]?.total || 0);

    // Calculate MRR - assuming $20/month for premium subscriptions
    // This is a simplified calculation - in production, you'd want to query actual Stripe prices
    const mrr = activeSubscriptions * 2000; // $20 in cents

    // ARR is MRR * 12
    const arr = mrr * 12;

    return {
      mrr,
      arr,
      totalRevenue,
      activeSubscriptions,
      lifetimeCustomers,
    };
  }

  async getConversionFunnel(): Promise<{
    totalSignups: number;
    freeToPaidConversions: number;
    conversionRate: number;
    averageTimeToConvert: number;
  }> {
    // Total signups (users with email)
    const signupsResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.email} IS NOT NULL`);
    const totalSignups = Number(signupsResult[0]?.count || 0);

    // Free to paid conversions
    const conversionsResult = await this.db.select({ count: sql<number>`count(*)` })
      .from(conversionEvents)
      .where(eq(conversionEvents.eventType, 'free_to_paid'));
    const freeToPaidConversions = Number(conversionsResult[0]?.count || 0);

    // Conversion rate
    const conversionRate = totalSignups > 0 ? (freeToPaidConversions / totalSignups) * 100 : 0;

    // Average time to convert (in days)
    // This requires joining users with conversion events and calculating time difference
    const timeToConvertResult = await this.db.select({
      avgDays: sql<number>`
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${conversionEvents.createdAt} - ${users.createdAt})) / 86400
          ), 
          0
        )
      `
    })
    .from(conversionEvents)
    .innerJoin(users, eq(conversionEvents.userId, users.id))
    .where(eq(conversionEvents.eventType, 'free_to_paid'));
    
    const averageTimeToConvert = Number(timeToConvertResult[0]?.avgDays || 0);

    return {
      totalSignups,
      freeToPaidConversions,
      conversionRate,
      averageTimeToConvert,
    };
  }
}

export const storage = new DbStorage();
