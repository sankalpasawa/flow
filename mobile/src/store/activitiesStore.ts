import { create } from 'zustand';
import { format } from 'date-fns';
import { Activity, ExperienceLog } from '../types';
import {
  getActivitiesForDay, createActivity, updateActivity, deleteActivity,
  CreateActivityInput, UpdateActivityInput,
} from '../lib/db/activities';
import { getLogForActivity, createLog, CreateLogInput } from '../lib/db/logs';
import { scheduleLogNudge, cancelLogNudge } from '../lib/notifications';
import { generateMindsetPrompt, categorizeActivity } from '../lib/ai';
import { SYSTEM_CATEGORIES } from '../features/categories/systemCategories';

interface ActivitiesState {
  activities: Activity[];
  logs: Record<string, ExperienceLog>; // activityId -> log
  selectedDate: Date;
  loading: boolean;
  error: string | null;
  loadDay: (userId: string, date: Date) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  addActivity: (input: CreateActivityInput) => Promise<Activity>;
  editActivity: (id: string, updates: UpdateActivityInput) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  setActivityStatus: (id: string, status: Activity['status']) => Promise<void>;
  submitLog: (input: CreateLogInput) => Promise<ExperienceLog>;
  getLogForActivity: (activityId: string) => ExperienceLog | undefined;
  clearError: () => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  logs: {},
  selectedDate: new Date(),
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadDay: async (userId, date) => {
    set({ loading: true, error: null });
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const acts = await getActivitiesForDay(userId, dateStr);
      const logsMap: Record<string, ExperienceLog> = {};
      await Promise.all(acts.map(async (a) => {
        try {
          const log = await getLogForActivity(a.id);
          if (log) logsMap[a.id] = log;
        } catch (err) {
          console.error(`[DayFlow] Failed to load log for activity ${a.id}:`, err);
        }
      }));
      set({ activities: acts, logs: logsMap, loading: false });
    } catch (err) {
      console.error('[DayFlow] Failed to load activities:', err);
      set({ error: 'Could not load your activities. Pull down to retry.', loading: false });
    }
  },

  addActivity: async (input) => {
    try {
      const activity = await createActivity(input);
      set((s) => ({ activities: [...s.activities, activity] }));

      scheduleLogNudge(activity).catch((err) =>
        console.warn('[DayFlow] Failed to schedule nudge:', err)
      );

      // Async AI: categorize then generate mindset prompt (never block)
      (async () => {
        try {
          const category = SYSTEM_CATEGORIES.find((c) => c.id === input.category_id);
          const prompt = await generateMindsetPrompt(
            input.title,
            category?.name ?? '',
            input.user_id
          );
          if (prompt) {
            await updateActivity(activity.id, { mindset_prompt: prompt });
            set((s) => ({
              activities: s.activities.map((a) =>
                a.id === activity.id ? { ...a, mindset_prompt: prompt } : a
              ),
            }));
          }
        } catch (err) {
          console.warn('[DayFlow] AI mindset prompt unavailable:', err);
        }
      })();

      return activity;
    } catch (err) {
      console.error('[DayFlow] Failed to create activity:', err);
      throw new Error('Could not create activity. Please try again.');
    }
  },

  editActivity: async (id, updates) => {
    try {
      await updateActivity(id, updates);
      const updated = await import('../lib/db/activities').then(m => m.getActivity(id));
      if (updated) {
        set((s) => ({
          activities: s.activities.map((a) => (a.id === id ? updated : a)),
        }));
        if (updates.start_time || updates.duration_minutes) {
          scheduleLogNudge(updated).catch((err) =>
            console.warn('[DayFlow] Failed to reschedule nudge:', err)
          );
        }
      }
    } catch (err) {
      console.error('[DayFlow] Failed to edit activity:', err);
      throw new Error('Could not save changes. Please try again.');
    }
  },

  removeActivity: async (id) => {
    try {
      await deleteActivity(id);
      cancelLogNudge(id).catch((err) =>
        console.warn('[DayFlow] Failed to cancel nudge:', err)
      );
      set((s) => ({
        activities: s.activities.filter((a) => a.id !== id),
      }));
    } catch (err) {
      console.error('[DayFlow] Failed to delete activity:', err);
      throw new Error('Could not delete activity. Please try again.');
    }
  },

  setActivityStatus: async (id, status) => {
    try {
      const now = new Date().toISOString();
      const updates: UpdateActivityInput = { status };
      if (status === 'IN_PROGRESS') updates.actual_start = now;
      if (status === 'COMPLETED' || status === 'SKIPPED') updates.actual_end = now;
      await updateActivity(id, updates);
      set((s) => ({
        activities: s.activities.map((a) =>
          a.id === id ? { ...a, status, ...updates } : a
        ),
      }));
    } catch (err) {
      console.error('[DayFlow] Failed to update activity status:', err);
      throw new Error('Could not update status. Please try again.');
    }
  },

  submitLog: async (input) => {
    try {
      const log = await createLog(input);
      set((s) => ({ logs: { ...s.logs, [input.activity_id]: log } }));
      return log;
    } catch (err) {
      console.error('[DayFlow] Failed to submit log:', err);
      throw new Error('Could not save your log. Please try again.');
    }
  },

  getLogForActivity: (activityId) => get().logs[activityId],
}));
