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

  // v2 migration: make start_time nullable (SQLite can't ALTER column constraints,
  // so we recreate the table if start_time is still NOT NULL)
  try {
    await _db.runAsync(`INSERT INTO activities (id, user_id, activity_type, title, start_time, duration_minutes, category_id, is_scheduled, status, priority, created_at, updated_at, synced, deleted) VALUES ('__v2_test__', '__test__', 'TASK', 'test', NULL, 0, 'sys-personal', 0, 'PLANNED', 'LOW', '', '', 0, 0)`);
    await _db.runAsync(`DELETE FROM activities WHERE id = '__v2_test__'`);
  } catch {
    // NOT NULL constraint still in place — need to recreate table
    console.log('[DayFlow] Migrating activities table for nullable start_time...');
    await _db.execAsync(`
      CREATE TABLE IF NOT EXISTS activities_v2 AS SELECT * FROM activities;
      DROP TABLE activities;
    `);
    await _db.execAsync(CREATE_TABLES_SQL);
    await _db.execAsync(`
      INSERT INTO activities SELECT * FROM activities_v2;
      DROP TABLE activities_v2;
    `);
    console.log('[DayFlow] Migration complete');
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
