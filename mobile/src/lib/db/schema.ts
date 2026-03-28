// SQLite schema — local offline-first store
// Source of truth on device; synced to Supabase on reconnect

export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode=WAL;
  PRAGMA foreign_keys=ON;

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    synced INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category_id TEXT NOT NULL,
    is_scheduled INTEGER NOT NULL DEFAULT 1,
    mindset_prompt TEXT,
    mindset_overridden INTEGER NOT NULL DEFAULT 0,
    recurrence_type TEXT NOT NULL DEFAULT 'NONE',
    recurrence_days TEXT,
    subtasks TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    actual_start TEXT,
    actual_end TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE INDEX IF NOT EXISTS idx_activities_user_start
    ON activities(user_id, start_time);

  CREATE TABLE IF NOT EXISTS experience_logs (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    mood INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    completion_pct INTEGER NOT NULL DEFAULT 0,
    reflection TEXT,
    would_repeat TEXT,
    log_phase TEXT NOT NULL DEFAULT 'AFTER',
    logged_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (activity_id) REFERENCES activities(id)
  );

  CREATE INDEX IF NOT EXISTS idx_logs_activity
    ON experience_logs(activity_id);

  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  );
`;
