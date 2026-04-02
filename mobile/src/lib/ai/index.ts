/**
 * DayFlow AI Architecture
 *
 * This is the central hub for all AI capabilities in the app.
 * DayFlow is AI-first: every feature should have an AI-powered path.
 *
 * =====================================================================
 * AI CAPABILITIES
 * =====================================================================
 *
 * 1. TEXT-TO-ACTION (actionEngine.ts)
 *    Input: free-form text from QuickAdd
 *    Output: structured action (create, move, complete, cancel)
 *    Uses: local regex parser (instant) + Claude Haiku (smart, 600ms debounce)
 *
 * 2. MINDSET GENERATION (ActivityFormScreen + edge function)
 *    Input: activity title + category + past mindsets
 *    Output: personal intention/mindset prompt
 *    Uses: local category fallback (instant) + Claude Haiku (personalized)
 *    Modes: generate fresh OR enhance user's draft
 *
 * 3. ACTIVITY PARSING (parseActivity.ts)
 *    Input: natural language text
 *    Output: structured fields (title, time, duration, date, category, recurrence)
 *    Uses: regex patterns (instant, client-side)
 *
 * FUTURE AI CAPABILITIES:
 * 4. SMART SCHEDULING — suggest optimal times based on energy patterns
 * 5. DAY SUMMARY — AI-generated summary of accomplishments
 * 6. PATTERN INSIGHTS — "Your energy drops after meetings"
 * 7. GOAL SUGGESTIONS — based on activity history
 * 8. VOICE INPUT — speech-to-text → parseActivity pipeline
 *
 * =====================================================================
 * ARCHITECTURE
 * =====================================================================
 *
 * All AI features follow this pattern:
 *
 * 1. LOCAL FIRST — Every AI feature has a local fallback that works
 *    without an API. The app is never broken without connectivity.
 *
 * 2. PROGRESSIVE ENHANCEMENT — Local runs instantly, AI enhances.
 *    User sees local result first, AI result replaces it smoothly.
 *
 * 3. SAME OUTPUT SHAPE — Local and AI parsers produce identical
 *    output types. UI code doesn't know which parser produced the result.
 *
 * 4. CONTEXT-AWARE — AI calls include user context:
 *    - Past activity titles and mindsets
 *    - Category list
 *    - Recent mood/energy patterns
 *    This makes responses personal, not generic.
 *
 * 5. RATE-LIMITED — 20 AI calls/day (shared ai_usage table).
 *    Local fallback is unlimited.
 *
 * 6. COST-OPTIMIZED — Claude Haiku for all real-time features.
 *    Claude Sonnet only for batch/background processing (insights).
 *
 * =====================================================================
 * EDGE FUNCTIONS (Supabase)
 * =====================================================================
 *
 * /functions/v1/ai-mindset-prompt — Mindset generation
 * /functions/v1/parse-activity — Text-to-action parsing
 *
 * Both deployed, both require ANTHROPIC_API_KEY as Supabase secret.
 * Both fall back gracefully when key is missing.
 *
 * =====================================================================
 * IMPROVEMENT LOOP
 * =====================================================================
 *
 * 1. actionEngine.ts logs every interaction (TODO: implement)
 * 2. Common patterns that fail → add to regex parser
 * 3. Common intents that are missed → add to INTENT_PATTERNS
 * 4. Category aliases that are wrong → update CATEGORY_ALIASES
 * 5. User feedback on mindsets → improve prompt template
 *
 * The engine improves with every interaction.
 */

// Re-export all AI capabilities from one place
export { processText, type ActionResult, type ActionType } from '../actionEngine';
export { parseActivityText, type ParsedActivity } from '../parseActivity';

// Edge function URLs (for when API is enabled)
export const AI_ENDPOINTS = {
  mindset: 'ai-mindset-prompt',
  parseActivity: 'parse-activity',
} as const;

// AI configuration
export const AI_CONFIG = {
  dailyLimit: 20,
  debounceMs: 600,
  model: 'claude-haiku-4-5-20251001',
  maxTokens: {
    mindset: 100,
    parseActivity: 200,
  },
} as const;
