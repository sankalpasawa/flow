import { getDb, generateId, nowISO } from './db';
type SQLiteBindValue = string | number | null | boolean;
import { Goal, GoalMetricType, GoalFrequency, Weekday } from '../../types';

export interface CreateGoalInput {
  user_id: string;
  title: string;
  metric_type: GoalMetricType;
  target_value: number;
  frequency: GoalFrequency;
  category_id: string;
  specific_days?: Weekday[];
}

export interface UpdateGoalInput {
  title?: string;
  metric_type?: GoalMetricType;
  target_value?: number;
  frequency?: GoalFrequency;
  category_id?: string;
  specific_days?: Weekday[];
  is_active?: boolean;
}

export interface GoalProgress {
  current_value: number;
  target_value: number;
}

function parseJsonArray<T>(val: unknown): T[] {
  if (!val) return [];
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val as T[];
  return [];
}

function mapRow(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    metric_type: (row.metric_type as GoalMetricType) ?? 'TIME',
    target_value: row.target_value as number,
    frequency: (row.frequency as GoalFrequency) ?? 'DAILY',
    category_id: row.category_id as string,
    specific_days: parseJsonArray<Weekday>(row.specific_days),
    is_active: row.is_active === undefined ? true : Boolean(Number(row.is_active)),
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

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const db = await getDb();
  const id = generateId();
  const now = nowISO();
  const specificDays = input.specific_days?.length ? JSON.stringify(input.specific_days) : null;

  await db.runAsync(
    `INSERT INTO goals
      (id, user_id, title, metric_type, target_value, frequency, category_id,
       specific_days, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      id, input.user_id, input.title, input.metric_type, input.target_value,
      input.frequency, input.category_id, specificDays, now, now,
    ]
  );

  return getGoal(id) as Promise<Goal>;
}

export async function getGoal(id: string): Promise<Goal | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT g.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM goals g
     LEFT JOIN categories c ON g.category_id = c.id
     WHERE g.id = ?`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export async function getActiveGoals(userId: string): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT g.*, c.name as cat_name, c.color as cat_color, c.icon as cat_icon
     FROM goals g
     LEFT JOIN categories c ON g.category_id = c.id
     WHERE g.user_id = ? AND g.is_active = ?
     ORDER BY g.created_at DESC`,
    [userId, 1]
  );
  return rows.map(mapRow);
}

export async function updateGoal(id: string, updates: UpdateGoalInput): Promise<void> {
  const db = await getDb();
  const now = nowISO();
  const fields: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.metric_type !== undefined) { fields.push('metric_type = ?'); values.push(updates.metric_type); }
  if (updates.target_value !== undefined) { fields.push('target_value = ?'); values.push(updates.target_value); }
  if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
  if (updates.category_id !== undefined) { fields.push('category_id = ?'); values.push(updates.category_id); }
  if (updates.specific_days !== undefined) { fields.push('specific_days = ?'); values.push(JSON.stringify(updates.specific_days)); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }

  values.push(id);
  await db.runAsync(
    `UPDATE goals SET ${fields.join(', ')} WHERE id = ?`,
    values as SQLiteBindValue[]
  );
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE goals SET is_active = 0, updated_at = ? WHERE id = ?',
    [nowISO(), id]
  );
}

export async function getGoalProgress(
  userId: string,
  goalId: string,
  periodStart: string,
  periodEnd: string,
): Promise<GoalProgress> {
  const db = await getDb();

  // First get the goal to know category_id, metric_type, target_value
  const goal = await getGoal(goalId);
  if (!goal) {
    return { current_value: 0, target_value: 0 };
  }

  // Fetch completed activities matching the goal's category in the date range.
  // No GROUP BY / SUM — the web DB doesn't support them, so we compute in TS.
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT a.duration_minutes
     FROM activities a
     WHERE a.user_id = ? AND a.category_id = ? AND a.status = ? AND a.deleted = 0
       AND a.start_time >= ? AND a.start_time < ?`,
    [userId, goal.category_id, 'COMPLETED', periodStart, periodEnd]
  );

  let currentValue: number;
  if (goal.metric_type === 'TIME') {
    currentValue = rows.reduce((sum, r) => sum + (Number(r.duration_minutes) || 0), 0);
  } else {
    // SESSIONS — count of completed activities
    currentValue = rows.length;
  }

  return { current_value: currentValue, target_value: goal.target_value };
}
