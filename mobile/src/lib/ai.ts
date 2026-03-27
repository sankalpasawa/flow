/**
 * AI calls — all routed through Supabase Edge Functions.
 * API key never touches the client.
 */

import { supabase } from './supabase';

const AI_FEATURE_FLAG = process.env.EXPO_PUBLIC_AI_ENABLED !== 'false';

interface AiCategorizeResult {
  category_id: string;
  confidence: number;
}

interface AiMindsetResult {
  prompt: string;
}

function sanitizeInput(text: string): string {
  // Strip control characters; truncate to 200 chars
  return text.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 200).trim();
}

async function callEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>
): Promise<T | null> {
  if (!AI_FEATURE_FLAG) return null;

  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    console.warn(`[AI] Edge function ${name} failed:`, error.message);
    return null;
  }
  return data as T;
}

export async function categorizeActivity(
  title: string,
  userId: string
): Promise<AiCategorizeResult | null> {
  return callEdgeFunction<AiCategorizeResult>('ai-categorize', {
    title: sanitizeInput(title),
    user_id: userId,
  });
}

export async function generateMindsetPrompt(
  title: string,
  categoryName: string,
  userId: string
): Promise<string | null> {
  const result = await callEdgeFunction<AiMindsetResult>('ai-mindset-prompt', {
    title: sanitizeInput(title),
    category: sanitizeInput(categoryName),
    user_id: userId,
  });
  return result?.prompt ?? null;
}

export async function generatePlanSuggestions(
  userId: string,
  date: string
): Promise<string[] | null> {
  const result = await callEdgeFunction<{ suggestions: string[] }>('ai-plan-suggest', {
    user_id: userId,
    date,
  });
  return result?.suggestions ?? null;
}
