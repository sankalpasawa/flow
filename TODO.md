# DayFlow — Pending Work

## High Priority (Next Session)

- [x] **Plan Tab**: Next-day planning screen. Shows tomorrow's plan, carry-forward overdue items, someday backlog. Move tasks to tomorrow/someday. "Add to Tomorrow" CTA. (Recurring auto-populate deferred — needs instance generation system.)
- [x] **Demo account seed**: `demo@dayflow.app` / `demo1234` — 210 tasks from Any.do export. Sign out from Settings to switch accounts. Both users share `dayflow_db` localStorage, partitioned by `user_id`.
- [x] **Date picker in ActivityForm**: Add ability to pick a specific date for an activity (today/tomorrow/pick date/someday). Currently the form takes date from route params only.
- [x] **Activity form as bottom sheet**: Per design spec, creation/editing should use iOS-style bottom sheets with drag handles, not full-screen navigation.
- [ ] **Unit tests**: Add tests for new features — search, carry-forward, task creation, activity type switching, overdue logic. Existing test infra in `src/__tests__/`.

## Upcoming (from latest session)

- [ ] **Pulse bar**: Micro-habit layer between date strip and canvas. Tap to mark done. See `designs/pulse-bar-mockup.html`.
- [ ] **Search screen redesign**: Results as activity cards (same style as day view pills). LLM-enhanced: text search first, then LLM picks up anything beyond basic search. Add TODO to refine search logic later.
- [ ] **Categories → Tags**: Decide whether to switch from single category to multiple tags per activity. Currently categories with emoji+name+color.
- [ ] **Duration picker custom button**: Pencil icon (✏️) replaces "2h" in duration chips. Opens inline number input for any custom duration in minutes.
- [ ] **Play screen voice**: Real speech-to-text requires dev build (not Expo Go). Wire when switching from Expo Go.

## Goals Feature Follow-up

- [ ] **Seed goals data**: Add sample goals to seed.ts and seedDemo.ts so new installs show example goals
- [ ] **AI-powered goal suggestions**: Use Claude to suggest goals based on user's activity patterns
- [ ] **Goal editing**: Edit existing goals (currently only creation is supported)
- [ ] **Goal-activity linking**: Associate daily tasks/time blocks with long-term goals for progress tracking

## Medium Priority

- [ ] **Warm theme remaining fixes**: OnboardingScreen, SignInScreen, SignUpScreen got bulk color replacement but may need manual polish (border colors, input focus states).
- [x] **Insights tab analytics**: Completion stats (7d/30d), stacked status bar, mood/energy 7-day trend bars, category breakdown with progress bars, AI-generated behavioral insight banner. Category drill-down moved to stack screen.
- [ ] **Settings screen**: Add toggle switches for notifications, mindset prompts, quiet hours. Currently just a placeholder with sign-out.
- [ ] **Log insights**: "Your energy peaks on Tuesdays" — analyze logged mood/energy data and surface patterns.
- [ ] **End-of-day planning nudge**: Push notification at 8-9:30pm when tomorrow has <3 planned activities.
- [ ] **Log prompt nudge**: Fire notification 30min after activity end_time for experience logging.

## Future Scope

- [ ] **Conflict → calendar view**: When there's a scheduling conflict, show a calendar icon that navigates to that day's canvas so user can see and rearrange visually
- [ ] **Post-create scroll**: After creating an activity, auto-navigate to that day's canvas and scroll to the time slot where the activity was placed
- [ ] **Experience log screen**: Post-activity mood/energy/reflection logging (design in progress)

## Architecture Roadmap (from ARCHITECTURE.md)

See ARCHITECTURE.md for full cognitive architecture (11-step loop) and research foundations.

### Cognitive Loop Foundation
- [ ] **Map current command layer to cognitive steps**: What exists, what's missing
- [ ] **Motivation layer**: How does the AI learn the user's goal hierarchy? (Onboarding? Learned over time?)
- [ ] **Wisdom heuristics**: When should the AI hold back vs act?
- [ ] **Affect inference**: How to estimate emotional state from available signals
- [ ] **Attention filtering**: How to determine what context matters for each request
- [ ] **Anticipation queries**: Schedule conflict prediction, pattern extrapolation

