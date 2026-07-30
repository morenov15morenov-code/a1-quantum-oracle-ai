import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("User", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password").notNull().default(""),
  role: text("role").notNull().default("USER"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  failedAttempts: integer("failedAttempts").notNull().default(0),
  lockedUntil: integer("lockedUntil", { mode: "timestamp_ms" }),
  passwordResetToken: text("passwordResetToken"),
  passwordResetExpires: integer("passwordResetExpires", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const predictions = sqliteTable("Prediction", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  result: text("result").notNull(),
  confidence: real("confidence"),
  reasoning: text("reasoning"),
  model: text("model").notNull().default("gpt-4o"),
  tokensIn: integer("tokensIn"),
  tokensOut: integer("tokensOut"),
  shareSlug: text("shareSlug"),
  context: text("context"),
  domainCategory: text("domainCategory"),
  outcomeStatus: text("outcomeStatus"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const predictionFeedbacks = sqliteTable("PredictionFeedback", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  predictionId: text("predictionId").notNull().unique().references(() => predictions.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull().default(0),
  wasAccurate: integer("wasAccurate", { mode: "boolean" }),
  comment: text("comment"),
  domain: text("domain"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const subscriptions = sqliteTable("Subscription", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("FREE"),
  predsUsed: integer("predsUsed").notNull().default(0),
  predsLimit: integer("predsLimit").notNull().default(5),
  periodStart: integer("periodStart", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  periodEnd: integer("periodEnd", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export const analyticsEvents = sqliteTable("AnalyticsEvent", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  event: text("event").notNull(),
  metadata: text("metadata"),
  userId: text("userId"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("Account", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (t) => ({
  providerProviderAccountId: unique("providerProviderAccountId").on(t.provider, t.providerAccountId),
}));

export const sessions = sqliteTable("Session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  predictions: many(predictions),
  feedback: many(predictionFeedbacks),
  subscription: one(subscriptions),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, { fields: [predictions.userId], references: [users.id] }),
  feedback: one(predictionFeedbacks),
}));

export const predictionFeedbacksRelations = relations(predictionFeedbacks, ({ one }) => ({
  prediction: one(predictions, { fields: [predictionFeedbacks.predictionId], references: [predictions.id] }),
  user: one(users, { fields: [predictionFeedbacks.userId], references: [users.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
