/**
 * DayFlow Action Engine
 *
 * Interprets free-form text and executes the appropriate action in the app.
 * This file is the SINGLE SOURCE OF TRUTH for what the app can do via text input.
 * It grows over time as we add capabilities.
 *
 * =====================================================================
 * CAPABILITIES REGISTRY — What a user can do
 * =====================================================================
 *
 * 1. CREATE an activity
 *    - "Gym at 7am" → creates Gym at 7:00 AM
 *    - "Read for 30 min" → creates Read task (no time = task)
 *    - "Call mom every evening" → creates recurring daily at 6pm
 *
 * 2. CREATE with conflict resolution
 *    - "Lunch at 3pm" → checks if 3pm is occupied
 *    - If occupied: shifts existing activity OR suggests alternative time
 *    - If "lunch" already exists today: moves it to new time instead of creating duplicate
 *
 * 3. MOVE an activity
 *    - "Move gym to 8am" → finds today's gym, changes time
 *    - "Shift meeting to tomorrow" → changes date
 *
 * 4. COMPLETE an activity
 *    - "Done with gym" → marks gym as completed
 *    - "Finished reading" → marks reading as completed
 *
 * 5. CANCEL/DELETE an activity
 *    - "Cancel the meeting" → deletes/skips the meeting
 *    - "Remove lunch" → deletes lunch
 *
 * 6. RESCHEDULE
 *    - "Push gym to 9am" → move time
 *    - "Delay lunch by 1 hour" → shift by duration
 *
 * 7. ADD a task (no time)
 *    - "Buy groceries" → adds to task bar
 *    - "Remember to call dentist" → adds to task bar
 *
 * 8. SET mindset
 *    - "Set intention for gym: push through" → updates mindset_prompt
 *
 * FUTURE (not yet implemented):
 * - "How was my day?" → show insights
 * - "What's next?" → show next activity
 * - "Free time today?" → find gaps
 * - "Summary" → day summary
 * =====================================================================
 */

import { Activity, RecurrenceType } from '../types';
import { parseActivityText, ParsedActivity } from './parseActivity';
import { format, addHours, parseISO } from 'date-fns';

// =====================================================================
// ACTION TYPES
// =====================================================================

export type ActionType =
  | 'create'        // Create new activity
  | 'move'          // Change time of existing
  | 'complete'      // Mark as done
  | 'cancel'        // Delete/skip
  | 'reschedule'    // Shift by duration
  | 'add_task'      // Add untimed task
  | 'set_mindset'   // Update mindset prompt
  | 'unknown';      // Can't determine intent

export interface ActionResult {
  type: ActionType;
  parsed: ParsedActivity;

  // For create actions
  shouldCreate: boolean;

  // For modify actions (move, complete, cancel)
  targetActivity: Activity | null;

  // Conflict info
  conflict: {
    exists: boolean;
    activity: Activity | null;
    suggestion: string | null;  // "Move 'Lunch' from 1pm to create space?"
  };

  // What to tell the user
  message: string;

  // Confidence 0-1
  confidence: number;
}

// =====================================================================
// INTENT DETECTION — What does the user want to do?
// =====================================================================

interface IntentMatch {
  type: ActionType;
  target: string;  // What activity they're referring to
  confidence: number;
}

