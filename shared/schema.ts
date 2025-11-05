import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for custom Twangle authentication
// Password is nullable to support migration from Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  hasLifetimeAccess: integer("has_lifetime_access").default(0),
  userNumber: integer("user_number"),
  emailVerified: integer("email_verified").default(0),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  newsletterSubscribed: integer("newsletter_subscribed").default(0),
  conversationResponseCount: integer("conversation_response_count").default(0),
  trialStartedAt: timestamp("trial_started_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  priceId: text("price_id"),
  planTier: text("plan_tier"),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  messageCount: integer("message_count").notNull().default(0),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  startedAt: true,
  lastMessageAt: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export const weeklySummaries = pgTable("weekly_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id"),
  summary: text("summary").notNull(),
  actionItems: text("action_items").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  createdAt: true,
});

export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;

export const sessionFeedback = pgTable("session_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id"),
  userId: varchar("user_id"),
  rating: integer("rating").notNull(),
  feedbackText: text("feedback_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSessionFeedbackSchema = createInsertSchema(sessionFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertSessionFeedback = z.infer<typeof insertSessionFeedbackSchema>;
export type SessionFeedback = typeof sessionFeedback.$inferSelect;

export const relationshipProgress = pgTable("relationship_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  weekStartDate: timestamp("week_start_date").notNull(),
  relationshipScore: integer("relationship_score").notNull(),
  improvementNotes: text("improvement_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRelationshipProgressSchema = createInsertSchema(relationshipProgress).omit({
  id: true,
  createdAt: true,
});

export type InsertRelationshipProgress = z.infer<typeof insertRelationshipProgressSchema>;
export type RelationshipProgress = typeof relationshipProgress.$inferSelect;

export const generalFeedback = pgTable("general_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  feedbackType: text("feedback_type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGeneralFeedbackSchema = createInsertSchema(generalFeedback)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    description: z.string().min(1, "Description is required").trim(),
    rating: z.number().int().min(1).max(5).optional(),
  });

export type InsertGeneralFeedback = z.infer<typeof insertGeneralFeedbackSchema>;
export type GeneralFeedback = typeof generalFeedback.$inferSelect;

export const retreatItineraries = pgTable("retreat_itineraries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  vibe: text("vibe").notNull(),
  goal: text("goal").notNull(),
  startTime: text("start_time").notNull(),
  duration: integer("duration").notNull(),
  location: text("location").notNull(),
  budget: text("budget").notNull(),
  focuses: text("focuses").array().notNull(),
  currentCity: text("current_city"),
  retreatDestination: text("retreat_destination"),
  streetAddress: text("street_address"),
  travelDistance: text("travel_distance"),
  startDate: timestamp("start_date"),
  visionPlanning: jsonb("vision_planning"),
  generatedItinerary: text("generated_itinerary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const visionPlanningSchema = z.object({
  focusTimelines: z.array(z.enum(['sixMonths', 'oneYear', 'fiveYears', 'tenYears'])).optional(),
  focusDimensions: z.array(z.enum([
    'financial', 
    'intimacy', 
    'health', 
    'career', 
    'business', 
    'spiritual', 
    'ministry', 
    'family', 
    'personal', 
    'community', 
    'legacy'
  ])).optional(),
}).optional();

export type VisionPlanning = z.infer<typeof visionPlanningSchema>;

export const insertRetreatItinerarySchema = createInsertSchema(retreatItineraries).omit({
  id: true,
  createdAt: true,
});

export type InsertRetreatItinerary = z.infer<typeof insertRetreatItinerarySchema>;
export type RetreatItinerary = typeof retreatItineraries.$inferSelect;

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  anonId: varchar("anon_id"),
  responses: jsonb("responses").notNull(),
  result: jsonb("result"),
  shareToken: varchar("share_token"),
  isShared: integer("is_shared").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

