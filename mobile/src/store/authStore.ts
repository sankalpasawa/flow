import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, DEFAULT_SETTINGS } from '../types';
import { DEV_USER_ID } from '../lib/db/seed';
import { DEMO_USER_ID, seedDemoData } from '../lib/db/seedDemo';

// Dev mode: bypass Supabase auth when using placeholder credentials or explicit flag
const IS_DEV = process.env.EXPO_PUBLIC_DEV_MODE === 'true' ||
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

const DEV_USER: User = {
  id: DEV_USER_ID,
  email: 'sankalp@dayflow.app',
  subscription_tier: 'PRO',
  settings: DEFAULT_SETTINGS,
};

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@dayflow.app',
  subscription_tier: 'PRO',
  settings: DEFAULT_SETTINGS,
};

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
    // In dev mode, skip Supabase auth entirely — unless user explicitly signed out
    if (IS_DEV) {
      const signedOut = typeof localStorage !== 'undefined' && localStorage.getItem('dayflow_signed_out');
      const savedUserId = typeof localStorage !== 'undefined' && localStorage.getItem('dayflow_active_user');
      if (!signedOut) {
        const activeUser = savedUserId === DEMO_USER_ID ? DEMO_USER : DEV_USER;
        console.log('[DayFlow] Dev mode — auto-login as', activeUser.email);
        set({ user: activeUser, loading: false });
        return;
      }
      set({ user: null, loading: false });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = await fetchOrCreateUser(session.user.id, session.user.email ?? '');
        set({ user: appUser, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (err) {
      console.error('[DayFlow] Auth initialization failed:', err);
      set({ user: null, loading: false, error: null });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const appUser = await fetchOrCreateUser(session.user.id, session.user.email ?? '');
          set({ user: appUser });
        } else {
          set({ user: null });
        }
      } catch (err) {
        console.error('[DayFlow] Auth state change error:', err);
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    // Demo account — bypass Supabase entirely
    if (email.trim().toLowerCase() === 'demo@dayflow.app' && password === 'demo1234') {
      await seedDemoData();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dayflow_signed_out');
        localStorage.setItem('dayflow_active_user', DEMO_USER_ID);
      }
      set({ user: DEMO_USER, loading: false });
      return;
    }
    // Dev sign-in as Sankalp (in case they signed out)
    if (IS_DEV && email.trim().toLowerCase() === 'sankalp@dayflow.app') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dayflow_signed_out');
        localStorage.removeItem('dayflow_active_user');
      }
      set({ user: DEV_USER, loading: false });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      console.error('[DayFlow] Sign in failed:', err);
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
      console.error('[DayFlow] Sign up failed:', err);
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      set({ error: mapAuthError(msg), loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      if (IS_DEV) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('dayflow_signed_out', 'true');
          localStorage.removeItem('dayflow_active_user');
        }
        set({ user: null });
        return;
      }
      await supabase.auth.signOut();
      set({ user: null });
    } catch (err) {
      console.error('[DayFlow] Sign out failed:', err);
      set({ user: null });
    }
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
