# DayFlow — Claude Instructions

## On Every Session Start
1. Read this file and `TODO.md`
2. Run setup if `node_modules` doesn't exist: `cd mobile && npm install`
3. Start dev server if not running: `cd mobile && npx expo start --web`
4. Open http://localhost:8081 — if data looks stale, clear localStorage: `localStorage.clear(); location.reload()`
5. Pick the top unchecked item from `TODO.md` and implement it
6. After each feature: commit, push to `claude/pull-latest-changes-XeutS`, check the box in `TODO.md`

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
- **Expo 55** React Native app, runs on web via react-native-web
- **Offline-first**: SQLite on native, custom in-memory DB with localStorage persistence on web (`src/lib/db/db.web.ts`)
- **State**: Zustand stores (`src/store/`)
- **Design**: Warm minimal theme — cream bg (#FAF7F2), forest green primary (#2D4A3E). Theme tokens in `src/theme.ts`
- **Backend**: Supabase (placeholder creds for dev, auto-bypassed via dev mode in authStore)
- **Goals feature**: Long-term goals with progress tracking, category-based grouping, and target dates. Lives in `src/features/goals/`.

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
