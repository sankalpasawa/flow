import { Category } from '../../types';

export const SYSTEM_CATEGORIES: Category[] = [
  { id: 'sys-personal',    user_id: null, name: 'Personal',    color: '#EC4899', icon: '✨', is_system: true, sort_order: 0 },
  { id: 'sys-learning',    user_id: null, name: 'Learning',    color: '#3B82F6', icon: '📚', is_system: true, sort_order: 1 },
  { id: 'sys-health',      user_id: null, name: 'Health',      color: '#10B981', icon: '💪', is_system: true, sort_order: 2 },
  { id: 'sys-rest',        user_id: null, name: 'Rest',        color: '#8B5CF6', icon: '😴', is_system: true, sort_order: 3 },
];
