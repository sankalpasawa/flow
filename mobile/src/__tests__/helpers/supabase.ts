/**
 * Supabase mock factory for tests.
 *
 * Replaces the scattered inline jest.fn() blocks in every test file with a
 * single import. Each helper returns the mock object AND wires it into the
 * module mock so the store/sync code picks it up.
 *
 * Usage:
 *   import { mockSupabaseEmpty, mockSupabaseUser, captureUpserts } from '../helpers/supabase';
 *
 *   // No session (default for most unit tests)
 *   const mocks = mockSupabaseEmpty();
 *
 *   // Active Supabase session
 *   const mocks = mockSupabaseUser(SUPABASE_USER);
 *
 *   // Seed remote rows for pull tests
 *   mockSupabaseTable('activities', [makeActivity({ user_id: SUPABASE_USER.id })]);
 *
 *   // Assert what was pushed
 *   const spy = captureUpserts('activities');
 *   await pushChanges(SUPABASE_USER.id);
 *   expect(spy.calls()).toHaveLength(1);
 */

import type { TestUser } from '../fixtures/users';

type Row = Record<string, unknown>;

// ─── Internal mock state ──────────────────────────────────────────────────────

const _tables: Record<string, Row[]> = {};
const _upsertCalls: Record<string, Row[][]> = {};

let _session: { user: { id: string; email: string } } | null = null;

// ─── Mock implementations ─────────────────────────────────────────────────────

const mockAuth = {
  getSession: jest.fn(async () => ({
    data: { session: _session ? { user: _session.user } : null },
  })),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  signInWithPassword: jest.fn(async ({ email }: { email: string; password: string }) => {
    if (_session?.user.email === email) return { error: null };
    return { error: new Error('Invalid login credentials') };
  }),
  signUp: jest.fn(async () => ({ error: null })),
  signOut: jest.fn(async () => {
    _session = null;
    return {};
  }),
};

function buildFromMock(table: string) {
  if (!_upsertCalls[table]) _upsertCalls[table] = [];

  const chainable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockImplementation((col: string, val: unknown) => {
      // For .select('*').eq('user_id', userId) — return that user's rows
      const rows = (_tables[table] ?? []).filter(r => r[col] === val);
      return {
        ...chainable,
        single: jest.fn().mockResolvedValue(
          rows.length ? { data: rows[0], error: null } : { data: null, error: new Error('Not found') }
        ),
        // Resolved directly for array selects
        then: (resolve: (v: { data: Row[]; error: null }) => void) =>
          Promise.resolve({ data: rows, error: null }).then(resolve),
      };
    }),
    single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    upsert: jest.fn().mockImplementation((rows: Row | Row[]) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      _upsertCalls[table].push(arr);
      // Merge into in-memory table
      if (!_tables[table]) _tables[table] = [];
      for (const row of arr) {
        const idx = _tables[table].findIndex(r => r.id === row.id);
        if (idx >= 0) _tables[table][idx] = row;
        else _tables[table].push(row);
      }
      return Promise.resolve({ error: null });
    }),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
  };
  return chainable;
}

export const mockSupabaseClient = {
  auth: mockAuth,
  from: jest.fn((table: string) => buildFromMock(table)),
};

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Reset all mock state. Call in beforeEach. */
export function resetSupabaseMock() {
  _session = null;
  Object.keys(_tables).forEach(k => delete _tables[k]);
  Object.keys(_upsertCalls).forEach(k => delete _upsertCalls[k]);
  jest.clearAllMocks();
}

/** Configure mock with no active session and empty remote tables. */
export function mockSupabaseEmpty() {
  _session = null;
  return mockSupabaseClient;
}

/**
 * Configure mock with an active session for the given user.
 * Auth state change listeners are NOT fired automatically — call
 * mockAuth.onAuthStateChange.mock.calls to trigger manually if needed.
 */
export function mockSupabaseUser(user: TestUser) {
  _session = { user: { id: user.id, email: user.email } };
  return mockSupabaseClient;
}

/**
 * Seed remote rows for a table. These are returned by `.select().eq()` calls.
 * Rows are NOT automatically in localStorage — use seedLocalDb() for that.
 */
export function mockSupabaseTable(table: string, rows: Row[]) {
  _tables[table] = [...rows];
}

/**
 * Returns a spy that records every upsert payload sent to a given table.
 * Use after a push operation to assert what rows were synced.
 *
 * @example
 *   const spy = captureUpserts('activities');
 *   await pushChanges(SUPABASE_USER.id);
 *   expect(spy.calls()).toHaveLength(1);
 *   expect(spy.calls()[0][0].id).toBe('act-1');
 */
export function captureUpserts(table: string) {
  if (!_upsertCalls[table]) _upsertCalls[table] = [];
  return {
    /** All upsert call payloads (each call is an array of rows). */
    calls: () => _upsertCalls[table],
    /** Flat list of every row upserted, across all calls. */
    rows: () => _upsertCalls[table].flat(),
    /** Assert nothing was upserted. */
    expectEmpty: () => expect(_upsertCalls[table].flat()).toHaveLength(0),
  };
}
