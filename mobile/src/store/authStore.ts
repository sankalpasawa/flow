import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, DEFAULT_SETTINGS } from '../types';
import { DEV_USER_ID } from '../lib/db/seed';
import { DEMO_USER_ID, seedDemoData } from '../lib/db/seedDemo';
import { performFullSync, isDevUser } from '../lib/sync';

/**
 * Auto-login convenience flag — true locally so Sankalp doesn't need to
 * manually sign in every time. Set EXPO_PUBLIC_DEV_MODE=false in production.
 *
 * NOTE: This flag does NOT gate the seed/demo accounts. Those accounts
 * (sankalp@dayflow.app, demo@dayflow.app) are always available via signIn()
 * in every environment — they load local seed data and skip Supabase sync.
 * Any other email uses real Supabase auth and syncs to the cloud.
 */
const AUTO_LOGIN =
  process.env.EXPO_PUBLIC_DEV_MODE === 'true' ||
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

const DEV_USER: User = {
  id: DEV_USER_ID,
  email: 'sankalp@dayflow.app',
  settings: DEFAULT_SETTINGS,
};

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@dayflow.app',
  settings: DEFAULT_SETTINGS,
};

// Local accounts that bypass Supabase auth and skip sync.
const LOCAL_EMAILS = new Set(['sankalp@dayflow.app', 'demo@dayflow.app']);

function isLocalAccount(email: string): boolean {
  return LOCAL_EMAILS.has(email.trim().toLowerCase());
}

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
    // ── Step 1: Auto-login as Sankalp when DEV_MODE=true (local convenience) ──
    if (AUTO_LOGIN) {
      const signedOut =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('dayflow_signed_out');
      if (!signedOut) {
        const savedUserId =
          typeof localStorage !== 'undefined' &&
          localStorage.getItem('dayflow_active_user');
        const activeUser = savedUserId === DEMO_USER_ID ? DEMO_USER : DEV_USER;
        console.log('[DayFlow] Auto-login as', activeUser.email);
        set({ user: activeUser, loading: false });
        return;
      }
    }

    // ── Step 2: Restore a previously saved local account session ──────────────
    // Handles the case where a user manually signed in as sankalp/demo even
    // when AUTO_LOGIN is off (e.g. a developer testing locally with DEV_MODE=false).
    if (typeof localStorage !== 'undefined') {
      const signedOut = localStorage.getItem('dayflow_signed_out');
      const savedUserId = localStorage.getItem('dayflow_active_user');
      if (!signedOut && savedUserId && isDevUser(savedUserId)) {
        const activeUser = savedUserId === DEMO_USER_ID ? DEMO_USER : DEV_USER;
        set({ user: activeUser, loading: false });
        return;
      }
    }

    // ── Step 3: Real Supabase session (all other users, including prod) ────────
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const appUser = await fetchOrCreateUser(
          session.user.id,
          session.user.email ?? ''
        );
        set({ user: appUser, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (err) {
      console.error('[DayFlow] Auth initialization failed:', err);
      set({ user: null, loading: false });
    }

    // Keep state in sync with Supabase token refresh / sign-out events
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const appUser = await fetchOrCreateUser(
            session.user.id,
            session.user.email ?? ''
          );
          set({ user: appUser });
        } else if (!isDevUser(get().user?.id ?? '')) {
          // Only clear state for real Supabase users; local accounts are unaffected
          set({ user: null });
        }
      } catch (err) {
        console.error('[DayFlow] Auth state change error:', err);
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    // ── Local seed account (sankalp) ───────────────────────────────────────────
    // Available in every environment. Loads seed.ts data, skips Supabase sync.
    if (email.trim().toLowerCase() === 'sankalp@dayflow.app') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dayflow_signed_out');
        localStorage.removeItem('dayflow_active_user');
      }
      set({ user: DEV_USER, loading: false });
      return;
    }

    // ── Demo account ───────────────────────────────────────────────────────────
    // Available in every environment. Loads demo seed data, skips Supabase sync.
    if (
      email.trim().toLowerCase() === 'demo@dayflow.app' &&
      password === 'demo1234'
    ) {
      try {
        await seedDemoData();
      } catch (e) {
        console.warn('[DayFlow] Demo seed failed (non-fatal):', e);
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dayflow_signed_out');
        localStorage.setItem('dayflow_active_user', DEMO_USER_ID);
      }
      set({ user: DEMO_USER, loading: false });
      return;
    }

    // ── Real Supabase auth ─────────────────────────────────────────────────────
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // fetchOrCreateUser (called via onAuthStateChange) handles sync
    } catch (err: unknown) {
      console.error('[DayFlow] Sign in failed:', err);
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      set({ error: mapAuthError(msg), loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    if (isLocalAccount(email)) {
      set({ error: 'That email is reserved for local development.', loading: false });
      return;
    }
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
      const currentUser = get().user;
      // Local accounts use localStorage flags; no Supabase session to clear
      if (currentUser && isDevUser(currentUser.id)) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('dayflow_signed_out', 'true');
          localStorage.removeItem('dayflow_active_user');
        }
        set({ user: null });
        return;
      }
      // Real Supabase users
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

  let appUser: User;
  if (error || !data) {
    appUser = { id, email, settings: DEFAULT_SETTINGS };
    await supabase.from('users').upsert(appUser);
  } else {
    appUser = data as User;
  }

  // Kick off a full sync in the background (no-op for dev/demo users)
  performFullSync(id).catch((err) =>
    console.warn('[DayFlow] Background sync failed (non-fatal):', err)
  );

  return appUser;
}

function mapAuthError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already in use'))
    return 'Email already in use. Try signing in instead.';
  if (msg.includes('Invalid login credentials'))
    return 'Invalid email or password.';
  if (msg.includes('Password should be at least'))
    return 'Password must be at least 6 characters.';
  if (
    msg.includes('ISO-8859') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError')
  )
    return 'Unable to connect to server. Please try again.';
  return msg;
}