export const attachmentStyleResultSchema = z.object({
  primaryStyle: z.enum(["secure", "anxious", "avoidant", "fearful"]),
  stylePercentages: z.object({
    secure: z.number(),
    anxious: z.number(),
    avoidant: z.number(),
    fearful: z.number(),
  }),
  description: z.string(),
  strengths: z.array(z.string()),
  growthAreas: z.array(z.string()),
  analysis: z.string(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type AttachmentStyleResult = z.infer<typeof attachmentStyleResultSchema>;

export const dateNights = pgTable("date_nights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  anonId: varchar("anon_id"),
  budget: text("budget").notNull(),
  vibe: text("vibe").notNull(),
  duration: text("duration").notNull(),
  location: text("location").notNull(),
  interests: text("interests").array().notNull(),
  dietaryRestrictions: text("dietary_restrictions"),
  transportation: text("transportation"),
  specialOccasion: text("special_occasion"),
  generatedPlan: text("generated_plan").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDateNightSchema = createInsertSchema(dateNights).omit({
  id: true,
  createdAt: true,
});

export type InsertDateNight = z.infer<typeof insertDateNightSchema>;
export type DateNight = typeof dateNights.$inferSelect;

export const accessLogs = pgTable("access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  email: varchar("email"),
  displayName: varchar("display_name"),
  ipAddress: varchar("ip_address").notNull(),
  country: varchar("country"),
  countryCode: varchar("country_code"),
  city: varchar("city"),
  region: varchar("region"),
  location: text("location"),
  userAgent: text("user_agent"),
  path: varchar("path"),
  accessType: varchar("access_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAccessLogSchema = createInsertSchema(accessLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof accessLogs.$inferSelect;

// Conversion events for tracking user lifecycle and revenue changes
export const conversionEvents = pgTable("conversion_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: varchar("email"),
  eventType: text("event_type").notNull(), // free_signup, free_to_paid, paid_to_free, subscription_renewed, subscription_canceled, trial_started, trial_converted, trial_expired
  fromPlan: text("from_plan"), // null, free, premium
  toPlan: text("to_plan"), // free, premium, null
  revenueImpact: integer("revenue_impact"), // in cents, can be negative for refunds
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: jsonb("metadata"), // additional context like cancellation reason, referral source
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertConversionEventSchema = createInsertSchema(conversionEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;
export type ConversionEvent = typeof conversionEvents.$inferSelect;

// Subscription lifecycle events from Stripe
export const subscriptionEvents = pgTable("subscription_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  eventType: text("event_type").notNull(), // created, updated, deleted, payment_succeeded, payment_failed, trial_will_end, canceled
  status: text("status"), // active, canceled, past_due, trialing, etc.
  priceId: text("price_id"),
  amount: integer("amount"), // in cents
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0),
  metadata: jsonb("metadata"), // full Stripe event data for debugging
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;

// Email send tracking for idempotency and monitoring
export const emailSendLogs = pgTable("email_send_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: varchar("email").notNull(),
  emailType: varchar("email_type").notNull(), // trial_reminder, verification, welcome, newsletter
  subType: varchar("sub_type"), // For trial_reminder: days_2, days_1, days_0
  status: varchar("status").notNull(), // success, failed
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional context like activity metrics
  sentAt: timestamp("sent_at").notNull().defaultNow(),
}, (table) => [
  index("idx_email_logs_user_type").on(table.userId, table.emailType, table.subType),
  index("idx_email_logs_sent_at").on(table.sentAt),
]);

export const insertEmailSendLogSchema = createInsertSchema(emailSendLogs).omit({
  id: true,
  sentAt: true,
});

export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;
export type EmailSendLog = typeof emailSendLogs.$inferSelect;

// Relationship health scores tracking
export const healthScores = pgTable("health_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  overallScore: integer("overall_score").notNull(), // 0-100
  breakdown: jsonb("breakdown").notNull(), // { communication: 80, intimacy: 70, conflict: 60, ... }
  metrics: jsonb("metrics").notNull(), // { chatSessions: 5, assessments: 2, exercisesCompleted: 10, ... }
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_health_scores_user").on(table.userId, table.calculatedAt),
]);

export const insertHealthScoreSchema = createInsertSchema(healthScores).omit({
  id: true,
  calculatedAt: true,
});

export type InsertHealthScore = z.infer<typeof insertHealthScoreSchema>;
export type HealthScore = typeof healthScores.$inferSelect;

// Partner connections for shared experiences
export const partnerships = pgTable("partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull(), // User who sent invite
  user2Id: varchar("user2_id"), // User who received invite (null until accepted)
  user2Email: varchar("user2_email"), // Email for pending invites
  status: varchar("status").notNull().default('pending'), // pending, active, declined, disconnected
  inviteToken: varchar("invite_token").unique(),
  inviteExpiresAt: timestamp("invite_expires_at"),
  sharedAssessments: integer("shared_assessments").default(1), // Allow sharing assessments
  sharedProgress: integer("shared_progress").default(1), // Allow sharing progress metrics
  sharedJournal: integer("shared_journal").default(0), // Allow partner to see journal (default private)
  connectedAt: timestamp("connected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_partnerships_users").on(table.user1Id, table.user2Id),
  index("idx_partnerships_token").on(table.inviteToken),
]);

export const insertPartnershipSchema = createInsertSchema(partnerships).omit({
  id: true,
  user1Id: true,
  user2Id: true,
  status: true,
  inviteToken: true,
  inviteExpiresAt: true,
  connectedAt: true,
  createdAt: true,
});

export type InsertPartnership = z.infer<typeof insertPartnershipSchema>;
export type Partnership = typeof partnerships.$inferSelect;

// Relationship journaling with AI insights
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  entry: text("entry").notNull(),
  mood: varchar("mood"), // happy, sad, frustrated, anxious, peaceful, excited, etc.
  tags: text("tags").array(), // communication, intimacy, conflict, growth, gratitude
  aiInsights: jsonb("ai_insights"), // { patterns: [], suggestions: [], sentimentScore: 0.8 }
  isPrivate: integer("is_private").default(1), // Private by default
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_journal_user_date").on(table.userId, table.createdAt),
]);

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Progress analytics snapshots for monthly reports
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  period: varchar("period").notNull(), // YYYY-MM for monthly, YYYY-WW for weekly
  periodType: varchar("period_type").notNull(), // monthly, weekly
  metrics: jsonb("metrics").notNull(), // Comprehensive metrics snapshot
  insights: jsonb("insights"), // AI-generated insights and patterns
  benchmarks: jsonb("benchmarks"), // Comparison to anonymized benchmarks
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_analytics_user_period").on(table.userId, table.period),
]);

export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots).omit({
  id: true,
  userId: true,
  period: true,
  metrics: true,
  insights: true,
  benchmarks: true,
  createdAt: true,
});

