import { Category } from '../../types';

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'sys-deep-work',   user_id: null, name: 'Deep Work',   color: '#6366F1', icon: '🧠', is_system: true, sort_order: 0 },
  { id: 'sys-meetings',    user_id: null, name: 'Meetings',    color: '#F59E0B', icon: '👥', is_system: true, sort_order: 1 },
  { id: 'sys-admin',       user_id: null, name: 'Admin',       color: '#64748B', icon: '📋', is_system: true, sort_order: 2 },
  { id: 'sys-health',      user_id: null, name: 'Health',      color: '#10B981', icon: '💪', is_system: true, sort_order: 3 },
  { id: 'sys-learning',    user_id: null, name: 'Learning',    color: '#3B82F6', icon: '📚', is_system: true, sort_order: 4 },
  { id: 'sys-personal',    user_id: null, name: 'Personal',    color: '#EC4899', icon: '✨', is_system: true, sort_order: 5 },
  { id: 'sys-creative',    user_id: null, name: 'Creative',    color: '#F97316', icon: '🎨', is_system: true, sort_order: 6 },
  { id: 'sys-rest',        user_id: null, name: 'Rest',        color: '#8B5CF6', icon: '😴', is_system: true, sort_order: 7 },
];