const INTENT_PATTERNS: Array<{ pattern: RegExp; type: ActionType; targetGroup: number }> = [
  // Complete
  { pattern: /^(?:done|finished|completed|did)\s+(?:with\s+)?(.+)/i, type: 'complete', targetGroup: 1 },
  { pattern: /^mark\s+(.+?)\s+(?:as\s+)?(?:done|complete)/i, type: 'complete', targetGroup: 1 },
  { pattern: /^✓\s*(.+)/i, type: 'complete', targetGroup: 1 },

  // Cancel/Delete
  { pattern: /^(?:cancel|delete|remove|skip)\s+(?:the\s+)?(.+)/i, type: 'cancel', targetGroup: 1 },
  { pattern: /^(?:don't|dont)\s+(?:need|want)\s+(.+)/i, type: 'cancel', targetGroup: 1 },

  // Move/Reschedule
  { pattern: /^(?:move|shift|push|delay)\s+(.+?)\s+(?:to|by)\s+(.+)/i, type: 'move', targetGroup: 1 },
  { pattern: /^(?:reschedule)\s+(.+?)\s+(?:to|for)\s+(.+)/i, type: 'reschedule', targetGroup: 1 },

  // Set mindset
  { pattern: /^(?:set\s+)?(?:intention|mindset)\s+(?:for\s+)?(.+?):\s*(.+)/i, type: 'set_mindset', targetGroup: 1 },
];

function detectIntent(text: string): IntentMatch {
  const trimmed = text.trim();

  for (const { pattern, type, targetGroup } of INTENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        type,
        target: match[targetGroup]?.trim() || '',
        confidence: 0.8,
      };
    }
  }

  // Default: create or add_task
  return {
    type: 'create',
    target: trimmed,
    confidence: 0.6,
  };
}

// =====================================================================
// ACTIVITY MATCHING — Find which activity the user is referring to
// =====================================================================

function findMatchingActivity(
  searchText: string,
  activities: Activity[],
  dateStr: string
): Activity | null {
  const lower = searchText.toLowerCase().trim();

  // Filter to today's activities
  const todayActs = activities.filter(a => {
    if (!a.start_time) return a.assigned_date === dateStr;
    return a.start_time.substring(0, 10) === dateStr;
  });

  // Exact title match
  const exact = todayActs.find(a => a.title.toLowerCase() === lower);
  if (exact) return exact;

  // Contains match
  const contains = todayActs.find(a => a.title.toLowerCase().includes(lower));
  if (contains) return contains;

  // Reverse contains (search text contains activity title)
  const reverse = todayActs.find(a => lower.includes(a.title.toLowerCase()));
  if (reverse) return reverse;

  // Fuzzy: first word match
  const firstWord = lower.split(/\s+/)[0];
  if (firstWord.length >= 3) {
    const fuzzy = todayActs.find(a => a.title.toLowerCase().startsWith(firstWord));
    if (fuzzy) return fuzzy;
  }

  return null;
}

// =====================================================================
// CONFLICT DETECTION — Check if the time slot is occupied
// =====================================================================

function checkConflicts(
  parsed: ParsedActivity,
  activities: Activity[],
  dateStr: string
): ActionResult['conflict'] {
  if (!parsed.time) return { exists: false, activity: null, suggestion: null };

  const [hours, mins] = parsed.time.split(':').map(Number);
  const duration = parsed.duration || 30;
  const newStart = new Date(`${dateStr}T${parsed.time}:00`).getTime();
  const newEnd = newStart + duration * 60000;

  const todayActs = activities.filter(a => {
    if (!a.start_time) return false;
    return a.start_time.substring(0, 10) === dateStr && a.status !== 'COMPLETED' && a.status !== 'SKIPPED';
  });

  for (const act of todayActs) {
    const actStart = new Date(act.start_time!).getTime();
    const actEnd = actStart + act.duration_minutes * 60000;

    if (newStart < actEnd && newEnd > actStart) {
      // Check if it's the same type of activity (e.g., user is moving lunch)
      const isSameActivity = act.title.toLowerCase().includes(parsed.title.toLowerCase()) ||
                              parsed.title.toLowerCase().includes(act.title.toLowerCase());

      if (isSameActivity) {
        return {
          exists: true,
          activity: act,
          suggestion: `"${act.title}" already exists at ${format(new Date(act.start_time!), 'h:mm a')}. Move it to ${parsed.time}?`,
        };
      }

      // Find next free slot
      let freeStart = actEnd;
      for (const other of todayActs) {
        if (!other.start_time) continue;
        const otherStart = new Date(other.start_time).getTime();
        const otherEnd = otherStart + other.duration_minutes * 60000;
        if (otherStart <= freeStart && otherEnd > freeStart) {
          freeStart = otherEnd;
        }
      }
      const freeTime = new Date(freeStart);

      return {
        exists: true,
        activity: act,
        suggestion: `Conflicts with "${act.title}" (${format(new Date(act.start_time!), 'h:mm a')}). Try ${format(freeTime, 'h:mm a')}?`,
      };
    }
  }

  return { exists: false, activity: null, suggestion: null };
}