export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;

// Conversation questions for daily couple check-ins
export const conversationQuestions = pgTable("conversation_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category").notNull(), // emotional_intimacy, communication_conflict, physical_intimacy, finances_planning, values_spiritual, play_adventure, trust_boundaries
  intensity: integer("intensity").notNull().default(1), // 1 (gentle), 2 (moderate), 3 (deep)
  questionText: text("question_text").notNull(),
  therapyPrompt: text("therapy_prompt"), // Guidance text shown with category
  active: integer("active").default(1), // Whether question is in rotation
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_questions_category").on(table.category, table.active),
]);

export const insertConversationQuestionSchema = createInsertSchema(conversationQuestions).omit({
  id: true,
  createdAt: true,
});

export type InsertConversationQuestion = z.infer<typeof insertConversationQuestionSchema>;
export type ConversationQuestion = typeof conversationQuestions.$inferSelect;

// Conversation responses (double-blind for partnered mode, solo journaling for individual mode)
export const conversationResponses = pgTable("conversation_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnershipId: varchar("partnership_id"), // Optional: Links to active partnership (null for solo mode)
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(), // Who answered
  responseText: text("response_text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_responses_partnership").on(table.partnershipId, table.questionId),
  index("idx_responses_user").on(table.userId, table.createdAt),
]);

export const insertConversationResponseSchema = createInsertSchema(conversationResponses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertConversationResponse = z.infer<typeof insertConversationResponseSchema>;
export type ConversationResponse = typeof conversationResponses.$inferSelect;

// Conversation help events (tracking when users need support)
export const conversationHelpEvents = pgTable("conversation_help_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionId: varchar("question_id").notNull(),
  actionType: varchar("action_type").notNull(), // guidance, think_time, alternative
  aiResponse: jsonb("ai_response"), // Stores AI coaching or alternative question
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_help_user").on(table.userId, table.createdAt),
]);

