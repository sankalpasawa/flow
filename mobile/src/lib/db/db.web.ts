// Web shim for SQLite — uses in-memory Map storage for preview purposes

const storage = new Map<string, any[]>();

class WebSQLiteDatabase {
  async execAsync(_sql: string): Promise<void> {
    // no-op for web preview
  }

  async getAllAsync<T>(sql: string, ..._params: any[]): Promise<T[]> {
    return [];
  }

  async getFirstAsync<T>(sql: string, ..._params: any[]): Promise<T | null> {
    return null;
  }

  async runAsync(sql: string, ..._params: any[]): Promise<{ lastInsertRowId: number; changes: number }> {
    return { lastInsertRowId: 0, changes: 0 };
  }
}

let _db: WebSQLiteDatabase | null = null;

export async function getDb(): Promise<any> {
  if (_db) return _db;
  _db = new WebSQLiteDatabase();
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