// =====================================================================
// MAIN ENGINE — Process free-form text into an action
// =====================================================================

export function processText(
  text: string,
  activities: Activity[],
  categories: Array<{ id: string; name: string }>,
  today: Date
): ActionResult {
  const dateStr = format(today, 'yyyy-MM-dd');

  // 1. Detect intent
  const intent = detectIntent(text);

  // 2. Parse the text for structured fields
  const parsed = parseActivityText(
    intent.type === 'create' ? text : intent.target,
    categories,
    today
  );

  // 3. Handle different intents
  switch (intent.type) {
    case 'complete': {
      const target = findMatchingActivity(intent.target, activities, dateStr);
      return {
        type: 'complete',
        parsed,
        shouldCreate: false,
        targetActivity: target,
        conflict: { exists: false, activity: null, suggestion: null },
        message: target
          ? `Mark "${target.title}" as done?`
          : `Couldn't find "${intent.target}" in today's activities.`,
        confidence: target ? 0.9 : 0.3,
      };
    }

    case 'cancel': {
      const target = findMatchingActivity(intent.target, activities, dateStr);
      return {
        type: 'cancel',
        parsed,
        shouldCreate: false,
        targetActivity: target,
        conflict: { exists: false, activity: null, suggestion: null },
        message: target
          ? `Cancel "${target.title}"?`
          : `Couldn't find "${intent.target}" in today's activities.`,
        confidence: target ? 0.9 : 0.3,
      };
    }

    case 'move':
    case 'reschedule': {
      const target = findMatchingActivity(intent.target, activities, dateStr);
      return {
        type: 'move',
        parsed,
        shouldCreate: false,
        targetActivity: target,
        conflict: { exists: false, activity: null, suggestion: null },
        message: target
          ? `Move "${target.title}" to ${parsed.time || 'new time'}?`
          : `Couldn't find "${intent.target}" to move.`,
        confidence: target ? 0.8 : 0.3,
      };
    }

    case 'set_mindset': {
      const target = findMatchingActivity(intent.target, activities, dateStr);
      return {
        type: 'set_mindset',
        parsed,
        shouldCreate: false,
        targetActivity: target,
        conflict: { exists: false, activity: null, suggestion: null },
        message: target
          ? `Set mindset for "${target.title}"`
          : `Couldn't find "${intent.target}".`,
        confidence: target ? 0.8 : 0.3,
      };
    }

    case 'create':
    default: {
      // Check if this activity already exists today (duplicate prevention)
      const existing = findMatchingActivity(parsed.title, activities, dateStr);

      if (existing && parsed.time) {
        // User might want to move the existing one
        return {
          type: 'move',
          parsed,
          shouldCreate: false,
          targetActivity: existing,
          conflict: {
            exists: true,
            activity: existing,
            suggestion: `"${existing.title}" already exists at ${existing.start_time ? format(parseISO(existing.start_time), 'h:mm a') : 'no time'}. Move it to ${parsed.time}?`,
          },
          message: `"${existing.title}" already exists today. Move it?`,
          confidence: 0.7,
        };
      }

      // Check for time conflicts
      const conflict = checkConflicts(parsed, activities, dateStr);

      // Determine if it's a task (no time) or activity
      const isTask = !parsed.time;

      return {
        type: isTask ? 'add_task' : 'create',
        parsed,
        shouldCreate: true,
        targetActivity: null,
        conflict,
        message: conflict.exists && conflict.suggestion
          ? conflict.suggestion
          : `Create "${parsed.title}"${parsed.time ? ` at ${parsed.time}` : ''}${parsed.duration ? ` (${parsed.duration}m)` : ''}`,
        confidence: parsed.title ? 0.8 : 0.3,
      };
    }
  }
}

// =====================================================================
// ACTION LOG — Track what patterns users use (for improving the engine)
// =====================================================================

/**
 * TODO: Log each processText() call with:
 * - input text
 * - detected intent
 * - confidence
 * - whether user accepted or modified the result
 * This data improves the engine over time.
 */
