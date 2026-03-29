import { create } from 'zustand';
import { startOfWeek, format } from 'date-fns';
import { Goal } from '../types';
import {
  getActiveGoals, createGoal, updateGoal, deleteGoal,
  getGoalProgress as dbGetGoalProgress,
  CreateGoalInput, UpdateGoalInput, GoalProgress,
} from '../lib/db/goals';

interface GoalsState {
  goals: Goal[];
  goalsLoading: boolean;
  loadGoals: (userId: string) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<Goal>;
  updateGoal: (id: string, updates: UpdateGoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalProgress: (goalId: string, userId: string) => Promise<GoalProgress>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  goalsLoading: false,

  loadGoals: async (userId) => {
    set({ goalsLoading: true });
    try {
      const goals = await getActiveGoals(userId);
      set({ goals, goalsLoading: false });
    } catch (err) {
      console.error('[DayFlow] Failed to load goals:', err);
      set({ goalsLoading: false });
    }
  },

  createGoal: async (input) => {
    try {
      const goal = await createGoal(input);
      set((s) => ({ goals: [goal, ...s.goals] }));
      return goal;
    } catch (err) {
      console.error('[DayFlow] Failed to create goal:', err);
      throw new Error('Could not create goal. Please try again.');
    }
  },

  updateGoal: async (id, updates) => {
    try {
      await updateGoal(id, updates);
      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
        ),
      }));
    } catch (err) {
      console.error('[DayFlow] Failed to update goal:', err);
      throw new Error('Could not update goal. Please try again.');
    }
  },

  deleteGoal: async (id) => {
    try {
      await deleteGoal(id);
      set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    } catch (err) {
      console.error('[DayFlow] Failed to delete goal:', err);
      throw new Error('Could not delete goal. Please try again.');
    }
  },

  getGoalProgress: async (goalId, userId) => {
    try {
      const goal = get().goals.find((g) => g.id === goalId);
      if (!goal) return { current_value: 0, target_value: 0 };

      const today = new Date();
      let periodStart: string;
      let periodEnd: string;

      if (goal.frequency === 'DAILY') {
        const dayStr = format(today, 'yyyy-MM-dd');
        periodStart = `${dayStr}T00:00:00.000Z`;
        periodEnd = `${dayStr}T23:59:59.999Z`;
      } else {
        // WEEKLY — Monday to Sunday
        const monday = startOfWeek(today, { weekStartsOn: 1 });
        const sundayEnd = new Date(monday);
        sundayEnd.setDate(sundayEnd.getDate() + 6);
        periodStart = `${format(monday, 'yyyy-MM-dd')}T00:00:00.000Z`;
        periodEnd = `${format(sundayEnd, 'yyyy-MM-dd')}T23:59:59.999Z`;
      }

      return await dbGetGoalProgress(userId, goalId, periodStart, periodEnd);
    } catch (err) {
      console.error('[DayFlow] Failed to get goal progress:', err);
      return { current_value: 0, target_value: 0 };
    }
  },
}));
