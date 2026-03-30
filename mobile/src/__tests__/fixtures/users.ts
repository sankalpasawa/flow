/**
 * Canonical test user fixtures.
 *
 * Every test that needs a user ID imports from here — no magic strings.
 *
 * ┌─────────────────┬────────────────┬──────────────────────────┬──────────────────────┬───────────────┐
 * │ Fixture         │ user_id        │ Data source              │ Storage              │ Supabase sync │
 * ├─────────────────┼────────────────┼──────────────────────────┼──────────────────────┼───────────────┤
 * │ DEV_USER        │ dev-user-001   │ seed.ts (git)            │ localStorage only    │ Never         │
 * │ DEMO_USER       │ demo-user-001  │ seedDemo.ts → seed.ts    │ localStorage only    │ Never         │
 * │ SUPABASE_USER   │ supa-test-001  │ Supabase (mocked)        │ localStorage + cloud │ Always        │
 * └─────────────────┴────────────────┴──────────────────────────┴──────────────────────┴───────────────┘
 *
 * Reset behaviour:
 *  DEV_USER      — bump SEED_VERSION in seed.ts + localStorage.clear()
 *  DEMO_USER     — bump SEED_VERSION in seedDemo.ts + localStorage.clear()
 *  SUPABASE_USER — clearLocalDb() in test teardown; remote rows in Supabase mock
 */

export interface TestUser {
  id: string;
  email: string;
  /** Where initial data comes from */
  dataSource: 'seed.ts' | 'seedDemo.ts' | 'supabase';
  /** Where data lives at runtime */
  storage: 'localStorage' | 'localStorage+supabase';
  /** Whether mutations are pushed to Supabase */
  syncsToSupabase: boolean;
}

export const DEV_USER: TestUser = {
  id: 'dev-user-001',
  email: 'sankalp@dayflow.app',
  dataSource: 'seed.ts',
  storage: 'localStorage',
  syncsToSupabase: false,
};

export const DEMO_USER: TestUser = {
  id: 'demo-user-001',
  email: 'demo@dayflow.app',
  dataSource: 'seedDemo.ts',
  storage: 'localStorage',
  syncsToSupabase: false,
};

export const SUPABASE_USER: TestUser = {
  id: 'supa-test-001',
  email: 'test@example.com',
  dataSource: 'supabase',
  storage: 'localStorage+supabase',
  syncsToSupabase: true,
};

/** All users in one array — useful for parameterised tests. */
export const ALL_USERS = [DEV_USER, DEMO_USER, SUPABASE_USER] as const;

/** Users that never touch Supabase. */
export const LOCAL_USERS = [DEV_USER, DEMO_USER] as const;
