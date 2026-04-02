/**
 * DayFlow AI Command Layer
 *
 * The AI has full access to the app's data schema.
 * No fixed capability list. The LLM understands the schema
 * and derives what's possible from it.
 *
 * DayFlow is not a calendar app. It's a personal operating system.
 * The calendar is just one UI view. The AI layer can do anything
 * the data model supports.
 */

import { Activity, Category } from '../../types';
import { format, parseISO, subDays, addDays } from 'date-fns';

// =====================================================================
// APP SCHEMA — Given to the LLM. This is what the AI "sees".
// As the app grows, this schema grows. The AI's capabilities
// automatically expand with the schema.
// =====================================================================

export const APP_SCHEMA = `
You are DayFlow's AI. DayFlow is a personal operating system.
You have FULL access to the user's data. You can read, create, update, delete anything.

DATA SCHEMA:

Activity {
  id: string
  title: string
  start_time: string | null    — ISO datetime. null = no specific time
  duration_minutes: number     — 0 if no duration
  category_id: string          — references a Category
  recurrence_type: NONE | DAILY | WEEKLY | MONTHLY | YEARLY
  recurrence_days: string[]    — e.g. ["Mon", "Wed", "Fri"]
  mindset_prompt: string | null — mental framing for this activity
  status: PLANNED | COMPLETED | SKIPPED
  subtasks: Array<{ title, done }>
  assigned_date: string | null — yyyy-MM-dd
  priority: HIGH | MEDIUM | LOW
}

Category {
  id: string
  name: string
  icon: string (emoji)
}

ExperienceLog {
  activity_id: string
  mood: 1-5
  energy: 1-5
  completion_pct: 0 | 50 | 100
  reflection: string | null
}

UI VIEWS:
- Calendar view: activities with time shown as pills on hourly canvas
- List view: all activities in a flat list with checkboxes
- Bottom bar: activities without time shown here
- Watermark: recurring activities without time shown as right-aligned chips

RULES:
- Activity without start_time → shows in bottom bar
- Activity without start_time + with recurrence → shows as watermark on calendar
- Activity with start_time → shows as pill on calendar
- User types natural language. You interpret and execute.
- If confident (>0.8), execute and confirm.
- If unsure (0.4-0.8), ask a clarifying question.
- If confused (<0.4), say what you don't understand.
- Always return valid JSON.
`;

// =====================================================================
// TYPES
// =====================================================================

export interface CommandResult {
  /** What to do */
  action: 'create' | 'update' | 'delete' | 'search' | 'navigate' | 'display' | 'clarify' | 'error';

  /** Parameters for the action — schema depends on action type */
  params: Record<string, any>;

  /** How sure the AI is (0-1) */
  confidence: number;

  /** What to tell the user */
  message: string;

  /** Follow-up question if confidence < 0.8 */
  clarification?: string | null;
}

// =====================================================================
// SCOPE CLASSIFICATION
// Determines how much data to fetch before calling the LLM.
// =====================================================================

export function classifyScope(text: string): 'light' | 'medium' | 'heavy' {
  const lower = text.toLowerCase();

  // Heavy: cross-date queries, analytics, patterns
  if (/this week|this month|last \d|how many|how much|total|all my|every time|pattern|trend|history|summary|report|stats/i.test(lower)) {
    return 'heavy';
  }

  // Medium: references other dates
  if (/tomorrow|yesterday|next|last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|move.*to|shift.*to|reschedule/i.test(lower)) {
    return 'medium';
  }

  // Light: today, current context
  return 'light';
}

// =====================================================================
// CONTEXT BUILDER
// Builds the context string given to the LLM.
// =====================================================================

