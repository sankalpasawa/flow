// Seed data from Sankalp's Any.do export
// Maps real tasks to DayFlow categories and creates a realistic 14-day canvas

import { generateId, nowISO } from './db';
import { SYSTEM_CATEGORIES } from '../../features/categories/systemCategories';

const USER_ID = 'dev-user-001';

// Custom categories mapped from Any.do categories not covered by system ones
const CUSTOM_CATEGORIES = [
  { id: 'cust-social', name: 'Social', color: '#14B8A6', icon: '👥', sort_order: 8 },
  { id: 'cust-family', name: 'Family', color: '#F97316', icon: '🏠', sort_order: 9 },
  { id: 'cust-finance', name: 'Finance', color: '#10B981', icon: '💰', sort_order: 10 },
  { id: 'cust-wedding', name: 'Wedding', color: '#EC4899', icon: '💍', sort_order: 11 },
  { id: 'cust-chores', name: 'Chores', color: '#78716C', icon: '🧹', sort_order: 12 },
  { id: 'cust-explore', name: 'Explore', color: '#8B5CF6', icon: '🧭', sort_order: 13 },
  { id: 'cust-mumbai', name: 'Mumbai', color: '#EF4444', icon: '🏙️', sort_order: 14 },
  { id: 'cust-fashion', name: 'Fashion', color: '#D946EF', icon: '👔', sort_order: 15 },
  { id: 'cust-duniyadari', name: 'Duniyadari', color: '#0EA5E9', icon: '🌍', sort_order: 16 },
  { id: 'cust-professional', name: 'Professional', color: '#6366F1', icon: '💼', sort_order: 17 },
];

// Any.do category → DayFlow category_id mapping
const CATEGORY_MAP: Record<string, string> = {
  'Root': 'sys-personal',
  'Read': 'sys-learning',
  'Health': 'sys-health',
  'Fun': 'sys-rest',
  'Finance': 'cust-finance',
  'Family': 'cust-family',
  'Emo/spir growth': 'sys-personal',
  'Social': 'cust-social',
  'Mumbai': 'cust-mumbai',
  'Wedding': 'cust-wedding',
  'Chores': 'cust-chores',
  'Explore': 'cust-explore',
  'Duniyadari': 'cust-duniyadari',
  'Professional': 'cust-professional',
  'Fashion': 'cust-fashion',
};

// Frequency string → RecurrenceType
function mapFrequency(freq: string): string {
  if (!freq) return 'NONE';
  const f = freq.toLowerCase();
  if (f === 'one-time') return 'NONE';
  if (f === 'daily') return 'DAILY';
  if (f.startsWith('weekly')) return 'WEEKLY';
  // Monthly, bi-weekly, etc. → treat as WEEKLY for display
  return 'WEEKLY';
}

