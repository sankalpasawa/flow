import { getDb, generateId, nowISO } from './db';
type SQLiteBindValue = string | number | null | boolean;
import { ExperienceLog, LogPhase, WouldRepeat } from '../../types';

export interface CreateLogInput {
  activity_id: string;
  user_id: string;
  mood: number;
  energy: number;
  completion_pct: 0 | 50 | 100;
  reflection?: string;
  would_repeat?: WouldRepeat;
  log_phase: LogPhase;
}

export async function createLog(input: CreateLogInput): Promise<ExperienceLog> {
  const db = await getDb();
  const id = generateId();
  const now = nowISO();
  await db.runAsync(
    `INSERT INTO experience_logs
      (id, activity_id, user_id, mood, energy, completion_pct,
       reflection, would_repeat, log_phase, logged_at, synced, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      id, input.activity_id, input.user_id,
      input.mood, input.energy, input.completion_pct,
      input.reflection ?? null, input.would_repeat ?? null,
      input.log_phase, now,
    ]
  );
  return getLog(id) as Promise<ExperienceLog>;
}

export async function updateLog(
  id: string,
  updates: Partial<Omit<CreateLogInput, 'activity_id' | 'user_id'>>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = ['synced = 0'];
  const values: unknown[] = [];

  if (updates.mood !== undefined) { fields.push('mood = ?'); values.push(updates.mood); }
  if (updates.energy !== undefined) { fields.push('energy = ?'); values.push(updates.energy); }
  if (updates.completion_pct !== undefined) { fields.push('completion_pct = ?'); values.push(updates.completion_pct); }
  if (updates.reflection !== undefined) { fields.push('reflection = ?'); values.push(updates.reflection); }
  if (updates.would_repeat !== undefined) { fields.push('would_repeat = ?'); values.push(updates.would_repeat); }
  if (updates.log_phase !== undefined) { fields.push('log_phase = ?'); values.push(updates.log_phase); }

  values.push(id);
  await db.runAsync(
    `UPDATE experience_logs SET ${fields.join(', ')} WHERE id = ?`,
    values as SQLiteBindValue[]
  );
}

export async function getLog(id: string): Promise<ExperienceLog | null> {
  const db = await getDb();
  return db.getFirstAsync<ExperienceLog>(
    'SELECT * FROM experience_logs WHERE id = ? AND deleted = 0',
    [id]
  );
}

export async function getLogForActivity(activityId: string): Promise<ExperienceLog | null> {
  const db = await getDb();
  return db.getFirstAsync<ExperienceLog>(
    'SELECT * FROM experience_logs WHERE activity_id = ? AND deleted = 0 ORDER BY logged_at DESC LIMIT 1',
    [activityId]
  );
}

export async function getLogsForUser(userId: string, limit = 50): Promise<ExperienceLog[]> {
  const db = await getDb();
  return db.getAllAsync<ExperienceLog>(
    `SELECT l.*, a.title as activity_title, a.start_time
     FROM experience_logs l
     JOIN activities a ON l.activity_id = a.id
     WHERE l.user_id = ? AND l.deleted = 0
     ORDER BY l.logged_at DESC
     LIMIT ?`,
    [userId, limit]
  );
}

export function isEditWindowOpen(activityEndTime: Date): boolean {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return activityEndTime > twentyFourHoursAgo;
}

// Count today's logs for freemium gate
export async function countTodayLogs(userId: string): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM experience_logs
     WHERE user_id = ? AND date(logged_at) = ? AND deleted = 0`,
    [userId, today]
  );
  return result?.count ?? 0;
}
