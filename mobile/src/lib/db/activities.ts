import { getDb, generateId, nowISO } from './db';
type SQLiteBindValue = string | number | null | boolean;
import { Activity, ActivityType, ActivityStatus, ActivityPriority, RecurrenceType, Subtask, Weekday } from '../../types';

export interface CreateActivityInput {
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  duration_minutes: number;
  category_id: string;
  activity_type?: ActivityType;
  is_scheduled?: boolean;
  priority?: ActivityPriority;
  recurrence_type?: RecurrenceType;
  recurrence_days?: Weekday[];
  subtasks?: Subtask[];
  goal_id?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  start_time?: string;
  duration_minutes?: number;
  category_id?: string;
  assigned_date?: string | null;
  is_scheduled?: boolean;
  mindset_prompt?: string;
  mindset_overridden?: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_days?: Weekday[];
  subtasks?: Subtask[];
  status?: ActivityStatus;
  priority?: ActivityPriority;
  actual_start?: string | null;
  actual_end?: string | null;
  goal_id?: string | null;
}

export async function getActivitiesForDay(userId: string, dateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND date(a.start_time) = ? AND a.is_scheduled = ? AND a.deleted = 0
     ORDER BY a.start_time ASC`,
    [userId, dateStr, 1]
  );
  return rows.map(mapRow);
}

// Get overdue PLANNED tasks from before the given date (carry-over)
export async function getOverdueActivities(userId: string, beforeDateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND date(a.start_time) < ? AND a.status = ? AND a.is_scheduled = ? AND a.deleted = 0
     ORDER BY a.start_time ASC`,
    [userId, beforeDateStr, 'PLANNED', 1]
  );
  return rows.map(mapRow);
}

// Get IN_PROGRESS scheduled activities from before the given date (carry-over)
export async function getInProgressActivities(userId: string, beforeDateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND date(a.start_time) < ? AND a.status = ? AND a.is_scheduled = ? AND a.deleted = 0
     ORDER BY a.start_time ASC`,
    [userId, beforeDateStr, 'IN_PROGRESS', 1]
  );
  return rows.map(mapRow);
}

// Get IN_PROGRESS untimed tasks from past days
export async function getInProgressTasks(userId: string, beforeDateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.activity_type = ? AND a.assigned_date < ? AND a.status = ? AND a.deleted = 0
     ORDER BY a.assigned_date ASC`,
    [userId, 'TASK', beforeDateStr, 'IN_PROGRESS']
  );
  return rows.map(mapRow);
}

// Get all non-deleted activities for a user (for analytics)
export async function getAllActivities(userId: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.deleted = 0
     ORDER BY a.start_time DESC`,
    [userId]
  );
  return rows.map(mapRow);
}

// Get unscheduled backlog tasks
export async function getBacklogActivities(userId: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.is_scheduled = ? AND a.deleted = 0
     ORDER BY a.created_at DESC`,
    [userId, 0]
  );
  return rows.map(mapRow);
}

// Get untimed tasks assigned to a specific day
export async function getUntimedTasksForDay(userId: string, dateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.activity_type = ? AND a.assigned_date = ? AND a.is_scheduled = ? AND a.deleted = 0
     ORDER BY a.created_at ASC`,
    [userId, 'TASK', dateStr, 0]
  );
  return rows.map(mapRow);
}

// Get overdue untimed tasks from past days
export async function getOverdueTasks(userId: string, beforeDateStr: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.activity_type = ? AND a.assigned_date < ? AND a.status = ? AND a.deleted = 0
     ORDER BY a.assigned_date ASC`,
    [userId, 'TASK', beforeDateStr, 'PLANNED']
  );
  return rows.map(mapRow);
}

