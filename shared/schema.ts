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

// User storage table for Replit Auth
// Reference: blueprint:javascript_log_in_with_replit
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  hasLifetimeAccess: integer("has_lifetime_access").default(0),
  userNumber: integer("user_number"),
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
  generatedItinerary: text("generated_itinerary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRetreatItinerarySchema = createInsertSchema(retreatItineraries).omit({
  id: true,
  createdAt: true,
});

export type InsertRetreatItinerary = z.infer<typeof insertRetreatItinerarySchema>;
export type RetreatItinerary = typeof retreatItineraries.$inferSelect;

export const assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
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
