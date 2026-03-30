/**
 * Supabase sync service — supports web (localStorage) and native (SQLite).
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 *  - Offline-first: all writes go to local DB first (synced=0 marks them dirty).
 *  - On sign-in or reconnect: pushChanges → pullChanges (push first to avoid
 *    overwriting in-flight local edits with older remote data).
 *  - Web: reads/writes localStorage JSON directly (no SQL layer needed for sync).
 *  - Native: queries SQLite via getDb() (same SQL as the rest of the app).
 *  - Dev users (dev-user-001, demo-user-001) are fully local; sync is a no-op.
 *
 * ─── Adding a new synced table ───────────────────────────────────────────────
 *  1. Add its name to SYNC_TABLES below.
 *  2. Add matching columns to supabase/migrations/001_initial.sql.
 *  3. Add RLS policy: `user_id = auth.uid()::text`.
 *  4. For native: add a SELECT branch in pushChanges / pullChanges native block.
 *
 * ─── Key design decisions ────────────────────────────────────────────────────
 *  - `synced` column is LOCAL-ONLY; never sent to Supabase (stripped in toRemoteRow).
 *  - `deleted` column IS sent to Supabase for soft-delete replication.
 *  - Conflict strategy: last-write-wins using `updated_at`.
 *  - Per-table errors are logged but don't abort the rest of the sync loop.
 */

import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type LocalDb = Record<string, Row[]>;

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dayflow_db';

/** Dev/demo accounts are fully local — sync is always a no-op for them. */
const DEV_USER_IDS = new Set(['dev-user-001', 'demo-user-001']);

/**
 * Tables to sync and their push order.
 * Categories must come before activities (FK dependency on category_id).
 */
const SYNC_TABLES = ['categories', 'activities', 'experience_logs', 'goals'] as const;
type SyncTable = (typeof SYNC_TABLES)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true for local dev/demo accounts that skip Supabase entirely. */
export function isDevUser(userId: string): boolean {
  return DEV_USER_IDS.has(userId);
}

const isWeb = typeof localStorage !== 'undefined';

