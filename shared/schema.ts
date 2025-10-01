import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  password: text("password"),
  facebookId: text("facebook_id").unique(),
  email: text("email"),
  name: text("name"),
  profilePicture: text("profile_picture"),
  stripeCustomerId: text("stripe_customer_id"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
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

export const insertGeneralFeedbackSchema = createInsertSchema(generalFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneralFeedback = z.infer<typeof insertGeneralFeedbackSchema>;
export type GeneralFeedback = typeof generalFeedback.$inferSelect;