// Get someday tasks (no assigned date)
export async function getSomedayTasks(userId: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.activity_type = ? AND a.assigned_date IS NULL AND a.deleted = 0
     ORDER BY a.created_at DESC`,
    [userId, 'TASK']
  );
  return rows.map(mapRow);
}

export interface CreateTaskInput {
  user_id: string;
  title: string;
  category_id?: string;
  assigned_date?: string; // YYYY-MM-DD, omit = someday
  description?: string;
  subtasks?: Subtask[];
  priority?: ActivityPriority;
  goal_id?: string | null;
}

export async function createTask(input: CreateTaskInput): Promise<Activity> {
  const db = await getDb();
  const id = generateId();
  const now = nowISO();
  const assignedDate = input.assigned_date ?? null;
  const subtasks = input.subtasks?.length ? JSON.stringify(input.subtasks) : null;

  await db.runAsync(
    `INSERT INTO activities
      (id, user_id, activity_type, title, description, start_time, duration_minutes, category_id,
       assigned_date, is_scheduled, mindset_prompt, mindset_overridden, recurrence_type, recurrence_days,
       subtasks, status, priority, actual_start, actual_end, goal_id, created_at, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, NULL, ?, ?, ?, NULL, NULL, ?, ?, ?, 0, 0)`,
    [
      id, input.user_id, 'TASK', input.title, input.description ?? null,
      now, 0, input.category_id ?? 'sys-personal',
      assignedDate, 0, 'NONE', subtasks,
      'PLANNED', input.priority ?? 'MEDIUM', input.goal_id ?? null, now, now,
    ]
  );
  return getActivity(id) as Promise<Activity>;
}

// Get all activities for a specific category
export async function getActivitiesByCategory(userId: string, categoryId: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.category_id = ? AND a.deleted = 0
     ORDER BY a.start_time DESC`,
    [userId, categoryId]
  );
  return rows.map(mapRow);
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const db = await getDb();
  const id = generateId();
  const now = nowISO();
  const isScheduled = input.is_scheduled !== undefined ? (input.is_scheduled ? 1 : 0) : 1;
  const recurrenceDays = input.recurrence_days?.length ? JSON.stringify(input.recurrence_days) : null;
  const subtasks = input.subtasks?.length ? JSON.stringify(input.subtasks) : null;

  const actType = input.activity_type ?? 'TIME_BLOCK';
  const assignedDate = input.start_time.substring(0, 10); // derive from start_time for time blocks

  await db.runAsync(
    `INSERT INTO activities
      (id, user_id, activity_type, title, description, start_time, duration_minutes, category_id,
       assigned_date, is_scheduled, mindset_prompt, mindset_overridden, recurrence_type, recurrence_days,
       subtasks, status, priority, actual_start, actual_end, goal_id, created_at, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, 0, 0)`,
    [
      id, input.user_id, actType, input.title, input.description ?? null,
      input.start_time, input.duration_minutes, input.category_id,
      assignedDate, isScheduled, input.recurrence_type ?? 'NONE', recurrenceDays, subtasks,
      'PLANNED', input.priority ?? 'MEDIUM', input.goal_id ?? null, now, now,
    ]
  );
  return getActivity(id) as Promise<Activity>;
}

export async function updateActivity(id: string, updates: UpdateActivityInput): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const fields: string[] = ['updated_at = ?', 'synced = 0'];
  const values: unknown[] = [now];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.start_time !== undefined) { fields.push('start_time = ?'); values.push(updates.start_time); }
  if (updates.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(updates.duration_minutes); }
  if (updates.category_id !== undefined) { fields.push('category_id = ?'); values.push(updates.category_id); }
  if (updates.assigned_date !== undefined) { fields.push('assigned_date = ?'); values.push(updates.assigned_date); }
  if (updates.is_scheduled !== undefined) { fields.push('is_scheduled = ?'); values.push(updates.is_scheduled ? 1 : 0); }
  if (updates.mindset_prompt !== undefined) { fields.push('mindset_prompt = ?'); values.push(updates.mindset_prompt); }
  if (updates.mindset_overridden !== undefined) { fields.push('mindset_overridden = ?'); values.push(updates.mindset_overridden ? 1 : 0); }
  if (updates.recurrence_type !== undefined) { fields.push('recurrence_type = ?'); values.push(updates.recurrence_type); }
  if (updates.recurrence_days !== undefined) { fields.push('recurrence_days = ?'); values.push(JSON.stringify(updates.recurrence_days)); }
  if (updates.subtasks !== undefined) { fields.push('subtasks = ?'); values.push(JSON.stringify(updates.subtasks)); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
  if (updates.actual_start !== undefined) { fields.push('actual_start = ?'); values.push(updates.actual_start); }
  if (updates.actual_end !== undefined) { fields.push('actual_end = ?'); values.push(updates.actual_end); }
  if (updates.goal_id !== undefined) { fields.push('goal_id = ?'); values.push(updates.goal_id); }

  values.push(id);
  await db.runAsync(
    `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`,
    values as SQLiteBindValue[]
  );
}

