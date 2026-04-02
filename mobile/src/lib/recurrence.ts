/**
 * Recurring activity instance generator
 *
 * Given a set of recurring activities and a target date,
 * generates virtual instances that should appear on that date.
 * No DB rows created — instances are computed on the fly.
 */

import { Activity, RecurrenceType, Weekday } from '../types';
import { parseISO, format, isBefore, isAfter, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, getDay, startOfDay } from 'date-fns';

const DAY_NAMES: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Check if a recurring activity should appear on a given date
 */
export function shouldRecurOnDate(activity: Activity, targetDate: Date): boolean {
  const recurrence = activity.recurrence_type;
  if (recurrence === 'NONE') return false;

  // Get the original start date of the recurring activity
  const startTime = activity.start_time;
  if (!startTime) return false;

  const originalDate = startOfDay(parseISO(startTime));
  const target = startOfDay(targetDate);

  // Don't show before the original start date
  if (isBefore(target, originalDate)) return false;

  // If it's the same day as original, the real instance handles it
  if (differenceInDays(target, originalDate) === 0) return false;

  const recurrenceDays = activity.recurrence_days || [];

  switch (recurrence) {
    case 'DAILY':
      return true;

    case 'WEEKDAYS': {
      const dayOfWeek = getDay(target); // 0=Sun, 6=Sat
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    }

    case 'WEEKLY': {
      const dayOfWeek = DAY_NAMES[getDay(target)];
      if (recurrenceDays.length > 0) {
        return recurrenceDays.includes(dayOfWeek);
      }
      // Default: same day of week as original
      return getDay(target) === getDay(originalDate);
    }

    case 'BIWEEKLY': {
      const weeksDiff = differenceInWeeks(target, originalDate);
      if (weeksDiff % 2 !== 0) return false;
      if (recurrenceDays.length > 0) {
        return recurrenceDays.includes(DAY_NAMES[getDay(target)]);
      }
      return getDay(target) === getDay(originalDate);
    }

    case 'MONTHLY': {
      const originalDay = parseISO(startTime).getDate();
      return target.getDate() === originalDay;
    }

    case 'BIMONTHLY': {
      const monthsDiff = differenceInMonths(target, originalDate);
      if (monthsDiff % 2 !== 0) return false;
      return target.getDate() === parseISO(startTime).getDate();
    }

    case 'QUARTERLY': {
      const monthsDiff = differenceInMonths(target, originalDate);
      if (monthsDiff % 3 !== 0) return false;
      return target.getDate() === parseISO(startTime).getDate();
    }

    case 'YEARLY': {
      const orig = parseISO(startTime);
      return target.getMonth() === orig.getMonth() && target.getDate() === orig.getDate();
    }

    default:
      return false;
  }
}

/**
 * Generate virtual instances of recurring activities for a target date.
 * Returns new Activity objects with adjusted start_time for the target date.
 * These are NOT saved to DB — they're computed on the fly.
 */
export function generateRecurringInstances(
  recurringActivities: Activity[],
  targetDate: Date
): Activity[] {
  const instances: Activity[] = [];
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  for (const activity of recurringActivities) {
    if (!shouldRecurOnDate(activity, targetDate)) continue;

    // Create a virtual instance with the same time but on the target date
    const originalTime = activity.start_time ? parseISO(activity.start_time) : null;
    let newStartTime = '';

    if (originalTime) {
      const hours = originalTime.getHours().toString().padStart(2, '0');
      const minutes = originalTime.getMinutes().toString().padStart(2, '0');
      newStartTime = `${targetDateStr}T${hours}:${minutes}:00.000Z`;
    }

    const instance: Activity = {
      ...activity,
      // Unique ID for this virtual instance (original ID + date)
      id: `${activity.id}_${targetDateStr}`,
      start_time: newStartTime || activity.start_time,
      assigned_date: targetDateStr,
      // Virtual instances are always PLANNED (user hasn't interacted with them)
      status: 'PLANNED' as const,
      actual_start: null,
      actual_end: null,
    };

    instances.push(instance);
  }

  return instances;
}
