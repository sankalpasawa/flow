// Web database — in-memory with localStorage persistence
// Implements the same interface as expo-sqlite for web compatibility

type Row = Record<string, unknown>;

const STORAGE_KEY = 'dayflow_db';

// Tables stored as arrays of rows
let tables: Record<string, Row[]> = {};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) tables = JSON.parse(raw);
  } catch {
    tables = {};
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  } catch (err) {
    console.error('[DayFlow] Failed to persist DB to localStorage:', err);
  }
}

function ensureTable(name: string) {
  if (!tables[name]) tables[name] = [];
}

// Simple SQL parser for the queries used in this app
function parseInsert(sql: string, params: unknown[]): { table: string; row: Row } | null {
  const m = sql.match(/INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!m) return null;
  const table = m[1];
  const cols = m[2].split(',').map(c => c.trim());
  const row: Row = {};
  let paramIdx = 0;
  const valueParts = m[3].split(',').map(v => v.trim());
  for (let i = 0; i < cols.length; i++) {
    const v = valueParts[i];
    if (v === '?') {
      row[cols[i]] = params[paramIdx++];
    } else if (v === 'NULL') {
      row[cols[i]] = null;
    } else {
      // Literal string like 'PLANNED'
      row[cols[i]] = v.replace(/^'|'$/g, '');
    }
  }
  return { table, row };
}

function parseUpdate(sql: string, params: unknown[]): { table: string; sets: Row; whereCol: string; whereVal: unknown } | null {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(\w+)\s*=\s*\?/i);
  if (!m) return null;
  const table = m[1];
  const setParts = m[2].split(',').map(s => s.trim());
  const sets: Row = {};
  let paramIdx = 0;
  for (const part of setParts) {
    const [col, val] = part.split('=').map(s => s.trim());
    if (val === '?') {
      sets[col] = params[paramIdx++];
    } else {
      sets[col] = val.replace(/^'|'$/g, '');
    }
  }
  const whereCol = m[3];
  const whereVal = params[paramIdx];
  return { table, sets, whereCol, whereVal };
}

function matchesWhere(row: Row, sql: string, params: unknown[]): boolean {
  // Simple WHERE clause matching for the queries in this app
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s*$)/is);
  if (!whereMatch) return true;

  const clause = whereMatch[1];
  let paramIdx = 0;

  // Count params used before WHERE
  const beforeWhere = sql.substring(0, sql.indexOf('WHERE'));
  for (const ch of beforeWhere) if (ch === '?') paramIdx++;

  // Parse individual conditions
  const conditions = clause.split(/\s+AND\s+/i);
  for (const cond of conditions) {
    const trimmed = cond.trim();

    // date(col) = ? or date(col) < ?
    const dateMatch = trimmed.match(/date\((\w+\.)?(\w+)\)\s*(=|<|>|<=|>=)\s*\?/);
    if (dateMatch) {
      const col = dateMatch[2];
      const op = dateMatch[3];
      const val = params[paramIdx++] as string;
      const rowVal = (row[col] as string) ?? '';
      const rowDate = rowVal.substring(0, 10); // YYYY-MM-DD from ISO
      if (op === '=' && rowDate !== val) return false;
      if (op === '<' && rowDate >= val) return false;
      if (op === '>' && rowDate <= val) return false;
      if (op === '<=' && rowDate > val) return false;
      if (op === '>=' && rowDate < val) return false;
      continue;
    }

    // col.field = ? or col = ?
    const eqMatch = trimmed.match(/(\w+\.)?(\w+)\s*=\s*\?/);
    if (eqMatch) {
      const col = eqMatch[2];
      const val = params[paramIdx++];
      if (row[col] !== val && String(row[col]) !== String(val)) return false;
      continue;
    }

    // col IS NULL
    const nullMatch = trimmed.match(/(\w+\.)?(\w+)\s+IS\s+NULL/i);
    if (nullMatch) {
      const col = nullMatch[2];
      if (row[col] !== null && row[col] !== undefined) return false;
      continue;
    }
  }
  return true;
}

