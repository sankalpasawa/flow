# DayFlow — Claude Instructions

## On Every Session Start
1. Read this file and `TODO.md`
2. Run setup if `node_modules` doesn't exist: `cd mobile && npm install`
3. Start dev server if not running: `npx expo start --web`
4. Open http://localhost:8081 — if data looks stale, clear localStorage: `localStorage.clear(); location.reload()`
5. Pick the top unchecked item from `TODO.md` and implement it
6. After each feature: commit, push to main, check the box in `TODO.md`

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

## Key Concepts
- **Two activity types**: `TIME_BLOCK` (hourly canvas slots) and `TASK` (checklist items)
- **Tasks without time** appear at the top of Today screen
- **Tasks with time** appear in their hour slot on the canvas
- **Carry-forward**: Incomplete tasks/activities from past days show on today with "Overdue" badge
- **Seed data**: Sankalp's real Any.do tasks. Dev mode auto-seeds on first load. Bump `SEED_VERSION` in `src/lib/db/seed.ts` to force re-seed.

## Important Files
| File | Purpose |
|------|---------|
| `src/theme.ts` | Design system (colors, spacing, radii, shadows) |
| `src/types/index.ts` | All TypeScript types (Activity, ActivityType, Category, etc.) |
| `src/lib/db/activities.ts` | All CRUD + queries for activities and tasks |
| `src/lib/db/db.web.ts` | Custom web SQL parser (handles SELECT, INSERT, UPDATE, JOIN, WHERE) |
| `src/lib/db/seed.ts` | Dev seed data from Sankalp's Any.do export |
| `src/store/activitiesStore.ts` | Zustand store for activities + tasks |
| `src/navigation/AppNavigator.tsx` | Tab navigator (Today, Plan, Insights, Settings) |
| `TODO.md` | Pending features and bugs — **start here for next steps** |
| `PLAN.md` | Original PRD with sprint plan and architecture |
| `data/sankalp_anydo_tasks.csv` | Sankalp's raw Any.do task export |

## Dev Mode
- Auth bypassed when `EXPO_PUBLIC_SUPABASE_URL` contains "placeholder"
- Auto-logs in as `sankalp@dayflow.app`
- Seed data auto-loads on first visit (check `dayflow_seed_version` in localStorage)
- After changing seed data: bump `SEED_VERSION` string in seed.ts, then `localStorage.clear(); location.reload()` in browser

## Web DB Gotchas
The web DB (`db.web.ts`) is a custom in-memory SQL parser, NOT real SQLite. It supports:
- SELECT with LEFT JOIN, WHERE (=, <, >, IS NULL, IS NOT NULL, date()), ORDER BY, LIMIT
- INSERT (with OR IGNORE), UPDATE
- **Does NOT support**: LIKE, nested subqueries, GROUP BY, HAVING
- LEFT JOIN bug was fixed: `prefixRow` no longer overwrites base table columns with joined table columns

## What to Work On
Read `TODO.md` for the full list. Top priorities:
1. Plan tab (next-day planning)
2. Date picker in ActivityForm
3. Bottom sheet modals (per design spec)
4. Unit tests for new features
