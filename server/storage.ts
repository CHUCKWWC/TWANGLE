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
  type EmailSendLog,
  type InsertEmailSendLog,
  type HealthScore,
  type InsertHealthScore,
  type Partnership,
  type InsertPartnership,
  type JournalEntry,
  type InsertJournalEntry,
  type AnalyticsSnapshot,
  type InsertAnalyticsSnapshot,
  type ConversationQuestion,
  type InsertConversationQuestion,
  type ConversationResponse,
  type InsertConversationResponse,
  type ConversationHelpEvent,
  type InsertConversationHelpEvent,
  type ConnectedAccount,
  type InsertConnectedAccount,
  type Product,
  type InsertProduct,
  type MerchantCustomer,
  type InsertMerchantCustomer,
  type MerchantSubscription,
  type InsertMerchantSubscription,
  type Couple,
  type InsertCouple,
  type Challenge,
  type InsertChallenge,
  type UserChallengeProgress,
  type InsertUserChallengeProgress,
  type ChallengeReflection,
  type InsertChallengeReflection,
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
  subscriptionEvents,
  emailSendLogs,
  healthScores,
  partnerships,
  journalEntries,
  analyticsSnapshots,
  conversationQuestions,
  conversationResponses,
  conversationHelpEvents,
  connectedAccounts,
  products,
  merchantCustomers,
  merchantSubscriptions,
  couples,
  challenges,
  userChallengeProgress,
  challengeReflections
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, or, desc, sql, isNull } from "drizzle-orm";
import ws from "ws";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { sendVerificationEmail as gmailSendVerificationEmail, sendPasswordResetEmail as gmailSendPasswordResetEmail } from "./gmail";

