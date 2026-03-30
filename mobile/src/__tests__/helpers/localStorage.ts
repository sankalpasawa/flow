/**
 * localStorage helpers for tests.
 *
 * The app stores all local data under the key `dayflow_db` as a JSON object:
 *   { categories: Row[], activities: Row[], experience_logs: Row[], goals: Row[] }
 *
 * Seed version keys (checked on app load to decide whether to re-seed):
 *   dayflow_seed_version       → dev-user-001 (seed.ts)
 *   dayflow_demo_seed_version  → demo-user-001 (seedDemo.ts)
 *
 * Usage in tests:
 *   beforeEach(() => clearLocalDb());
 *   seedLocalDb(DEV_USER.id, { activities: [makeActivity()] });
 *   expect(getLocalTable('activities')).toHaveLength(1);
 *   expectRowSynced('activities', 'act-1');
 */

type Row = Record<string, unknown>;
type TableName = 'categories' | 'activities' | 'experience_logs' | 'goals';

const STORAGE_KEY = 'dayflow_db';
const SEED_VERSION_KEYS: Record<string, string> = {
  'dev-user-001': 'dayflow_seed_version',
  'demo-user-001': 'dayflow_demo_seed_version',
};

// ─── Read / write ─────────────────────────────────────────────────────────────

export function getLocalDb(): Record<TableName, Row[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return { categories: [], activities: [], experience_logs: [], goals: [] };
  }
}

export function getLocalTable(table: TableName): Row[] {
  return getLocalDb()[table] ?? [];
}

function setLocalDb(db: Record<string, Row[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

/** Wipe all local DB state and seed version markers. */
export function clearLocalDb() {
  localStorage.removeItem(STORAGE_KEY);
  Object.values(SEED_VERSION_KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('dayflow_signed_out');
  localStorage.removeItem('dayflow_active_user');
}

/**
 * Write known rows for a user into localStorage.
 * Existing rows for OTHER users are preserved.
 *
 * @example
 *   seedLocalDb(DEV_USER.id, {
 *     activities: [makeActivity({ status: 'COMPLETED' })],
 *   });
 */
export function seedLocalDb(
  userId: string,
  rows: Partial<Record<TableName, Row[]>>
) {
  const db = getLocalDb();
  for (const [table, data] of Object.entries(rows) as [TableName, Row[]][]) {
    const others = (db[table] ?? []).filter((r: Row) => r.user_id !== userId);
    db[table] = [...others, ...data.map(r => ({ ...r, user_id: userId }))];
  }
  setLocalDb(db);
}

/**
 * Mark a user's seed as already applied (skips re-seed on next app load).
 * Pass the version string from the relevant seed file's SEED_VERSION constant.
 */
export function markSeeded(userId: string, version: string) {
  const key = SEED_VERSION_KEYS[userId];
  if (key) localStorage.setItem(key, version);
}

// ─── Assertions ───────────────────────────────────────────────────────────────

/** Assert a row in the given table has synced = 1. */
export function expectRowSynced(table: TableName, id: string) {
  const row = getLocalTable(table).find(r => r.id === id);
  if (!row) throw new Error(`Row ${id} not found in ${table}`);
  expect(row.synced).toBe(1);
}

/** Assert a row in the given table has synced = 0 (dirty, pending push). */
export function expectRowDirty(table: TableName, id: string) {
  const row = getLocalTable(table).find(r => r.id === id);
  if (!row) throw new Error(`Row ${id} not found in ${table}`);
  expect(row.synced).toBe(0);
}

/** Assert a row has deleted = 1 (soft-deleted). */
export function expectRowDeleted(table: TableName, id: string) {
  const row = getLocalTable(table).find(r => r.id === id);
  if (!row) throw new Error(`Row ${id} not found in ${table}`);
  expect(row.deleted).toBe(1);
}

/** Returns all rows for a specific user in a table. */
export function rowsForUser(table: TableName, userId: string): Row[] {
  return getLocalTable(table).filter(r => r.user_id === userId);
}
