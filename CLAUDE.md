# DayFlow — Claude Instructions

## Context Loading (read this first every session)

Detect what the user wants to work on and load the RIGHT context:

| User says | Load | Do NOT load |
|-----------|------|-------------|
| Anything about the app, features, bugs, code, design | DayFlow context: CLAUDE.md, TODO.md, DESIGN.md, PLAN.md, ARCHITECTURE.md, PRODUCT-KNOWLEDGE-SYSTEM.md | asawa-inc/sutra/ |
| "Sutra", "operating model", "principles", "how we work" | Sutra context: asawa-inc/sutra/ | DayFlow code files |
| "Asawa", "holding", "portfolio", "company structure" | Holding context: asawa-inc/holding/ + awareness of both companies | Deep code files |
| Ambiguous | Ask: "Are we working on DayFlow (the app) or Sutra (how we operate)?" | — |

## On Every Session Start
1. Read this file and `TODO.md`
2. Run setup if `node_modules` doesn't exist: `cd mobile && npm install`
3. Start dev server if not running: `cd mobile && npx expo start`
4. Pick the top unchecked item from `TODO.md` and implement it
5. After each feature: commit, push to `v2/redesign`

## New Machine Setup
```bash
git clone https://github.com/sankalpasawa/flow.git
cd flow/mobile
npm install
npx expo start --web
# Open http://localhost:8081
# Clear localStorage on first load: localStorage.clear(); location.reload()
```

## Architecture
See `ARCHITECTURE.md` for the full five-layer architecture vision.

**Five layers**: UI (skin) → Data (spine) → World Context (senses) → User Model (memory) → AI (brain)