// Configure Neon to use WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations (Reference: blueprint:javascript_log_in_with_replit)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getTrialUsersNeedingReminders(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getTotalUserCount(): Promise<number>;
  getLifetimeAccessCount(): Promise<number>;
  setEmailVerificationToken(userId: string, token: string, expires: Date): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  markEmailVerified(userId: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined>;
  getTrialProgress(userId: string): Promise<{
    chatSessions: number;
    assessments: number;
    retreats: number;
    dateNights: number;
  }>;
  
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
  
  // Email send tracking
  createEmailSendLog(log: InsertEmailSendLog): Promise<EmailSendLog>;
  hasEmailBeenSent(userId: string, emailType: string, subType?: string): Promise<boolean>;
  getEmailSendLogs(filters?: { userId?: string; emailType?: string; status?: string; limit?: number }): Promise<EmailSendLog[]>;
  getEmailDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    byType: Record<string, { sent: number; success: number; failed: number }>;
  }>;

  // Health score tracking
  calculateHealthScore(userId: string): Promise<HealthScore>;
  getHealthScores(userId: string, limit?: number): Promise<HealthScore[]>;
  getLatestHealthScore(userId: string): Promise<HealthScore | undefined>;

  // Partnership/connection management
  createPartnership(partnership: InsertPartnership): Promise<Partnership>;
  getPartnership(id: string): Promise<Partnership | undefined>;
  getPartnershipByToken(token: string): Promise<Partnership | undefined>;
  getActivePartnership(userId: string): Promise<Partnership | undefined>;
  getPendingInvites(userId: string): Promise<Partnership[]>;
  updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership | undefined>;
  acceptPartnership(token: string, userId: string): Promise<Partnership | undefined>;

  // Journal entries
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: string, limit?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;

  // Analytics snapshots
  createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot>;
  getAnalyticsSnapshots(userId: string, periodType?: string): Promise<AnalyticsSnapshot[]>;
  getLatestAnalyticsSnapshot(userId: string, periodType: string): Promise<AnalyticsSnapshot | undefined>;

  // Conversation questions and responses
  getDailyQuestion(partnershipId: string): Promise<ConversationQuestion | undefined>;
  getSoloQuestion(userId: string): Promise<ConversationQuestion | undefined>;
  getRandomQuestion(category?: string): Promise<ConversationQuestion | undefined>;
  createConversationResponse(response: InsertConversationResponse): Promise<ConversationResponse>;
  getConversationResponses(partnershipId: string, questionId: string): Promise<ConversationResponse[]>;
  getSoloConversationResponses(userId: string, questionId: string): Promise<ConversationResponse[]>;
  getConversationHistory(partnershipId: string, limit?: number): Promise<Array<{
    question: ConversationQuestion;
    responses: ConversationResponse[];
    isComplete: boolean;
  }>>;
  getSoloConversationHistory(userId: string, limit?: number): Promise<Array<{
    question: ConversationQuestion;
    responses: ConversationResponse[];
    isComplete: boolean;
  }>>;
  createConversationHelpEvent(event: InsertConversationHelpEvent): Promise<ConversationHelpEvent>;
  incrementConversationResponseCount(userId: string): Promise<void>;
  
  // Stripe Connect: Connected Accounts
  createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount>;
  getConnectedAccountByUserId(userId: string): Promise<ConnectedAccount | undefined>;
  getConnectedAccountByStripeId(stripeAccountId: string): Promise<ConnectedAccount | undefined>;
  getAllConnectedAccounts(): Promise<ConnectedAccount[]>;
  updateConnectedAccount(id: string, updates: Partial<ConnectedAccount>): Promise<ConnectedAccount | undefined>;
  
  // Stripe Connect: Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByUserId(userId: string): Promise<Product[]>;
  getProductsByConnectedAccount(connectedAccountId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  
  // Stripe Connect: Merchant Customers
  createMerchantCustomer(customer: InsertMerchantCustomer): Promise<MerchantCustomer>;
  getMerchantCustomer(userId: string, connectedAccountId: string): Promise<MerchantCustomer | undefined>;
  getMerchantCustomersByUser(userId: string): Promise<MerchantCustomer[]>;
  
  // Stripe Connect: Merchant Subscriptions
  createMerchantSubscription(subscription: InsertMerchantSubscription): Promise<MerchantSubscription>;
  getMerchantSubscription(id: string): Promise<MerchantSubscription | undefined>;
  getMerchantSubscriptionByStripeId(stripeSubscriptionId: string): Promise<MerchantSubscription | undefined>;
  getMerchantSubscriptionsByUser(userId: string): Promise<MerchantSubscription[]>;
  getMerchantSubscriptionsByProduct(productId: string): Promise<MerchantSubscription[]>;
  getMerchantSubscriptionsByAccount(connectedAccountId: string): Promise<MerchantSubscription[]>;
  updateMerchantSubscription(id: string, updates: Partial<MerchantSubscription>): Promise<MerchantSubscription | undefined>;
  updateMerchantSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<MerchantSubscription>): Promise<MerchantSubscription | undefined>;
  
  // Couple subscription management
  createCouple(couple: InsertCouple): Promise<Couple>;
  getCouple(id: string): Promise<Couple | undefined>;
  getCoupleByPrimaryUser(userId: string): Promise<Couple | undefined>;
  getCoupleByPartnerUser(userId: string): Promise<Couple | undefined>;
  getCoupleByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Couple | undefined>;
  getCoupleByInviteToken(token: string): Promise<Couple | undefined>;
  updateCouple(id: string, updates: Partial<Couple>): Promise<Couple | undefined>;
  generatePartnerInviteToken(coupleId: string, partnerEmail: string, expiresInHours?: number): Promise<{ token: string; couple: Couple }>;
  acceptPartnerInvite(token: string, userId: string): Promise<Couple | undefined>;
  cancelPartnerInvite(coupleId: string): Promise<Couple | undefined>;
  removePartner(coupleId: string): Promise<Couple | undefined>;
  
  // 40dayTwangle Challenge system
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallengeByDay(dayNumber: number): Promise<Challenge | undefined>;
  getAllChallenges(): Promise<Challenge[]>;
  
  createUserChallengeProgress(progress: InsertUserChallengeProgress): Promise<UserChallengeProgress>;
  getUserChallengeProgress(userId: string): Promise<UserChallengeProgress | undefined>;
  updateUserChallengeProgress(id: string, updates: Partial<UserChallengeProgress>): Promise<UserChallengeProgress | undefined>;
  markDayComplete(userId: string, dayNumber: number): Promise<UserChallengeProgress | undefined>;
  
  createChallengeReflection(reflection: InsertChallengeReflection): Promise<ChallengeReflection>;
  getChallengeReflection(id: string): Promise<ChallengeReflection | undefined>;
  getUserReflectionForDay(userId: string, dayNumber: number): Promise<ChallengeReflection | undefined>;
  getAllUserReflections(userId: string): Promise<ChallengeReflection[]>;
  
  // Session store for authentication
  sessionStore: any;
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getTrialUsersNeedingReminders(): Promise<User[]> {
    const now = new Date();
    return Array.from(this.users.values()).filter(user => {
      // Must have email and be verified
      if (!user.email || !user.emailVerified) return false;
      // Must be on trial
      if (!user.trialStartedAt || !user.trialEndsAt) return false;
      // Trial must not have ended
      if (new Date(user.trialEndsAt) < now) return false;
      return true;
    });
  }

  async getTrialProgress(userId: string): Promise<{
    chatSessions: number;
    assessments: number;
    retreats: number;
    dateNights: number;
  }> {
    const chatSessions = Array.from(this.chatSessions.values())
      .filter(session => session.userId === userId).length;
    const assessments = Array.from(this.assessments.values())
      .filter(assessment => assessment.userId === userId).length;
    const retreats = Array.from(this.retreatItineraries.values())
      .filter(retreat => retreat.userId === userId).length;
    const dateNights = Array.from(this.dateNights.values())
      .filter(dateNight => dateNight.userId === userId).length;

    return { chatSessions, assessments, retreats, dateNights };
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
      emailVerified: 0,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      newsletterSubscribed: 0,
      trialStartedAt: null,
      trialEndsAt: null,
      isAdmin: 0,
      createdAt: now,
      updatedAt: null,
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
      emailVerified: 0,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      newsletterSubscribed: 0,
      trialStartedAt: null,
      trialEndsAt: null,
      isAdmin: 0,
      createdAt: now,
      updatedAt: null,
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
      visionPlanning: insertItinerary.visionPlanning ?? '',
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

  // Conversion events (stub implementation for MemStorage)
  async createConversionEvent(event: InsertConversionEvent): Promise<ConversionEvent> {
    const id = randomUUID();
    return {
      id,
      userId: event.userId,
      email: event.email ?? null,
      stripeCustomerId: event.stripeCustomerId ?? null,
      eventType: event.eventType,
      fromPlan: event.fromPlan ?? null,
      toPlan: event.toPlan ?? null,
      revenueImpact: event.revenueImpact ?? null,
      metadata: event.metadata ?? null,
      stripeSubscriptionId: event.stripeSubscriptionId ?? null,
      createdAt: new Date(),
    };
  }

  async getConversionEvents(userId?: string, limit: number = 50): Promise<ConversionEvent[]> {
    return [];
  }

  async getConversionEventsByType(eventType: string): Promise<ConversionEvent[]> {
    return [];
  }

  // Subscription events (stub implementation for MemStorage)
  async createSubscriptionEvent(event: InsertSubscriptionEvent): Promise<SubscriptionEvent> {
    const id = randomUUID();
    return {
      id,
      userId: event.userId,
      stripeSubscriptionId: event.stripeSubscriptionId,
      stripeCustomerId: event.stripeCustomerId ?? null,
      eventType: event.eventType,
      status: event.status ?? null,
      priceId: event.priceId ?? null,
      currentPeriodEnd: event.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? null,
      canceledAt: event.canceledAt ?? null,
      metadata: event.metadata ?? null,
      createdAt: new Date(),
    };
  }

  async getSubscriptionEventsByUser(userId: string): Promise<SubscriptionEvent[]> {
    return [];
  }

  async getSubscriptionEvents(userId?: string, stripeSubscriptionId?: string, limit: number = 100): Promise<SubscriptionEvent[]> {
    return [];
  }

  // Analytics (stub implementation for MemStorage)
  async getRevenueMetrics(): Promise<{
    mrr: number;
    arr: number;
    totalRevenue: number;
    activeSubscriptions: number;
    lifetimeCustomers: number;
  }> {
    return {
      mrr: 0,
      arr: 0,
      totalRevenue: 0,
      activeSubscriptions: 0,
      lifetimeCustomers: 0,
    };
  }

  async getConversionFunnel(): Promise<{
    totalSignups: number;
    freeToPaidConversions: number;
    conversionRate: number;
    averageTimeToConvert: number;
  }> {
    return {
      totalSignups: 0,
      freeToPaidConversions: 0,
      conversionRate: 0,
      averageTimeToConvert: 0,
    };
  }

  // Email send tracking (stub implementation for MemStorage)
  async createEmailSendLog(log: InsertEmailSendLog): Promise<EmailSendLog> {
    const id = randomUUID();
    return {
      id,
      userId: log.userId,
      email: log.email,
      emailType: log.emailType,
      subType: log.subType ?? null,
      status: log.status,
      errorMessage: log.errorMessage ?? null,
      metadata: log.metadata ?? null,
      sentAt: new Date(),
    };
  }

  async hasEmailBeenSent(userId: string, emailType: string, subType?: string): Promise<boolean> {
    return false;
  }

  async getEmailSendLogs(filters?: { userId?: string; emailType?: string; status?: string; limit?: number }): Promise<EmailSendLog[]> {
    return [];
  }

  async getEmailDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    byType: Record<string, { sent: number; success: number; failed: number }>;
  }> {
    return {
      totalSent: 0,
      totalSuccess: 0,
      totalFailed: 0,
      byType: {},
    };
  }

  // Health score tracking (stub implementation)
  async calculateHealthScore(userId: string): Promise<HealthScore> {
    const id = randomUUID();
    return {
      id,
      userId,
      overallScore: 75,
      breakdown: { communication: 80, intimacy: 70, conflict: 75, growth: 80 },
      metrics: { chatSessions: 0, assessments: 0, exercisesCompleted: 0 },
      calculatedAt: new Date(),
    };
  }

  async getHealthScores(userId: string, limit: number = 30): Promise<HealthScore[]> {
    return [];
  }

  async getLatestHealthScore(userId: string): Promise<HealthScore | undefined> {
    return undefined;
  }

  // Partnership management (stub implementation)
  async createPartnership(partnership: InsertPartnership): Promise<Partnership> {
    const id = randomUUID();
    return {
      id,
      user1Id: partnership.user1Id,
      user2Id: partnership.user2Id ?? null,
      user2Email: partnership.user2Email ?? null,
      status: partnership.status ?? 'pending',
      inviteToken: partnership.inviteToken ?? null,
      inviteExpiresAt: partnership.inviteExpiresAt ?? null,
      sharedAssessments: partnership.sharedAssessments ?? 1,
      sharedProgress: partnership.sharedProgress ?? 1,
      sharedJournal: partnership.sharedJournal ?? 0,
      connectedAt: partnership.connectedAt ?? null,
      createdAt: new Date(),
    };
  }

  async getPartnership(id: string): Promise<Partnership | undefined> {
    return undefined;
  }

  async getPartnershipByToken(token: string): Promise<Partnership | undefined> {
    return undefined;
  }

  async getActivePartnership(userId: string): Promise<Partnership | undefined> {
    return undefined;
  }

  async getPendingInvites(userId: string): Promise<Partnership[]> {
    return [];
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership | undefined> {
    return undefined;
  }

  async acceptPartnership(token: string, userId: string): Promise<Partnership | undefined> {
    return undefined;
  }

  // Journal entries (stub implementation)
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    return {
      id,
      userId: entry.userId,
      entry: entry.entry,
      mood: entry.mood ?? null,
      tags: entry.tags ?? null,
      aiInsights: entry.aiInsights ?? null,
      isPrivate: entry.isPrivate ?? 1,
      createdAt: new Date(),
    };
  }

  async getJournalEntries(userId: string, limit: number = 50): Promise<JournalEntry[]> {
    return [];
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    return undefined;
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    return undefined;
  }

  // Analytics snapshots (stub implementation)
  async createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const id = randomUUID();
    return {
      id,
      userId: snapshot.userId,
      period: snapshot.period,
      periodType: snapshot.periodType,
      metrics: snapshot.metrics,
      insights: snapshot.insights ?? null,
      benchmarks: snapshot.benchmarks ?? null,
      createdAt: new Date(),
    };
  }

  async getAnalyticsSnapshots(userId: string, periodType?: string): Promise<AnalyticsSnapshot[]> {
    return [];
  }

  async getLatestAnalyticsSnapshot(userId: string, periodType: string): Promise<AnalyticsSnapshot | undefined> {
    return undefined;
  }
}