export function buildContext(
  scope: 'light' | 'medium' | 'heavy',
  todayActivities: Activity[],
  categories: Category[],
  currentTime: Date,
): string {
  const todayStr = format(currentTime, 'yyyy-MM-dd');
  const timeStr = format(currentTime, 'h:mm a');

  const catList = categories.map(c => `  ${c.id}: ${c.icon} ${c.name}`).join('\n');

  const formatAct = (a: Activity) => {
    const time = a.start_time && a.start_time !== ''
      ? format(parseISO(a.start_time), 'h:mm a')
      : 'no time';
    const dur = a.duration_minutes > 0 ? `${a.duration_minutes}m` : '';
    const rec = a.recurrence_type !== 'NONE' ? `repeats: ${a.recurrence_type}` : '';
    const mind = a.mindset_prompt ? `mindset: "${a.mindset_prompt.substring(0, 50)}"` : '';
    return `  [${a.status}] "${a.title}" — ${time} ${dur} ${rec} ${mind}`.trim();
  };

  const actList = todayActivities.map(formatAct).join('\n');

  return `Now: ${timeStr}
Today: ${todayStr}

Categories:
${catList}

Today's activities:
${actList || '  (none)'}`;
}

// =====================================================================
// PROMPT BUILDER
// Assembles the full prompt for the LLM call.
// =====================================================================

export function buildPrompt(
  userText: string,
  context: string,
): { system: string; user: string } {
  return {
    system: `${APP_SCHEMA}

CURRENT STATE:
${context}

Respond with JSON only. No explanation outside the JSON.
{
  "action": "create | update | delete | search | navigate | display | clarify",
  "params": { ... },
  "confidence": 0.0 to 1.0,
  "message": "what you'll tell the user",
  "clarification": "question if confidence < 0.8, null otherwise"
}

For CREATE: params = { title, start_time, duration_minutes, category_id, recurrence_type, mindset_prompt, priority }
For UPDATE: params = { search_query, updates: { field: new_value } }
For DELETE: params = { search_query }
For SEARCH: params = { query, date_range }
For NAVIGATE: params = { date }
For DISPLAY: params = { what: "free_time" | "summary" | "stats", date_range }
For CLARIFY: params = {}, clarification = "your question"

Omit null/undefined fields from params. Only include what's relevant.`,
    user: userText,
  };
}

// =====================================================================
// LOCAL FALLBACK
// When the LLM is not available, do basic intent matching.
// This is NOT the primary path — just a safety net.
// =====================================================================

export function localFallback(
  text: string,
  todayActivities: Activity[],
  categories: Category[],
): CommandResult {
  const lower = text.toLowerCase().trim();

  // Delete/remove/cancel
  if (/^(?:delete|remove|cancel|skip)\s+/i.test(lower)) {
    const query = lower.replace(/^(?:delete|remove|cancel|skip)\s+/i, '').replace(/^the\s+/i, '');
    const match = todayActivities.find(a =>
      a.title.toLowerCase().includes(query) || query.includes(a.title.toLowerCase())
    );
    if (match) {
      return {
        action: 'delete',
        params: { search_query: query, matched_id: match.id, matched_title: match.title },
        confidence: 0.8,
        message: `Delete "${match.title}"?`,
      };
    }
    return {
      action: 'clarify',
      params: {},
      confidence: 0.3,
      message: `Couldn't find "${query}" in today's activities.`,
      clarification: `Which activity do you want to remove?`,
    };
  }

  // Complete/done/finish
  if (/^(?:done|finish|complete|did)\s+/i.test(lower)) {
    const query = lower.replace(/^(?:done|finish|complete|did)\s+(?:with\s+)?/i, '');
    const match = todayActivities.find(a =>
      a.title.toLowerCase().includes(query)
    );
    if (match) {
      return {
        action: 'update',
        params: { search_query: query, matched_id: match.id, updates: { status: 'COMPLETED' } },
        confidence: 0.85,
        message: `Marked "${match.title}" as done.`,
      };
    }
  }

  // Default: treat as create
  return {
    action: 'create',
    params: { raw_text: text },
    confidence: 0.5,
    message: `Create "${text}"?`,
  };
}
