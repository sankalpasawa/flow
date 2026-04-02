# DayFlow Organization Structure & Departmental Roadmap

**Last updated**: 2026-04-02
**Company stage**: Pre-launch, solo founder (AI-assisted)
**Product**: DayFlow -- personal operating system (iOS, React Native/Expo, Supabase)
**Target user**: Structured Achievers -- knowledge workers who already plan and reflect, using duct-taped tools (Any.do + Google Docs, or Sunsama at $16-20/mo)
**Revenue model**: Freemium -- 5 logs/day free, Pro at $10/mo

---

## Table of Contents

1. [Department 1: Product](#1-product)
2. [Department 2: Design](#2-design)
3. [Department 3: Engineering](#3-engineering)
4. [Department 4: Data & Analytics](#4-data--analytics)
5. [Department 5: Security & Privacy](#5-security--privacy)
6. [Department 6: Infrastructure](#6-infrastructure)
7. [Department 7: Quality](#7-quality)
8. [Department 8: Growth](#8-growth)
9. [Department 9: Content](#9-content)
10. [Department 10: Legal & Compliance](#10-legal--compliance)
11. [Cross-Department Dependencies](#cross-department-dependencies)
12. [Daily Standup Protocol](#daily-standup-protocol)
13. [Scaling Plan](#scaling-plan)

---

## 1. Product

**Mission**: Define what DayFlow builds, for whom, in what order, and measure whether it works.

### OKRs (Q2 2026)

**Objective 1: Launch DayFlow on TestFlight and validate product-market fit signal**
- KR1: Ship TestFlight build to 25 external beta users by May 15
- KR2: Achieve D7 retention of 40% or higher among beta cohort (industry average for productivity apps: 25%)
- KR3: Collect 50+ qualitative feedback entries (NPS, feature requests, friction reports)

**Objective 2: Validate the experience log as the core differentiator**
- KR1: 60% of active users log mood/energy at least 3x per week by end of Q2
- KR2: Users who log 5+ times show 2x higher D14 retention than non-loggers
- KR3: Identify top 3 "aha moments" from user interviews (conduct 10 interviews by June 30)

**Objective 3: Define and lock the competitive positioning against Sunsama**
- KR1: Document 5 specific reasons a Sunsama user would switch, validated by 3+ user interviews
- KR2: Publish internal competitive teardown comparing DayFlow vs Sunsama vs Notion Calendar vs Reclaim.ai
- KR3: Define pricing page copy with feature comparison table

**Objective 4: Establish a repeatable product development cycle**
- KR1: Ship 2 major features per month (Plan tab, Insights tab, Experience Log, Goals)
- KR2: Maintain a prioritized backlog with no more than 5 P0 items at any time
- KR3: Every shipped feature has a success metric defined before development begins

### Priority Roadmap

**P0 -- Must do before launch**
- Finalize P0 feature set: Today canvas (done), Plan tab (done), Experience Log, Quick Add with LLM
- Define success metrics for each launch feature (activation, engagement, retention signals)
- Write beta onboarding script (what to tell testers, what feedback to collect)
- Create user journey map: first open -> first time block -> first log -> first insight
- Lock the "why switch from Sunsama" positioning document

**P1 -- Within first month post-launch**
- Conduct 10 user interviews from beta cohort
- Analyze D7/D14/D30 retention by cohort
- Prioritize top 3 feature requests from beta feedback
- Build internal dashboard for key metrics (or use PostHog)
- Define the "North Star Metric" (candidates: weekly active logging sessions, daily planning completions)

**P2 -- Within first quarter**
- Competitive feature audit: what do Sunsama, Reclaim, Notion Calendar have that DayFlow lacks?
- Define Phase 2-3 roadmap based on beta data (Tomorrow feature, Insights, Journaling)
- Establish a formal product review cadence (weekly product review, monthly strategy review)
- Begin App Store launch planning (screenshots, description, ASO keywords)

### Current Gaps

- No formal user research process. Founder intuition is driving decisions (valid at this stage, but needs validation).
- No success metrics defined per feature. Features ship without measurable acceptance criteria.
- No competitive teardown document. Sunsama is named as the competitor but no deep analysis exists.
- No beta user recruitment pipeline. "Plans to validate with specific named users" (from PLAN.md) has not been executed.
- No product analytics instrumented. PostHog is in TODO.md but not implemented.
- No user journey map. The path from first open to retained user is not documented.

### Implementation Tasks

- Create `/Users/abhishekasawa/Claude/flow/docs/product/competitive-analysis.md` -- Sunsama, Reclaim, Notion Calendar teardown
- Create `/Users/abhishekasawa/Claude/flow/docs/product/metrics.md` -- define North Star Metric, feature-level metrics, retention targets
- Create `/Users/abhishekasawa/Claude/flow/docs/product/beta-plan.md` -- recruitment, onboarding script, feedback collection, interview template
- Add success criteria to every item in `TODO.md` (even one line: "Success: X% of users do Y")
- Set up PostHog project and add `EXPO_PUBLIC_POSTHOG_KEY` to environment

### Best Practices (What the Best Companies Do)

- **Linear**: Ships in 6-week cycles with clear themes. Every cycle has a written pitch document before work starts. Features have "appetite" (time budget) not estimates.
- **Spotify**: Uses "bets" framework -- each initiative is a bet with a hypothesis, success metric, and kill criteria. If the metric isn't hit, the feature gets cut or iterated.
- **Notion**: Founder-led product for the first 50 people. Coda Hale's "Work is Work" principle -- the founder's taste IS the product strategy at this stage.
- **Apple**: "DRI" (Directly Responsible Individual) for every feature. One person owns the outcome, not a committee.
- **Figma**: Measures "time to first value" obsessively. The onboarding experience IS the product.

---

## 2. Design

**Mission**: Make DayFlow feel like the most beautiful, intuitive personal OS a knowledge worker has ever used. Design is not decoration -- it is the product.

### OKRs (Q2 2026)

**Objective 1: Establish a production-ready design system**
- KR1: Document 100% of reusable components in DESIGN.md with specs (spacing, colors, typography, states)
- KR2: Zero hardcoded color/spacing values in component files -- all reference `theme.ts` tokens
- KR3: Design system covers all 4 component states: default, pressed, disabled, loading

**Objective 2: Achieve a "premium feel" rating from beta users**
- KR1: 80% of beta users rate visual quality as 4/5 or higher in feedback survey
- KR2: Complete glassmorphism implementation across all screens (Today, Plan, Insights, Settings, Forms)
- KR3: All transitions and animations run at 60fps on iPhone 12 and newer

**Objective 3: Make the experience log frictionless**
- KR1: Time from "tap log" to "log submitted" under 8 seconds for returning users
- KR2: Log form completion rate above 85% (users who open the form also submit it)
- KR3: Design and ship 3 variants of the log prompt (post-activity, end-of-day, quick-mood)

### Priority Roadmap

**P0 -- Must do before launch**
- Audit all screens against DESIGN.md and fix inconsistencies (warm theme fixes still pending per TODO.md)
- Complete Experience Log screen design and implementation
- Finalize bottom sheet pattern for activity creation/editing (done) and log entry
- Design the onboarding flow (3-4 screens max: value prop, permission grants, first time block creation)
- Ensure all touch targets are 44x44pt minimum (Apple HIG)
- Polish the glassmorphism pill rendering on the Today canvas

**P1 -- Within first month**
- Design the Pulse Bar (micro-habit layer, mockup exists at `designs/pulse-bar-mockup.html`)
- Redesign Search results as activity cards (per TODO.md)
- Design goal-activity linking UI (how daily tasks connect to long-term goals)
- Create dark mode variant of the design system
- Design empty states for all screens (no activities, no logs, no insights)

**P2 -- Within first quarter**
- Design the Insights tab visualizations (energy curves, completion patterns, mood trends)
- Design the Tomorrow planning experience (AI-suggested plan, drag to reorder)
- Create motion design spec (transitions between screens, micro-interactions, gesture feedback)
- Design the Settings screen with full toggle set (notifications, quiet hours, theme)
- App icon and splash screen final design

### Current Gaps

- DESIGN.md exists but component documentation is incomplete. Many components have specs, but states (loading, error, empty) are not defined.
- Onboarding flow not designed. New users see seed data, not an onboarding experience.
- Experience Log screen is "design in progress" (per TODO.md) -- this is P0 and blocking.
- Dark mode not considered. The warm cream theme is beautiful but some users will want dark mode.
- No motion/animation spec. Transitions exist but are ad hoc, not systematized.
- Empty states not designed. What does the app look like on day 1 with zero data?
- Accessibility not addressed. No VoiceOver labels, no Dynamic Type support, no contrast ratio verification.

### Implementation Tasks

- Audit `src/theme.ts` -- ensure every component references tokens, not raw values. Run a grep for hardcoded hex colors outside `theme.ts`.
- Create onboarding screen designs (can be HTML mockups in `designs/` folder first)
- Complete Experience Log screen in `src/features/` -- design + implementation
- Add `accessibilityLabel` props to all interactive elements across the app
- Test all screens with iOS "Increase Contrast" and "Bold Text" accessibility settings
- Create `designs/empty-states.html` -- mockups for zero-data states on Today, Plan, Insights

### Best Practices

- **Apple**: Every interaction has a physical metaphor. Buttons feel like buttons. Glass looks like glass. The design language is consistent to the pixel.
- **Linear**: Monochrome with one accent color. Obsessive about spacing consistency. Every element on a 4px grid. Command palette as primary navigation.
- **Figma**: Design tokens are the single source of truth. Components are built from tokens, screens from components. No one-off styles.
- **Notion**: Minimal chrome, maximum content. The UI gets out of the way. Heavy use of white space.
- **Spotify**: Bold typography as hierarchy. Limited color palette for content, reserving color for data visualization and brand moments.

---

## 3. Engineering

**Mission**: Build and maintain a reliable, performant, extensible codebase that serves the product vision without accruing unmanageable tech debt.

### OKRs (Q2 2026)

**Objective 1: Ship a stable TestFlight build**
- KR1: Zero P0 crashes in a 48-hour soak test on iPhone 12, 13, 14, 15
- KR2: Cold start time under 2 seconds on iPhone 12
- KR3: All P0 features (Today canvas, Plan tab, Experience Log, Quick Add) passing automated tests

**Objective 2: Resolve architecture debt before it compounds**
- KR1: Unify web and native DB into a single `DatabaseAdapter` interface (per CLAUDE.md architecture debt)
- KR2: Schema defined in one place (`schema.ts`) used by both platforms
- KR3: Reduce total lines of code in `db.web.ts` by 30% through abstraction

**Objective 3: Wire the AI layer for real usage**
- KR1: Quick Add with LLM parsing handles 90% of natural language inputs correctly (test with 50 real phrases)
- KR2: AI command layer (`commandLayer.ts`) integrated with Supabase edge function in production
- KR3: Average AI response time under 1.5 seconds for Quick Add operations

**Objective 4: Establish engineering quality baseline**
- KR1: Test coverage above 60% for business logic (`src/lib/`, `src/store/`)
- KR2: Zero TypeScript `any` types in new code (eslint rule enforced)
- KR3: All PRs require passing CI before merge

### Priority Roadmap

**P0 -- Must do before launch**
- Fix the DB abstraction layer (web vs native dual-path is a landmine)
- Wire LLM into Quick Add (currently local parser only)
- Complete Experience Log feature (CRUD, form, storage)
- Implement the Pulse Bar
- Fix all known bugs in TODO.md (DateStrip scroll, SettingsScreen colors, LogFormScreen colors)
- Set up EAS Build for TestFlight distribution
- Implement offline-first data sync strategy (SQLite primary, Supabase sync)

**P1 -- Within first month**
- Add unit tests for all new features (search, carry-forward, task creation, overdue logic)
- Implement push notifications (iOS APNs via Expo Notifications)
- Wire Supabase auth (currently bypassed in dev mode)
- Implement the freemium gate (5 logs/day free, unlimited Pro)
- Activity overlap validation
- Performance profiling on physical devices

**P2 -- Within first quarter**
- Skills system architecture (routing, context recipes, SRK level tracking)
- Tomorrow feature with world context (weather API, day type detection)
- User model computation (energy curves, completion patterns)
- Google Calendar read adapter
- Universal Entry migration (Activity -> Entry with type + metadata)
- Edge function deployment pipeline

### Current Gaps

- **DB abstraction**: Two completely separate code paths for web and native. Schema defined in multiple places. This is the highest-risk technical debt.
- **No CI/CD**: No automated builds, no test pipeline, no lint enforcement on push.
- **No real auth**: Supabase auth is bypassed in dev mode. Production auth flow not tested.
- **No offline sync**: SQLite is local-only, Supabase is remote-only. No sync strategy.
- **No push notifications**: Critical for the nudge loop (end-of-day planning, log prompts). Requires a dev build, not Expo Go.
- **No error tracking**: No Sentry, no Bugsnag, no crash reporting.
- **No performance monitoring**: No baseline metrics for cold start, render times, memory usage.
- **Test coverage unknown**: Tests exist in `src/__tests__/` but coverage percentage is not tracked.

### Implementation Tasks

- Create `src/lib/db/DatabaseAdapter.ts` -- interface with `query()`, `execute()`, `transaction()` methods
- Create `src/lib/db/SQLiteAdapter.ts` and `src/lib/db/WebAdapter.ts` implementing the interface
- Migrate all direct DB calls to use the adapter
- Set up EAS Build: `eas build:configure` then `eas build --platform ios --profile preview`
- Add Sentry: `npx expo install @sentry/react-native`, configure in `App.tsx`
- Set up GitHub Actions CI: lint, typecheck, test on every push
- Create `src/__tests__/commandLayer.test.ts` -- test natural language parsing
- Create `src/__tests__/activities.test.ts` -- test CRUD operations
- Wire Supabase auth: implement sign-up, sign-in, password reset flows in `authStore.ts`

### Best Practices

- **Linear**: Single codebase, no microservices until absolutely necessary. Monorepo. Ship daily. Feature flags for incomplete work.
- **Figma**: Obsessive about performance. Every interaction is measured. If something takes more than 100ms, it gets a loading state.
- **Notion**: Offline-first architecture from day 1. Conflict resolution is a first-class concern. CRDT-based sync.
- **Apple**: Instruments profiling before every release. Memory leaks are P0 bugs. 60fps is non-negotiable.
- **Spotify**: Trunk-based development. Feature flags everywhere. A/B test infrastructure is part of the core platform, not an afterthought.

---

## 4. Data & Analytics

**Mission**: Instrument DayFlow so every product decision is informed by real user behavior, not assumptions.

### OKRs (Q2 2026)

**Objective 1: Establish a metrics foundation before launch**
- KR1: PostHog (or equivalent) integrated with 15+ key events tracked by May 1
- KR2: Define and instrument the activation funnel: Install -> First time block -> First log -> D1 return
- KR3: Build a real-time dashboard showing DAU, WAU, retention curves, feature usage

**Objective 2: Enable data-driven feature decisions**
- KR1: Every P1+ feature has a pre-defined success metric tracked in PostHog
- KR2: Ship at least 1 A/B test in Q2 (candidate: onboarding flow variant)
- KR3: Weekly metrics review with documented insights (written, not just glanced at)

**Objective 3: Build the user behavior data pipeline for the AI layer**
- KR1: Compute energy curve (mood/energy by hour) for users with 14+ days of log data
- KR2: Compute completion pattern (% tasks done by day of week, time of day) for all users
- KR3: Generate user model summary string that fits in 500 tokens for AI context injection

### Priority Roadmap

**P0 -- Must do before launch**
- Integrate PostHog SDK (`expo-posthog` or REST API fallback)
- Define and instrument the 15 core events:
  - `app_opened`, `time_block_created`, `task_created`, `activity_completed`, `activity_deleted`
  - `log_opened`, `log_submitted`, `log_skipped`
  - `quick_add_used`, `quick_add_ai_triggered`, `quick_add_ai_succeeded`, `quick_add_ai_failed`
  - `plan_tab_viewed`, `insights_tab_viewed`, `goal_created`
- Define the activation metric (proposed: user creates 3+ time blocks AND submits 1+ log within first 3 days)
- Set up retention cohort tracking

**P1 -- Within first month**
- Build the activation funnel dashboard
- Instrument feature-specific events (search used, date changed, swipe to complete, carry-forward)
- Set up weekly automated metrics email/report
- First A/B test: onboarding with/without guided first time block creation

**P2 -- Within first quarter**
- User model computation pipeline (energy curves, completion patterns, overcommitment signal)
- Pattern summary generation for AI context (per ARCHITECTURE.md User Model layer)
- Cohort analysis: power users vs casual users vs churned users
- Revenue analytics: conversion from free to Pro, LTV estimation
- Experimentation platform: ability to run 2+ concurrent A/B tests

### Current Gaps

- **No analytics at all**. Zero events tracked. No PostHog, no Mixpanel, no Amplitude. Flying blind.
- **No activation metric defined**. Cannot measure if users are finding value.
- **No retention tracking**. D1/D7/D30 retention is unknown.
- **No user model computation**. ARCHITECTURE.md describes energy curves and completion patterns but none are implemented.
- **No experimentation infrastructure**. Cannot A/B test anything.
- **No data pipeline for the AI layer**. `buildContext()` in `commandLayer.ts` has no user behavior data.

### Implementation Tasks

- Install PostHog: `npm install posthog-react-native` in `mobile/`
- Create `src/lib/analytics.ts` -- wrapper around PostHog with `track(event, properties)` function
- Add `analytics.track()` calls to all 15 core events in stores and screens
- Create `src/lib/userModel.ts` -- aggregation functions:
  - `computeEnergyProfile(userId, days)` -- average mood/energy by hour from ExperienceLog
  - `computeCompletionPattern(userId, days)` -- % completed by day of week
  - `computeOvercommitmentScore(userId, days)` -- planned vs completed ratio
  - `generateUserSummary(userId)` -- produces the 500-token summary string
- Wire `generateUserSummary()` into `buildContext()` in `commandLayer.ts`
- Set up PostHog dashboard: activation funnel, retention curve, feature usage breakdown

### Best Practices

- **Spotify**: "Metrics are a first-class citizen." Every squad owns their metrics. Metrics reviews happen weekly, not quarterly. They use a custom experimentation platform (Confidence) that handles multi-armed bandits.
- **Notion**: Tracks "time to value" -- how quickly a new user creates their first meaningful artifact. This single metric drove their onboarding redesign.
- **Linear**: Minimal analytics. They track what matters (activation, retention, NPS) and ignore vanity metrics (total signups, page views). Quality over quantity in events.
- **Figma**: Instruments every interaction to measure latency. Analytics serve both product decisions AND engineering performance.
- **Apple**: Privacy-preserving analytics. Differential privacy in data collection. Aggregate, never individual. DayFlow should follow this -- it's a personal data app.

---

## 5. Security & Privacy

**Mission**: DayFlow holds intimate personal data (mood, energy, reflections, daily schedules). Security and privacy are existential. A breach destroys user trust permanently.

### OKRs (Q2 2026)

**Objective 1: Implement production-grade authentication**
- KR1: Supabase Auth fully wired with email/password + Google SSO by May 1
- KR2: All API calls authenticated with JWT validation, zero unauthenticated endpoints
- KR3: Password reset flow working end-to-end on iOS

**Objective 2: Ensure data isolation and privacy**
- KR1: Supabase RLS policies enforced on 100% of tables -- no user can read another user's data
- KR2: AI context pipeline sends summaries only to LLM, never raw personal entries (per ARCHITECTURE.md)
- KR3: Document exactly what data leaves the device and where it goes (privacy architecture doc)

**Objective 3: Establish a security baseline**
- KR1: Zero high/critical vulnerabilities in `npm audit` by launch
- KR2: All secrets (API keys, Supabase credentials) stored in environment variables, never in source code
- KR3: Complete a self-audit using OWASP Mobile Top 10 checklist

### Priority Roadmap

**P0 -- Must do before launch**
- Wire Supabase Auth for real (currently dev-bypassed)
- Implement RLS policies on all Supabase tables (`activities`, `experience_logs`, `categories`, `goals`)
- Audit codebase for hardcoded secrets (`EXPO_PUBLIC_SUPABASE_URL`, API keys)
- Ensure the LLM never receives raw journal entries or full activity text -- only summaries
- Run `npm audit` and fix all high/critical vulnerabilities
- Implement secure token storage on device (Expo SecureStore)

**P1 -- Within first month**
- Implement rate limiting on Supabase edge functions (prevent AI abuse)
- Add biometric auth option (Face ID/Touch ID) for app unlock
- Implement data export (user can download all their data as JSON)
- Set up automated dependency vulnerability scanning in CI

**P2 -- Within first quarter**
- Implement data deletion (user can delete all data, GDPR Article 17)
- Encrypt sensitive fields at rest in SQLite (mood, energy, reflections)
- SOC 2 Type 1 readiness assessment (for enterprise/B2B future)
- Penetration test (can be self-directed using OWASP ZAP)
- Certificate pinning for API calls

### Current Gaps

- **Auth is bypassed**. Dev mode auto-login means auth has never been tested in a real flow. This is the biggest security gap.
- **No RLS policies tested**. Supabase tables may have RLS enabled but policies are not verified.
- **Secrets in code**. `EXPO_PUBLIC_SUPABASE_URL` contains "placeholder" -- production secrets management not set up.
- **No secure storage**. Auth tokens stored in AsyncStorage (unencrypted) instead of Expo SecureStore.
- **No privacy architecture document**. Users don't know what data goes where.
- **LLM data exposure undefined**. ARCHITECTURE.md says "LLM sees summaries only" but this is not enforced in code.
- **No dependency scanning**. `npm audit` has likely never been run.

### Implementation Tasks

- Create Supabase RLS policies:
  ```sql
  ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can only access own activities" ON activities
    FOR ALL USING (auth.uid() = user_id);
  ```
  (Repeat for `experience_logs`, `categories`, `goals`)
- Replace AsyncStorage with Expo SecureStore for auth tokens in `authStore.ts`
- Create `src/lib/privacy.ts` -- sanitization functions that strip PII before sending to LLM
- Run `cd mobile && npm audit --production` and fix results
- Create `/Users/abhishekasawa/Claude/flow/docs/security/privacy-architecture.md` -- document all data flows
- Add `.env.example` to repo with all required environment variables (no values)
- Set up GitHub Dependabot for automated vulnerability alerts

### Best Practices

- **Apple**: Privacy is a feature, not a compliance checkbox. App Tracking Transparency, nutrition labels on the App Store. DayFlow should lead with privacy in marketing.
- **Signal**: Minimal data collection. If you don't collect it, you can't leak it. DayFlow should collect only what's necessary for the product to function.
- **Linear**: SOC 2 Type II certified. Bug bounty program. Transparent security page. Even at startup stage, they prioritized this.
- **Notion**: Data residency options. User-controlled encryption keys (enterprise). Export all data anytime.
- **1Password**: Zero-knowledge architecture. The company cannot read user data even if subpoenaed. DayFlow should aspire to this for personal reflections.

---

## 6. Infrastructure

**Mission**: Build the deployment, monitoring, and operational foundation that lets a solo developer ship with the confidence of a 10-person team.

### OKRs (Q2 2026)

**Objective 1: Establish CI/CD pipeline**
- KR1: Every push to `main` triggers lint + typecheck + test suite in GitHub Actions by May 1
- KR2: EAS Build configured for TestFlight distribution, build time under 15 minutes
- KR3: Supabase edge functions deploy automatically on merge to `main`

**Objective 2: Set up monitoring and alerting**
- KR1: Sentry configured for crash reporting with 100% of unhandled exceptions captured
- KR2: Uptime monitoring on Supabase endpoints with PagerDuty/Slack alerts on downtime
- KR3: Error budget defined: 99.5% crash-free sessions target

**Objective 3: Automate the release process**
- KR1: One-command TestFlight submission: `eas submit --platform ios`
- KR2: Automated version bumping and changelog generation on release
- KR3: Release cadence established: weekly TestFlight builds, bi-weekly App Store submissions

### Priority Roadmap

**P0 -- Must do before launch**
- Set up GitHub Actions workflow: `lint -> typecheck -> test -> build`
- Configure EAS Build for iOS (`eas.json` with `preview` and `production` profiles)
- Set up Sentry for React Native crash reporting
- Configure environment variables for staging vs production (Supabase project per environment)
- First successful TestFlight build distributed to internal testers

**P1 -- Within first month**
- Set up Supabase edge function deployment in CI
- Configure uptime monitoring (Checkly, Better Uptime, or UptimeRobot)
- Set up Slack alerts for: crashes > 1% of sessions, edge function errors, auth failures
- Implement OTA updates via `expo-updates` for non-native code changes
- Database backup strategy (Supabase handles this, but verify retention and test restore)

**P2 -- Within first quarter**
- Staging environment (separate Supabase project, separate EAS build profile)
- Feature flags system (Statsig, LaunchDarkly, or PostHog feature flags)
- Automated performance regression testing in CI
- Log aggregation for edge functions (Supabase dashboard + custom alerts)
- Load testing for Supabase edge functions (expected: 100-1000 users)

### Current Gaps

- **No CI/CD at all**. No GitHub Actions, no automated tests on push, no automated builds.
- **No crash reporting**. If the app crashes in beta, nobody knows.
- **No monitoring**. Supabase could go down and there's no alert.
- **No staging environment**. Dev and production are the same (or nonexistent).
- **No release process**. Building and submitting to TestFlight is manual and undocumented.
- **No OTA updates**. Every bug fix requires a full App Store submission.
- **No feature flags**. Cannot ship incomplete features safely or A/B test.

### Implementation Tasks

- Create `.github/workflows/ci.yml`:
  ```yaml
  on: [push, pull_request]
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
        - run: cd mobile && npm ci
        - run: cd mobile && npx tsc --noEmit
        - run: cd mobile && npx eslint src/
        - run: cd mobile && npm test
  ```
- Run `cd mobile && eas build:configure` to generate `eas.json`
- Run `cd mobile && npx expo install @sentry/react-native` and configure
- Create a Supabase staging project (separate from production)
- Create `mobile/scripts/release.sh` -- bumps version, builds, submits to TestFlight
- Set up UptimeRobot to ping Supabase health endpoint every 5 minutes

### Best Practices

- **Linear**: Ships multiple times per day. Feature flags gate everything. Rollback is one click. Their CI runs in under 3 minutes.
- **Figma**: Canary releases -- 1% of users get the new version first. If error rates spike, automatic rollback.
- **Spotify**: Separate "release trains" for different parts of the app. Mobile has a weekly release cadence with automatic rollback triggers.
- **Notion**: Heavy investment in OTA updates to avoid App Store review bottleneck. Critical fixes ship same-day.
- **Apple (internal)**: Dogfooding -- employees use pre-release builds daily. DayFlow founder should be on the latest TestFlight build at all times.

---

## 7. Quality

**Mission**: Ensure DayFlow works correctly, looks right, and feels right on every device, every time.

### OKRs (Q2 2026)

**Objective 1: Establish automated testing foundation**
- KR1: 60% code coverage on business logic (`src/lib/`, `src/store/`) by June 30
- KR2: 15+ integration tests covering critical user flows (create activity, log experience, complete task)
- KR3: All tests run in CI and block merge on failure

**Objective 2: Eliminate visual regressions**
- KR1: Screenshot tests for 5 key screens (Today, Plan, Insights, Activity Form, Log Form)
- KR2: Zero visual regressions escape to TestFlight (caught in PR review or automated tests)
- KR3: Design QA checklist completed for every screen before launch

**Objective 3: Ship a bug-free launch build**
- KR1: Zero P0/P1 bugs in the launch build (all known bugs in TODO.md resolved)
- KR2: Complete regression test pass on iPhone 12, 14, 15 Pro before submission
- KR3: App Store review rejection rate: 0 (first submission accepted)

### Priority Roadmap

**P0 -- Must do before launch**
- Write unit tests for: activity CRUD, task completion, carry-forward logic, overdue detection
- Write unit tests for: commandLayer natural language parsing (50 test phrases)
- Fix all known bugs in TODO.md Bugs section
- Manual QA pass on physical iPhone for every screen
- Test offline behavior: airplane mode, create activities, come back online
- Test edge cases: midnight rollover, timezone changes, very long activity names

**P1 -- Within first month**
- Set up Jest snapshot testing for key components
- Set up Detox or Maestro for end-to-end testing on iOS
- Create a QA checklist template for feature PRs
- Establish bug triage process: P0 (crash/data loss), P1 (broken feature), P2 (visual), P3 (minor)
- Implement visual regression testing (Percy, Chromatic, or manual screenshot comparison)

**P2 -- Within first quarter**
- Automated accessibility testing (axe-core for React Native)
- Performance testing: measure and track cold start, screen transition times
- Fuzz testing for the natural language parser
- Beta user bug report flow (in-app feedback button -> GitHub issue)
- Device farm testing (BrowserStack App Live) for iPhone models not owned

### Current Gaps

- **Tests exist but coverage is unknown**. `src/__tests__/` has tests but no coverage report.
- **No integration tests**. Unit tests may exist but no end-to-end user flow tests.
- **No visual regression testing**. Design changes could break existing screens silently.
- **No QA process**. No checklist, no triage, no regression pass before release.
- **Known bugs are not triaged**. TODO.md lists bugs but doesn't prioritize them (P0 vs P3).
- **No device testing beyond dev phone**. Unknown behavior on older iPhones.
- **No accessibility testing**. VoiceOver, Dynamic Type, and contrast not verified.

### Implementation Tasks

- Create `mobile/src/__tests__/activities.test.ts` -- test all CRUD operations
- Create `mobile/src/__tests__/commandLayer.test.ts` -- test 50 natural language inputs
- Create `mobile/src/__tests__/overdue.test.ts` -- test carry-forward and overdue logic
- Run `cd mobile && npx jest --coverage` and add coverage threshold to `jest.config.js`:
  ```json
  { "coverageThreshold": { "global": { "branches": 50, "functions": 60, "lines": 60 } } }
  ```
- Create `docs/qa/qa-checklist.md` -- per-screen checklist for manual QA
- Triage bugs in TODO.md: assign P0/P1/P2/P3 severity to each
- Install and configure Maestro for iOS e2e tests: `brew install maestro`

### Best Practices

- **Apple**: Rejects apps that crash during review. They test on the oldest supported device. DayFlow must work on iPhone 12 (iOS 16+).
- **Linear**: "If it's broken, it's P0." They have near-zero known bug backlog. Bugs are fixed immediately, not tracked for later.
- **Figma**: Visual regression testing on every PR. They use Chromatic for Storybook components.
- **Notion**: Extensive manual QA for complex interactions (drag and drop, real-time collaboration). Some things can't be automated.
- **Spotify**: Automated accessibility testing in CI. Every PR is checked for VoiceOver labels, contrast ratios, and touch target sizes.

---

## 8. Growth

**Mission**: Acquire, activate, and retain users. Make DayFlow a daily habit, not a downloaded-then-forgotten app.

### OKRs (Q2 2026)

**Objective 1: Design and implement the activation funnel**
- KR1: Onboarding flow live in TestFlight by May 15
- KR2: 60% of new users create their first time block within 5 minutes of first open
- KR3: 40% of new users submit their first experience log within 24 hours of first open

**Objective 2: Build the retention engine**
- KR1: End-of-day planning nudge implemented (push notification at 8-9:30pm per TODO.md)
- KR2: Log prompt nudge implemented (30 min after activity end per TODO.md)
- KR3: D7 retention above 40% for beta cohort (Sunsama benchmark: ~35%)

**Objective 3: Prepare for organic growth**
- KR1: App Store listing optimized with 5 screenshots, description, and 10 ASO keywords
- KR2: Landing page live at dayflow.app with email waitlist (convert 5% of visitors)
- KR3: Identify and execute 2 organic growth channels (Product Hunt launch, relevant subreddits)

### Priority Roadmap

**P0 -- Must do before launch**
- Build onboarding flow: 3 screens (value prop, create first time block, submit first log)
- Implement push notification infrastructure (APNs via Expo Notifications)
- Design and implement the end-of-day planning nudge
- Design and implement the post-activity log prompt nudge
- Define activation metric and instrument it

**P1 -- Within first month**
- App Store listing: title, subtitle, description, keywords, 5 screenshots, 1 app preview video
- Landing page with email capture (Framer, Webflow, or custom)
- Product Hunt launch preparation (build a ship page, collect early supporters)
- In-app feedback mechanism (shake to report, or feedback button in settings)
- Implement streak/consistency indicator (days of continuous planning/logging)

**P2 -- Within first quarter**
- Referral system: "Invite a friend, both get 1 week Pro free"
- Weekly email digest: "Your week in review" (engagement data, patterns, insights)
- Social proof: "Join X knowledge workers who plan with DayFlow"
- Content marketing: blog posts on personal productivity systems, daily planning methods
- App Store Optimization: iterate on keywords based on search rankings

### Current Gaps

- **No onboarding flow**. New users see seed data or an empty screen. No guided first experience.
- **No push notifications**. The nudge system (planning prompt, log prompt) is the retention engine and it doesn't exist. Requires a dev build, not Expo Go.
- **No activation metric**. Cannot measure if users are finding value.
- **No landing page**. No web presence beyond the App Store listing (which doesn't exist yet either).
- **No organic growth strategy**. No plan for how users discover DayFlow.
- **No email capture**. No way to build a waitlist or communicate with interested users.
- **No in-app feedback**. Beta users have no way to report issues from within the app.

### Implementation Tasks

- Create `src/features/onboarding/` directory with screens:
  - `WelcomeScreen.tsx` -- value prop, "Your personal operating system"
  - `FirstBlockScreen.tsx` -- guided creation of first time block
  - `FirstLogScreen.tsx` -- guided first experience log
- Implement push notifications:
  - `expo install expo-notifications`
  - Create `src/lib/notifications.ts` -- register for push, schedule local notifications
  - Schedule end-of-day nudge: local notification at 8:30pm if tomorrow has <3 planned items
  - Schedule log prompt: local notification 30 min after `end_time` of completed activities
- Create App Store assets: take 5 screenshots using iPhone 15 Pro Max (6.7" display)
- Set up a Framer landing page at dayflow.app with Mailchimp email capture
- Add feedback button in Settings: opens email compose to feedback@dayflow.app

### Best Practices

- **Notion**: Bottoms-up growth. Users discover it through shared documents. The product IS the growth engine. DayFlow's equivalent: users sharing their weekly reviews or productivity patterns.
- **Figma**: "Time to first value" under 60 seconds. The onboarding flow gets the user to an "aha" moment immediately.
- **Linear**: Word-of-mouth only. No paid acquisition. Product quality drives growth. The app is so good that engineers tell other engineers.
- **Spotify**: Personalized onboarding. New users pick preferences, and the app immediately feels tailored. DayFlow could ask: "What does your typical day look like?" and pre-populate.
- **Apple**: App Store screenshots tell a story. Each screenshot highlights one feature with a clear headline. Not just UI dumps.

---

## 9. Content

**Mission**: Every word in and around DayFlow reinforces the product's identity as a premium personal operating system.

### OKRs (Q2 2026)

**Objective 1: Launch-ready App Store presence**
- KR1: App Store listing copy finalized and approved (title, subtitle, description, keywords) by May 1
- KR2: 5 App Store screenshots designed, each with a headline and feature callout
- KR3: 30-second app preview video produced

**Objective 2: In-app copy that reduces friction**
- KR1: Every empty state has helpful, encouraging copy (not "No items found")
- KR2: All error messages are user-friendly (not technical) and actionable
- KR3: AI-generated content (insights, suggestions) has a consistent voice: warm, concise, never condescending

**Objective 3: Support and documentation ready for beta**
- KR1: In-app help section with 10 FAQ articles (how to create time blocks, how to log, etc.)
- KR2: Changelog maintained for every TestFlight build (what's new, what's fixed)
- KR3: Beta feedback form accessible from within the app

### Priority Roadmap

**P0 -- Must do before launch**
- Write App Store listing:
  - Title: "DayFlow - Personal Operating System" (30 chars max)
  - Subtitle: "Plan, Log, Reflect, Grow" (30 chars max)
  - Description: 4000 chars covering value prop, key features, differentiators
  - Keywords: 100 chars, research competitors' keywords using AppFollow or Sensor Tower
- Write all empty state messages (Today with no activities, Plan with no tomorrow items, Insights with no data)
- Write all error messages (network error, auth failure, sync failure)
- Define the DayFlow voice: warm but direct, personal but not casual, encouraging but not patronizing
- Write onboarding screen copy

**P1 -- Within first month**
- Create a changelog system (in-app "What's New" screen shown after updates)
- Write 10 FAQ articles for in-app help
- Create release notes template for TestFlight builds
- Write the "Why DayFlow?" page for the landing site

**P2 -- Within first quarter**
- Blog content: 3-4 articles on personal productivity, daily planning, structured reflection
- Create a "DayFlow method" content piece -- the philosophy behind the product
- Social media presence: Twitter/X account with product updates
- Help center (Intercom, Crisp, or static site)
- Video tutorials: 3 short how-to videos (creating a day plan, using the log, reading insights)

### Current Gaps

- **No App Store listing**. Title, description, keywords, screenshots -- none exist.
- **No voice/tone guide**. The AI-generated content (insights, suggestions) has no defined personality.
- **Empty states are generic or missing**. Users hitting empty screens see nothing helpful.
- **No changelog**. Users don't know what changed between builds.
- **No FAQ or help**. Beta users have no self-service support.
- **No marketing content**. No blog, no social media, no landing page copy.

### Implementation Tasks

- Create `/Users/abhishekasawa/Claude/flow/docs/content/app-store-listing.md` -- draft listing copy
- Create `/Users/abhishekasawa/Claude/flow/docs/content/voice-guide.md` -- define DayFlow's writing voice with examples
- Create `src/components/EmptyState.tsx` -- reusable component with icon, title, description, CTA
- Add empty states to: TodayScreen, PlanScreen, InsightsScreen, GoalsScreen, SearchScreen
- Create `CHANGELOG.md` in repo root -- start tracking changes per version
- Create `src/features/settings/HelpScreen.tsx` -- in-app FAQ

### Best Practices

- **Apple**: "Think Different." Every word is intentional. Their product copy uses short sentences, active voice, and concrete benefits (not features).
- **Notion**: Documentation is a product. Their help center is exhaustive, with GIFs showing every interaction. It reduces support load to near zero.
- **Linear**: Changelog is a weekly blog post with personality. It's not just "fixed bugs" -- it tells a story about what improved and why.
- **Figma**: Community-driven content. Users create and share templates. The content ecosystem creates organic growth.
- **Spotify**: "Wrapped" -- turning user data into shareable content. DayFlow could do "Your Month in Review" as a shareable card.

---

## 10. Legal & Compliance

**Mission**: Ensure DayFlow can operate legally in all target markets, protect the company from liability, and meet app store requirements on first submission.

### OKRs (Q2 2026)

**Objective 1: App Store compliance on first submission**
- KR1: Privacy Nutrition Label completed in App Store Connect (all data types disclosed)
- KR2: Terms of Service and Privacy Policy published at dayflow.app/terms and dayflow.app/privacy
- KR3: App Review Guidelines checklist completed -- zero rejection-triggering violations

**Objective 2: GDPR and CCPA readiness**
- KR1: Data processing inventory documented (what data, where stored, who processes it, retention period)
- KR2: User data export and deletion implemented and tested
- KR3: Cookie/tracking consent mechanism if web version launches (not needed for iOS-only)

**Objective 3: Protect the business**
- KR1: DayFlow trademark search completed (no conflicts in productivity app category)
- KR2: Contributor License Agreement (CLA) ready for when first external contributor joins
- KR3: Terms of Service cover AI-generated content liability (LLM outputs are suggestions, not advice)

### Priority Roadmap

**P0 -- Must do before launch**
- Write Terms of Service (can use a generator like Termly.io as a starting point, then customize)
- Write Privacy Policy covering:
  - What data is collected (activities, logs, mood, energy, reflections)
  - Where it's stored (Supabase/AWS, user's device)
  - What's sent to third parties (Anthropic for AI processing -- summaries only)
  - User rights (access, export, deletion)
  - Children's data (COPPA: do not collect data from users under 13)
- Complete the App Store Connect Privacy Nutrition Label
- Add age gate or COPPA compliance statement (17+ rating recommended for personal data apps)
- Review Apple App Review Guidelines sections 1.x (Safety), 2.x (Performance), 5.x (Legal)

**P1 -- Within first month**
- Implement in-app consent flows (terms acceptance on first use, data processing consent)
- Host terms and privacy policy at dayflow.app/terms and dayflow.app/privacy
- Implement data export feature (JSON download of all user data)
- Implement data deletion feature (delete account and all associated data)

**P2 -- Within first quarter**
- GDPR Data Processing Agreement (DPA) with Supabase (they provide one)
- GDPR DPA with Anthropic (for AI processing)
- Trademark registration for "DayFlow" in relevant classes
- Review and comply with EU Digital Services Act (if distributing in EU)
- Insurance: general liability and E&O (errors and omissions) for AI-generated advice

### Current Gaps

- **No Terms of Service**. Cannot launch without this.
- **No Privacy Policy**. Required by both Apple App Store and GDPR.
- **No Privacy Nutrition Label**. App Store Connect requires this before submission.
- **No age verification/COPPA compliance**. If a child uses the app and logs personal data, this is a legal risk.
- **No data export/deletion**. GDPR requires both. Currently impossible.
- **No AI liability disclaimer**. AI-generated insights and suggestions could be interpreted as advice (wellness, health).
- **No DPA with vendors**. Supabase and Anthropic both process user data; DPAs are required under GDPR.

### Implementation Tasks

- Generate Terms of Service using Termly.io, customize for DayFlow's specific data handling
- Generate Privacy Policy, ensuring it covers: Supabase (data storage), Anthropic (AI processing), PostHog (analytics)
- In App Store Connect, fill out the Privacy Nutrition Label:
  - Data Used to Track You: None (if PostHog is configured for privacy mode)
  - Data Linked to You: Health & Fitness (mood, energy), User Content (reflections, activities)
  - Data Not Linked to You: Diagnostics (crash reports)
- Add terms acceptance screen to onboarding flow: "By continuing, you agree to our Terms of Service and Privacy Policy"
- Add `DELETE /api/user` Supabase edge function that deletes all user data
- Add "Delete Account" button in Settings with confirmation dialog
- Set app rating to 17+ in App Store Connect metadata

### Best Practices

- **Apple**: Rejects apps without a privacy policy link. The nutrition label must be accurate -- discrepancies get flagged. Review their guidelines at developer.apple.com/app-store/review/guidelines/.
- **Notion**: Transparent privacy center. Published a detailed "How Notion Uses Your Data" page with a simple comparison table. DayFlow should do the same.
- **Linear**: SOC 2 Type II early. They did it at ~20 employees because B2B customers require it. DayFlow is B2C but the discipline is valuable.
- **Signal**: Open-source, auditable privacy. The gold standard. DayFlow should at minimum publish what data goes where.
- **Calm/Headspace**: These apps handle similar sensitive data (mood, mental health). They set the standard for health-adjacent app compliance. Review their privacy policies as templates.

---

## Cross-Department Dependencies

### Critical Path to Launch

```
Legal (Terms + Privacy Policy)
  |
  v
Security (Auth + RLS) -----> Engineering (TestFlight build)
  |                               |
  v                               v
Infrastructure (CI/CD + Sentry)   Quality (QA pass)
  |                               |
  v                               v
Data (PostHog instrumented) ----> Product (Beta plan ready)
  |                               |
  v                               v
Growth (Onboarding flow) -------> Content (App Store listing)
  |                               |
  v                               v
  +----- LAUNCH (TestFlight) -----+
```

### Blocking Dependencies

| Blocked Department | Blocked By | Why |
|-------------------|------------|-----|
| Engineering (TestFlight) | Security (Auth) | Cannot ship with bypassed auth |
| Engineering (TestFlight) | Infrastructure (EAS Build) | Cannot distribute without build pipeline |
| Growth (Push notifications) | Engineering (Dev build) | Push notifications don't work in Expo Go |
| Growth (Onboarding) | Design (Onboarding screens) | Cannot build what isn't designed |
| Data (Analytics) | Engineering (PostHog SDK) | Analytics requires SDK integration |
| Content (App Store listing) | Design (Screenshots) | Need final UI for screenshots |
| Content (App Store listing) | Legal (Privacy Policy) | App Store requires privacy policy link |
| Quality (E2E tests) | Infrastructure (CI) | Tests must run in CI to be useful |
| Product (Metrics review) | Data (Dashboard) | Cannot review what isn't measured |
| Engineering (AI features) | Security (LLM data privacy) | Must define what data the LLM can see |

### Parallel Workstreams

These can happen simultaneously without blocking each other:

1. **Design** (onboarding + empty states) in parallel with **Engineering** (DB abstraction + bug fixes)
2. **Legal** (terms + privacy policy) in parallel with **Content** (App Store copy + voice guide)
3. **Infrastructure** (CI/CD setup) in parallel with **Quality** (writing tests)
4. **Data** (defining events) in parallel with **Growth** (designing onboarding flow)
5. **Security** (RLS policies + audit) in parallel with **Engineering** (feature development)

---

## Daily Standup Protocol

As a solo founder, the "standup" is a daily structured check-in across ALL departments, not just engineering. This prevents the common failure mode where engineering dominates and everything else is neglected until launch week.

### Daily Review (15 minutes, every morning)

**Format**: Answer one question per department. Not all departments need attention every day. Flag any department that's been untouched for 5+ days.

| Department | Daily Question | Red Flag |
|-----------|---------------|----------|
| Product | What's the top user problem I'm solving today? | Shipping features without knowing why |
| Design | Does today's work match the design system? | Hardcoded values, inconsistent patterns |
| Engineering | What am I building? What's blocking? | Building without tests, ignoring tech debt |
| Data | Am I measuring what I'm building? | Shipping features with no analytics |
| Security | Am I introducing any new data exposure? | New API calls, new LLM context, new storage |
| Infrastructure | Can I deploy what I built yesterday? | Cannot build, cannot test, cannot ship |
| Quality | Did I test what I built yesterday? | Shipping untested code |
| Growth | Will a new user find value in what I built? | Building for existing users only |
| Content | Did I update user-facing copy? | Empty states, error messages, unclear labels |
| Legal | Did I change how user data is handled? | New data collection without policy update |

### Weekly Review (1 hour, every Friday)

1. **Metrics review** (15 min): DAU, retention, feature usage, crash rate, error rate
2. **Department audit** (30 min): For each department, check the P0 items. Are any past due? Any new blockers?
3. **Priority adjustment** (15 min): Re-stack the coming week. What's the one thing that matters most?

### Monthly Review (2 hours, first Monday)

1. **OKR progress check**: Score each KR (0.0 to 1.0). Anything below 0.3 needs intervention.
2. **Roadmap adjustment**: Based on actual data (retention, usage, feedback), reprioritize P1/P2 items.
3. **Department health**: Which department is most neglected? Dedicate focused time.
4. **User interviews**: Schedule 2-3 for the coming month.

---

## Scaling Plan

### Solo (1 person, AI-assisted) -- Current Stage

**What to automate (let AI/tools handle)**:
- Code generation and refactoring (Claude Code)
- Unit test writing (Claude Code)
- CI/CD pipeline (GitHub Actions)
- Crash reporting and alerting (Sentry)
- Analytics dashboard (PostHog)
- Dependency vulnerability scanning (Dependabot)
- App Store screenshot generation (Fastlane snapshots)
- Design QA (automated screenshot comparison)
- Terms of Service / Privacy Policy generation (Termly.io, then customize)
- Changelog generation from commit history

**What to do manually (requires human judgment)**:
- Product strategy and prioritization (what to build and why)
- Design taste decisions (what looks and feels right)
- User interviews and qualitative research
- AI prompt engineering and context design
- App Store review responses
- Critical security decisions
- Pricing strategy
- Beta user relationship management

**Solo toolkit**:
| Tool | Department | Cost |
|------|-----------|------|
| Claude Code | Engineering, Quality, Content | Subscription |
| GitHub Actions | Infrastructure | Free (2000 min/mo) |
| Sentry | Infrastructure, Quality | Free tier |
| PostHog | Data | Free tier (1M events/mo) |
| EAS Build | Infrastructure | Free tier (30 builds/mo) |
| Supabase | Engineering | Free tier (500MB, 50K auth users) |
| Termly.io | Legal | Free tier |
| Framer | Growth (landing page) | $5/mo |
| UptimeRobot | Infrastructure | Free tier (50 monitors) |
| Fastlane | Infrastructure | Free (OSS) |

**Total non-Supabase recurring cost**: ~$5-25/month

### Seed (3-5 people) -- First Hires

**When to hire**: After achieving product-market fit signal (D30 retention > 25%, or 100+ organic weekly active users).

**Hire 1: Senior Full-Stack Engineer**
- Why first: The founder should shift to product/design/growth. Engineering is the most automatable with AI but also the biggest bottleneck at scale.
- Owns: Engineering, Infrastructure, Quality
- Key trait: Comfortable with AI-assisted development, React Native experience, can set up production infrastructure

**Hire 2: Growth/Marketing Generalist**
- Why second: Retention is proven, now need acquisition. This person covers Growth, Content, and parts of Product (user research).
- Owns: Growth, Content, App Store, landing page, social media, user interviews
- Key trait: Has shipped a consumer app before, understands mobile growth levers, can write compelling copy

**Hire 3: Designer (Part-time/Contract)**
- Why third: The design system is established. Need someone to execute and evolve it, not define it from scratch.
- Owns: Design, Design QA, accessibility
- Key trait: iOS design expertise, can work within an established design system, Figma fluency

**Hire 4 (optional): Data/Analytics Engineer**
- Why: When the user model and AI context pipeline become the product differentiator, need someone dedicated.
- Owns: Data, user model computation, A/B testing infrastructure, AI context optimization
- Key trait: SQL fluency, experience with product analytics, comfortable with LLM prompt engineering

**Org chart at 5 people**:
```
Founder (CEO/CPO)
  |-- Product strategy, design direction, fundraising
  |
  +-- Senior Full-Stack Engineer
  |     |-- Engineering, Infra, CI/CD
  |     |-- Quality, testing
  |     |-- Security implementation
  |
  +-- Growth/Marketing Generalist
  |     |-- Growth, onboarding, retention
  |     |-- Content, App Store, landing page
  |     |-- User research, feedback loops
  |
  +-- Designer (part-time)
  |     |-- UI/UX design, design system
  |     |-- Accessibility, visual QA
  |
  +-- Data Engineer (optional)
        |-- Analytics, dashboards
        |-- User model pipeline
        |-- A/B testing
```

### Series A (10-15 people) -- Team Structure

**When to scale**: After $1M+ ARR or $2-5M Series A raised. Product-market fit confirmed. Growth is the bottleneck, not product.

**Engineering Pod (5 people)**
- Engineering Manager / Tech Lead (1)
- Senior iOS/RN Engineer (1) -- native performance, push notifications, device-specific issues
- Backend Engineer (1) -- Supabase, edge functions, data pipeline, sync
- AI/ML Engineer (1) -- cognitive loop, skills system, prompt engineering, user model
- QA Engineer (1) -- test automation, device testing, regression

**Product + Design Pod (3 people)**
- Head of Product (1) -- roadmap, metrics, user research, competitive analysis
- Senior Product Designer (1) -- UI/UX, interaction design, design system evolution
- Content Designer (1) -- in-app copy, App Store, help center, voice/tone

**Growth + Data Pod (3 people)**
- Head of Growth (1) -- acquisition, activation, retention, referral, revenue (AARRR)
- Data Analyst (1) -- analytics, dashboards, experimentation, cohort analysis
- Growth Engineer (1) -- onboarding experiments, notification optimization, A/B tests

**Operations (1-2 people)**
- Operations / Legal / Finance (1) -- compliance, vendor management, accounting
- Developer Relations / Community (1, optional) -- beta community, content marketing, social

**Org chart at 12 people**:
```
CEO/Founder
  |-- Vision, strategy, fundraising, culture
  |
  +-- Head of Product
  |     |-- Product Designer
  |     |-- Content Designer
  |
  +-- Engineering Manager
  |     |-- Senior iOS Engineer
  |     |-- Backend Engineer
  |     |-- AI/ML Engineer
  |     |-- QA Engineer
  |
  +-- Head of Growth
  |     |-- Data Analyst
  |     |-- Growth Engineer
  |
  +-- Operations Lead
        |-- DevRel (optional)
```

**Key structural decisions at this stage**:

1. **No separate Security department**. Security is embedded in Engineering with the Engineering Manager as DRI. Hire a dedicated security person at 25+ employees or after a compliance event.

2. **No separate Infrastructure team**. Infrastructure is owned by the Backend Engineer with DevOps tooling. Separate only when you have 5+ services or multi-region deployments.

3. **Product and Design are one pod**. At this stage, product and design should be tightly coupled. Separate them when you have 3+ product lines.

4. **Growth and Data are one pod**. Growth decisions need data, data exists to inform growth. Keep them together until you need a separate data platform team.

5. **AI/ML is in Engineering, not a separate team**. The AI layer is the product, not a service. The AI engineer works directly with the product team, not in an isolated research group.

---

## Appendix: Department Maturity Matrix

Track the maturity of each department over time. Score 1-5.

| Department | Level 1 (Ad hoc) | Level 3 (Established) | Level 5 (Optimized) | Current |
|-----------|-------------------|----------------------|---------------------|---------|
| Product | Founder intuition | Metrics-driven decisions | Predictive prioritization | 1 |
| Design | Ad hoc styling | Design system enforced | User-tested, accessible, dark mode | 2 |
| Engineering | Features ship | CI/CD, tests, monitoring | Performance budgets, feature flags | 1.5 |
| Data | No analytics | Dashboards, funnels, cohorts | Experimentation platform, ML pipeline | 0 |
| Security | Dev mode bypass | Auth, RLS, secret management | Pen tested, SOC 2, encryption at rest | 0.5 |
| Infrastructure | Manual deploys | CI/CD, monitoring, alerting | Canary releases, auto-rollback | 0 |
| Quality | Manual testing | Automated unit + integration | Visual regression, a11y, e2e | 0.5 |
| Growth | No onboarding | Onboarding, push notifications | Experimentation, lifecycle marketing | 0 |
| Content | No copy | App Store listing, voice guide | Content marketing, help center, video | 0 |
| Legal | Nothing | Terms, privacy policy, COPPA | GDPR certified, trademarked, insured | 0 |

**Target by end of Q2 2026**: Every department at Level 2 or higher. No zeros.

---

## Appendix: Quick Reference -- What to Do This Week

Based on the critical path and current gaps, here is the sequenced punch list for the next 7 days:

### Day 1-2: Legal + Security Foundation
- [ ] Generate Terms of Service and Privacy Policy (Termly.io)
- [ ] Run `npm audit` in `mobile/` and fix critical issues
- [ ] Wire Supabase Auth (replace dev bypass)

### Day 3-4: Infrastructure + Quality
- [ ] Create GitHub Actions CI workflow (lint, typecheck, test)
- [ ] Configure EAS Build for TestFlight
- [ ] Install Sentry, add crash reporting
- [ ] Write 10 unit tests for core business logic

### Day 5-6: Data + Growth
- [ ] Install PostHog, instrument 15 core events
- [ ] Build onboarding flow (3 screens)
- [ ] Implement push notification infrastructure

### Day 7: Content + Launch Prep
- [ ] Write App Store listing copy
- [ ] Design 5 App Store screenshots
- [ ] Create CHANGELOG.md
- [ ] Complete manual QA pass on physical iPhone

This is a forcing function. Not everything will get done in a week. But the sequencing ensures that no department is neglected and the critical path to TestFlight launch is unblocked.
