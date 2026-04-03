# Maze — Onboarding Status
Phase: BUILDING — App deployed, Supabase pending
Started: 2026-04-04
Onboarding duration: 15 minutes

## Live URL
**https://maze-app-fawn.vercel.app** (demo mode — 12 built-in jokes)

## What's Built
- Next.js 16 + Tailwind v4 + shadcn/ui (dark mode)
- Feed with infinite scroll + category chips
- JokeCard with like/dislike + WhatsApp share
- Individual joke pages (/j/[id]) with SSR OG meta tags
- Dynamic OG images for WhatsApp previews (next/og)
- Content ingestion API (JokeAPI + icanhazdadjoke + Official Joke API)
- Reaction API with session preference tracking
- Demo mode fallback (works without Supabase)
- Deployed to Vercel production

## What's Pending
1. **Supabase setup** — Create project, run migration, connect env vars
2. **Seed 500+ jokes** — Hit /api/ingest once DB is connected
3. **AI joke generation** — Vercel AI SDK + Claude integration
4. **Vercel Cron** — Auto-ingest every 6 hours
5. **PostHog analytics** — Add before 100 users

## Key Decisions
- Name: Maze (M-A-Z-E)
- Platform: Web (mobile-optimized), WhatsApp-shareable
- Core bet: Retention — she comes back repeatedly
- Founder involvement: Hands-on
- Stack: Next.js 16 + Tailwind v4 + shadcn/ui + Supabase + Vercel
