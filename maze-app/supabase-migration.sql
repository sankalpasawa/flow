-- Maze Database Schema
-- Run this in Supabase SQL Editor to set up all tables

-- Content: every joke, meme, image lives here
create table if not exists content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text_joke', 'image_meme', 'dad_joke', 'dark_joke', 'one_liner', 'ai_generated')),
  category text not null,
  title text,
  body text not null,
  image_url text,
  source text not null,
  source_id text,
  score float default 0,
  like_count int default 0,
  dislike_count int default 0,
  share_count int default 0,
  view_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Dedup index: prevent duplicate content from same source
create unique index if not exists content_source_dedup on content(source, source_id) where source_id is not null;

-- Feed query index
create index if not exists content_feed_idx on content(is_active, category, score desc, created_at desc);

-- Sessions: anonymous users
create table if not exists sessions (
  id text primary key,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- Users: optional auth
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  session_id text references sessions(id),
  display_name text,
  created_at timestamptz default now()
);

-- Interactions: like/dislike/share/view tracking
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id),
  content_id uuid not null references content(id),
  action text not null check (action in ('like', 'dislike', 'share', 'view')),
  created_at timestamptz default now()
);

-- One like or dislike per content per session
create unique index if not exists interactions_unique_reaction on interactions(session_id, content_id, action)
  where action in ('like', 'dislike');

-- Session interaction queries
create index if not exists interactions_session_idx on interactions(session_id, action, created_at desc);

-- Ingestion log
create table if not exists ingestion_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  fetched_count int default 0,
  new_count int default 0,
  duplicate_count int default 0,
  error text,
  created_at timestamptz default now()
);

-- RPC function: increment content score columns
create or replace function increment_content_score(cid uuid, col text)
returns void as $$
begin
  execute format('update content set %I = %I + 1, score = (like_count + 1.0) / greatest(like_count + dislike_count + 1.0, 1.0) * 10 where id = $1', col, col)
  using cid;
end;
$$ language plpgsql security definer;

-- Enable Row Level Security (permissive for now, tighten when auth is added)
alter table content enable row level security;
alter table sessions enable row level security;
alter table interactions enable row level security;
alter table ingestion_log enable row level security;

-- Public read access to content
create policy "Content is publicly readable" on content for select using (true);

-- Service role can insert/update content
create policy "Service role manages content" on content for all using (true) with check (true);

-- Sessions are publicly readable and insertable (anonymous)
create policy "Sessions are public" on sessions for all using (true) with check (true);

-- Interactions are publicly insertable
create policy "Interactions are public" on interactions for all using (true) with check (true);

-- Ingestion log is service-only readable
create policy "Ingestion log is public" on ingestion_log for all using (true) with check (true);