export class DbStorage implements IStorage {
  private db;
  public sessionStore: any;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
    
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      errorLog: (err: Error) => {
        // Suppress benign "already exists" errors from session store initialization
        if (!err.message?.includes('already exists')) {
          console.error('Session store error:', err);
        }
      }
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select().from(users);
    return result;
  }

  async getTrialUsersNeedingReminders(): Promise<User[]> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.email} IS NOT NULL`,
          eq(users.emailVerified, true),
          sql`${users.trialStartedAt} IS NOT NULL`,
          sql`${users.trialEndsAt} IS NOT NULL`,
          sql`${users.trialEndsAt} > ${now.toISOString()}`
        )
      );
    return result;
  }

  async getTrialProgress(userId: string): Promise<{
    chatSessions: number;
    assessments: number;
    retreats: number;
    dateNights: number;
  }> {
    const [chatSessionsCount, assessmentsCount, retreatsCount, dateNightsCount] = await Promise.all([
      this.db.select({ count: sql<number>`count(DISTINCT ${chatSessions.id})` })
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId)),
      this.db.select({ count: sql<number>`count(*)` })
        .from(assessments)
        .where(eq(assessments.userId, userId)),
      this.db.select({ count: sql<number>`count(*)` })
        .from(retreatItineraries)
        .where(eq(retreatItineraries.userId, userId)),
      this.db.select({ count: sql<number>`count(*)` })
        .from(dateNights)
        .where(eq(dateNights.userId, userId)),
    ]);

    return {
      chatSessions: Number(chatSessionsCount[0]?.count ?? 0),
      assessments: Number(assessmentsCount[0]?.count ?? 0),
      retreats: Number(retreatsCount[0]?.count ?? 0),
      dateNights: Number(dateNightsCount[0]?.count ?? 0),
    };
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

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);
    return result[0];
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'http://localhost:5000';
    await gmailSendVerificationEmail(email, token, baseUrl);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'http://localhost:5000';
    await gmailSendPasswordResetEmail(email, token, baseUrl);
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

  async getTotalMessageCount(): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`sum(${chatSessions.messageCount})` })
      .from(chatSessions);
    return Number(result[0]?.total || 0);
  }

  async getAverageSessionRating(): Promise<{ avgRating: number; count: number }> {
    const result = await this.db
      .select({ 
        avgRating: sql<number>`avg(${sessionFeedback.rating})`,
        count: sql<number>`count(*)`
      })
      .from(sessionFeedback);
    return {
      avgRating: Number(result[0]?.avgRating || 0),
      count: Number(result[0]?.count || 0)
    };
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

  // Email send tracking methods
  async createEmailSendLog(log: InsertEmailSendLog): Promise<EmailSendLog> {
    const result = await this.db.insert(emailSendLogs).values(log).returning();
    return result[0];
  }

  async hasEmailBeenSent(userId: string, emailType: string, subType?: string): Promise<boolean> {
    const conditions = subType
      ? and(
          eq(emailSendLogs.userId, userId),
          eq(emailSendLogs.emailType, emailType),
          eq(emailSendLogs.subType, subType),
          eq(emailSendLogs.status, 'success')
        )
      : and(
          eq(emailSendLogs.userId, userId),
          eq(emailSendLogs.emailType, emailType),
          eq(emailSendLogs.status, 'success')
        );

    const result = await this.db.select({ id: emailSendLogs.id })
      .from(emailSendLogs)
      .where(conditions)
      .limit(1);
    
    return result.length > 0;
  }

  async getEmailSendLogs(filters?: { 
    userId?: string; 
    emailType?: string; 
    status?: string; 
    limit?: number 
  }): Promise<EmailSendLog[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(emailSendLogs.userId, filters.userId));
    if (filters?.emailType) conditions.push(eq(emailSendLogs.emailType, filters.emailType));
    if (filters?.status) conditions.push(eq(emailSendLogs.status, filters.status));

    if (conditions.length > 0) {
      return await this.db.select().from(emailSendLogs)
        .where(and(...conditions))
        .orderBy(desc(emailSendLogs.sentAt))
        .limit(filters?.limit || 100);
    }

    return await this.db.select().from(emailSendLogs)
      .orderBy(desc(emailSendLogs.sentAt))
      .limit(filters?.limit || 100);
  }

  async getEmailDeliveryStats(startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalSuccess: number;
    totalFailed: number;
    byType: Record<string, { sent: number; success: number; failed: number }>;
  }> {
    const conditions = [];
    if (startDate) conditions.push(sql`${emailSendLogs.sentAt} >= ${startDate.toISOString()}`);
    if (endDate) conditions.push(sql`${emailSendLogs.sentAt} <= ${endDate.toISOString()}`);

    // Get all logs within date range
    const logs = conditions.length > 0
      ? await this.db.select().from(emailSendLogs).where(and(...conditions))
      : await this.db.select().from(emailSendLogs);

    // Calculate aggregates
    const totalSent = logs.length;
    const totalSuccess = logs.filter(log => log.status === 'success').length;
    const totalFailed = logs.filter(log => log.status === 'failed').length;

    // Group by type
    const byType: Record<string, { sent: number; success: number; failed: number }> = {};
    for (const log of logs) {
      if (!byType[log.emailType]) {
        byType[log.emailType] = { sent: 0, success: 0, failed: 0 };
      }
      byType[log.emailType].sent++;
      if (log.status === 'success') byType[log.emailType].success++;
      if (log.status === 'failed') byType[log.emailType].failed++;
    }

    return {
      totalSent,
      totalSuccess,
      totalFailed,
      byType,
    };
  }

  // Health score tracking implementations
  async calculateHealthScore(userId: string): Promise<HealthScore> {
    // Get user activity metrics
    const progress = await this.getTrialProgress(userId);
    const sessionFeedbackList = await this.getSessionFeedback(userId);
    const avgRating = sessionFeedbackList.length > 0
      ? sessionFeedbackList.reduce((sum, f) => sum + f.rating, 0) / sessionFeedbackList.length
      : 0;

    // Calculate component scores (0-100 scale)
    const communicationScore = Math.min(100, (progress.chatSessions * 10) + (avgRating * 10));
    const intimacyScore = Math.min(100, progress.assessments * 25);
    const conflictScore = Math.min(100, 50 + (avgRating * 10));
    const growthScore = Math.min(100, (progress.retreats * 20) + (progress.dateNights * 10));

    // Overall score is weighted average
    const overallScore = Math.round(
      (communicationScore * 0.3) +
      (intimacyScore * 0.25) +
      (conflictScore * 0.25) +
      (growthScore * 0.2)
    );

    const healthScore: InsertHealthScore = {
      userId,
      overallScore,
      breakdown: {
        communication: Math.round(communicationScore),
        intimacy: Math.round(intimacyScore),
        conflict: Math.round(conflictScore),
        growth: Math.round(growthScore),
      },
      metrics: {
        chatSessions: progress.chatSessions,
        assessments: progress.assessments,
        retreats: progress.retreats,
        dateNights: progress.dateNights,
        avgSessionRating: Math.round(avgRating * 10) / 10,
      },
    };

    const result = await this.db.insert(healthScores).values(healthScore).returning();
    return result[0];
  }

  async getHealthScores(userId: string, limit: number = 30): Promise<HealthScore[]> {
    return await this.db.select().from(healthScores)
      .where(eq(healthScores.userId, userId))
      .orderBy(desc(healthScores.calculatedAt))
      .limit(limit);
  }

  async getLatestHealthScore(userId: string): Promise<HealthScore | undefined> {
    const result = await this.db.select().from(healthScores)
      .where(eq(healthScores.userId, userId))
      .orderBy(desc(healthScores.calculatedAt))
      .limit(1);
    return result[0];
  }

  // Partnership management implementations
  async createPartnership(partnership: InsertPartnership): Promise<Partnership> {
    const result = await this.db.insert(partnerships).values(partnership).returning();
    return result[0];
  }

  async getPartnership(id: string): Promise<Partnership | undefined> {
    const result = await this.db.select().from(partnerships).where(eq(partnerships.id, id)).limit(1);
    return result[0];
  }

  async getPartnershipByToken(token: string): Promise<Partnership | undefined> {
    const result = await this.db.select().from(partnerships)
      .where(eq(partnerships.inviteToken, token))
      .limit(1);
    return result[0];
  }

  async getActivePartnership(userId: string): Promise<Partnership | undefined> {
    const result = await this.db.select().from(partnerships)
      .where(
        and(
          or(
            eq(partnerships.user1Id, userId),
            eq(partnerships.user2Id, userId)
          ),
          eq(partnerships.status, 'active')
        )
      )
      .limit(1);
    return result[0];
  }

  async getPendingInvites(userId: string): Promise<Partnership[]> {
    // Get invites sent to this user's email
    const user = await this.getUser(userId);
    if (!user?.email) return [];

    return await this.db.select().from(partnerships)
      .where(
        and(
          eq(partnerships.user2Email, user.email),
          eq(partnerships.status, 'pending')
        )
      )
      .orderBy(desc(partnerships.createdAt));
  }

  async updatePartnership(id: string, updates: Partial<Partnership>): Promise<Partnership | undefined> {
    const result = await this.db.update(partnerships)
      .set(updates)
      .where(eq(partnerships.id, id))
      .returning();
    return result[0];
  }

  async acceptPartnership(token: string, userId: string): Promise<Partnership | undefined> {
    const result = await this.db.update(partnerships)
      .set({
        user2Id: userId,
        status: 'active',
        connectedAt: new Date(),
      })
      .where(eq(partnerships.inviteToken, token))
      .returning();
    return result[0];
  }

  // Journal entries implementations
  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const result = await this.db.insert(journalEntries).values(entry).returning();
    return result[0];
  }

  async getJournalEntries(userId: string, limit: number = 50): Promise<JournalEntry[]> {
    return await this.db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const result = await this.db.select().from(journalEntries)
      .where(eq(journalEntries.id, id))
      .limit(1);
    return result[0];
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const result = await this.db.update(journalEntries)
      .set(updates)
      .where(eq(journalEntries.id, id))
      .returning();
    return result[0];
  }

  // Analytics snapshots implementations
  async createAnalyticsSnapshot(snapshot: InsertAnalyticsSnapshot): Promise<AnalyticsSnapshot> {
    const result = await this.db.insert(analyticsSnapshots).values(snapshot).returning();
    return result[0];
  }

  async getAnalyticsSnapshots(userId: string, periodType?: string): Promise<AnalyticsSnapshot[]> {
    if (periodType) {
      return await this.db.select().from(analyticsSnapshots)
        .where(
          and(
            eq(analyticsSnapshots.userId, userId),
            eq(analyticsSnapshots.periodType, periodType)
          )
        )
        .orderBy(desc(analyticsSnapshots.period));
    }
    return await this.db.select().from(analyticsSnapshots)
      .where(eq(analyticsSnapshots.userId, userId))
      .orderBy(desc(analyticsSnapshots.period));
  }

  async getLatestAnalyticsSnapshot(userId: string, periodType: string): Promise<AnalyticsSnapshot | undefined> {
    const result = await this.db.select().from(analyticsSnapshots)
      .where(
        and(
          eq(analyticsSnapshots.userId, userId),
          eq(analyticsSnapshots.periodType, periodType)
        )
      )
      .orderBy(desc(analyticsSnapshots.period))
      .limit(1);
    return result[0];
  }

  // Conversation implementations
  async getDailyQuestion(partnershipId: string): Promise<ConversationQuestion | undefined> {
    // Get today's question: the one that both partners haven't completed yet
    const partnership = await this.getPartnership(partnershipId);
    if (!partnership || !partnership.user1Id || !partnership.user2Id) {
      return undefined;
    }

    // Find all questions where both partners haven't responded
    const allQuestions = await this.db.select().from(conversationQuestions)
      .where(eq(conversationQuestions.active, 1))
      .orderBy(conversationQuestions.createdAt);

    for (const question of allQuestions) {
      const responses = await this.getConversationResponses(partnershipId, question.id);
      const user1Responded = responses.some(r => r.userId === partnership.user1Id);
      const user2Responded = responses.some(r => r.userId === partnership.user2Id);
      
      if (!user1Responded || !user2Responded) {
        return question;
      }
    }

    // If all questions completed, return a random one
    return this.getRandomQuestion();
  }

  async getRandomQuestion(category?: string): Promise<ConversationQuestion | undefined> {
    const whereConditions = [eq(conversationQuestions.active, 1)];
    
    if (category) {
      whereConditions.push(eq(conversationQuestions.category, category));
    }

    const questions = await this.db.select().from(conversationQuestions)
      .where(and(...whereConditions));
      
    if (questions.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  async getSoloQuestion(userId: string): Promise<ConversationQuestion | undefined> {
    // Get the first question that the solo user hasn't answered yet
    const allQuestions = await this.db.select().from(conversationQuestions)
      .where(eq(conversationQuestions.active, 1))
      .orderBy(conversationQuestions.createdAt);

    for (const question of allQuestions) {
      const responses = await this.getSoloConversationResponses(userId, question.id);
      if (responses.length === 0) {
        return question;
      }
    }

    // If all questions completed, return a random one
    return this.getRandomQuestion();
  }

  async createConversationResponse(response: InsertConversationResponse): Promise<ConversationResponse> {
    const result = await this.db.insert(conversationResponses).values(response).returning();
    return result[0];
  }

  async getConversationResponses(partnershipId: string, questionId: string): Promise<ConversationResponse[]> {
    return await this.db.select().from(conversationResponses)
      .where(
        and(
          eq(conversationResponses.partnershipId, partnershipId),
          eq(conversationResponses.questionId, questionId)
        )
      )
      .orderBy(conversationResponses.createdAt);
  }

  async getSoloConversationResponses(userId: string, questionId: string): Promise<ConversationResponse[]> {
    return await this.db.select().from(conversationResponses)
      .where(
        and(
          isNull(conversationResponses.partnershipId),
          eq(conversationResponses.userId, userId),
          eq(conversationResponses.questionId, questionId)
        )
      )
      .orderBy(conversationResponses.createdAt);
  }

  async getConversationHistory(partnershipId: string, limit: number = 20): Promise<Array<{
    question: ConversationQuestion;
    responses: ConversationResponse[];
    isComplete: boolean;
  }>> {
    const partnership = await this.getPartnership(partnershipId);
    if (!partnership || !partnership.user1Id || !partnership.user2Id) {
      return [];
    }

    // Get all responses for this partnership
    const allResponses = await this.db.select().from(conversationResponses)
      .where(eq(conversationResponses.partnershipId, partnershipId))
      .orderBy(desc(conversationResponses.createdAt));

    // Group by question
    const questionMap = new Map<string, ConversationResponse[]>();
    for (const response of allResponses) {
      if (!questionMap.has(response.questionId)) {
        questionMap.set(response.questionId, []);
      }
      questionMap.get(response.questionId)!.push(response);
    }

    // Get question details and check completion
    const history = [];
    for (const [questionId, responses] of questionMap.entries()) {
      const question = await this.db.select().from(conversationQuestions)
        .where(eq(conversationQuestions.id, questionId))
        .limit(1);
      
      if (question[0]) {
        const user1Responded = responses.some(r => r.userId === partnership.user1Id);
        const user2Responded = responses.some(r => r.userId === partnership.user2Id);
        
        history.push({
          question: question[0],
          responses,
          isComplete: user1Responded && user2Responded,
        });
      }
      
      if (history.length >= limit) break;
    }

    return history;
  }

  async getSoloConversationHistory(userId: string, limit: number = 20): Promise<Array<{
    question: ConversationQuestion;
    responses: ConversationResponse[];
    isComplete: boolean;
  }>> {
    // Get all solo responses for this user
    const allResponses = await this.db.select().from(conversationResponses)
      .where(
        and(
          isNull(conversationResponses.partnershipId),
          eq(conversationResponses.userId, userId)
        )
      )
      .orderBy(desc(conversationResponses.createdAt));

    // Group by question
    const questionMap = new Map<string, ConversationResponse[]>();
    for (const response of allResponses) {
      if (!questionMap.has(response.questionId)) {
        questionMap.set(response.questionId, []);
      }
      questionMap.get(response.questionId)!.push(response);
    }

    // Get question details
    const history = [];
    for (const [questionId, responses] of questionMap.entries()) {
      const question = await this.db.select().from(conversationQuestions)
        .where(eq(conversationQuestions.id, questionId))
        .limit(1);
      
      if (question[0]) {
        history.push({
          question: question[0],
          responses,
          isComplete: true, // Solo responses are always "complete"
        });
      }
      
      if (history.length >= limit) break;
    }

    return history;
  }

  async createConversationHelpEvent(event: InsertConversationHelpEvent): Promise<ConversationHelpEvent> {
    const result = await this.db.insert(conversationHelpEvents).values(event).returning();
    return result[0];
  }

  async incrementConversationResponseCount(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ 
        conversationResponseCount: sql`${users.conversationResponseCount} + 1` 
      })
      .where(eq(users.id, userId));
  }

  // Stripe Connect: Connected Accounts implementations
  async createConnectedAccount(account: InsertConnectedAccount): Promise<ConnectedAccount> {
    const result = await this.db.insert(connectedAccounts).values(account).returning();
    return result[0];
  }

  async getConnectedAccountByUserId(userId: string): Promise<ConnectedAccount | undefined> {
    const result = await this.db.select().from(connectedAccounts)
      .where(eq(connectedAccounts.userId, userId))
      .limit(1);
    return result[0];
  }

  async getConnectedAccountByStripeId(stripeAccountId: string): Promise<ConnectedAccount | undefined> {
    const result = await this.db.select().from(connectedAccounts)
      .where(eq(connectedAccounts.stripeAccountId, stripeAccountId))
      .limit(1);
    return result[0];
  }

  async getAllConnectedAccounts(): Promise<ConnectedAccount[]> {
    return await this.db.select().from(connectedAccounts).orderBy(desc(connectedAccounts.createdAt));
  }

  async updateConnectedAccount(id: string, updates: Partial<ConnectedAccount>): Promise<ConnectedAccount | undefined> {
    const result = await this.db
      .update(connectedAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(connectedAccounts.id, id))
      .returning();
    return result[0];
  }

  // Stripe Connect: Products implementations
  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values(product).returning();
    return result[0];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products)
      .where(eq(products.id, id))
      .limit(1);
    return result[0];
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
    return await this.db.select().from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByConnectedAccount(connectedAccountId: string): Promise<Product[]> {
    return await this.db.select().from(products)
      .where(eq(products.connectedAccountId, connectedAccountId))
      .orderBy(desc(products.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.db.select().from(products).orderBy(desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await this.db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  // Stripe Connect: Merchant Customers implementations
  async createMerchantCustomer(customer: InsertMerchantCustomer): Promise<MerchantCustomer> {
    const result = await this.db.insert(merchantCustomers).values(customer).returning();
    return result[0];
  }

  async getMerchantCustomer(userId: string, connectedAccountId: string): Promise<MerchantCustomer | undefined> {
    const result = await this.db.select().from(merchantCustomers)
      .where(and(
        eq(merchantCustomers.userId, userId),
        eq(merchantCustomers.connectedAccountId, connectedAccountId)
      ))
      .limit(1);
    return result[0];
  }

  async getMerchantCustomersByUser(userId: string): Promise<MerchantCustomer[]> {
    return await this.db.select().from(merchantCustomers)
      .where(eq(merchantCustomers.userId, userId));
  }

  // Stripe Connect: Merchant Subscriptions implementations
  async createMerchantSubscription(subscription: InsertMerchantSubscription): Promise<MerchantSubscription> {
    const result = await this.db.insert(merchantSubscriptions).values(subscription).returning();
    return result[0];
  }

  async getMerchantSubscription(id: string): Promise<MerchantSubscription | undefined> {
    const result = await this.db.select().from(merchantSubscriptions)
      .where(eq(merchantSubscriptions.id, id))
      .limit(1);
    return result[0];
  }

  async getMerchantSubscriptionByStripeId(stripeSubscriptionId: string): Promise<MerchantSubscription | undefined> {
    const result = await this.db.select().from(merchantSubscriptions)
      .where(eq(merchantSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
    return result[0];
  }

  async getMerchantSubscriptionsByUser(userId: string): Promise<MerchantSubscription[]> {
    return await this.db.select().from(merchantSubscriptions)
      .where(eq(merchantSubscriptions.userId, userId))
      .orderBy(desc(merchantSubscriptions.createdAt));
  }

  async getMerchantSubscriptionsByProduct(productId: string): Promise<MerchantSubscription[]> {
    return await this.db.select().from(merchantSubscriptions)
      .where(eq(merchantSubscriptions.productId, productId))
      .orderBy(desc(merchantSubscriptions.createdAt));
  }

  async getMerchantSubscriptionsByAccount(connectedAccountId: string): Promise<MerchantSubscription[]> {
    return await this.db.select().from(merchantSubscriptions)
      .where(eq(merchantSubscriptions.connectedAccountId, connectedAccountId))
      .orderBy(desc(merchantSubscriptions.createdAt));
  }

  async updateMerchantSubscription(id: string, updates: Partial<MerchantSubscription>): Promise<MerchantSubscription | undefined> {
    const result = await this.db
      .update(merchantSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchantSubscriptions.id, id))
      .returning();
    return result[0];
  }

  async updateMerchantSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<MerchantSubscription>): Promise<MerchantSubscription | undefined> {
    const result = await this.db
      .update(merchantSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(merchantSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return result[0];
  }

  // Couple subscription management implementations
  async createCouple(couple: InsertCouple): Promise<Couple> {
    const result = await this.db.insert(couples).values(couple).returning();
    return result[0];
  }

  async getCouple(id: string): Promise<Couple | undefined> {
    const result = await this.db.select().from(couples).where(eq(couples.id, id));
    return result[0];
  }

  async getCoupleByPrimaryUser(userId: string): Promise<Couple | undefined> {
    const result = await this.db.select().from(couples)
      .where(eq(couples.primaryUserId, userId))
      .orderBy(desc(couples.createdAt));
    return result[0];
  }

  async getCoupleByPartnerUser(userId: string): Promise<Couple | undefined> {
    const result = await this.db.select().from(couples)
      .where(eq(couples.partnerUserId, userId))
      .orderBy(desc(couples.createdAt));
    return result[0];
  }

  async getCoupleByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Couple | undefined> {
    const result = await this.db.select().from(couples)
      .where(eq(couples.stripeSubscriptionId, stripeSubscriptionId));
    return result[0];
  }

  async getCoupleByInviteToken(token: string): Promise<Couple | undefined> {
    const result = await this.db.select().from(couples)
      .where(
        and(
          eq(couples.partnerInviteToken, token),
          sql`${couples.partnerInviteExpires} > NOW()`
        )
      );
    return result[0];
  }

  async updateCouple(id: string, updates: Partial<Couple>): Promise<Couple | undefined> {
    const result = await this.db
      .update(couples)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(couples.id, id))
      .returning();
    return result[0];
  }

  async generatePartnerInviteToken(coupleId: string, partnerEmail: string, expiresInHours: number = 72): Promise<{ token: string; couple: Couple }> {
    const token = randomUUID();
    const expires = new Date();
    expires.setHours(expires.getHours() + expiresInHours);

    const result = await this.db
      .update(couples)
      .set({
        partnerInviteEmail: partnerEmail,
        partnerInviteToken: token,
        partnerInviteExpires: expires,
        partnerInvitedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(couples.id, coupleId))
      .returning();

    return { token, couple: result[0] };
  }

  async acceptPartnerInvite(token: string, userId: string): Promise<Couple | undefined> {
    const couple = await this.getCoupleByInviteToken(token);
    if (!couple) return undefined;

    const result = await this.db
      .update(couples)
      .set({
        partnerUserId: userId,
        partnerJoinedAt: new Date(),
        partnerInviteToken: null,
        partnerInviteExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, couple.id))
      .returning();

    await this.db
      .update(users)
      .set({ coupleId: couple.id })
      .where(eq(users.id, userId));

    return result[0];
  }

  async cancelPartnerInvite(coupleId: string): Promise<Couple | undefined> {
    const result = await this.db
      .update(couples)
      .set({
        partnerInviteEmail: null,
        partnerInviteToken: null,
        partnerInviteExpires: null,
        partnerInvitedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, coupleId))
      .returning();
    return result[0];
  }

  async removePartner(coupleId: string): Promise<Couple | undefined> {
    const couple = await this.getCouple(coupleId);
    if (!couple || !couple.partnerUserId) return undefined;

    await this.db
      .update(users)
      .set({ coupleId: null })
      .where(eq(users.id, couple.partnerUserId));

    const result = await this.db
      .update(couples)
      .set({
        partnerUserId: null,
        partnerJoinedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(couples.id, coupleId))
      .returning();

    return result[0];
  }

  // 40dayTwangle Challenge system implementations
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const result = await this.db.insert(challenges).values(challenge).returning();
    return result[0];
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const result = await this.db.select({
      id: challenges.id,
      dayNumber: challenges.dayNumber,
      title: challenges.title,
      scripture: challenges.scripture,
      summary: challenges.summary,
      actionPrompt: challenges.actionPrompt,
      journalQuestion: challenges.journalQuestion,
      createdAt: challenges.createdAt,
    }).from(challenges).where(eq(challenges.id, id));
    return result[0];
  }

  async getChallengeByDay(dayNumber: number): Promise<Challenge | undefined> {
    const result = await this.db.select({
      id: challenges.id,
      dayNumber: challenges.dayNumber,
      title: challenges.title,
      scripture: challenges.scripture,
      summary: challenges.summary,
      actionPrompt: challenges.actionPrompt,
      journalQuestion: challenges.journalQuestion,
      createdAt: challenges.createdAt,
    }).from(challenges).where(eq(challenges.dayNumber, dayNumber));
    return result[0];
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return await this.db.select({
      id: challenges.id,
      dayNumber: challenges.dayNumber,
      title: challenges.title,
      scripture: challenges.scripture,
      summary: challenges.summary,
      actionPrompt: challenges.actionPrompt,
      journalQuestion: challenges.journalQuestion,
      createdAt: challenges.createdAt,
    }).from(challenges).orderBy(challenges.dayNumber);
  }

  async createUserChallengeProgress(progress: InsertUserChallengeProgress): Promise<UserChallengeProgress> {
    const result = await this.db.insert(userChallengeProgress).values(progress).returning();
    return result[0];
  }

  async getUserChallengeProgress(userId: string): Promise<UserChallengeProgress | undefined> {
    const result = await this.db.select().from(userChallengeProgress)
      .where(
        and(
          eq(userChallengeProgress.userId, userId),
          eq(userChallengeProgress.isActive, 1)
        )
      )
      .orderBy(desc(userChallengeProgress.startedAt));
    return result[0];
  }

  async updateUserChallengeProgress(id: string, updates: Partial<UserChallengeProgress>): Promise<UserChallengeProgress | undefined> {
    const result = await this.db
      .update(userChallengeProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userChallengeProgress.id, id))
      .returning();
    return result[0];
  }

  async markDayComplete(userId: string, dayNumber: number): Promise<UserChallengeProgress | undefined> {
    const progress = await this.getUserChallengeProgress(userId);
    if (!progress) return undefined;

    const nextDay = dayNumber + 1;
    const updates: Partial<UserChallengeProgress> = {
      lastCompletedDay: dayNumber,
      currentDay: nextDay <= 40 ? nextDay : 40,
      lastActivityAt: new Date(),
    };

    if (dayNumber === 40) {
      updates.completedAt = new Date();
      updates.isActive = 0;
    }

    return await this.updateUserChallengeProgress(progress.id, updates);
  }

  async createChallengeReflection(reflection: InsertChallengeReflection): Promise<ChallengeReflection> {
    const result = await this.db.insert(challengeReflections).values(reflection).returning();
    return result[0];
  }

  async getChallengeReflection(id: string): Promise<ChallengeReflection | undefined> {
    const result = await this.db.select().from(challengeReflections).where(eq(challengeReflections.id, id));
    return result[0];
  }

  async getUserReflectionForDay(userId: string, dayNumber: number): Promise<ChallengeReflection | undefined> {
    const result = await this.db.select().from(challengeReflections)
      .where(
        and(
          eq(challengeReflections.userId, userId),
          eq(challengeReflections.dayNumber, dayNumber)
        )
      );
    return result[0];
  }

  async getAllUserReflections(userId: string): Promise<ChallengeReflection[]> {
    return await this.db.select().from(challengeReflections)
      .where(eq(challengeReflections.userId, userId))
      .orderBy(challengeReflections.dayNumber);
  }
}

export const storage = new DbStorage();
