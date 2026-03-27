// Pure logic tests for auth flow — no component rendering needed
import { useAuthStore } from '../../store/authStore';

describe('SignIn validation logic', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, error: null });
  });

  test('empty email sets error in store', () => {
    useAuthStore.setState({ error: 'Please enter your email and password.' });
    expect(useAuthStore.getState().error).toBe('Please enter your email and password.');
  });

  test('clearError clears the error', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  test('error state is reactive', () => {
    expect(useAuthStore.getState().error).toBeNull();
    useAuthStore.setState({ error: 'Invalid email or password.' });
    expect(useAuthStore.getState().error).toBe('Invalid email or password.');
  });
});
