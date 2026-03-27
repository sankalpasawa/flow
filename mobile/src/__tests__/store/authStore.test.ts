import { useAuthStore } from '../../store/authStore';

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

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true, error: null });
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
});
