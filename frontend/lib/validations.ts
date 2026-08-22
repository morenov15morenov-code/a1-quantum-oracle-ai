import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or less"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be 128 characters or less"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signupServerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or less"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be 128 characters or less"),
});

export const predictionSchema = z.object({
  input: z.string().min(10, "Question must be at least 10 characters").max(2000, "Question too long"),
  context: z.string().max(5000, "Context too long").optional(),
  domainCategory: z.string().max(100, "Domain too long").optional(),
});

export const oracleQuerySchema = z.object({
  input: z.string().min(10, "Question must be at least 10 characters").max(2000, "Question too long"),
  context: z.string().max(5000, "Context too long").optional(),
  domainCategory: z.string().max(100, "Domain too long").optional(),
});

export const feedbackSchema = z.object({
  predictionId: z.string().min(1, "Prediction ID is required"),
  rating: z.number().int().min(1).max(5),
  wasAccurate: z.boolean().optional(),
  comment: z.string().max(500, "Comment too long").optional(),
  domain: z.string().max(100, "Domain too long").optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be 100 characters or less"),
  email: z.string().email("Invalid email address"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be 128 characters or less"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const subscriptionSchema = z.object({
  tier: z.enum(["FREE", "PRO"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PredictionInput = z.infer<typeof predictionSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
