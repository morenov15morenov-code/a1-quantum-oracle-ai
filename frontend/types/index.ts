export type Role = "USER" | "ADMIN";

export interface PredictionResult {
  id: string;
  input: string;
  result: string;
  confidence: number | null;
  reasoning: string | null;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  createdAt: Date | string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
}

export interface AnalyticsData {
  totalUsers: number;
  totalPredictions: number;
  activeUsers: number;
  avgConfidence: number;
  predictionsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
  topModels: { model: string; count: number }[];
  predictionsByUser: { userId: string; userName: string; count: number }[];
}

export interface PaginatedResponse<T> {
  predictions: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
}
