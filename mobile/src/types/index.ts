export type ActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type ActivityPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecurrenceType =
  | 'NONE' | 'DAILY' | 'WEEKDAYS' | 'WEEKLY'
  | 'BIWEEKLY' | 'TRIWEEKLY' | 'MONTHLY'
  | 'BIMONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'YEARLY';
export type WouldRepeat = 'YES' | 'NO' | 'MAYBE';
export type LogPhase = 'BEFORE' | 'DURING' | 'AFTER';
export type SubscriptionTier = 'FREE' | 'PRO';

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  icon: string;
  is_system: boolean;
  sort_order: number;
}

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO UTC
  duration_minutes: number;
  category_id: string;
  is_scheduled: boolean; // false = backlog/someday task
  mindset_prompt: string | null;
  mindset_overridden: boolean;
  recurrence_type: RecurrenceType;
  recurrence_days: Weekday[]; // e.g. ['Mon','Wed','Fri'] for day-specific recurrence
  subtasks: Subtask[];
  status: ActivityStatus;
  priority: ActivityPriority;
  actual_start: string | null;
  actual_end: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface ExperienceLog {
  id: string;
  activity_id: string;
  user_id: string;
  mood: number; // 1-5
  energy: number; // 1-5
  completion_pct: 0 | 50 | 100;
  reflection: string | null;
  would_repeat: WouldRepeat | null;
  log_phase: LogPhase;
  logged_at: string; // ISO UTC
}

export interface UserSettings {
  day_start: string; // "06:00"
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string; // "08:00"
  nudge_enabled: boolean;
  timezone: string;
}

export interface User {
  id: string;
  email: string;
  subscription_tier: SubscriptionTier;
  settings: UserSettings;
}

export interface AiUsage {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  call_count: number;
  queued_calls: unknown[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  day_start: '06:00',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  nudge_enabled: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export const FREE_TIER_LOG_LIMIT = 5;
export const AI_DAILY_CALL_LIMIT = 20;