export async function deleteActivity(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE activities SET deleted = 1, synced = 0, updated_at = ? WHERE id = ?',
    [nowISO(), id]
  );
}

export async function getActivity(id: string): Promise<Activity | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ? AND a.deleted = 0`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function searchActivities(userId: string, query: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.deleted = 0
     ORDER BY a.start_time DESC`,
    [userId]
  );
  const all = rows.map(mapRow);
  if (!query.trim()) return all;

  const q = query.toLowerCase();
  return all.filter(a => {
    const fields = [
      a.title, a.description, a.category?.name, a.status,
      a.recurrence_type, a.priority, a.mindset_prompt, a.start_time,
    ].filter(Boolean).join(' ').toLowerCase();
    return fields.includes(q);
  });
}

export async function setMindsetPrompt(id: string, prompt: string): Promise<void> {
  await updateActivity(id, { mindset_prompt: prompt });
}

/**
 * Check if a proposed TIME_BLOCK overlaps with any existing scheduled activity.
 * Returns the conflicting activity if found, null if the slot is free.
 */
export async function checkActivityOverlap(
  userId: string,
  startTime: string,
  durationMinutes: number,
  excludeId?: string,
): Promise<Activity | null> {
  if (durationMinutes <= 0) return null;

  const proposedStart = new Date(startTime).getTime();
  const proposedEnd = proposedStart + durationMinutes * 60000;
  const dateStr = startTime.substring(0, 10);

  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND date(a.start_time) = ? AND a.is_scheduled = 1
       AND a.activity_type = 'TIME_BLOCK' AND a.deleted = 0`,
    [userId, dateStr],
  );

  for (const row of rows) {
    const activity = mapRow(row);
    if (excludeId && activity.id === excludeId) continue;
    if (activity.duration_minutes <= 0) continue;

    const existStart = new Date(activity.start_time).getTime();
    const existEnd = existStart + activity.duration_minutes * 60000;

    // Overlap: intervals intersect (but not just touching)
    if (proposedStart < existEnd && proposedEnd > existStart) {
      return activity;
    }
  }
  return null;
}

/**
 * Generate instances of recurring activities for the given date.
 * Creates a new PLANNED activity for each template that should recur on that day,
 * skipping if an identical title + start-time instance already exists.
 */
export async function generateRecurringInstances(userId: string, dateStr: string): Promise<void> {
  const db = await getDb();

  // Load all activities that have a recurrence pattern
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND a.deleted = 0`,
    [userId],
  );
  const all = rows.map(mapRow);
  const templates = all.filter(a => a.recurrence_type !== 'NONE' && a.is_scheduled);

  if (templates.length === 0) return;

  const targetDate = new Date(dateStr + 'T00:00:00');

  for (const tmpl of templates) {
    if (!shouldOccurOnDate(tmpl, targetDate)) continue;

    // Compute the start_time for this instance on the target date
    const originalStart = new Date(tmpl.start_time);
    const instanceStart = new Date(dateStr + 'T' + padTime(originalStart.getHours(), originalStart.getMinutes()));

    // Check if an instance already exists (same title + overlapping time on that date)
    const alreadyExists = all.some(a => {
      if (a.user_id !== userId) return false;
      if (a.title !== tmpl.title) return false;
      if (!a.start_time.startsWith(dateStr)) return false;
      // Same hour/minute = same instance
      const aDate = new Date(a.start_time);
      return aDate.getHours() === originalStart.getHours() &&
             aDate.getMinutes() === originalStart.getMinutes();
    });

    if (alreadyExists) continue;

    // Create the instance
    const id = generateId();
    const now = nowISO();
    const recurrenceDays = tmpl.recurrence_days?.length ? JSON.stringify(tmpl.recurrence_days) : null;

    await db.runAsync(
      `INSERT INTO activities
        (id, user_id, activity_type, title, description, start_time, duration_minutes, category_id,
         assigned_date, is_scheduled, mindset_prompt, mindset_overridden, recurrence_type, recurrence_days,
         subtasks, status, priority, actual_start, actual_end, goal_id, created_at, updated_at, synced, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, 0, 'NONE', ?, ?, 'PLANNED', ?, NULL, NULL, ?, ?, ?, 0, 0)`,
      [
        id, userId, tmpl.activity_type, tmpl.title, tmpl.description ?? null,
        instanceStart.toISOString(), tmpl.duration_minutes, tmpl.category_id,
        dateStr, recurrenceDays,
        tmpl.subtasks?.length ? JSON.stringify(tmpl.subtasks) : null,
        tmpl.priority ?? 'MEDIUM', tmpl.goal_id ?? null, now, now,
      ],
    );
  }
}

function padTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

const WEEKDAY_MAP: Record<number, Weekday> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

function shouldOccurOnDate(activity: Activity, date: Date): boolean {
  const dayOfWeek = WEEKDAY_MAP[date.getDay()];
  const originalStart = new Date(activity.start_time);
  const originalDayOfWeek = WEEKDAY_MAP[originalStart.getDay()];

  // If recurrence_days is populated, use that for membership check
  if (activity.recurrence_days?.length) {
    return activity.recurrence_days.includes(dayOfWeek);
  }

  switch (activity.recurrence_type) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return date.getDay() >= 1 && date.getDay() <= 5;
    case 'WEEKLY':
      return dayOfWeek === originalDayOfWeek;
    case 'BIWEEKLY': {
      // Every 2 weeks from the original start date
      const diffMs = date.getTime() - originalStart.getTime();
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      return dayOfWeek === originalDayOfWeek && diffWeeks % 2 === 0;
    }
    case 'TRIWEEKLY': {
      const diffMs = date.getTime() - originalStart.getTime();
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
      return dayOfWeek === originalDayOfWeek && diffWeeks % 3 === 0;
    }
    case 'MONTHLY':
      return date.getDate() === originalStart.getDate();
    case 'BIMONTHLY':
      return date.getDate() === originalStart.getDate() && date.getMonth() % 2 === originalStart.getMonth() % 2;
    case 'QUARTERLY':
      return date.getDate() === originalStart.getDate() && date.getMonth() % 3 === originalStart.getMonth() % 3;
    default:
      return false;
  }
}

function parseJsonArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val as T[];
  return [];
}

function mapRow(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    activity_type: (row.activity_type as ActivityType) ?? 'TIME_BLOCK',
    title: row.title as string,
    description: (row.description as string) ?? null,
    assigned_date: (row.assigned_date as string) ?? null,
    start_time: row.start_time as string,
    duration_minutes: row.duration_minutes as number,
    category_id: row.category_id as string,
    is_scheduled: row.is_scheduled === undefined ? true : Boolean(Number(row.is_scheduled)),
    mindset_prompt: (row.mindset_prompt as string) ?? null,
    mindset_overridden: Boolean(row.mindset_overridden),
    recurrence_type: (row.recurrence_type as RecurrenceType) ?? 'NONE',
    recurrence_days: parseJsonArray<Weekday>(row.recurrence_days),
    subtasks: parseJsonArray<Subtask>(row.subtasks),
    status: (row.status as ActivityStatus) ?? 'PLANNED',
    priority: (row.priority as ActivityPriority) ?? 'MEDIUM',
    actual_start: (row.actual_start as string) ?? null,
    actual_end: (row.actual_end as string) ?? null,
    goal_id: (row.goal_id as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    category: row.cat_name ? {
      id: row.category_id as string,
      user_id: null,
      name: row.cat_name as string,
      color: row.cat_color as string,
      icon: row.cat_icon as string,
      is_system: true,
      sort_order: 0,
    } : undefined,
  };
}