export const insertConversationHelpEventSchema = createInsertSchema(conversationHelpEvents).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertConversationHelpEvent = z.infer<typeof insertConversationHelpEventSchema>;
export type ConversationHelpEvent = typeof conversationHelpEvents.$inferSelect;

// Stripe Connect: Connected Accounts
// Tracks merchants/sellers who can receive payments through the platform
export const connectedAccounts = pgTable("connected_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripeAccountId: varchar("stripe_account_id").unique().notNull(),
  chargesEnabled: integer("charges_enabled").default(0),
  detailsSubmitted: integer("details_submitted").default(0),
  payoutsEnabled: integer("payouts_enabled").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_connected_accounts_user").on(table.userId),
]);

export const insertConnectedAccountSchema = createInsertSchema(connectedAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConnectedAccount = z.infer<typeof insertConnectedAccountSchema>;
export type ConnectedAccount = typeof connectedAccounts.$inferSelect;

// Stripe Connect: Products
// Platform-level products mapped to connected accounts
// Supports both one-time purchases and recurring subscriptions
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  connectedAccountId: varchar("connected_account_id").notNull(),
  stripeProductId: varchar("stripe_product_id").unique().notNull(),
  stripePriceId: varchar("stripe_price_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priceInCents: integer("price_in_cents").notNull(),
  currency: varchar("currency").default('usd').notNull(),
  productType: varchar("product_type").default('one_time').notNull(), // 'one_time' | 'subscription'
  billingInterval: varchar("billing_interval"), // 'month' | 'year' (null for one_time)
  trialDays: integer("trial_days").default(0), // Trial period in days (0 for no trial)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_products_user").on(table.userId),
  index("idx_products_connected_account").on(table.connectedAccountId),
  index("idx_products_type").on(table.productType),
]);

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Stripe Connect: Merchant Customers
// Maps platform users to Stripe customer IDs on each connected account
// Needed because each merchant needs their own customer records
export const merchantCustomers = pgTable("merchant_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Platform user ID
  connectedAccountId: varchar("connected_account_id").notNull(), // Merchant's connected account
  stripeCustomerId: varchar("stripe_customer_id").notNull(), // Customer ID on connected account
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_merchant_customers_user").on(table.userId),
  index("idx_merchant_customers_account").on(table.connectedAccountId),
  index("idx_merchant_customers_unique").on(table.userId, table.connectedAccountId), // Unique per user-merchant pair
]);

export const insertMerchantCustomerSchema = createInsertSchema(merchantCustomers).omit({
  id: true,
  createdAt: true,
});

export type InsertMerchantCustomer = z.infer<typeof insertMerchantCustomerSchema>;
export type MerchantCustomer = typeof merchantCustomers.$inferSelect;

// Stripe Connect: Merchant Subscriptions
// Tracks active subscriptions for marketplace products
export const merchantSubscriptions = pgTable("merchant_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Customer user ID
  productId: varchar("product_id").notNull(), // Marketplace product ID
  connectedAccountId: varchar("connected_account_id").notNull(), // Merchant's account
  stripeSubscriptionId: varchar("stripe_subscription_id").unique().notNull(),
  stripeCustomerId: varchar("stripe_customer_id").notNull(), // Customer on connected account
  status: varchar("status").notNull(), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: integer("cancel_at_period_end").default(0),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  lastPaymentAt: timestamp("last_payment_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_merchant_subs_user").on(table.userId),
  index("idx_merchant_subs_product").on(table.productId),
  index("idx_merchant_subs_account").on(table.connectedAccountId),
  index("idx_merchant_subs_status").on(table.status),
]);

export const insertMerchantSubscriptionSchema = createInsertSchema(merchantSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMerchantSubscription = z.infer<typeof insertMerchantSubscriptionSchema>;
export type MerchantSubscription = typeof merchantSubscriptions.$inferSelect;