### Phase 2: Tomorrow Feature (next after calendar polish)
**Cognitive layers activated: Attention, Orientation, Anticipation**
- [ ] **World context: day type**: Detect weekday/weekend/holiday, include in AI context
- [ ] **World context: weather**: Integrate free weather API, include in AI context for outdoor activity suggestions
- [ ] **Basic user model**: Aggregate completion patterns from last 30 days, include summary in AI context
- [ ] **Enrich buildContext()**: Expand `commandLayer.ts:buildContext()` to accept world signals and user model summary
- [ ] **Tomorrow planning with AI**: AI suggests tomorrow's plan based on patterns + world context
- [ ] **First skill agent**: Planning skill with context recipe

### Phase 3: Insights (after tomorrow)
**Cognitive layers activated: Wisdom, Affect**
- [ ] **Energy curve computation**: Aggregate mood/energy from ExperienceLog by time-of-day
- [ ] **Completion pattern detection**: "You skip gym on Mondays 80% of the time"
- [ ] **Overcommitment signal**: Planned vs completed per day, running average
- [ ] **Pattern summary for AI**: Distill aggregations into concise text for AI context
- [ ] **Insights tab redesign**: Show AI-derived observations with glass aesthetic
- [ ] **Wisdom layer first use**: "You're overcommitting" / "Your schedule looks fine"

### Phase 4: Journaling
- [ ] **Universal Entry migration**: Add `type` and `source` columns to Activity table
- [ ] **Journal entry type**: Rich text body, mood, tags
- [ ] **AI cross-referencing**: Connect journal entries to activity patterns

### Phase 5: Self-modification + Free-form
- [ ] **Glass WebView component**: Fallback renderer for AI-generated HTML. First mechanism for dynamic UI. Not the only one.
- [ ] **Design tokens in AI prompt**: Pass DayFlow's design system to LLM so generated content matches the app.
- [ ] **Skills system**: Route requests to specialized agents. Each skill has a context recipe + output type.
- [ ] **Edge function generation**: AI writes and deploys Supabase functions from within the app.
- [ ] **Agent orchestration**: Multi-step task decomposition and execution across skills.

### Phase 6: External Sources
- [ ] **Google Calendar read adapter**
- [ ] **Google Calendar write adapter**
- [ ] **Two-way sync**
- [ ] **Other source adapters** (based on user need)

## Lower Priority

- [ ] **Data fetching from server**: Replace hardcoded seed data with Supabase sync for production. Seed data is dev-only (in `src/lib/db/seed.ts`).
- [ ] **AI features with real API keys**: Mindset prompts (Claude Sonnet), auto-categorize (Claude Haiku), planning suggestions. Edge functions exist in `supabase/functions/`.
- [ ] **Codex review integration**: Use codex to review code on each change.
- [ ] **Activity overlap validation**: Prevent scheduling two activities at the same time.
- [ ] **Freemium gate**: 5 logs/day limit for free tier, unlimited for Pro ($10/mo).
- [ ] **PostHog analytics**: Add event tracking for key user actions.

## Technical Context

- **Working dir**: `flow/mobile` (run all commands from here)
- **Branch**: `claude/pull-latest-changes-XeutS` on `sankalpasawa/flow` — push all changes here
- **Dev server**: `npx expo start --web` → http://localhost:8081
- **After seed changes**: Must clear browser localStorage: `localStorage.clear(); location.reload()`
- **Design system**: Warm minimal theme in `src/theme.ts` (cream bg #FAF7F2, forest green primary #2D4A3E)
- **Two activity types**: `TIME_BLOCK` (hourly canvas) and `TASK` (checklist at top of Today). Controlled by `activity_type` field.
- **Web DB**: Custom in-memory SQL parser in `src/lib/db/db.web.ts`. Supports basic SELECT/INSERT/UPDATE, LEFT JOIN, WHERE with =, <, >, IS NULL, IS NOT NULL, date() function.
- **Seed data (Sankalp)**: `src/lib/db/seed.ts` — user id `dev-user-001`. Bump `SEED_VERSION` to force re-seed.
- **Seed data (Demo)**: `src/lib/db/seedDemo.ts` — user id `demo-user-001`, 210 Any.do tasks. Bump `SEED_VERSION` in that file to force re-seed.
- **Accounts**: Both stored in `dayflow_db` localStorage key, partitioned by `user_id`. Switch via Sign Out in Settings.
- **Any.do CSV**: Raw export at `data/sankalp_anydo_tasks.csv`

## Bugs Known

- [ ] DateStrip may not scroll to today on initial load (web-only, SectionList scrollToLocation doesn't work in react-native-web)
- [x] `assigned_date` not yet wired into ActivityFormScreen — tasks get assigned_date from route param but no date picker UI
- [ ] SettingsScreen/LogFormScreen colors may need manual polish after bulk sed replacement
