/**
 * Activity and task factory functions for tests.
 *
 * Usage:
 *   makeActivity({ status: 'COMPLETED' })
 *   makeTask({ assigned_date: '2026-03-30', user_id: DEMO_USER.id })
 *   makeLog({ mood: 5, energy: 4 })
 */

import { Activity, ExperienceLog } from '../../types';
import { DEV_USER } from './users';

let _seq = 0;
function seq(prefix: string) {
  return `${prefix}-${++_seq}`;
}

/** Reset the ID sequence between test files (call in beforeEach if needed). */
export function resetSeq() {
  _seq = 0;
}

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  const now = new Date().toISOString();
  const today = now.substring(0, 10);
  return {
    id: seq('act'),
    user_id: DEV_USER.id,
    activity_type: 'TIME_BLOCK',
    title: 'Test activity',
    description: null,
    start_time: `${today}T09:00:00.000Z`,
    duration_minutes: 60,
    category_id: 'sys-deep-work',
    assigned_date: today,
    is_scheduled: true,
    mindset_prompt: null,
    mindset_overridden: false,
    recurrence_type: 'NONE',
    recurrence_days: [],
    subtasks: [],
    status: 'PLANNED',
    priority: 'MEDIUM',
    actual_start: null,
    actual_end: null,
    goal_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Activity> = {}): Activity {
  return makeActivity({
    id: seq('task'),
    activity_type: 'TASK',
    is_scheduled: false,
    duration_minutes: 0,
    ...overrides,
  });
}

export function makeLog(
  activityId: string,
  overrides: Partial<ExperienceLog> = {}
): ExperienceLog {
  return {
    id: seq('log'),
    activity_id: activityId,
    user_id: DEV_USER.id,
    mood: 3,
    energy: 3,
    completion_pct: 100,
    reflection: null,
    would_repeat: null,
    log_phase: 'AFTER',
    logged_at: new Date().toISOString(),
    ...overrides,
  };
}
