-- DayFlow Initial Schema
-- Sprint 1: Core tables with RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO')),
  settings JSONB NOT NULL DEFAULT '{
    "day_start": "06:00",
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "nudge_enabled": true,
    "timezone": "UTC"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  -- NULL = system category
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  color TEXT NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categories_write" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Seed system categories
INSERT INTO public.categories (id, user_id, name, color, icon, is_system, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Deep Work',  '#6366F1', '🧠', TRUE, 0),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Meetings',   '#F59E0B', '👥', TRUE, 1),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Admin',      '#64748B', '📋', TRUE, 2),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Health',     '#10B981', '💪', TRUE, 3),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Learning',   '#3B82F6', '📚', TRUE, 4),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Personal',   '#EC4899', '✨', TRUE, 5),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Creative',   '#F97316', '🎨', TRUE, 6),
  ('00000000-0000-0000-0000-000000000008', NULL, 'Rest',       '#8B5CF6', '😴', TRUE, 7);

-- Activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 80),
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 240),
  category_id UUID NOT NULL REFERENCES public.categories(id),
  mindset_prompt TEXT,
  mindset_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_type TEXT NOT NULL DEFAULT 'NONE' CHECK (recurrence_type IN ('NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY')),
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_user_start ON public.activities (user_id, start_time);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_own" ON public.activities
  FOR ALL USING (auth.uid() = user_id);

-- Experience Logs
CREATE TABLE public.experience_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
  completion_pct INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct IN (0, 50, 100)),
  reflection TEXT CHECK (char_length(reflection) <= 5000),
  would_repeat TEXT CHECK (would_repeat IN ('YES', 'NO', 'MAYBE')),
  log_phase TEXT NOT NULL DEFAULT 'AFTER' CHECK (log_phase IN ('BEFORE', 'DURING', 'AFTER')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_activity ON public.experience_logs (activity_id);
CREATE INDEX idx_logs_user_date ON public.experience_logs (user_id, logged_at);

ALTER TABLE public.experience_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_own" ON public.experience_logs
  FOR ALL USING (auth.uid() = user_id);

-- AI Usage tracking (circuit breaker)
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  call_count INTEGER NOT NULL DEFAULT 0,
  queued_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (user_id, date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_own" ON public.ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