function parseSelect(sql: string, params: unknown[]): Row[] {
  // Extract table name (supports JOIN)
  const fromMatch = sql.match(/FROM\s+(\w+)\s+(\w+)?/i);
  if (!fromMatch) return [];
  const table = fromMatch[1];
  const alias = fromMatch[2] || table;
  ensureTable(table);

  let rows = [...tables[table]];

  // Handle LEFT JOIN
  const joinMatch = sql.match(/LEFT\s+JOIN\s+(\w+)\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  let joinTable: string | null = null;
  let joinAlias: string | null = null;
  if (joinMatch) {
    joinTable = joinMatch[1];
    joinAlias = joinMatch[2];
    const leftAlias = joinMatch[3];
    const leftCol = joinMatch[4];
    const rightAlias = joinMatch[5];
    const rightCol = joinMatch[6];
    ensureTable(joinTable);

    rows = rows.map(r => {
      const joinRow = tables[joinTable!].find(jr =>
        jr[rightCol] === r[leftCol] || r[rightCol] === jr[leftCol]
      );
      return { ...r, ...(joinRow ? prefixRow(joinRow, joinAlias!, r) : {}) };
    });
  }

  // Apply WHERE
  rows = rows.filter(r => matchesWhere(r, sql, params));

  // Handle ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+\.)?(\w+)\s+(ASC|DESC)?/i);
  if (orderMatch) {
    const col = orderMatch[2];
    const dir = (orderMatch[3] || 'ASC').toUpperCase();
    rows.sort((a, b) => {
      const aVal = String(a[col] ?? '');
      const bVal = String(b[col] ?? '');
      return dir === 'ASC' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  // Handle LIMIT
  const limitMatch = sql.match(/LIMIT\s+\?/i);
  if (limitMatch) {
    // Find the limit param (last param usually)
    const allParams = [...params];
    const limitVal = Number(allParams[allParams.length - 1]) || 50;
    rows = rows.slice(0, limitVal);
  }

  // Handle SELECT columns with aliases
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/is);
  if (selectMatch) {
    const selectPart = selectMatch[1].trim();
    if (selectPart !== '*' && !selectPart.startsWith('COUNT')) {
      const cols = selectPart.split(',').map(c => c.trim());
      rows = rows.map(r => {
        const newRow: Row = {};
        for (const col of cols) {
          // Handle "table.col as alias"
          const asMatch = col.match(/(\w+\.)?(\w+)\s+as\s+(\w+)/i);
          if (asMatch) {
            const srcCol = asMatch[2];
            const alias = asMatch[3];
            // Check prefixed join columns first
            if (joinAlias && r[`${joinAlias}_${srcCol}`] !== undefined) {
              newRow[alias] = r[`${joinAlias}_${srcCol}`];
            } else {
              newRow[alias] = r[srcCol];
            }
            continue;
          }
          // Handle "table.*"
          const starMatch = col.match(/(\w+)\.\*/);
          if (starMatch) {
            Object.assign(newRow, r);
            continue;
          }
          // Handle "table.col"
          const dotMatch = col.match(/(\w+)\.(\w+)/);
          if (dotMatch) {
            newRow[dotMatch[2]] = r[dotMatch[2]];
            continue;
          }
          // Plain column
          newRow[col] = r[col];
        }
        return newRow;
      });
    }
  }

  // Handle COUNT(*)
  if (sql.match(/SELECT\s+COUNT\(\*\)\s+as\s+(\w+)/i)) {
    const countAlias = sql.match(/COUNT\(\*\)\s+as\s+(\w+)/i)![1];
    return [{ [countAlias]: rows.length }];
  }

  return rows;
}

function prefixRow(row: Row, alias: string, baseRow: Row): Row {
  const result: Row = {};
  for (const [k, v] of Object.entries(row)) {
    result[`${alias}_${k}`] = v;
    // Only add unprefixed key if it doesn't collide with base table columns
    if (!(k in baseRow)) {
      result[k] = v;
    }
  }
  return result;
}

class WebSQLiteDatabase {
  constructor() {
    loadFromStorage();
  }

  async execAsync(_sql: string): Promise<void> {
    // Schema creation — tables are virtual, no need to execute DDL
  }

  async getAllAsync<T>(sql: string, ...rawParams: unknown[]): Promise<T[]> {
    const params = Array.isArray(rawParams[0]) ? rawParams[0] : rawParams;
    try {
      return parseSelect(sql, params) as T[];
    } catch (err) {
      console.error('[DayFlow] Web DB getAllAsync error:', err, sql);
      return [];
    }
  }

  async getFirstAsync<T>(sql: string, ...rawParams: unknown[]): Promise<T | null> {
    const params = Array.isArray(rawParams[0]) ? rawParams[0] : rawParams;
    try {
      const rows = parseSelect(sql, params);
      return (rows[0] as T) ?? null;
    } catch (err) {
      console.error('[DayFlow] Web DB getFirstAsync error:', err, sql);
      return null;
    }
  }

  async runAsync(sql: string, ...rawParams: unknown[]): Promise<{ lastInsertRowId: number; changes: number }> {
    const params = Array.isArray(rawParams[0]) ? rawParams[0] : rawParams;
    try {
      const upperSql = sql.trim().toUpperCase();

      if (upperSql.startsWith('INSERT')) {
        const isIgnore = upperSql.includes('OR IGNORE');
        const parsed = parseInsert(sql, params);
        if (parsed) {
          ensureTable(parsed.table);
          if (isIgnore) {
            const exists = tables[parsed.table].some(r => r.id === parsed.row.id);
            if (exists) return { lastInsertRowId: 0, changes: 0 };
          }
          tables[parsed.table].push(parsed.row);
          saveToStorage();
          return { lastInsertRowId: tables[parsed.table].length, changes: 1 };
        }
      }

      if (upperSql.startsWith('UPDATE')) {
        const parsed = parseUpdate(sql, params);
        if (parsed) {
          ensureTable(parsed.table);
          let changes = 0;
          tables[parsed.table] = tables[parsed.table].map(r => {
            if (r[parsed.whereCol] === parsed.whereVal || String(r[parsed.whereCol]) === String(parsed.whereVal)) {
              changes++;
              return { ...r, ...parsed.sets };
            }
            return r;
          });
          saveToStorage();
          return { lastInsertRowId: 0, changes };
        }
      }

      return { lastInsertRowId: 0, changes: 0 };
    } catch (err) {
      console.error('[DayFlow] Web DB runAsync error:', err, sql);
      return { lastInsertRowId: 0, changes: 0 };
    }
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
