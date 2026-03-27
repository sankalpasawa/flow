import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, DEFAULT_SETTINGS } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = await fetchOrCreateUser(session.user.id, session.user.email ?? '');
        set({ user: appUser, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false, error: null });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const appUser = await fetchOrCreateUser(session.user.id, session.user.email ?? '');
        set({ user: appUser });
      } else {
        set({ user: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: mapAuthError(msg), loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: mapAuthError(msg), loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));

async function fetchOrCreateUser(id: string, email: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    // Create on first sign in
    const newUser = {
      id, email,
      subscription_tier: 'FREE' as const,
      settings: DEFAULT_SETTINGS,
    };
    await supabase.from('users').upsert(newUser);
    return newUser;
  }
  return data as User;
}

function mapAuthError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already in use')) {
    return 'Email already in use. Try signing in instead.';
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('ISO-8859') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Unable to connect to server. Please try again.';
  }
  return msg;
}
