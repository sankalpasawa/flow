import { create } from 'zustand';
import { format, addDays } from 'date-fns';
import { Activity, ExperienceLog } from '../types';
import {
  getActivitiesForDay, getOverdueActivities, getBacklogActivities,
  getUntimedTasksForDay, getOverdueTasks, getSomedayTasks,
  getInProgressActivities, getInProgressTasks,
  createActivity, createTask, updateActivity, deleteActivity,
  CreateActivityInput, CreateTaskInput, UpdateActivityInput,
} from '../lib/db/activities';
import { getLogForActivity, createLog, CreateLogInput } from '../lib/db/logs';
import { scheduleLogNudge, cancelLogNudge } from '../lib/notifications';
import { generateMindsetPrompt, categorizeActivity } from '../lib/ai';
import { SYSTEM_CATEGORIES } from '../features/categories/systemCategories';

interface ActivitiesState {
  activities: Activity[];
  untimedTasks: Activity[];
  backlog: Activity[];
  logs: Record<string, ExperienceLog>; // activityId -> log
  selectedDate: Date;
  loading: boolean;
  error: string | null;
  // Plan tab state
  planActivities: Activity[];
  planTasks: Activity[];
  carryForward: Activity[];
  somedayTasks: Activity[];
  planLoading: boolean;
  loadDay: (userId: string, date: Date) => Promise<void>;
  loadBacklog: (userId: string) => Promise<void>;
  loadPlan: (userId: string) => Promise<void>;
  moveToDate: (id: string, dateStr: string) => Promise<void>;
  moveToSomeday: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  addActivity: (input: CreateActivityInput) => Promise<Activity>;
  addTask: (input: CreateTaskInput) => Promise<Activity>;
  editActivity: (id: string, updates: UpdateActivityInput) => Promise<void>;
  removeActivity: (id: string) => Promise<void>;
  setActivityStatus: (id: string, status: Activity['status']) => Promise<void>;
  quickToggleComplete: (id: string) => Promise<void>;
  submitLog: (input: CreateLogInput) => Promise<ExperienceLog>;
  getLogForActivity: (activityId: string) => ExperienceLog | undefined;
  clearError: () => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  untimedTasks: [],
  backlog: [],
  logs: {},
  selectedDate: new Date(),
  loading: false,
  error: null,
  // Plan tab state
  planActivities: [],
  planTasks: [],
  carryForward: [],
  somedayTasks: [],
  planLoading: false,

