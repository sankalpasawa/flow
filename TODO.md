# Asawa Inc. — Work Items

## Layer 1: Abstraction / Meta (How We Work)

These are not product features. They're about how a human works with AI agents to build companies.

### Operating System for Human-AI Collaboration
- [ ] **Operating Model implementation** — apply OPERATING-MODEL.md to daily work. Test Sense→Shape→Decide→Specify→Execute→Learn flow on next 3 features.
- [ ] **Voice agent** — natural voice interaction with Claude Code. Options: ElevenLabs, Edge TTS, Claude iOS. Current: macOS `say -v Tara` for summaries. Goal: conversational, energy-matching.
- [ ] **Floating Voice Listener (Desktop/Mac)** — always-on voice assistant that listens and executes. Opens apps, runs commands, creates activities. Could be standalone product under Asawa Inc.
- [ ] **Wispr Flow integration** — auto-submit in terminal after dictation. Explore keyboard automation.
- [ ] **Structured logging principles** — log at boundaries, not inside functions. Log failures, not successes.
- [ ] **Custom Claude Code agents** — create .claude/agents/ for each department (design-qa, security-scan, cto-review). Model, tools, and skills per agent.
- [ ] **Context engineering** — build repo maps, ring-based context loading, templates per operation type. From OPERATING-MODEL.md section 5.

### Philosophy / Research
- [ ] **Refine operating model** — test with real features, find what breaks, iterate. The model is v1.
- [ ] **Asawa Inc. structure** — holding company operating principles. Shared agent infrastructure. Portfolio company independence. From RESEARCH-SYNTHESIS.md.

---

## Layer 2: DayFlow (The Product)

### Ship to Users (P0 — do before anything else)
- [ ] **Unit tests** — at least parseActivity, rendering rules, actionEngine. 23/344 tests exist. Start with the critical paths.
- [ ] **Fix fontSize runtime error** — non-fatal but pollutes logs. Find the source.
- [ ] **PostHog analytics** — integrate before launch. Track: activity_created, activity_completed, search_query, play_query.
- [ ] **Privacy policy** — required for App Store. CISO flagged as P0 blocker.
- [ ] **JWT validation in edge function** — anyone can impersonate any user. P0 security.
- [ ] **Onboarding flow** — first-time user has zero guidance. First-user review: "check back in 3 months."

### Features (P1 — build soon)
- [ ] **Pulse bar** — micro-habit layer between date strip and canvas. See `designs/pulse-bar-mockup.html`.
- [ ] **Categories → Tags** — multiple labels per activity. Design mockup exists.
- [ ] **Proactive morning planning** — AI suggests the day. "Here's your day, what matters most?" The killer differentiator per first-user review.
- [ ] **Search screen polish** — LLM-enhanced search working but UI needs refinement.
- [ ] **Play screen chat history polish** — lazy loading animations, speed optimization (P2).
- [ ] **Duration picker scroll wheel** — implemented but needs polish on the interaction.
- [ ] **Play screen voice** — requires dev build (not Expo Go).

### Features (P2 — build later)
- [ ] **World context: weather, day type** — feed into AI context for smarter suggestions.
- [ ] **Basic user model** — aggregate completion patterns, energy curves from ExperienceLog.
- [ ] **Insights tab redesign** — AI-derived observations with glass aesthetic.
- [ ] **Tomorrow planning with AI** — AI suggests tomorrow based on patterns + world context.
- [ ] **Settings screen** — toggle switches for notifications, mindset prompts, quiet hours.
- [ ] **Goals feature** — seed data, AI suggestions, editing, goal-activity linking.

### Features (P3 — future)
- [ ] **Journaling** — Universal Entry migration, journal entry type, AI cross-referencing.
- [ ] **Self-modification** — Glass WebView, edge function generation, agent orchestration.
- [ ] **Google Calendar** — read adapter → write adapter → two-way sync.
- [ ] **Energy curve computation** — mood/energy by time-of-day.
- [ ] **Freemium gate** — 5 logs/day free, Pro at $14-16/mo.

### Technical Debt
- [ ] **ActivityFormScreen: 1,402 lines** — needs splitting urgently. CTO review flagged.
- [ ] **9 files over 400 lines** — PlanScreen, PlayScreen, CanvasScreen, others.
- [ ] **Warm theme polish** — OnboardingScreen, SignInScreen, SignUpScreen border/focus states.
- [ ] **DateStrip scroll bug** — may not scroll to today on initial load.
- [ ] **SettingsScreen/LogFormScreen** — colors may need polish.

### Infrastructure
- [ ] **CI/CD pipeline** — GitHub Actions for build, test, deploy.
- [ ] **Sentry error tracking** — React Native crash reporting.
- [ ] **EAS Build** — switch from Expo Go to dev build for full native features.
- [ ] **Supabase RLS** — audit and enforce row-level security on all tables.

---

## Layer 3: Big Ideas (Asawa Inc. Portfolio)

- [ ] **Floating Voice Listener** — always-on desktop voice assistant. Platform-level idea. Could be separate company.
- [ ] **AI-native company operating system** — the operating model itself as a product. Other founders could use it to run their AI-agent companies.
- [ ] **DayFlow for teams** — shared calendars, team mindsets, collaborative planning. Enterprise play (future).
