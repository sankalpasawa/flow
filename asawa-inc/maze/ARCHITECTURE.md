# Maze — Architecture Card

## 5A: Product Type Classification

```yaml
product_type: "content-platform"
primary_value: "Entertainment — curated and generated humor content"
content_source: "hybrid — curated (APIs, Reddit) + ai-generated + eventually user-submitted"
interaction_model: "consume + share"
data_sensitivity: "public — jokes/memes are not private. User preferences are private."
```

Primary metric: Engagement (return visits, session duration, scroll depth)
Core technical challenge: Content quality + freshness + WhatsApp viral loop
Key architecture decision: Content pipeline (aggregate → filter → rank → serve) + OG image generation for WhatsApp previews

---

## 5B: Platform & Tech Stack

```yaml
tech_stack:
  framework: "Next.js 16 (App Router) — founder already ships PPR on this stack. Server Components for OG tags (WhatsApp crawler needs server-rendered HTML). Vercel-first deployment."
  styling: "Tailwind CSS v4 + shadcn/ui — fast iteration, component ownership, consistent with founder's PPR stack. No design system overhead for V1."
  backend: "Supabase (Postgres + Auth + Edge Functions) — founder knows it from DayFlow and PPR. Row-level security ready for when auth matters. Edge Functions for content aggregation cron jobs."
  ai: "Vercel AI SDK v6 + Claude via Vercel AI Gateway — for AI joke generation feature. streamText for real-time joke generation. generateObject for structured joke output with category/type metadata."
  content_apis:
    primary:
      - "JokeAPI (sv443) — free, no auth, 6 categories, multi-language"
      - "icanhazdadjoke — free, no auth, dad jokes with search"
      - "HumorAPI — 50K jokes + 290K memes, freemium tier"
    secondary:
      - "Reddit (r/jokes, r/dadjokes, r/IndianDankMemes) via Meme_Api or direct API"
      - "Official Joke API — small corpus, good for seeding"
    ai_generated:
      - "Claude via Vercel AI Gateway — topic-based joke generation"
  deploy: "Vercel — zero-config for Next.js, OG image caching on CDN, Edge Functions for API routes, preview URLs per PR."
  analytics: "PostHog — add before 100 users. Free tier sufficient. Event tracking for shares, likes, scroll depth."
  image_storage: "Vercel Blob — for cached meme images. Public access for OG image serving."
```

### Why This Stack

| Decision | Rationale |
|----------|-----------|
| Next.js over SPA | WhatsApp crawler needs server-rendered OG tags. Can't do this with a client-side React app. |
| Supabase over Firebase | Founder already knows Supabase. Postgres is better for the content query patterns (category filtering, scoring, seen-tracking). |
| Vercel AI Gateway over direct Anthropic | Observability, fallbacks, rate limiting built in. Can swap models without code changes. |
| shadcn/ui over custom components | Speed. Copy components in, own them, customize. No dependency lock-in. |
| No Redis/caching layer (V1) | Supabase is fast enough for V1 scale. Add Redis (Upstash via Vercel Marketplace) when latency matters. |

---

## 5C: Data Model

```sql
-- Content: the core table. Every joke, meme, image lives here.
create table content (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text_joke', 'image_meme', 'dad_joke', 'dark_joke', 'one_liner', 'ai_generated')),
  category text not null,           -- 'dad_jokes', 'dark_humor', 'memes', 'one_liners', 'indian', 'programming', 'general'
  title text,                       -- optional title/setup
  body text not null,               -- the joke text or meme caption
  image_url text,                   -- for image memes
  source text not null,             -- 'jokeapi', 'icanhazdadjoke', 'humorapi', 'reddit', 'ai_generated', 'user_submitted'
  source_id text,                   -- external ID for dedup
  score float default 0,            -- computed from likes/dislikes
  like_count int default 0,
  dislike_count int default 0,
  share_count int default 0,
  view_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint to prevent duplicate content from same source
create unique index content_source_dedup on content(source, source_id) where source_id is not null;

-- Index for feed queries
create index content_feed_idx on content(is_active, category, score desc, created_at desc);

-- Sessions: anonymous users (no auth required)
create table sessions (
  id text primary key,              -- client-generated UUID, stored in localStorage
  preferences jsonb default '{}',   -- { liked_categories: [], disliked_categories: [], ... }
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

-- Users: optional auth (linked to session)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  session_id text references sessions(id),
  display_name text,
  created_at timestamptz default now()
);

-- Interactions: like/dislike/share tracking per session
create table interactions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id),
  content_id uuid not null references content(id),
  action text not null check (action in ('like', 'dislike', 'share', 'view')),
  created_at timestamptz default now()
);

-- Prevent duplicate interactions (one like/dislike per content per session)
create unique index interactions_unique_reaction on interactions(session_id, content_id, action)
  where action in ('like', 'dislike');

-- Index for personalization queries
create index interactions_session_idx on interactions(session_id, action, created_at desc);

-- Content ingestion log: track what's been fetched from APIs
create table ingestion_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  fetched_count int default 0,
  new_count int default 0,
  duplicate_count int default 0,
  error text,
  created_at timestamptz default now()
);
```

### Content Pipeline Architecture

```
                    ┌──────────────┐
                    │  Cron Job    │  (Vercel Cron, runs every 6 hours)
                    │  /api/ingest │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ JokeAPI  │ │ DadJoke  │ │ HumorAPI │
        │ Fetcher  │ │ Fetcher  │ │ Fetcher  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │            │
             └─────────┬───┘────────────┘
                       ▼
              ┌──────────────────┐
              │  Dedup + Classify │  (check source_id, assign category)
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │  Insert to DB    │  (INSERT ... ON CONFLICT DO NOTHING)
              └──────────────────┘
```