  clearError: () => set({ error: null }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  loadPlan: async (userId) => {
    set({ planLoading: true });
    try {
      const tomorrow = addDays(new Date(), 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      const [tomorrowActs, tomorrowTasks, plannedActs, inProgressActs, plannedTsks, inProgressTsks, someday] = await Promise.all([
        getActivitiesForDay(userId, tomorrowStr),
        getUntimedTasksForDay(userId, tomorrowStr),
        getOverdueActivities(userId, tomorrowStr),
        getInProgressActivities(userId, tomorrowStr),
        getOverdueTasks(userId, tomorrowStr),
        getInProgressTasks(userId, tomorrowStr),
        getSomedayTasks(userId),
      ]);
      set({
        planActivities: tomorrowActs,
        planTasks: tomorrowTasks,
        carryForward: [...plannedActs, ...inProgressActs, ...plannedTsks, ...inProgressTsks],
        somedayTasks: someday,
        planLoading: false,
      });
    } catch (err) {
      console.error('[DayFlow] Failed to load plan:', err);
      set({ planLoading: false });
    }
  },

  moveToDate: async (id, dateStr) => {
    try {
      // Find the activity across all plan lists
      const allPlan = [...get().carryForward, ...get().somedayTasks, ...get().backlog];
      const activity = allPlan.find(a => a.id === id);
      if (!activity) return;

      if (activity.activity_type === 'TASK') {
        await updateActivity(id, { assigned_date: dateStr });
      } else {
        // For time blocks, update start_time date portion keeping the same hour
        const oldStart = new Date(activity.start_time);
        const [year, month, day] = dateStr.split('-').map(Number);
        const newStart = new Date(year, month - 1, day, oldStart.getHours(), oldStart.getMinutes());
        await updateActivity(id, { start_time: newStart.toISOString() });
      }
      // Build the updated activity with correct fields for both tasks and time blocks
      const updated = activity.activity_type === 'TASK'
        ? { ...activity, assigned_date: dateStr }
        : { ...activity, assigned_date: dateStr, start_time: new Date(
            Number(dateStr.split('-')[0]), Number(dateStr.split('-')[1]) - 1, Number(dateStr.split('-')[2]),
            new Date(activity.start_time).getHours(), new Date(activity.start_time).getMinutes()
          ).toISOString() };
      // Remove from carry-forward / someday and add to plan
      set(s => {
        const newPlanActivities = activity.is_scheduled
          ? [...s.planActivities, updated].sort((a, b) => a.start_time.localeCompare(b.start_time))
          : s.planActivities;
        return {
          carryForward: s.carryForward.filter(a => a.id !== id),
          somedayTasks: s.somedayTasks.filter(a => a.id !== id),
          planActivities: newPlanActivities,
          planTasks: !activity.is_scheduled
            ? [...s.planTasks, updated]
            : s.planTasks,
        };
      });
    } catch (err) {
      console.error('[DayFlow] Failed to move activity:', err);
    }
  },

  moveToSomeday: async (id) => {
    try {
      await updateActivity(id, { assigned_date: null, is_scheduled: false });
      const activity = get().carryForward.find(a => a.id === id)
        || get().planTasks.find(a => a.id === id)
        || get().planActivities.find(a => a.id === id);
      set(s => ({
        carryForward: s.carryForward.filter(a => a.id !== id),
        planActivities: s.planActivities.filter(a => a.id !== id),
        planTasks: s.planTasks.filter(a => a.id !== id),
        somedayTasks: activity ? [{ ...activity, assigned_date: null, is_scheduled: false }, ...s.somedayTasks] : s.somedayTasks,
      }));
    } catch (err) {
      console.error('[DayFlow] Failed to move to someday:', err);
    }
  },

  loadBacklog: async (userId) => {
    try {
      const items = await getBacklogActivities(userId);
      set({ backlog: items });
    } catch (err) {
      console.error('[DayFlow] Failed to load backlog:', err);
    }
  },

  addTask: async (input) => {
    try {
      const task = await createTask(input);
      set((s) => ({ untimedTasks: [...s.untimedTasks, task] }));
      return task;
    } catch (err) {
      console.error('[DayFlow] Failed to create task:', err);
      throw new Error('Could not create task. Please try again.');
    }
  },

  loadDay: async (userId, date) => {
    set({ loading: true, error: null });
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const isToday = dateStr === todayStr;
      const [dayActs, overdueActs, dayTasks, overdueTsks] = await Promise.all([
        getActivitiesForDay(userId, dateStr),
        isToday ? getOverdueActivities(userId, dateStr) : Promise.resolve([]),
        getUntimedTasksForDay(userId, dateStr),
        isToday ? getOverdueTasks(userId, dateStr) : Promise.resolve([]),
      ]);
      // Merge: overdue first, then today's activities
      const acts = [...overdueActs, ...dayActs];
      const allTasks = [...overdueTsks, ...dayTasks];

      // Move timed tasks onto the hourly canvas instead of the overhead section
      const isTimedTask = (t: Activity): boolean => {
        if (t.is_scheduled) return true;
        if (t.duration_minutes > 0) {
          const h = new Date(t.start_time).getHours();
          const m = new Date(t.start_time).getMinutes();
          return h !== 0 || m !== 0;
        }
        return false;
      };
      const timedTasks = allTasks.filter(isTimedTask);
      const untimed = allTasks.filter(t => !isTimedTask(t));
      acts.push(...timedTasks);

      const logsMap: Record<string, ExperienceLog> = {};
      await Promise.all(acts.map(async (a) => {
        try {
          const log = await getLogForActivity(a.id);
          if (log) logsMap[a.id] = log;
        } catch (err) {
          console.error(`[DayFlow] Failed to load log for activity ${a.id}:`, err);
        }
      }));
      set({ activities: acts, untimedTasks: untimed, logs: logsMap, loading: false });
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

  quickToggleComplete: async (id) => {
    try {
      const activity = get().activities.find(a => a.id === id)
        || get().untimedTasks.find(a => a.id === id)
        || get().backlog.find(a => a.id === id)
        || get().planActivities.find(a => a.id === id)
        || get().planTasks.find(a => a.id === id)
        || get().carryForward.find(a => a.id === id);
      if (!activity) return;
      const newStatus = activity.status === 'COMPLETED' ? 'PLANNED' : 'COMPLETED';
      const now = new Date().toISOString();
      const updates: UpdateActivityInput = { status: newStatus };
      if (newStatus === 'COMPLETED') updates.actual_end = now;
      await updateActivity(id, updates);
      const updateList = (list: Activity[]) =>
        list.map(a => a.id === id ? { ...a, status: newStatus, ...updates } as Activity : a);
      set(s => ({
        activities: updateList(s.activities),
        untimedTasks: updateList(s.untimedTasks),
        backlog: updateList(s.backlog),
        planActivities: updateList(s.planActivities),
        planTasks: updateList(s.planTasks),
        carryForward: updateList(s.carryForward),
      }));
    } catch (err) {
      console.error('[DayFlow] Quick toggle failed:', err);
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
