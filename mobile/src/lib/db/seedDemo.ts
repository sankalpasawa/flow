// Demo seed data — mirrors the Sankalp dev account data, scoped to demo-user-001.
// Account: demo@dayflow.app / demo1234
// Data is sourced from seed.ts (single source of truth); bump SEED_VERSION to force re-seed.

import { generateId, nowISO } from './db';
import { SYSTEM_CATEGORIES } from '../../features/categories/systemCategories';
import { buildActivities, buildGoals, CUSTOM_CATEGORIES } from './seed';

export const DEMO_USER_ID = 'demo-user-001';
const SEED_VERSION = '4';

export async function seedDemoData(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem('dayflow_demo_seed_version') === SEED_VERSION) return;

  const { activities, logs } = buildActivities();
  const goals = buildGoals(DEMO_USER_ID);
  const seedNow = nowISO();

  const categoryRows = [
    ...SYSTEM_CATEGORIES.map(c => ({
      id: c.id, user_id: c.user_id, name: c.name, color: c.color,
      icon: c.icon, is_system: 1, sort_order: c.sort_order, synced: 1,
    })),
    ...CUSTOM_CATEGORIES.map(c => ({
      id: c.id, user_id: DEMO_USER_ID, name: c.name, color: c.color,
      icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
    })),
  ];

  const activityRows = activities.map(a => ({
    ...a,
    user_id: DEMO_USER_ID,
    is_scheduled: a.is_scheduled ? 1 : 0,
    mindset_overridden: 0,
    created_at: seedNow,
    updated_at: seedNow,
    synced: 0,
    deleted: 0,
  }));

  const logRows = logs.map(l => ({
    id: generateId(),
    activity_id: l.activity_id,
    user_id: DEMO_USER_ID,
    mood: l.mood,
    energy: l.energy,
    completion_pct: l.completion_pct,
    reflection: l.reflection,
    would_repeat: l.would_repeat,
    log_phase: l.log_phase,
    logged_at: l.logged_at,
    synced: 0,
    deleted: 0,
  }));

  // Merge with existing DB (may already have Sankalp's data)
  const existing = localStorage.getItem('dayflow_db');
  const db = existing ? JSON.parse(existing) : { categories: [], activities: [], experience_logs: [], goals: [] };

  // Remove old demo data, keep Sankalp's
  const filteredActs = (db.activities || []).filter((a: { user_id: string }) => a.user_id !== DEMO_USER_ID);
  const filteredCats = (db.categories || []).filter((c: { user_id: string; is_system: number }) => c.user_id !== DEMO_USER_ID || c.is_system);
  const filteredGoals = (db.goals || []).filter((g: { user_id: string }) => g.user_id !== DEMO_USER_ID);
  const filteredLogs = (db.experience_logs || []).filter((l: { user_id: string }) => l.user_id !== DEMO_USER_ID);

  db.categories = [...filteredCats, ...CUSTOM_CATEGORIES.map(c => ({
    id: c.id, user_id: DEMO_USER_ID, name: c.name, color: c.color,
    icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
  }))];
  // Ensure system categories exist
  for (const sc of categoryRows.filter(c => c.is_system)) {
    if (!db.categories.find((c: { id: string }) => c.id === sc.id)) {
      db.categories.push(sc);
    }
  }
  db.activities = [...filteredActs, ...activityRows];
  db.experience_logs = [...filteredLogs, ...logRows];
  db.goals = [...filteredGoals, ...goals];

  localStorage.setItem('dayflow_db', JSON.stringify(db));
  localStorage.setItem('dayflow_demo_seed_version', SEED_VERSION);
  localStorage.setItem('dayflow_onboarded', 'true');

  console.log(`[DayFlow] Demo seeded: ${activityRows.length} activities, ${logRows.length} logs, ${goals.length} goals for demo@dayflow.app`);
}
