/**
 * @jest-environment jsdom
 */
import { useAuthStore } from '../../store/authStore';
import { DEV_USER, DEMO_USER, SUPABASE_USER } from '../fixtures/users';

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: jest.fn().mockResolvedValue({}),
    }),
  },
}));

// sync is a no-op in auth tests
jest.mock('../../lib/sync', () => ({
  performFullSync: jest.fn().mockResolvedValue(undefined),
  isDevUser: (id: string) => id === DEV_USER.id || id === DEMO_USER.id,
}));

// seed functions are no-ops in auth tests
jest.mock('../../lib/db/seedDemo', () => ({
  seedDemoData: jest.fn().mockResolvedValue(undefined),
  DEMO_USER_ID: 'demo-user-001',
}));

jest.mock('../../lib/db/seed', () => ({
  DEV_USER_ID: 'dev-user-001',
}));

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, loading: true, error: null });
    // Prevent AUTO_LOGIN from triggering in tests (DEV_MODE=true locally)
    localStorage.setItem('dayflow_signed_out', 'true');
    localStorage.removeItem('dayflow_active_user');
  });

  test('initial state is loading with no user', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('clearError resets error to null', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  test('initialize sets loading to false when no session', async () => {
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().loading).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('signIn sets error on failure', async () => {
    const { supabase } = require('../../lib/supabase');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: new Error('Invalid login credentials'),
    });
    await useAuthStore.getState().signIn('test@test.com', 'wrong');
    expect(useAuthStore.getState().error).toBe('Invalid email or password.');
  });

  test('signUp sets error on short password', async () => {
    const { supabase } = require('../../lib/supabase');
    supabase.auth.signUp.mockResolvedValueOnce({
      error: new Error('Password should be at least 6 characters'),
    });
    await useAuthStore.getState().signUp('test@test.com', '123');
    expect(useAuthStore.getState().error).toBe('Password must be at least 6 characters.');
  });

  // ─── Local account paths (work in every environment) ───────────────────────

  test('signIn as sankalp sets dev user without calling Supabase', async () => {
    const { supabase } = require('../../lib/supabase');
    await useAuthStore.getState().signIn(DEV_USER.email, 'any-password');
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe(DEV_USER.id);
  });

  test('signIn as demo with correct password sets demo user without calling Supabase', async () => {
    const { supabase } = require('../../lib/supabase');
    await useAuthStore.getState().signIn(DEMO_USER.email, 'demo1234');
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe(DEMO_USER.id);
  });

  test('signIn as demo with wrong password falls through to Supabase', async () => {
    const { supabase } = require('../../lib/supabase');
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: new Error('Invalid login credentials'),
    });
    await useAuthStore.getState().signIn(DEMO_USER.email, 'wrong');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
  });

  test('signOut for dev user clears state and sets signed_out flag without calling Supabase', async () => {
    const { supabase } = require('../../lib/supabase');
    useAuthStore.setState({ user: { id: DEV_USER.id, email: DEV_USER.email, settings: {} as never } });
    await useAuthStore.getState().signOut();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('dayflow_signed_out')).toBe('true');
  });

  test('signUp with reserved local email returns error without calling Supabase', async () => {
    const { supabase } = require('../../lib/supabase');
    await useAuthStore.getState().signUp(DEV_USER.email, 'password123');
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
    expect(useAuthStore.getState().error).toBeTruthy();
  });

  test('initialize restores saved local user from localStorage without Supabase', async () => {
    localStorage.removeItem('dayflow_signed_out');
    localStorage.setItem('dayflow_active_user', DEMO_USER.id);
    await useAuthStore.getState().initialize();
    const { supabase } = require('../../lib/supabase');
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe(DEMO_USER.id);
  });
});
