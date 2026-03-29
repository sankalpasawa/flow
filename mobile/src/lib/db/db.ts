import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
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

  return _db;
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
