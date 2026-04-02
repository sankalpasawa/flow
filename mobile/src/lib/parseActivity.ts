import { addDays, nextDay, format } from 'date-fns';
import type { RecurrenceType } from '../types';

// ─── Output shape ────────────────────────────────────────────────

export interface ParsedActivity {
  title: string;
  date: string | null;       // 'yyyy-MM-dd' or null
  time: string | null;       // 'HH:mm' or null
  duration: number | null;   // minutes or null
  categoryId: string | null;
  recurrence: RecurrenceType | null;
  mindsetPrompt: string | null;
}

// ─── Category alias map ──────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string[]> = {
  health:   ['gym', 'workout', 'exercise', 'run', 'running', 'jog', 'lift', 'swim', 'bike', 'hike', 'fitness'],
  learning: ['read', 'study', 'book', 'learn', 'course', 'lecture', 'tutorial', 'practice'],
  personal: ['meditate', 'yoga', 'pray', 'journal', 'reflect', 'self-care', 'therapy'],
  social:   ['call', 'talk', 'chat', 'meet', 'hangout', 'coffee', 'lunch', 'dinner', 'drinks', 'party'],
  work:     ['work', 'meeting', 'email', 'report', 'presentation', 'standup', 'review', 'code', 'deploy'],
};

// ─── Mindset prompts by category keyword ─────────────────────────

const MINDSET_MAP: Record<string, string> = {
  health:   'Show up. The hardest part is starting.',
  learning: 'Stay curious. Every page compounds.',
  personal: 'Be present. This moment matters.',
  social:   'Be present. Listen more than you speak.',
  work:     'Deep focus. One thing at a time.',
};

// ─── Day-of-week helpers ─────────────────────────────────────────

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

// ─── Helpers ─────────────────────────────────────────────────────

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

/**
 * Remove a regex match from the remaining text and return the updated text.
 */
function strip(text: string, pattern: RegExp): string {
  return text.replace(pattern, ' ');
}

// ─── Main parser ─────────────────────────────────────────────────

