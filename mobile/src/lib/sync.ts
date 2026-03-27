/**
 * Supabase sync layer.
 * Strategy: client wins for user content. On reconnect, push unsynced local
 * records to Supabase. Conflicts resolved by updated_at (latest wins).
 */

import { supabase } from './supabase';
import { getDb } from './db/db';

export async function syncPendingActivities(userId: string): Promise<void> {
  const db = await getDb();
  const unsynced = await db.getAllAsync<{
    id: string; title: string; start_time: string; duration_minutes: number;
    category_id: string; mindset_prompt: string | null; mindset_overridden: number;
    recurrence_type: string; status: string; priority: string;
    actual_start: string | null; actual_end: string | null;
    created_at: string; updated_at: string; deleted: number;
  }>(
    'SELECT * FROM activities WHERE user_id = ? AND synced = 0',
    [userId]
  );

  for (const row of unsynced) {
    try {
      if (row.deleted) {
        await supabase.from('activities').delete().eq('id', row.id);
      } else {
        await supabase.from('activities').upsert({
          id: row.id, user_id: userId, title: row.title,
          start_time: row.start_time, duration_minutes: row.duration_minutes,
          category_id: row.category_id, mindset_prompt: row.mindset_prompt,
          mindset_overridden: Boolean(row.mindset_overridden),
          recurrence_type: row.recurrence_type, status: row.status,
          priority: row.priority, actual_start: row.actual_start,
          actual_end: row.actual_end, created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
      await db.runAsync('UPDATE activities SET synced = 1 WHERE id = ?', [row.id]);
    } catch (err) {
      console.error('[DayFlow] Sync failed:', err);
    }
  }
}

export async function syncPendingLogs(userId: string): Promise<void> {
  const db = await getDb();
  const unsynced = await db.getAllAsync<{
    id: string; activity_id: string; mood: number; energy: number;
    completion_pct: number; reflection: string | null; would_repeat: string | null;
    log_phase: string; logged_at: string; deleted: number;
  }>(
    'SELECT * FROM experience_logs WHERE user_id = ? AND synced = 0',
    [userId]
  );

  for (const row of unsynced) {
    try {
      if (row.deleted) {
        await supabase.from('experience_logs').delete().eq('id', row.id);
      } else {
        await supabase.from('experience_logs').upsert({
          id: row.id, activity_id: row.activity_id, user_id: userId,
          mood: row.mood, energy: row.energy, completion_pct: row.completion_pct,
          reflection: row.reflection, would_repeat: row.would_repeat,
          log_phase: row.log_phase, logged_at: row.logged_at,
        });
      }
      await db.runAsync('UPDATE experience_logs SET synced = 1 WHERE id = ?', [row.id]);
    } catch (err) {
      console.error('[DayFlow] Sync failed:', err);
    }
  }
}

export async function syncAll(userId: string): Promise<void> {
  await Promise.all([
    syncPendingActivities(userId),
    syncPendingLogs(userId),
  ]);
}
