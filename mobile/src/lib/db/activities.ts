import { getDb, generateId, nowISO } from './db';
import type { SQLiteBindValue } from 'expo-sqlite';
import { Activity, ActivityStatus, ActivityPriority, RecurrenceType } from '../../types';

export interface CreateActivityInput {
  user_id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  category_id: string;
  priority?: ActivityPriority;
  recurrence_type?: RecurrenceType;
}

export interface UpdateActivityInput {
  title?: string;
  start_time?: string;
  duration_minutes?: number;
  category_id?: string;
  mindset_prompt?: string;
  mindset_overridden?: boolean;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  actual_start?: string | null;
  actual_end?: string | null;
}

export async function getActivitiesForDay(userId: string, dateStr: string): Promise<Activity[]> {
  const db = await getDb();
  // dateStr: YYYY-MM-DD — match start_time by date prefix in UTC
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM activities a
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.user_id = ? AND date(a.start_time) = ? AND a.deleted = 0
     ORDER BY a.start_time ASC`,
    [userId, dateStr]
  );
  return rows.map(mapRow);
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const db = await getDb();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO activities
      (id, user_id, title, start_time, duration_minutes, category_id,
       mindset_prompt, mindset_overridden, recurrence_type, status, priority,
       actual_start, actual_end, created_at, updated_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 0, ?, 'PLANNED', ?, NULL, NULL, ?, ?, 0, 0)`,
    [
      id, input.user_id, input.title, input.start_time, input.duration_minutes,
      input.category_id, input.recurrence_type ?? 'NONE',
      input.priority ?? 'MEDIUM', now, now,
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
  if (updates.start_time !== undefined) { fields.push('start_time = ?'); values.push(updates.start_time); }
  if (updates.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(updates.duration_minutes); }
  if (updates.category_id !== undefined) { fields.push('category_id = ?'); values.push(updates.category_id); }
  if (updates.mindset_prompt !== undefined) { fields.push('mindset_prompt = ?'); values.push(updates.mindset_prompt); }
  if (updates.mindset_overridden !== undefined) { fields.push('mindset_overridden = ?'); values.push(updates.mindset_overridden ? 1 : 0); }
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

export async function setMindsetPrompt(id: string, prompt: string): Promise<void> {
  await updateActivity(id, { mindset_prompt: prompt });
}

function mapRow(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    start_time: row.start_time as string,
    duration_minutes: row.duration_minutes as number,
    category_id: row.category_id as string,
    mindset_prompt: (row.mindset_prompt as string) ?? null,
    mindset_overridden: Boolean(row.mindset_overridden),
    recurrence_type: (row.recurrence_type as RecurrenceType) ?? 'NONE',
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