### Feed Serving Architecture

```
  User opens Maze link
         │
         ▼
  ┌──────────────────┐
  │ GET /api/feed    │  params: ?category=&cursor=&session_id=
  │                  │
  │ 1. Get session   │  (create if new, load preferences if exists)
  │ 2. Query content │  (exclude seen, boost liked categories, rank by score)
  │ 3. Return 20     │  (paginated, cursor-based)
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ Client renders   │  Infinite scroll, lazy load images
  │ feed cards       │
  └──────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  Like/     Share
  Dislike    │
    │        ▼
    │   ┌──────────────────┐
    │   │ /api/share/{id}  │  → Generate OG image → Return WhatsApp-ready URL
    │   └──────────────────┘
    ▼
  ┌──────────────────┐
  │ POST /api/react  │  → Update score, log interaction, adjust session preferences
  └──────────────────┘
```

### WhatsApp Sharing Flow

```
  User taps Share on a joke
         │
         ▼
  Generate shareable URL: maze.app/j/{content-id}
         │
         ▼
  /j/{content-id}/opengraph-image  (next/og ImageResponse)
  → Renders joke text on branded card (Maze logo, category badge)
  → Cached on Vercel CDN
         │
         ▼
  Web Share API → WhatsApp
  → WhatsApp scrapes OG tags from maze.app/j/{content-id}
  → Shows preview card with joke text + Maze branding
         │
         ▼
  Recipient taps link → Opens maze.app/j/{content-id}
  → Shows that specific joke
  → "Keep scrolling" CTA → Enters the feed
  → New session created → Viral loop complete
```

---

## 5D: Content Strategy

```yaml
seed_content:
  target: "500+ jokes before launch"
  sources:
    - "JokeAPI batch fetch — ~200 jokes across categories"
    - "icanhazdadjoke — ~100 dad jokes"
    - "HumorAPI — ~200 curated memes + jokes"
  quality_gate: "AI self-rating (1-10 funny score via Claude). Only jokes scoring 6+ enter the feed."

ongoing_content:
  automated: "Cron job every 6 hours fetches new content from APIs. Dedup prevents repeats."
  ai_generated: "User-initiated (type topic → get jokes). Best-rated AI jokes get added to the public feed."
  freshness: "Feed algorithm weights recency + score. New content appears at top, high-scored content stays visible longer."

personalization:
  method: "Category-weighted scoring. If user likes 5 dad jokes, dad jokes get a 2x boost in their feed. If they dislike dark humor, dark humor gets -0.5x penalty."
  cold_start: "New users get the globally highest-scored content. Preferences build after 10+ interactions."
  storage: "Session preferences stored in sessions.preferences JSONB. Lightweight, no ML model needed for V1."
```

---

## 5E: Design Approach

```yaml
design_approach: "design-in-code"
rationale: "Solo founder, web MVP, speed over polish. Tailwind + shadcn gives enough aesthetic control. Iterate live in browser."
design_direction: "Warm, playful, high-contrast. Think: dark background with vibrant accent colors per category. Cards should feel like flipping through a joke book. Typography-forward for text jokes. Clean image display for memes."
```

Key design decisions to make during build:
- Color palette per category (dad jokes = warm yellow, dark humor = purple/black, memes = vibrant blue, etc.)
- Card design for text jokes vs image memes
- Share button placement and animation
- Category navigation (tabs? chips? sidebar?)
- Like/dislike interaction (swipe? buttons? thumb icons?)

---

## 5F: Deployment Architecture

```yaml
deploy:
  platform: "Vercel"
  preview: "Auto preview URLs per git push (built into Vercel + GitHub)"
  production: "maze.vercel.app initially. Custom domain when ready."
  monitoring: "Vercel Analytics (built-in) + PostHog for product analytics"
  rollback: "Instant via Vercel dashboard"
  cron: "Vercel Cron for content ingestion (/api/ingest, every 6 hours)"
  edge: "OG image generation at Edge for fast WhatsApp preview rendering"
  blob: "Vercel Blob for cached meme images (if needed)"
  
environment_variables:
  - "SUPABASE_URL"
  - "SUPABASE_ANON_KEY"
  - "SUPABASE_SERVICE_ROLE_KEY"
  - "ANTHROPIC_API_KEY (or VERCEL_AI_GATEWAY_KEY)"
  - "HUMORAPI_KEY (if using premium tier)"
  - "POSTHOG_KEY (add before 100 users)"
```

---

## Architecture Summary

```yaml
product_type: "content-platform"
platform: "web (mobile-optimized, Next.js 16)"
tech_stack:
  framework: "Next.js 16 (App Router) — SSR for OG tags, Server Components for performance"
  styling: "Tailwind CSS v4 + shadcn/ui — fast iteration, component ownership"
  backend: "Supabase (Postgres + Auth + Edge Functions) — content DB, session tracking, optional auth"
  ai: "Vercel AI SDK v6 + Claude via Vercel AI Gateway — joke generation"
  deploy: "Vercel — CDN, cron, OG caching, preview URLs"
  analytics: "PostHog — add before 100 users"
data_model: "Content platform pattern — content + sessions + interactions + ingestion_log"
content_strategy: "500+ seed jokes from APIs. Ongoing: cron every 6h. AI supplements. Quality gate: 6+/10 funny score."
design_approach: "design-in-code — Tailwind + shadcn, iterate live in browser"
deploy_pipeline: "git push → Vercel preview → verify → promote to production"
```
