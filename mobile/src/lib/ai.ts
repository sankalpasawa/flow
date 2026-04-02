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

// ── Universal command — calls /command edge function ──

export interface CommandResponse {
  action: 'create' | 'update' | 'delete' | 'search' | 'navigate' | 'display' | 'clarify';
  params: Record<string, any>;
  confidence: number;
  message: string;
  clarification?: string | null;
  error?: string;
}

export async function sendCommand(
  text: string,
  userId: string,
  context: string,
): Promise<CommandResponse | null> {
  if (!AI_FEATURE_FLAG) return null;

  try {
    // Use direct fetch with anon key — works in dev mode without a session
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/command`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        text: sanitizeInput(text),
        user_id: userId,
        context,
      }),
    });

    if (!res.ok) {
      console.warn(`[AI] Command failed: ${res.status}`);
      return null;
    }

    return await res.json() as CommandResponse;
  } catch (err) {
    console.warn('[AI] Command error:', err);
    return null;
  }
}
