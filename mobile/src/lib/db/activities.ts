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
}

export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  start_time?: string;
  duration_minutes?: number;
  category_id?: string;
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
       subtasks, status, priority, actual_start, actual_end, created_at, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, NULL, ?, ?, ?, NULL, NULL, ?, ?, 0, 0)`,
    [
      id, input.user_id, 'TASK', input.title, input.description ?? null,
      now, 0, input.category_id ?? 'sys-personal',
      assignedDate, 0, 'NONE', subtasks,
      'PLANNED', input.priority ?? 'MEDIUM', now, now,
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
       subtasks, status, priority, actual_start, actual_end, created_at, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 0, 0)`,
    [
      id, input.user_id, actType, input.title, input.description ?? null,
      input.start_time, input.duration_minutes, input.category_id,
      assignedDate, isScheduled, input.recurrence_type ?? 'NONE', recurrenceDays, subtasks,
      'PLANNED', input.priority ?? 'MEDIUM', now, now,
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
