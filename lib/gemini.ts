import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from './types';

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  promptTokens: 6.25, // ₹6.25 per 1M input tokens for gemini-2.5-flash (approx $0.075 * 83.33 INR/USD)
  completionTokens: 25.0, // ₹25.0 per 1M output tokens for gemini-2.5-flash (approx $0.3 * 83.33 INR/USD)
};

// Carbon emission factors (grams of CO2 per 1M tokens)
// Based on research showing AI models emit approximately 0.5-2g CO2 per 1000 tokens
const CARBON_EMISSION = {
  promptTokens: 0.8, // 0.8g CO2 per 1M input tokens
  completionTokens: 1.2, // 1.2g CO2 per 1M output tokens (generation is more intensive)
};

export function calculateCost(promptTokens: number, completionTokens: number): number {
  const promptCost = (promptTokens / 1_000_000) * PRICING.promptTokens;
  const completionCost = (completionTokens / 1_000_000) * PRICING.completionTokens;
  return promptCost + completionCost;
}

export function calculateCarbonEmission(promptTokens: number, completionTokens: number): number {
  const promptEmission = (promptTokens / 1_000_000) * CARBON_EMISSION.promptTokens;
  const completionEmission = (completionTokens / 1_000_000) * CARBON_EMISSION.completionTokens;
  return promptEmission + completionEmission;
}

export function formatCost(cost: number): string {
  return `₹${cost.toFixed(4)}`;
}

export function formatCarbonEmission(emission: number): string {
  // Handle NaN or undefined values
  if (!emission || isNaN(emission)) {
    return '0mg CO₂';
  }
  
  if (emission < 1) {
    return `${(emission * 1000).toFixed(2)}mg CO₂`;
  } else if (emission < 1000) {
    return `${emission.toFixed(3)}g CO₂`;
  } else {
    return `${(emission / 1000).toFixed(3)}kg CO₂`;
  }
}