**Current implementation**:
- **Expo 55** React Native app, iPhone via Expo Go (web is out of scope)
- **Offline-first**: SQLite on native, custom in-memory DB with localStorage persistence on web (`src/lib/db/db.web.ts`)
- **State**: Zustand stores (`src/store/`)
- **Design**: Warm minimal theme — cream bg (#F5F0E8), forest green primary (#2D5A3E). Theme tokens in `src/theme.ts`
- **Backend**: Supabase (placeholder creds for dev, auto-bypassed via dev mode in authStore)
- **AI**: Schema-driven command layer (`commandLayer.ts` + Supabase edge function). LLM-agnostic. Currently Claude Haiku.
- **Goals feature**: Long-term goals with progress tracking, category-based grouping, and target dates. Lives in `src/features/goals/`.

**Key architecture rules**:
- The AI is not Claude. It's whatever LLM is best. Don't hardcode vendor assumptions.
- Schema is the API. Expand the data schema, the AI's capabilities expand automatically.
- UI follows data. Data shape determines rendering (timed → pill, untimed+recurring → watermark, untimed → task).
- Adapters are source-agnostic. Not just calendars. Any external app with an API.
- Capabilities are unbounded. The LLM defines what's possible, not the app.

## Key Concepts
- **Two activity types**: `TIME_BLOCK` (hourly canvas slots) and `TASK` (checklist items)
- **Tasks without time** appear at the top of Today screen (collapsible section)
- **Tasks with time** appear in their hour slot on the canvas
- **Carry-forward**: Incomplete tasks/activities from past days show on today with "Overdue" badge
- **Goals**: Long-term objectives with progress tracking (0-100%), target dates, and category grouping. Accessible from Insights tab.
- **Seed data**: Sankalp's real Any.do tasks. Dev mode auto-seeds on first load. Bump `SEED_VERSION` in `src/lib/db/seed.ts` to force re-seed.

## Important Files
| File | Purpose |
|------|---------|
| `src/theme.ts` | Design system (colors, spacing, radii, shadows) |
| `src/types/index.ts` | All TypeScript types (Activity, ActivityType, Category, etc.) |
| `src/lib/db/activities.ts` | All CRUD + queries for activities and tasks |
| `src/lib/db/db.web.ts` | Custom web SQL parser (handles SELECT, INSERT, UPDATE, JOIN, WHERE) |
| `src/lib/db/seed.ts` | Dev seed data from Sankalp's Any.do export (user: `dev-user-001`) |
| `src/lib/db/seedDemo.ts` | Demo account seed — 210 tasks (user: `demo-user-001`) |
| `src/store/activitiesStore.ts` | Zustand store for activities + tasks |
| `src/store/authStore.ts` | Auth logic — dev auto-login + demo account bypass |
| `src/navigation/AppNavigator.tsx` | Tab navigator (Today, Plan, Insights, Settings) |
| `src/features/goals/screens/GoalFormScreen.tsx` | Goal creation form (accordion sections, date picker, category) |
| `TODO.md` | Pending features and bugs — **start here for next steps** |
| `PLAN.md` | Original PRD with sprint plan and architecture |
| `data/sankalp_anydo_tasks.csv` | Sankalp's raw Any.do task export |

## Dev Mode & Accounts
- Auth bypassed when `EXPO_PUBLIC_SUPABASE_URL` contains "placeholder"
- **Sankalp account** (default auto-login): `sankalp@dayflow.app` — user id `dev-user-001`
- **Demo account**: `demo@dayflow.app` / `demo1234` — user id `demo-user-001`, 210 tasks from Any.do
- To switch accounts: Settings → Sign Out → enter demo credentials on login screen
- After signing out, a `dayflow_signed_out` flag in localStorage prevents auto-relogin
- Signing back in as `sankalp@dayflow.app` (any password) restores auto-login behaviour
- Seed version tracked in localStorage: `dayflow_seed_version` (Sankalp), `dayflow_demo_seed_version` (demo)
- After changing seed data: bump `SEED_VERSION` in the relevant seed file, then `localStorage.clear(); location.reload()`

## Web DB Gotchas
The web DB (`db.web.ts`) is a custom in-memory SQL parser, NOT real SQLite. It supports:
- SELECT with LEFT JOIN, WHERE (=, <, >, IS NULL, IS NOT NULL, date()), ORDER BY, LIMIT
- INSERT (with OR IGNORE), UPDATE
- **Does NOT support**: LIKE, nested subqueries, GROUP BY, HAVING
- LEFT JOIN bug was fixed: `prefixRow` no longer overwrites base table columns with joined table columns
- Both user accounts share the same `dayflow_db` localStorage key; rows are partitioned by `user_id`

## Architecture Debt — Prioritize Before Next Feature
- **DB abstraction layer**: The web DB (`db.web.ts`) and native SQLite (`db.ts`) have no shared interface. Seed, queries, and schema live in separate paths. Refactor into one `DatabaseAdapter` interface with web and native implementations. This removes the dual-path seeding hack and prevents "missing column" bugs (schema.ts must match what queries expect).
- **Schema as source of truth**: `schema.ts` defines native tables, but `db.web.ts` creates tables lazily. Any new column must be added in BOTH places. Unify this.
- **Use agents for parallel work**: Spawn subagents for independent tasks (reading files, running reviews, fixing separate bugs). Don't do everything sequentially.
- **Always create task lists**: Use TaskCreate for any multi-step work to track progress visibly.

## Design Principles (from user)
1. **Auto-scroll to current time** — canvas always opens focused on now
2. **Strong natural colors** — not faded/pastel. Rich, warm, vibrant
3. **Duration = visual height** — activity blocks height matches their time span (calendar-style)
4. **Micro-interactions everywhere** — swipe to complete, haptics, pull to refresh, smooth transitions
5. **Swipeable date strip** — thumb-friendly horizontal swipe, no arrow buttons
6. **Modern depth** — proper shadows, pixel-perfect alignment, 4px grid spacing
7. **Infinite day scroll** — after 11 PM scrolling continues to next day, date updates
8. **No middle screen** — tapping activity goes directly to edit (bottom sheet), not detail view
9. **No would_repeat** — remove from log form, unnecessary friction
10. **No completion circles** — remove checkbox from cards, use horizontal swipe gesture instead
11. **Horizontal swipe to complete** — swipe right to mark done
12. **Clean means beautiful, not bare** — keep useful info (category, duration), remove noise (mindset on card, badges)
13. **Always persist instructions** — every decision goes to CLAUDE.md/TODO.md and gets pushed to git
14. **Consistent calendar across app** — same HOUR_HEIGHT, colors, block sizing, overlap layout used in Today canvas, Plan Hours view, and any future calendar views. Single source of truth for calendar constants.
15. **Design system as code** — all UI built from a formal design system (typography scale, spacing grid, colors, shadows, component sizes, animation durations). No hardcoded values in components.
16. **Edit activity form** — no header (today/tom/date/someday). Time picker: scroll wheel to minute precision. Duration: None, 15m, 30m, 1h, then custom widget. Category: dropdown. Frequency: once or repeat (Any.do style repeat UI). Keep it minimal.
17. **No infinite scroll on canvas** — single day. Horizontal thumb swipe left/right changes day. Keep it simple.

## What to Work On
Read `TODO.md` for the full list. Top priorities:
1. Canvas rewrite: duration-proportional blocks, infinite day scroll, auto-scroll to now
2. Swipe gestures: complete activities, swipeable date strip
3. Goals feature follow-up (seed goals data, AI suggestions, editing)
4. Unit tests for new features

## Running on Device
- Run `npx expo start` from `mobile/` directory
- Scan the QR code with iPhone camera to open in Expo Go
- Web: `npx expo start --web` then open http://localhost:8081
- SDK 54 for Expo Go compatibility

## QA Cleanup
After every QA session, clean `mobile/qa-screenshots/` and `/tmp/dayflow-qa/`. Don't let test artifacts accumulate.

## Ask Logging (PRD Updates)
Every 5-10 significant user requests, update the "User Asks Log" table in PLAN.md.
Log: date, what was asked, status (Done/In progress/TODO), and outcome.
This ensures nothing is forgotten and the product direction is tracked.

**When to log:**
- After completing a batch of fixes
- When the user gives a new direction or priority shift
- At the end of a session
- When a major decision is made (design, architecture, scope)

**Logic:** Count user messages since last log update. If >= 5 significant asks, append to the table. A "significant ask" is a feature request, bug report, design feedback, or direction change — not a "yes", "done", "continue".

## Fundamental Principle: Full Automation
The user's time and energy are sacred. Do NOT ask for collaboration, input, or manual steps unless absolutely necessary (security credentials, design taste decisions).

Rules:
- Automate everything: testing, QA, screenshots, deployment, debugging
- Don't ask the user to click, navigate, paste, or run commands
- If something needs manual input, try at least 2 automated approaches first
- For design QA: control the app yourself, navigate screens, take screenshots
- For errors: read logs yourself, diagnose, fix, verify
- For git: push automatically after commits
- Only escalate to the user when genuinely blocked (auth, taste decisions, business logic ambiguity)

This applies to: QA testing, debugging, deployment, git operations, design review, and all development tasks.

## Product Knowledge System
Before making ANY code change, read `PRODUCT-KNOWLEDGE-SYSTEM.md`.
It contains: shearing layers (what changes at what rate), four flow maps (data, decisions, failures, changes), boundary contracts, sensors, and the change protocol.
The single most important rule: **when crossing a layer boundary, read the change flow map for that boundary.**

## NEVER Take Shortcuts — Code Quality Rules

These rules are ABSOLUTE. Breaking them causes cascading bugs that are worse than the original problem.

### Before writing ANY code change:
1. **Trace the full data flow.** Read every file the change touches. Understand the chain: UI → store → DB → query → render. Don't change one link without understanding all links.
2. **Identify all callers.** Grep for every function/variable you're modifying. List every place it's used. If you can't list them all, you haven't read enough.
3. **Check ID assumptions.** This codebase has virtual IDs (recurring instances: `realId_YYYY-MM-DD`). Any code that passes an ID to the DB must handle virtual IDs. Any code that matches IDs in arrays must handle both forms.
4. **Never change a function's contract silently.** If a function took X and returned Y, and you change it to take X' or return Y', EVERY caller must be updated in the SAME commit.

### Before committing:
5. **Read the diff line by line.** Does every changed line make sense in context? Is there any line that "might" break something? If "might", don't commit. Investigate.
6. **Check for regressions.** If you changed file A, does file B still work? Specifically: if you changed the store, does the screen still render? If you changed the DB layer, does the store still query correctly?
7. **Test the happy path mentally.** Walk through: user opens app → taps activity → form opens → edits → saves → form closes → canvas shows updated data. Does every step work with your change?

### When fixing bugs:
8. **Understand the bug completely before writing any fix.** Trace it end to end. Find the EXACT line that fails and WHY. Don't guess.
9. **Fix the root cause, not the symptom.** If the real problem is an architectural assumption (like virtual IDs), fix the assumption, don't patch around it.
10. **One change at a time.** Fix one thing per commit. Test. Then fix the next thing. Never make 3 changes at once hoping they all work.
11. **If a fix touches more than 2 files, stop and think.** A bug fix that requires changes in 4 files is probably treating symptoms. The root cause is likely in one file.
12. **If your fix is more complex than the original code, you're doing it wrong.** A fix should be simpler than the bug, not more complex.

### When the fix breaks more things:
13. **IMMEDIATELY REVERT.** Don't try to fix the fix. Revert to the last known working state. Then start over with a better understanding.
14. **Write down what went wrong.** Why did the fix break things? What assumption was wrong? This goes in the commit message and in the decision log.

### Architectural rules (from past bugs):
15. **Virtual recurring IDs:** Activities generated by `recurrence.ts` have IDs like `originalId_2026-04-03`. The store arrays contain these virtual IDs. The DB only has the original ID. Any function that writes to the DB must resolve virtual → real. Any function that reads from the store can use virtual IDs.
16. **Seed data is ephemeral.** Never assume seed data is the user's data. Seeds run on load and can overwrite edits. Use `INSERT OR IGNORE` for seeds, not `INSERT OR REPLACE`, unless it's a one-time migration.
17. **Rendering rules depend on activity_type, not just data shape.** A TIME_BLOCK with duration 0 is still a pill. A TASK with time + duration 0 is a watermark. Don't change rendering rules without checking all combinations.

## Target Platform: iPhone via Expo Go Only
- Web is out of scope. Don't test, optimize, or build for web.
- All QA must happen via the DesignQA system (iPhone captures) or by controlling the app programmatically
- Native-first: use react-native-safe-area-context, native gestures, iOS-specific optimizations

## Living Documentation Rule
Whenever a critical decision, philosophy, direction, or framework is decided during a session, immediately update the relevant document:

- **DESIGN.md** — Visual decisions, component specs, interaction patterns, design philosophy, color/type/spacing rules. Updated when: new component designed, visual treatment decided, interaction pattern locked, design philosophy refined.
- **PLAN.md** — Product direction, feature scope, architecture decisions, data model changes. Updated when: new feature scoped, data model changed, architecture decision made, product direction shifted.
- **CLAUDE.md** — Development instructions, conventions, workflow rules. Updated when: process changes, new conventions established, tool/workflow updates.
- **TODO.md** — Implementation tasks. Updated when: new work items identified, items completed.

These documents must be thorough and exhaustive so that:
1. Someone new can recreate the entire system by reading them
2. Future changes reference the right document for context
3. Decision rationale is preserved (WHY, not just WHAT)

After every significant decision, ask: "Which document needs updating?" and update it before moving on.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
Key rules: glass morphism pills, no accent bars (use category tints), watermark chips right-aligned, Instrument Sans only.
In QA mode, flag any code that doesn't match DESIGN.md.

## Agent Orchestration
When working in this repo, always maintain a **standby listener agent** running in the background. When the user gives a new instruction:
1. Dispatch a sub-agent to handle the task
2. Immediately spawn a new standby listener agent
3. If the standby agent finishes for any reason, spawn a new one

The standby agent holds context on all design decisions and current work state. This ensures the user can give instructions at any time and they'll be picked up.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review

## Autonomous Org

DayFlow runs like a company with AI CXO agents. See `org/ORG.md` for full structure.

**Daily standup**: When the user says "standup" or at the start of each session, run the standup protocol from `org/STANDUP-PROTOCOL.md`. Launch parallel agents for Quality, Design, Engineering, and Data checks. Synthesize with CEO agent. Write report to `org/standup/{date}.md`.

**Weekly strategy**: On Mondays or when user says "strategy", run the CEO weekly review. Include Security and Growth agents.

**Agent files**: `org/agents/{role}.md` — instruction sets for each CXO agent.

**Decision log**: Every significant decision goes to `org/decisions/{date}-{topic}.md`.

**When adding features**: Before implementing, check with CPO (is this the right priority?), CDO (what's the design spec?), CTO (does this fit the architecture?), CQO (what tests are needed?). After implementing, run CDO and CQO checks.

**Daily work should span ALL departments**, not just product and engineering. Check the standup report for cross-department action items.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**PPR — Personal Wedding Command Center**

A web app that gives a groom one place to manage his entire wedding — tasks, research, comparisons, and creative tools like greeting cards. Built as fast, clean HTML pages on Vercel, shareable via WhatsApp links. Currently a personal tool for one wedding (July 5-6, 2026); potentially a service for other couples later.

**Core Value:** Every wedding task, research link, and creative project lives in one place with shareable URLs — nothing gets forgotten, nothing gets lost in tabs.

### Constraints

- **Timeline**: Must be usable within first build session. Wedding is in 93 days.
- **Platform**: Web only. Next.js on Vercel. No native apps.
- **Auth**: No auth for V1. Direct access. Shared pages are public.
- **AI**: Claude via Vercel AI SDK for research summarization and card generation.
- **Database**: Supabase (Postgres + Edge Functions).
- **Sharing**: Every page must generate a valid WhatsApp preview card.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Validated Stack
## Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16 (latest, released Oct 2025) | Full-stack web framework | App Router is stable and production-ready. Server Components reduce client JS. SSR is required for WhatsApp OG tag scraping — WhatsApp's crawler does not execute JavaScript, so tags must be in server-rendered HTML. Next.js 16 adds Cache Components (use cache directive), stable Turbopack, React 19.2 features. Vercel-first deployment means zero-config edge functions. |
| React | 19.2 (bundled with Next.js 16) | UI rendering | Ships with Next.js 16. View Transitions and Activity component are immediately useful for card animations. |
| TypeScript | 5.x | Type safety | Required by shadcn/ui and Supabase JS v2. Next.js 16 minimum is TypeScript 5.1. |
# Select: App Router, TypeScript, Tailwind, ESLint
## Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility CSS | v4 is the current release. CSS-first configuration (no tailwind.config.js required). 3-10x faster full builds than v3. Auto-scans project. Compatible with Next.js 16. |
| shadcn/ui | CLI v4 (March 2026) | Component primitives | Not a dependency — components are copied into the project, owned by you. Built on Radix UI. Kanban board, data table, form, dialog, dropdown — all exist. Tailwind v4 compatible. `npx shadcn@latest` installs current CLI. |
## Database and Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase (@supabase/supabase-js) | 2.101.1 | Postgres database + auth + realtime | Correct choice. Row-level security, edge functions, and auth are all ready when the product needs them. V1 has no auth per PROJECT.md, but Supabase is wired for it. |
| @supabase/ssr | latest | Next.js App Router cookie auth | Required for correct session management in Server Components. Creates separate client instances for Server vs Client contexts. Use `supabase.auth.getUser()` only in Server Components. |
## AI Layer
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ai (Vercel AI SDK) | 6.0.143 | Streaming text, tool calls, agents | Current major version. streamText for research summaries. generateText for card copy. generateObject for structured comparison data. LLM-agnostic — swap providers without rewriting callers. |
| @ai-sdk/anthropic | latest | Anthropic Claude provider | Direct Anthropic API for local dev. |
| @ai-sdk/vercel | 2.0.39 | Vercel AI Gateway provider | Preferred for production. Access claude-sonnet-4-5 (or newer) via Vercel AI Gateway. Handles rate limits, logging, observability. |
## OG Image Generation (WhatsApp Previews)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/og (ImageResponse) | built into Next.js | Dynamic OG images | Ships with Next.js — zero extra install. Generates PNG via Satori + Resvg at the Edge runtime. Cacheable on Vercel CDN. Create `app/og/route.tsx` per page type. |
- Recommended: 1200 × 630px (1.91:1 aspect ratio)
- Minimum: 300px wide (below 100px = no preview)
- Format: PNG, JPG, or WebP
- Max file size: 600KB
- WhatsApp crawler does NOT execute JavaScript — og:image must be a direct image URL, not a JS-rendered tag
## AI Image Generation (Greeting Cards)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @fal-ai/client | latest | AI image generation for cards | Best for serverless Next.js: sub-second cold starts, predictable per-image pricing ($0.01-$0.08 per 1024×1024), Vercel-native integration. Supports Flux.1 (state-of-the-art quality) and Flux Schnell (fast/cheap). 985 endpoints available. |
| @fal-ai/server-proxy | latest | Proxy layer for Next.js | Prevents API key exposure. Create `app/api/fal/proxy/route.ts` re-exporting `createRouteHandler`. Required for production security. |
- `fal-ai/flux/schnell` — Fast, cheap, good for iteration. Use as default.
- `fal-ai/flux-pro/v1.1` — Higher quality for final card renders.
- Do NOT use Stable Diffusion variants — quality gap is significant vs Flux in 2025/2026.
| Option | Why Not |
|--------|---------|
| OpenAI DALL-E 3 | Higher cost per image, slower, less flexible for wedding aesthetic fine-tuning |
| Replicate | Per-second GPU billing makes cost unpredictable for a personal tool. No latency advantage over fal.ai |
| Stability AI API | More complex setup, less community tooling for Next.js, quality similar to Flux |
| Calling Claude for images | Claude cannot generate images directly — only text |
## Card Download and Sharing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| html-to-image | latest (npm) | Convert React card component to downloadable PNG | Simpler API than html2canvas. Uses `toPng(ref.current)` → data URL → download anchor. Works in Next.js App Router as a client component. |
## Task Management UI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui (built-in) | CLI v4 | Task cards, checkboxes, badges, dialogs | Use shadcn's Checkbox, Badge, Card, Dialog, Select components. No extra dependency needed for the list view. |
| @dnd-kit/core + @dnd-kit/sortable | ^6.x | Drag-and-drop reordering (Phase 2+) | The shadcn kanban board example uses dnd-kit. Lightweight (~10kb), keyboard accessible, touch-friendly. Only add this when drag-to-reorder is actively built — not Phase 1. |
## Deployment
| Technology | Purpose | Why |
|------------|---------|-----|
| Vercel | Hosting + CDN + Edge Functions + OG image caching | Zero-config for Next.js. OG images auto-cached on Vercel CDN. Edge runtime available for ImageResponse. Supabase environment variables via Vercel project settings. Free tier is sufficient for a personal tool. |
## Alternatives Considered (Full Stack)
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 App Router | Remix, Astro | Remix has good DX but smaller ecosystem. Astro is wrong for dynamic data (tasks, real-time). Next.js has best Vercel integration. |
| Database | Supabase | PlanetScale, Neon, Firebase | PlanetScale deprecated free tier. Neon is excellent but adds auth work. Firebase is overkill for Postgres-native use case. |
| AI text | Vercel AI SDK + Claude | Direct Anthropic SDK | Direct SDK couples to one provider. Vercel AI SDK is provider-agnostic and handles streaming, tool calls, structured output with one API. |
| AI images | fal.ai | Replicate, OpenAI | Replicate cost unpredictable. OpenAI DALL-E 3 more expensive, less flexible. fal.ai best dev UX for Next.js. |
| OG images | next/og (ImageResponse) | Puppeteer/headless Chrome | Puppeteer has cold-start latency of 2-10 seconds on serverless. next/og is sub-100ms. |
| Styling | Tailwind v4 + shadcn | Chakra UI, MUI | Chakra/MUI ship opinionated design that fights customization. Tailwind+shadcn gives full ownership. |
## Full Installation Command
# 1. Scaffold
# 2. shadcn
# 3. Supabase
# 4. Vercel AI SDK
# 5. fal.ai (for card image generation)
# 6. Card download
# 7. Drag-and-drop (defer to Phase 2+)
# npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
## Missing Pieces (Not in Founder's Original Stack List)
| Gap | Solution | Why Needed |
|-----|----------|------------|
| OG image generation | `next/og` (ImageResponse) — already in Next.js | Every shareable page needs a server-rendered og:image URL. WhatsApp won't generate a preview without it. |
| AI image generation | fal.ai + Flux Schnell | The greeting card creator requires generative images. Claude (text model) cannot produce images. |
| Card download | html-to-image | Users need to save cards as PNG to share on WhatsApp (Web Share API can share URLs but not inline generated images). |
| WhatsApp sharing | Web Share API (native, no library) | Deep-link fallback via `wa.me/?text=` is the correct pattern. No library needed. |
## Sources
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — verified Oct 2025
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) — official docs
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation) — official docs
- [Supabase @supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — version 2.101.1 confirmed
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — official docs
- [AI SDK npm package](https://www.npmjs.com/package/ai) — version 6.0.143 confirmed
- [AI SDK 6 announcement](https://vercel.com/blog/ai-sdk-6) — Vercel blog
- [Vercel AI Gateway models](https://vercel.com/docs/ai-gateway/models-and-providers) — official docs
- [fal.ai Next.js integration](https://docs.fal.ai/model-apis/integrations/nextjs) — official docs
- [Vercel fal integration](https://vercel.com/docs/ai/fal) — Vercel docs
- [AI image API comparison 2026](https://www.teamday.ai/blog/ai-image-video-api-providers-comparison-2026) — third-party benchmark
- [WhatsApp link preview guide 2026](https://www.ogrilla.com/blog/whatsapp-link-preview-guide) — comprehensive spec reference
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) — CLI v4 March 2026
- [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — v4 CSS-first config
- [dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) — official package
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
