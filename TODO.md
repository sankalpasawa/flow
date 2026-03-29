# DayFlow — Pending Work

## High Priority (Next Session)

- [x] **Plan Tab**: Next-day planning screen. Shows tomorrow's plan, carry-forward overdue items, someday backlog. Move tasks to tomorrow/someday. "Add to Tomorrow" CTA. (Recurring auto-populate deferred — needs instance generation system.)
- [ ] **Date picker in ActivityForm**: Add ability to pick a specific date for an activity (today/tomorrow/pick date/someday). Currently the form takes date from route params only.
- [ ] **Activity form as bottom sheet**: Per design spec, creation/editing should use iOS-style bottom sheets with drag handles, not full-screen navigation.
- [ ] **Unit tests**: Add tests for new features — search, carry-forward, task creation, activity type switching, overdue logic. Existing test infra in `src/__tests__/`.

## Medium Priority

- [ ] **Warm theme remaining fixes**: OnboardingScreen, SignInScreen, SignUpScreen got bulk color replacement but may need manual polish (border colors, input focus states).
- [ ] **Insights tab analytics**: Add completion stats, category donut chart, mood/energy trend line chart (per design spec). Currently only shows Today/Tomorrow/Someday task lists + category drill-down.
- [ ] **Settings screen**: Add toggle switches for notifications, mindset prompts, quiet hours. Currently just a placeholder with sign-out.
- [ ] **Log insights**: "Your energy peaks on Tuesdays" — analyze logged mood/energy data and surface patterns.
- [ ] **End-of-day planning nudge**: Push notification at 8-9:30pm when tomorrow has <3 planned activities.
- [ ] **Log prompt nudge**: Fire notification 30min after activity end_time for experience logging.

## Lower Priority

- [ ] **Data fetching from server**: Replace hardcoded seed data with Supabase sync for production. Seed data is dev-only (in `src/lib/db/seed.ts`).
- [ ] **AI features with real API keys**: Mindset prompts (Claude Sonnet), auto-categorize (Claude Haiku), planning suggestions. Edge functions exist in `supabase/functions/`.
- [ ] **Codex review integration**: Use codex to review code on each change.
- [ ] **Calendar sync**: Google Calendar, Apple Calendar integration (deferred to post-PMF per PRD).
- [ ] **Activity overlap validation**: Prevent scheduling two activities at the same time.
- [ ] **Freemium gate**: 5 logs/day limit for free tier, unlimited for Pro ($10/mo).
- [ ] **PostHog analytics**: Add event tracking for key user actions.

## Technical Context

- **Working dir**: `/Users/abhishekasawa/flow/mobile`
- **Branch**: `main` on `sankalpasawa/flow`
- **Dev server**: `npx expo start --web` → http://localhost:8081
- **After seed changes**: Must clear browser localStorage: `localStorage.clear(); location.reload()`
- **Design system**: Warm minimal theme in `src/theme.ts` (cream bg #FAF7F2, forest green primary #2D4A3E)
- **Two activity types**: `TIME_BLOCK` (hourly canvas) and `TASK` (checklist at top of Today). Controlled by `activity_type` field.
- **Web DB**: Custom in-memory SQL parser in `src/lib/db/db.web.ts`. Supports basic SELECT/INSERT/UPDATE, LEFT JOIN, WHERE with =, <, >, IS NULL, IS NOT NULL, date() function.
- **Seed data**: Sankalp's real Any.do tasks. Seed version tracked in localStorage (`dayflow_seed_version`). Bump version string in `seed.ts` to force re-seed.
- **Any.do CSV**: Raw export at `data/sankalp_anydo_tasks.csv`

## Bugs Known

- [ ] DateStrip may not scroll to today on initial load (web-only, SectionList scrollToLocation doesn't work in react-native-web)
- [ ] `assigned_date` not yet wired into ActivityFormScreen — tasks get assigned_date from route param but no date picker UI
- [ ] SettingsScreen/LogFormScreen colors may need manual polish after bulk sed replacement