export function parseActivityText(
  text: string,
  categories: Array<{ id: string; name: string }>,
  today: Date,
): ParsedActivity {
  let remaining = ` ${text} `; // pad with spaces for boundary matching

  let time: string | null = null;
  let duration: number | null = null;
  let date: string | null = null;
  let recurrence: RecurrenceType | null = null;
  let categoryId: string | null = null;
  let mindsetPrompt: string | null = null;

  // ── 4. Recurrence (before time, because "every morning" sets both) ──

  // "every morning" / "every evening"
  const everyMorning = /\bevery\s+morning\b/i;
  const everyEvening = /\bevery\s+evening\b/i;

  if (everyMorning.test(remaining)) {
    recurrence = 'DAILY';
    time = '07:00';
    remaining = strip(remaining, everyMorning);
  } else if (everyEvening.test(remaining)) {
    recurrence = 'DAILY';
    time = '18:00';
    remaining = strip(remaining, everyEvening);
  }

  // "every day" / "daily"
  const everyDay = /\b(?:every\s+day|daily)\b/i;
  if (!recurrence && everyDay.test(remaining)) {
    recurrence = 'DAILY';
    remaining = strip(remaining, everyDay);
  }

  // "every week" / "weekly"
  const everyWeek = /\b(?:every\s+week|weekly)\b/i;
  if (!recurrence && everyWeek.test(remaining)) {
    recurrence = 'WEEKLY';
    remaining = strip(remaining, everyWeek);
  }

  // "every month" / "monthly"
  const everyMonth = /\b(?:every\s+month|monthly)\b/i;
  if (!recurrence && everyMonth.test(remaining)) {
    recurrence = 'MONTHLY';
    remaining = strip(remaining, everyMonth);
  }

  // ── 1. Time extraction ──

  // "at 7am" / "at 7:30pm" / "at 15:00"
  const atTime = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const atMatch = remaining.match(atTime);
  if (atMatch && time === null) {
    let hours = parseInt(atMatch[1], 10);
    const minutes = atMatch[2] ? parseInt(atMatch[2], 10) : 0;
    const meridian = atMatch[3]?.toLowerCase();

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;

    time = `${pad(hours)}:${pad(minutes)}`;
    remaining = strip(remaining, atTime);
  }

  // Time-of-day keywords (only if time not already set)
  if (time === null) {
    const timeWords: Array<[RegExp, string]> = [
      [/\bmorning\b/i, '07:00'],
      [/\bafternoon\b/i, '13:00'],
      [/\bevening\b/i, '18:00'],
      [/\bnight\b/i, '21:00'],
    ];
    for (const [pattern, t] of timeWords) {
      if (pattern.test(remaining)) {
        time = t;
        remaining = strip(remaining, pattern);
        break;
      }
    }
  }

  // ── 2. Duration extraction ──

  // "for 30 min" / "for 30 minutes" / "for 1 hour" / "for 2 hours" / "for 1.5 hours"
  const forDuration = /\bfor\s+(\d+(?:\.\d+)?)\s*(min(?:utes?)?|hours?)\b/i;
  const forMatch = remaining.match(forDuration);
  if (forMatch) {
    const value = parseFloat(forMatch[1]);
    const unit = forMatch[2].toLowerCase();
    duration = unit.startsWith('h') ? Math.round(value * 60) : Math.round(value);
    remaining = strip(remaining, forDuration);
  }

  // Shorthand: "30m" / "1h" / "1.5h"
  if (duration === null) {
    const shortDuration = /\b(\d+(?:\.\d+)?)\s*(m|h)\b/i;
    const shortMatch = remaining.match(shortDuration);
    if (shortMatch) {
      const value = parseFloat(shortMatch[1]);
      const unit = shortMatch[2].toLowerCase();
      duration = unit === 'h' ? Math.round(value * 60) : Math.round(value);
      remaining = strip(remaining, shortDuration);
    }
  }

  // ── 3. Date extraction ──

  // "today"
  const todayRe = /\btoday\b/i;
  if (todayRe.test(remaining)) {
    date = formatDate(today);
    remaining = strip(remaining, todayRe);
  }

  // "tomorrow"
  if (date === null) {
    const tomorrowRe = /\btomorrow\b/i;
    if (tomorrowRe.test(remaining)) {
      date = formatDate(addDays(today, 1));
      remaining = strip(remaining, tomorrowRe);
    }
  }

  // "next Monday" / "next tuesday" etc.
  if (date === null) {
    const nextDayRe = /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thurs|fri|sat|sun)\b/i;
    const nextDayMatch = remaining.match(nextDayRe);
    if (nextDayMatch) {
      const dayName = nextDayMatch[1].toLowerCase();
      const dayIndex = DAY_MAP[dayName];
      if (dayIndex !== undefined) {
        date = formatDate(nextDay(today, dayIndex));
      }
      remaining = strip(remaining, nextDayRe);
    }
  }

  // "next week"
  if (date === null) {
    const nextWeekRe = /\bnext\s+week\b/i;
    if (nextWeekRe.test(remaining)) {
      date = formatDate(addDays(today, 7));
      remaining = strip(remaining, nextWeekRe);
    }
  }

  // ── 5. Category matching ──

  const lowerText = text.toLowerCase();

  // First: try alias matching
  let matchedCategoryKey: string | null = null;

  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      // Match whole word in original text
      const aliasRe = new RegExp(`\\b${alias}\\b`, 'i');
      if (aliasRe.test(lowerText)) {
        matchedCategoryKey = key;
        break;
      }
    }
    if (matchedCategoryKey) break;
  }

  if (matchedCategoryKey) {
    // Find a category whose name case-insensitively contains the key
    const cat = categories.find(
      (c) => c.name.toLowerCase().includes(matchedCategoryKey!),
    );
    if (cat) {
      categoryId = cat.id;
    }
  }

  // Fallback: case-insensitive contains match of any word against category names
  if (!categoryId) {
    const words = lowerText.split(/\s+/);
    for (const cat of categories) {
      const catLower = cat.name.toLowerCase();
      for (const word of words) {
        if (word.length >= 3 && catLower.includes(word)) {
          categoryId = cat.id;
          break;
        }
      }
      if (categoryId) break;
    }
  }

  // ── 7. Mindset generation ──

  if (matchedCategoryKey && MINDSET_MAP[matchedCategoryKey]) {
    mindsetPrompt = MINDSET_MAP[matchedCategoryKey];
  }

  // ── 6. Title extraction ──

  // Clean up: collapse whitespace, trim
  let title = remaining
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // If title is empty, use original text
  if (!title) {
    title = text.trim();
    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  }

  return {
    title,
    date,
    time,
    duration,
    categoryId,
    recurrence,
    mindsetPrompt,
  };
}