function uuid() { return generateId(); }
function dayOffset(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoAt(dayOff: number, hour: number, min = 0): string {
  const d = dayOffset(dayOff);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

interface SeedActivity {
  id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  start_time: string;
  duration_minutes: number;
  category_id: string;
  assigned_date: string | null;
  is_scheduled: boolean;
  status: string;
  priority: string;
  recurrence_type: string;
  recurrence_days?: string[];
  subtasks?: Array<{ id: string; title: string; done: boolean }>;
  mindset_prompt: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

interface SeedLog {
  activity_id: string;
  mood: number;
  energy: number;
  completion_pct: number;
  reflection: string | null;
  would_repeat: string | null;
  log_phase: string;
  logged_at: string;
}

function buildActivities(): { activities: SeedActivity[]; logs: SeedLog[] } {
  const activities: SeedActivity[] = [];
  const logs: SeedLog[] = [];

  // ─── 7 days ago: Monday — structured day ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(-7, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 7, 57), actual_end: isoAt(-7, 8, 7) },
    { id: uuid(), title: 'Breakfast', start_time: isoAt(-7, 8, 31), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 8, 31), actual_end: isoAt(-7, 9, 0) },
    { id: uuid(), title: 'Waking up practise', start_time: isoAt(-7, 9, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 9, 0), actual_end: isoAt(-7, 9, 20) },
    { id: uuid(), title: 'Sunlight', start_time: isoAt(-7, 9, 0), duration_minutes: 15, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 9, 0), actual_end: isoAt(-7, 9, 15) },
    { id: uuid(), title: 'Self love', start_time: isoAt(-7, 10, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 10, 0), actual_end: isoAt(-7, 10, 30) },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(-7, 10, 30), duration_minutes: 120, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: 'Serious about intent, playful execution.', actual_start: isoAt(-7, 10, 30), actual_end: isoAt(-7, 12, 30) },
    { id: uuid(), title: 'Leisure activities', start_time: isoAt(-7, 15, 0), duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'DAILY', mindset_prompt: null, actual_start: isoAt(-7, 15, 0), actual_end: isoAt(-7, 16, 0) },
    { id: uuid(), title: 'Celebrating Journal', start_time: isoAt(-7, 20, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 20, 0), actual_end: isoAt(-7, 20, 20) },
    { id: uuid(), title: 'Check routine before sleep', start_time: isoAt(-7, 21, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'BIWEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 21, 0), actual_end: isoAt(-7, 21, 15) },
    { id: uuid(), title: 'Bed time water', start_time: isoAt(-7, 22, 0), duration_minutes: 5, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-7, 22, 0), actual_end: isoAt(-7, 22, 5) },
  );
  logs.push(
    { activity_id: activities[5].id, mood: 4, energy: 4, completion_pct: 100, reflection: 'Good deep focus block. Felt productive.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-7, 12, 35) },
    { activity_id: activities[7].id, mood: 5, energy: 3, completion_pct: 100, reflection: 'Grateful for the small wins this week.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-7, 20, 25) },
  );

  // ─── 6 days ago: Tuesday — reading + social ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(-6, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-6, 7, 57), actual_end: isoAt(-6, 8, 7) },
    { id: uuid(), title: 'Read about Vata', start_time: isoAt(-6, 9, 0), duration_minutes: 45, category_id: 'sys-learning', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-6, 9, 0), actual_end: isoAt(-6, 9, 45) },
    { id: uuid(), title: 'Love/care with bhabhi', start_time: isoAt(-6, 10, 0), duration_minutes: 30, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-6, 10, 0), actual_end: isoAt(-6, 10, 30) },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(-6, 11, 0), duration_minutes: 150, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-6, 11, 0), actual_end: isoAt(-6, 13, 30) },
    { id: uuid(), title: 'Create happy memories', start_time: isoAt(-6, 16, 0), duration_minutes: 60, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-6, 16, 0), actual_end: isoAt(-6, 17, 0) },
    { id: uuid(), title: 'Read 5 aesop', start_time: isoAt(-6, 20, 0), duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-6, 20, 0), actual_end: isoAt(-6, 20, 30) },
    { id: uuid(), title: 'Message Saurabh', start_time: isoAt(-6, 20, 30), duration_minutes: 15, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'BIWEEKLY', mindset_prompt: null, actual_start: isoAt(-6, 20, 30), actual_end: isoAt(-6, 20, 45) },
  );
  logs.push(
    { activity_id: activities[11].id, mood: 4, energy: 3, completion_pct: 100, reflection: 'Interesting read on dosha balance. Need to apply more.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-6, 9, 50) },
    { activity_id: activities[13].id, mood: 4, energy: 4, completion_pct: 100, reflection: 'Solid work session. Made real progress.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-6, 13, 35) },
  );

  // ─── 5 days ago: Wednesday — growth + bhaiya ───
  activities.push(
    { id: uuid(), title: 'Sunlight', start_time: isoAt(-5, 9, 0), duration_minutes: 15, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-5, 9, 0), actual_end: isoAt(-5, 9, 15) },
    { id: uuid(), title: 'Waking up practise', start_time: isoAt(-5, 9, 15), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-5, 9, 15), actual_end: isoAt(-5, 9, 35) },
    { id: uuid(), title: 'Bhaiya meet', start_time: isoAt(-5, 15, 0), duration_minutes: 60, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-5, 15, 0), actual_end: isoAt(-5, 16, 0) },
    { id: uuid(), title: 'Humour Writing', start_time: isoAt(-5, 17, 0), duration_minutes: 45, category_id: 'sys-creative', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-5, 17, 0), actual_end: isoAt(-5, 17, 45) },
    { id: uuid(), title: 'Movement games', start_time: isoAt(-5, 18, 0), duration_minutes: 60, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-5, 18, 0), actual_end: isoAt(-5, 19, 0) },
    { id: uuid(), title: 'Observe breath!', start_time: isoAt(-5, 21, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: 'Just observe. No judgement.', actual_start: isoAt(-5, 21, 0), actual_end: isoAt(-5, 21, 15) },
  );
  logs.push(
    { activity_id: activities[19].id, mood: 5, energy: 3, completion_pct: 100, reflection: 'Great conversation with bhaiya. Good advice on life direction.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-5, 16, 5) },
    { activity_id: activities[20].id, mood: 5, energy: 4, completion_pct: 100, reflection: 'Wrote a funny piece about office culture. Felt liberating.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-5, 17, 50) },
  );

  // ─── 4 days ago: Thursday — focus + reflection + one-time tasks ───
  activities.push(
    { id: uuid(), title: 'Breakfast', start_time: isoAt(-4, 8, 30), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-4, 8, 30), actual_end: isoAt(-4, 9, 0) },
    { id: uuid(), title: 'Rent', start_time: isoAt(-4, 9, 30), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-4, 9, 30), actual_end: isoAt(-4, 9, 45) },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(-4, 10, 0), duration_minutes: 180, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: 'Serious about intent, playful execution.', actual_start: isoAt(-4, 10, 0), actual_end: isoAt(-4, 13, 0) },
    { id: uuid(), title: 'Barber', start_time: isoAt(-4, 14, 0), duration_minutes: 45, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-4, 14, 0), actual_end: isoAt(-4, 14, 45) },
    { id: uuid(), title: 'Enjoy the feeling', start_time: isoAt(-4, 16, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-4, 16, 0), actual_end: isoAt(-4, 16, 30) },
    { id: uuid(), title: 'Structuring as a skill', start_time: isoAt(-4, 17, 0), duration_minutes: 45, category_id: 'cust-duniyadari', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'BIWEEKLY', mindset_prompt: null, actual_start: isoAt(-4, 17, 0), actual_end: isoAt(-4, 17, 45) },
    { id: uuid(), title: 'Shriraj wallet', start_time: isoAt(-4, 18, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-4, 18, 0), actual_end: isoAt(-4, 18, 15) },
    { id: uuid(), title: 'Self 2.0 clarity', start_time: isoAt(-4, 19, 0), duration_minutes: 45, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'BIWEEKLY', mindset_prompt: 'Focus on needs/desires. What matters most?', actual_start: isoAt(-4, 19, 0), actual_end: isoAt(-4, 19, 45) },
    { id: uuid(), title: 'Leisure activities', start_time: isoAt(-4, 20, 0), duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'DAILY', mindset_prompt: null, actual_start: isoAt(-4, 20, 0), actual_end: isoAt(-4, 21, 0) },
  );
  logs.push(
    { activity_id: activities[24].id, mood: 5, energy: 5, completion_pct: 100, reflection: 'Best deep work session this week. Flow state hit around hour 2.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-4, 13, 5) },
    { activity_id: activities[27].id, mood: 4, energy: 3, completion_pct: 100, reflection: 'Clarity session was productive. Wrote down 3 things that truly matter.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-4, 19, 50) },
  );

  // ─── 3 days ago: Friday — routine + review ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(-3, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-3, 7, 57), actual_end: isoAt(-3, 8, 7) },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(-3, 10, 0), duration_minutes: 120, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-3, 10, 0), actual_end: isoAt(-3, 12, 0) },
    { id: uuid(), title: 'Review each category', start_time: isoAt(-3, 14, 0), duration_minutes: 45, category_id: 'sys-admin', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-3, 14, 0), actual_end: isoAt(-3, 14, 45) },
    { id: uuid(), title: 'Decentralising decision making', start_time: isoAt(-3, 15, 0), duration_minutes: 45, category_id: 'cust-duniyadari', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-3, 15, 0), actual_end: isoAt(-3, 15, 45) },
    { id: uuid(), title: 'Review with papa and bhaiya', start_time: isoAt(-3, 19, 0), duration_minutes: 60, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-3, 19, 0), actual_end: isoAt(-3, 20, 0) },
    { id: uuid(), title: 'Letter to future self', start_time: isoAt(-3, 21, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-3, 21, 0), actual_end: isoAt(-3, 21, 30) },
  );
  logs.push(
    { activity_id: activities[31].id, mood: 4, energy: 3, completion_pct: 100, reflection: 'Category review helped prioritize. Need to trim reading list.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-3, 14, 50) },
    { activity_id: activities[33].id, mood: 5, energy: 4, completion_pct: 100, reflection: 'Great family call. Papa gave wisdom on patience.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-3, 20, 5) },
  );

  // ─── 2 days ago: Saturday — social + chores ───
  activities.push(
    { id: uuid(), title: 'Call mummy', start_time: isoAt(-2, 8, 30), duration_minutes: 30, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 8, 30), actual_end: isoAt(-2, 9, 0) },
    { id: uuid(), title: 'Laundry', start_time: isoAt(-2, 10, 20), duration_minutes: 45, category_id: 'cust-chores', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 10, 20), actual_end: isoAt(-2, 11, 5) },
    { id: uuid(), title: 'Dhruv bhai', start_time: isoAt(-2, 11, 0), duration_minutes: 60, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 11, 0), actual_end: isoAt(-2, 12, 0) },
    { id: uuid(), title: 'stabalise current things', start_time: isoAt(-2, 14, 0), duration_minutes: 60, category_id: 'cust-chores', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 14, 0), actual_end: isoAt(-2, 15, 0) },
    { id: uuid(), title: 'Massage', start_time: isoAt(-2, 16, 0), duration_minutes: 60, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'BIWEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 16, 0), actual_end: isoAt(-2, 17, 0) },
    { id: uuid(), title: 'Detan', start_time: isoAt(-2, 17, 0), duration_minutes: 30, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'BIWEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 17, 0), actual_end: isoAt(-2, 17, 30) },
    { id: uuid(), title: 'Check routine before sleep', start_time: isoAt(-2, 21, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-2, 21, 0), actual_end: isoAt(-2, 21, 15) },
  );
  logs.push(
    { activity_id: activities[35].id, mood: 5, energy: 4, completion_pct: 100, reflection: 'Mummy sounded happy. Talked about wedding plans.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-2, 9, 5) },
    { activity_id: activities[39].id, mood: 4, energy: 5, completion_pct: 100, reflection: 'Much needed. Body feels reset.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-2, 17, 5) },
  );

  // ─── Yesterday: Sunday — reflection + social ───
  activities.push(
    { id: uuid(), title: 'Celebrating Journal', start_time: isoAt(-1, 9, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-1, 9, 0), actual_end: isoAt(-1, 9, 20) },
    { id: uuid(), title: 'Meet people of all age group(eld)', start_time: isoAt(-1, 13, 0), duration_minutes: 90, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(-1, 13, 0), actual_end: isoAt(-1, 14, 30) },
    { id: uuid(), title: 'Board of mentors', start_time: isoAt(-1, 15, 0), duration_minutes: 60, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-1, 15, 0), actual_end: isoAt(-1, 16, 0) },
    { id: uuid(), title: 'Pick something from chakra', start_time: isoAt(-1, 16, 30), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: isoAt(-1, 16, 30), actual_end: isoAt(-1, 17, 0) },
    { id: uuid(), title: 'Leisure activities', start_time: isoAt(-1, 18, 0), duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'LOW', recurrence_type: 'DAILY', mindset_prompt: null, actual_start: isoAt(-1, 18, 0), actual_end: isoAt(-1, 19, 0) },
    { id: uuid(), title: 'Aversion to being social', start_time: isoAt(-1, 20, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: 'Why do I avoid it? What am I afraid of?', actual_start: isoAt(-1, 20, 0), actual_end: isoAt(-1, 20, 30) },
  );
  logs.push(
    { activity_id: activities[43].id, mood: 4, energy: 3, completion_pct: 100, reflection: 'Good to spend time with older folks. Different perspectives.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-1, 14, 35) },
    { activity_id: activities[47].id, mood: 3, energy: 2, completion_pct: 100, reflection: 'Honest reflection. Need to push myself more into social situations.', would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(-1, 20, 35) },
  );

  // ─── Today: Monday — current ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(0, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(0, 7, 57), actual_end: isoAt(0, 8, 7) },
    { id: uuid(), title: 'Sunlight', start_time: isoAt(0, 9, 0), duration_minutes: 15, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(0, 9, 0), actual_end: isoAt(0, 9, 15) },
    { id: uuid(), title: 'routine', start_time: isoAt(0, 9, 30), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'COMPLETED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: isoAt(0, 9, 30), actual_end: isoAt(0, 10, 0) },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(0, 10, 0), duration_minutes: 150, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'IN_PROGRESS', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: 'Serious about intent, playful execution.', actual_start: isoAt(0, 10, 0), actual_end: null },
    { id: uuid(), title: 'Bency', start_time: isoAt(0, 12, 44), duration_minutes: 30, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'BIMONTHLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Anand meeting follow up', start_time: isoAt(0, 13, 30), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Clean badminton racket', start_time: isoAt(0, 14, 0), duration_minutes: 15, category_id: 'cust-chores', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Leisure activities', start_time: isoAt(0, 15, 0), duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'LOW', recurrence_type: 'DAILY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Find fixed mindset personas!', start_time: isoAt(0, 16, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'MONTHLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'password for google doc', start_time: isoAt(0, 16, 30), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Love/care with bhabhi', start_time: isoAt(0, 17, 0), duration_minutes: 30, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Enjoying the feeling', start_time: isoAt(0, 18, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'LOW', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Liesure write', start_time: isoAt(0, 19, 0), duration_minutes: 45, category_id: 'sys-creative', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Celebrating Journal', start_time: isoAt(0, 20, 30), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Check routine before sleep', start_time: isoAt(0, 21, 30), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
  );
  logs.push(
    { activity_id: activities[48].id, mood: 4, energy: 4, completion_pct: 100, reflection: null, would_repeat: 'YES', log_phase: 'AFTER', logged_at: isoAt(0, 8, 10) },
    { activity_id: activities[51].id, mood: 4, energy: 4, completion_pct: 50, reflection: 'Good progress. Need to wrap up the main task.', would_repeat: 'YES', log_phase: 'DURING', logged_at: isoAt(0, 12, 0) },
  );

  // ─── Tomorrow: Tuesday ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(1, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Self love', start_time: isoAt(1, 9, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Read on attachment', start_time: isoAt(1, 9, 30), duration_minutes: 45, category_id: 'sys-learning', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(1, 10, 30), duration_minutes: 150, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Create happy memories', start_time: isoAt(1, 16, 0), duration_minutes: 60, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Message Saurabh', start_time: isoAt(1, 19, 0), duration_minutes: 15, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Bed time water', start_time: isoAt(1, 22, 0), duration_minutes: 5, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'LOW', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Day +2: Wednesday ───
  activities.push(
    { id: uuid(), title: 'Waking up practise', start_time: isoAt(2, 9, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Bhaiya meet', start_time: isoAt(2, 15, 0), duration_minutes: 60, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Movement games', start_time: isoAt(2, 18, 0), duration_minutes: 60, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Practice being vulnerable', start_time: isoAt(2, 20, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Day +3: Thursday ───
  activities.push(
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(3, 10, 0), duration_minutes: 180, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Humour Writing', start_time: isoAt(3, 17, 0), duration_minutes: 45, category_id: 'sys-creative', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Structuring as a skill', start_time: isoAt(3, 18, 0), duration_minutes: 45, category_id: 'cust-duniyadari', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Story telling', start_time: isoAt(3, 19, 0), duration_minutes: 45, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Day +4: Friday ───
  activities.push(
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(4, 10, 0), duration_minutes: 120, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Enjoy the feeling', start_time: isoAt(4, 16, 0), duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'LOW', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Investing in equities', start_time: isoAt(4, 17, 0), duration_minutes: 45, category_id: 'cust-finance', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Monthly expenses analysis', start_time: isoAt(4, 18, 0), duration_minutes: 45, category_id: 'cust-finance', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Celebrating Journal', start_time: isoAt(4, 20, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Day +5: Saturday ───
  activities.push(
    { id: uuid(), title: 'Call mummy', start_time: isoAt(5, 8, 30), duration_minutes: 30, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Laundry', start_time: isoAt(5, 10, 0), duration_minutes: 45, category_id: 'cust-chores', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Dhruv bhai', start_time: isoAt(5, 11, 0), duration_minutes: 60, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Skin care: checkin & implement', start_time: isoAt(5, 14, 0), duration_minutes: 30, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Diet', start_time: isoAt(5, 15, 0), duration_minutes: 30, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Kaka', start_time: isoAt(5, 16, 0), duration_minutes: 45, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Check routine before sleep', start_time: isoAt(5, 21, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Day +6: Sunday ───
  activities.push(
    { id: uuid(), title: 'Celebrating Journal', start_time: isoAt(6, 9, 0), duration_minutes: 20, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Meet people of all age group(eld)', start_time: isoAt(6, 13, 0), duration_minutes: 90, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Solve maths/coding problems to build rationality', start_time: isoAt(6, 15, 0), duration_minutes: 60, category_id: 'cust-duniyadari', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Tor', start_time: isoAt(6, 17, 0), duration_minutes: 45, category_id: 'cust-social', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Observe breath!', start_time: isoAt(6, 20, 0), duration_minutes: 15, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: 'Just observe. No judgement.', actual_start: null, actual_end: null },
  );

  // ─── Day +7: Monday (next week) ───
  activities.push(
    { id: uuid(), title: 'Morning water', start_time: isoAt(7, 7, 57), duration_minutes: 10, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Sunlight', start_time: isoAt(7, 9, 0), duration_minutes: 15, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Sankalp work', start_time: isoAt(7, 10, 0), duration_minutes: 180, category_id: 'sys-deep-work', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: 'Serious about intent, playful execution.', actual_start: null, actual_end: null },
    { id: uuid(), title: 'B12 injections', start_time: isoAt(7, 14, 0), duration_minutes: 30, category_id: 'sys-health', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'stabalise current things', start_time: isoAt(7, 15, 0), duration_minutes: 60, category_id: 'cust-chores', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'WEEKLY', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Personal website', start_time: isoAt(7, 17, 0), duration_minutes: 60, category_id: 'sys-creative', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Speak with Rishil', start_time: isoAt(7, 18, 30), duration_minutes: 30, category_id: 'cust-family', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Self 2.0 clarity', start_time: isoAt(7, 19, 30), duration_minutes: 45, category_id: 'sys-personal', activity_type: 'TIME_BLOCK', assigned_date: null, is_scheduled: true, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'WEEKLY', mindset_prompt: 'Focus on needs/desires. What matters most?', actual_start: null, actual_end: null },
  );

  // ─── Day-assigned tasks (untimed) — appear at top of Today ───
  const todayDate = new Date().toISOString().split('T')[0];
  const now = nowISO();

  activities.push(
    // Today's tasks — only "Anand meeting follow up" assigned to today; rest go to someday
    { id: uuid(), activity_type: 'TASK', title: 'Rent', start_time: now, duration_minutes: 15, category_id: 'sys-personal', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), activity_type: 'TASK', title: 'Clean badminton racket', start_time: now, duration_minutes: 15, category_id: 'cust-chores', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), activity_type: 'TASK', title: 'Anand meeting follow up', start_time: now, duration_minutes: 30, category_id: 'sys-personal', assigned_date: todayDate, is_scheduled: false, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), activity_type: 'TASK', title: 'password for google doc', start_time: now, duration_minutes: 5, category_id: 'sys-personal', assigned_date: null, is_scheduled: false, status: 'COMPLETED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: now },
    // Previously day-assigned tasks — moved to someday bucket
    { id: uuid(), activity_type: 'TASK', title: 'Shriraj wallet', start_time: now, duration_minutes: 15, category_id: 'sys-personal', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), activity_type: 'TASK', title: 'Photo on ig about shreyaa', start_time: now, duration_minutes: 20, category_id: 'sys-personal', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  // ─── Backlog (Someday) — unscheduled tasks from Any.do ───
  activities.push(
    { id: uuid(), title: 'Find out books to read for self awareness', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Power naps', start_time: now, duration_minutes: 15, category_id: 'sys-health', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: "Restaurant's kitchen", start_time: now, duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Read about war', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'India as a society: strengths and weaknesses', start_time: now, duration_minutes: 45, category_id: 'sys-personal', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Four agreements', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'How to create a mafia', start_time: now, duration_minutes: 30, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Franz Kafka', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Constitution', start_time: now, duration_minutes: 45, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Read on endorphins/oxytocin', start_time: now, duration_minutes: 30, category_id: 'sys-personal', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Painting', start_time: now, duration_minutes: 60, category_id: 'sys-creative', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Upskill for freedom', start_time: now, duration_minutes: 60, category_id: 'sys-personal', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Visit a farm', start_time: now, duration_minutes: 120, category_id: 'cust-explore', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Voice course', start_time: now, duration_minutes: 60, category_id: 'cust-social', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Meet type of artists', start_time: now, duration_minutes: 60, category_id: 'cust-social', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Pick up pottery, painting, improv', start_time: now, duration_minutes: 60, category_id: 'cust-social', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Play lego', start_time: now, duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Origami', start_time: now, duration_minutes: 45, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Language', start_time: now, duration_minutes: 30, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Upanishads and Veda volumes', start_time: now, duration_minutes: 60, category_id: 'sys-personal', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Pre wedding things', description: 'Ring, dress, engagement photos, invite friends, books for wedding', start_time: now, duration_minutes: 60, category_id: 'cust-wedding', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'HIGH', recurrence_type: 'NONE', subtasks: [
      { id: uuid(), title: 'Ring', done: false },
      { id: uuid(), title: 'Dress', done: false },
      { id: uuid(), title: 'Engagement photos', done: true },
      { id: uuid(), title: 'Invite friends', done: false },
      { id: uuid(), title: 'Books for wedding', done: false },
    ], mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Mumbai trip', description: 'Rue da Liban, Aswad, Bhau Daji Lad, Living Room Bandra, Visit school', start_time: now, duration_minutes: 120, category_id: 'cust-mumbai', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', subtasks: [
      { id: uuid(), title: 'Rue da Liban', done: false },
      { id: uuid(), title: 'Aswad restaurant', done: false },
      { id: uuid(), title: 'Bhau Daji Lad museum', done: false },
      { id: uuid(), title: 'Living Room Bandra', done: false },
      { id: uuid(), title: 'Visit school', done: false },
      { id: uuid(), title: 'Bandra east shopping', done: false },
    ], mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Order things', description: 'Shopping list, travel bottles, cleaning kit, sunscreen, slip ons', start_time: now, duration_minutes: 30, category_id: 'cust-chores', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', subtasks: [
      { id: uuid(), title: 'Travel bottles', done: false },
      { id: uuid(), title: 'Cleaning kit', done: true },
      { id: uuid(), title: 'Sunscreen', done: true },
      { id: uuid(), title: 'Slip ons', done: false },
      { id: uuid(), title: 'Meditation cushion', done: false },
    ], mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Essentials Harvard', start_time: now, duration_minutes: 60, category_id: 'cust-duniyadari', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Find liberal arts in Bangalore', start_time: now, duration_minutes: 30, category_id: 'cust-explore', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Pune weather institute', start_time: now, duration_minutes: 60, category_id: 'cust-explore', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Moby Dick', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Guns, Germs and Steel', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Good strategy bad strategy', start_time: now, duration_minutes: 30, category_id: 'sys-learning', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'MEDIUM', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Calculus', start_time: now, duration_minutes: 60, category_id: 'cust-duniyadari', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Logic gates', start_time: now, duration_minutes: 45, category_id: 'cust-duniyadari', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Play Vice City', start_time: now, duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
    { id: uuid(), title: 'Manjuman boys', start_time: now, duration_minutes: 60, category_id: 'sys-rest', activity_type: 'TASK', assigned_date: null, is_scheduled: false, status: 'PLANNED', priority: 'LOW', recurrence_type: 'NONE', mindset_prompt: null, actual_start: null, actual_end: null },
  );

  return { activities, logs };
}

export async function seedDummyData(): Promise<void> {
  if (typeof localStorage === 'undefined') return;

  // Check if already seeded with latest version (bump to re-seed)
  const SEED_VERSION = '9';
  if (localStorage.getItem('dayflow_seed_version') === SEED_VERSION) return;

  // Write directly to localStorage, bypassing the web DB's SQL parser
  const { activities, logs } = buildActivities();
  const seedNow = nowISO();

  const categoryRows = [
    ...SYSTEM_CATEGORIES.map(c => ({
      id: c.id, user_id: c.user_id, name: c.name, color: c.color,
      icon: c.icon, is_system: 1, sort_order: c.sort_order, synced: 1,
    })),
    ...CUSTOM_CATEGORIES.map(c => ({
      id: c.id, user_id: USER_ID, name: c.name, color: c.color,
      icon: c.icon, is_system: 0, sort_order: c.sort_order, synced: 1,
    })),
  ];

  const activityRows = activities.map(a => ({
    id: a.id, user_id: USER_ID,
    activity_type: a.activity_type ?? 'TIME_BLOCK',
    title: a.title,
    description: a.description ?? null,
    start_time: a.start_time,
    duration_minutes: a.duration_minutes, category_id: a.category_id,
    assigned_date: a.assigned_date ?? (a.is_scheduled ? a.start_time.substring(0, 10) : null),
    is_scheduled: a.is_scheduled ? 1 : 0,
    mindset_prompt: a.mindset_prompt, mindset_overridden: 0,
    recurrence_type: a.recurrence_type,
    recurrence_days: a.recurrence_days ? JSON.stringify(a.recurrence_days) : null,
    subtasks: a.subtasks ? JSON.stringify(a.subtasks) : null,
    status: a.status, priority: a.priority,
    actual_start: a.actual_start, actual_end: a.actual_end,
    created_at: seedNow, updated_at: seedNow, synced: 0, deleted: 0,
  }));

  const logRows = logs.map(l => ({
    id: uuid(), activity_id: l.activity_id, user_id: USER_ID,
    mood: l.mood, energy: l.energy, completion_pct: l.completion_pct,
    reflection: l.reflection, would_repeat: l.would_repeat,
    log_phase: l.log_phase, logged_at: l.logged_at, synced: 0, deleted: 0,
  }));

  const dbState = {
    categories: categoryRows,
    activities: activityRows,
    experience_logs: logRows,
  };

  localStorage.setItem('dayflow_db', JSON.stringify(dbState));
  localStorage.setItem('dayflow_seed_version', SEED_VERSION);
  // Mark onboarding complete so we skip straight to canvas
  localStorage.setItem('dayflow_onboarded', 'true');

  console.log(`[DayFlow] Seeded ${activityRows.length} activities and ${logRows.length} logs for Sankalp`);
}

export const DEV_USER_ID = USER_ID;
