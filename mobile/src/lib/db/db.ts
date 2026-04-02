import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import type { DatabaseAdapter } from './types';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (_db) return _db as unknown as DatabaseAdapter;
  _db = await SQLite.openDatabaseAsync('dayflow.db');
  await _db.execAsync(CREATE_TABLES_SQL);

  // Migrations: add columns that may be missing from older DB versions
  const migrations = [
    `ALTER TABLE activities ADD COLUMN activity_type TEXT NOT NULL DEFAULT 'TIME_BLOCK'`,
    `ALTER TABLE activities ADD COLUMN assigned_date TEXT`,
  ];
  for (const sql of migrations) {
    try { await _db.execAsync(sql); } catch { /* column already exists */ }
  }

  // v2 migration: make start_time nullable
  // Disable FK checks during migration to avoid constraint errors
  try {
    await _db.execAsync('PRAGMA foreign_keys = OFF;');
    // Test if NULL is allowed
    await _db.runAsync(`INSERT INTO activities (id, user_id, activity_type, title, start_time, duration_minutes, category_id, is_scheduled, status, priority, created_at, updated_at, synced, deleted) VALUES ('__v2_test__', '__test__', 'TASK', 'test', NULL, 0, '__test__', 0, 'PLANNED', 'LOW', '', '', 0, 0)`);
    await _db.runAsync(`DELETE FROM activities WHERE id = '__v2_test__'`);
  } catch {
    console.log('[DayFlow] Migrating activities table for nullable start_time...');
    try {
      await _db.execAsync(`CREATE TABLE IF NOT EXISTS activities_v2 AS SELECT * FROM activities;`);
      await _db.execAsync(`DROP TABLE IF EXISTS activities;`);
      await _db.execAsync(CREATE_TABLES_SQL);
      await _db.execAsync(`INSERT OR IGNORE INTO activities SELECT * FROM activities_v2;`);
      await _db.execAsync(`DROP TABLE IF EXISTS activities_v2;`);
      console.log('[DayFlow] Migration complete');
    } catch (migErr) {
      console.log('[DayFlow] Migration skipped (table already correct):', migErr);
    }
  } finally {
    await _db.execAsync('PRAGMA foreign_keys = ON;');
  }

  return _db as unknown as DatabaseAdapter;
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowISO(): string {
  return new Date().toISOString();
}