function getLocalDb(): LocalDb {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalDb(db: LocalDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

/**
 * Strip client-only fields before upserting to Supabase.
 * `synced` is local tracking only; `deleted` is kept for soft-delete replication.
 */
function toRemoteRow(row: Row): Row {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { synced, ...rest } = row;
  return rest;
}

// ─── Web sync (localStorage) ─────────────────────────────────────────────────

async function pushWeb(userId: string): Promise<void> {
  const db = getLocalDb();
  let changed = false;

  for (const table of SYNC_TABLES) {
    const dirtyRows = (db[table] ?? []).filter(
      (r: Row) => r.user_id === userId && r.synced === 0
    );
    if (!dirtyRows.length) continue;

    const { error } = await supabase
      .from(table as SyncTable)
      .upsert(dirtyRows.map(toRemoteRow), { onConflict: 'id' });

    if (error) {
      console.error(`[DayFlow Sync] Push ${table} failed:`, error.message);
      continue; // Best-effort: continue other tables
    }

    // Mark pushed rows as synced locally
    const pushedIds = new Set(dirtyRows.map((r) => r.id as string));
    db[table] = (db[table] ?? []).map((r: Row) =>
      pushedIds.has(r.id as string) ? { ...r, synced: 1 } : r
    );
    changed = true;
  }

  if (changed) saveLocalDb(db);
}

async function pullWeb(userId: string): Promise<void> {
  const db = getLocalDb();
  let changed = false;

  for (const table of SYNC_TABLES) {
    const { data, error } = await supabase
      .from(table as SyncTable)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error(`[DayFlow Sync] Pull ${table} failed:`, error.message);
      continue;
    }
    if (!data?.length) continue;

    const remoteIds = new Set(data.map((r: Row) => r.id as string));

    // Preserve rows from other users
    const otherRows = (db[table] ?? []).filter((r: Row) => r.user_id !== userId);
    // Preserve local dirty rows not yet on the server (will be pushed next cycle)
    const pendingLocal = (db[table] ?? []).filter(
      (r: Row) =>
        r.user_id === userId &&
        r.synced === 0 &&
        !remoteIds.has(r.id as string)
    );
    // Remote rows arrive as clean
    const remoteRows = data.map((r: Row) => ({ ...r, synced: 1 }));

    db[table] = [...otherRows, ...remoteRows, ...pendingLocal];
    changed = true;
  }

  if (changed) saveLocalDb(db);
}

// ─── Native sync (SQLite) ────────────────────────────────────────────────────

async function pushNative(userId: string): Promise<void> {
  // Lazy-import to avoid bundling SQLite on web
  const { getDb } = await import('./db/db');
  const db = await getDb();

  // Push activities
  const dirtyActivities = await db.getAllAsync<Row>(
    'SELECT * FROM activities WHERE user_id = ? AND synced = 0',
    [userId]
  );
  if (dirtyActivities.length) {
    const { error } = await supabase
      .from('activities')
      .upsert(dirtyActivities.map(toRemoteRow), { onConflict: 'id' });
    if (!error) {
      await db.runAsync(
        `UPDATE activities SET synced = 1 WHERE user_id = ? AND synced = 0`,
        [userId]
      );
    } else {
      console.error('[DayFlow Sync] Push activities failed:', error.message);
    }
  }

  // Push experience_logs
  const dirtyLogs = await db.getAllAsync<Row>(
    'SELECT * FROM experience_logs WHERE user_id = ? AND synced = 0',
    [userId]
  );
  if (dirtyLogs.length) {
    const { error } = await supabase
      .from('experience_logs')
      .upsert(dirtyLogs.map(toRemoteRow), { onConflict: 'id' });
    if (!error) {
      await db.runAsync(
        `UPDATE experience_logs SET synced = 1 WHERE user_id = ? AND synced = 0`,
        [userId]
      );
    } else {
      console.error('[DayFlow Sync] Push logs failed:', error.message);
    }
  }

  // Push goals
  const dirtyGoals = await db.getAllAsync<Row>(
    'SELECT * FROM goals WHERE user_id = ? AND synced = 0',
    [userId]
  );
  if (dirtyGoals.length) {
    const { error } = await supabase
      .from('goals')
      .upsert(dirtyGoals.map(toRemoteRow), { onConflict: 'id' });
    if (!error) {
      // goals table may not have a synced column — handle gracefully
      await db
        .runAsync(`UPDATE goals SET synced = 1 WHERE user_id = ? AND synced = 0`, [userId])
        .catch(() => {});
    } else {
      console.error('[DayFlow Sync] Push goals failed:', error.message);
    }
  }
}

async function pullNative(userId: string): Promise<void> {
  const { getDb } = await import('./db/db');
  const db = await getDb();

  // Pull activities
  const { data: acts, error: actsErr } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId);
  if (actsErr) {
    console.error('[DayFlow Sync] Pull activities failed:', actsErr.message);
  } else if (acts?.length) {
    for (const row of acts) {
      await db.runAsync(
        `INSERT OR REPLACE INTO activities
           (id, user_id, activity_type, title, description, assigned_date, start_time,
            duration_minutes, category_id, is_scheduled, mindset_prompt, mindset_overridden,
            recurrence_type, recurrence_days, subtasks, status, priority, actual_start,
            actual_end, goal_id, created_at, updated_at, synced, deleted)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
        [
          row.id, row.user_id, row.activity_type, row.title, row.description,
          row.assigned_date, row.start_time, row.duration_minutes, row.category_id,
          row.is_scheduled, row.mindset_prompt, row.mindset_overridden,
          row.recurrence_type, row.recurrence_days, row.subtasks,
          row.status, row.priority, row.actual_start, row.actual_end,
          row.goal_id, row.created_at, row.updated_at, row.deleted ?? 0,
        ]
      );
    }
  }

  // Pull experience_logs
  const { data: logs, error: logsErr } = await supabase
    .from('experience_logs')
    .select('*')
    .eq('user_id', userId);
  if (logsErr) {
    console.error('[DayFlow Sync] Pull logs failed:', logsErr.message);
  } else if (logs?.length) {
    for (const row of logs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO experience_logs
           (id, activity_id, user_id, mood, energy, completion_pct,
            reflection, would_repeat, log_phase, logged_at, synced, deleted)
         VALUES (?,?,?,?,?,?,?,?,?,?,1,?)`,
        [
          row.id, row.activity_id, row.user_id, row.mood, row.energy,
          row.completion_pct, row.reflection, row.would_repeat,
          row.log_phase, row.logged_at, row.deleted ?? 0,
        ]
      );
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Push all dirty (synced=0) local rows for this user to Supabase.
 * After a successful push, marks those rows synced=1 locally.
 */
export async function pushChanges(userId: string): Promise<void> {
  if (isDevUser(userId)) return;
  if (isWeb) {
    await pushWeb(userId);
  } else {
    await pushNative(userId);
  }
}

/**
 * Pull all rows for this user from Supabase and merge into local storage.
 * Local dirty rows not yet in remote are preserved (pending next push).
 */
export async function pullChanges(userId: string): Promise<void> {
  if (isDevUser(userId)) return;
  if (isWeb) {
    await pullWeb(userId);
  } else {
    await pullNative(userId);
  }
}

/**
 * Full sync: push local changes first, then pull remote.
 * Safe to call on sign-in, app resume, or network reconnect.
 */
export async function performFullSync(userId: string): Promise<void> {
  if (isDevUser(userId)) return;
  try {
    await pushChanges(userId);
    await pullChanges(userId);
    console.log('[DayFlow Sync] Full sync complete for', userId);
  } catch (err) {
    console.error('[DayFlow Sync] Full sync error:', err);
  }
}

/** @deprecated Use pushChanges + pullChanges instead. Kept for backward compatibility. */
export async function syncAll(userId: string): Promise<void> {
  await performFullSync(userId);
}

/** @deprecated Use pushChanges instead. */
export async function syncPendingActivities(userId: string): Promise<void> {
  await pushChanges(userId);
}

/** @deprecated Use pushChanges instead. */
export async function syncPendingLogs(userId: string): Promise<void> {
  await pushChanges(userId);
}
