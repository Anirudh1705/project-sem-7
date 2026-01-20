export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TokenStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  carbonEmission: number; // in grams of CO2
}

export interface ChatSession {
  _id?: string;
  id?: string;
  title: string;
  messages: Message[];
  stats: TokenStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
}

export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
