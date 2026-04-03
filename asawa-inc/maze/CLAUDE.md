# Maze — Claude Instructions

## What is Maze

A never-ending humor feed — jokes, memes, dark humor, dad jokes — shareable via WhatsApp links that pull people back into the feed. Built as a mobile-optimized web app on Next.js 16 + Vercel.

## On Every Session Start
1. Read this file and `TODO.md`
2. Read `OPERATING-SYSTEM-V1.md` for process and skill routing
3. Check `STATUS.md` for current phase
4. Pick the top unchecked item from `TODO.md` and implement it
5. After each feature: commit, push

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **AI**: Vercel AI SDK v6 + Claude via Vercel AI Gateway
- **Content APIs**: JokeAPI (sv443), icanhazdadjoke, HumorAPI
- **Deploy**: Vercel
- **Analytics**: PostHog (add before 100 users)

## Key Architecture Rules
- **SSR is mandatory** for all pages with OG tags. WhatsApp's crawler does NOT execute JavaScript.
- **Content pipeline is the engine.** Jokes come from APIs + AI. The DB is the single source of truth.
- **Anonymous-first.** Sessions use client-generated UUIDs. Auth is optional.
- **WhatsApp sharing is the growth loop.** Every shared link MUST render a preview card. Test this on every deploy.
- **Personalization is simple.** Category-weighted scoring from like/dislike interactions. No ML.

## Important Files
| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | Full data model, content pipeline, feed serving, sharing flow |
| `PRODUCT-BRIEF.md` | PR/FAQ, P0 features, risk map, success metrics |
| `MARKET-BRIEF.md` | Competitors, market gap, technical landscape |
| `OPERATING-SYSTEM-V1.md` | Process, skills, A/B test config, stage criteria |
| `TODO.md` | Build order — follow the dependency chain |
| `METRICS.md` | What to measure, targets, feature ship log |
| `SUTRA-CONFIG.md` | A/B test config (SUTRA vs DIRECT mode per feature) |

## Content Sources
| Source | API | Auth | Categories |
|--------|-----|------|-----------|
| JokeAPI | sv443.net/jokeapi/v2/ | None | Programming, General, Dark, Pun, Spooky, Christmas |
| icanhazdadjoke | icanhazdadjoke.com/api | None | Dad jokes |
| HumorAPI | humorapi.com | API key | Jokes + Memes (50K + 290K) |
| AI Generated | Vercel AI SDK + Claude | API key | Any topic |

## Design Direction
- Warm, playful, high-contrast
- Dark background with vibrant category accent colors
- Typography-forward for text jokes, clean display for image memes
- Cards should feel like flipping through a joke book
- Mobile-first — everything must look great on a phone screen
- No clutter — humor is the only content

## Session Isolation
- This is a Maze session. Only edit files in `asawa-inc/maze/` and the Maze code directory.
- Do NOT edit DayFlow, PPR, Sutra, or holding company files.
- Feedback about Sutra → write to `asawa-inc/maze/feedback-to-sutra/`

## Skill Routing
| Need | Use |
|------|-----|
| Brainstorm | `/office-hours` |
| Plan review | `/autoplan` |
| Build | Just code it from TODO.md |
| Test | `/qa` |
| Code review | `/review` |
| Ship | `/ship` |
| Post-deploy | `/canary` |
| Debug | `/investigate` |
| Design explore | `/design-shotgun` |
| Design polish | `/design-review` |
| Progress | `/gsd:progress` |
| Pause | `/gsd:pause-work` |
| Resume | `/gsd:resume-work` |
