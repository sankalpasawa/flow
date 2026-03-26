# DayFlow Design Research: Any.do, Sunsama, Tiimo

Research conducted 2026-03-26. Sources listed at bottom.

---

## 1. Any.do — Design Patterns

### Daily View / Time-Blocking Canvas
- **"Plan My Day" morning ritual**: Each morning, surfaces undone tasks and lets you drag them into time slots or defer them. Low friction, no complexity. This is the closest thing to a guided daily planning flow in a mainstream task app.
- **Calendar views**: Daily, 3-day, weekly, and agenda views. Calendar syncs with Google/Outlook/iCal so your time blocks show up everywhere.
- **Time blocking is secondary**: Any.do's core is a task list with calendar bolted on. Time blocking exists but isn't the hero — it's drag-to-schedule, not a native hourly canvas.
- **DayFlow takeaway**: The "Plan My Day" surfacing mechanic is worth borrowing. But DayFlow's hourly canvas should be the *primary* view, not an add-on. Any.do proves users want a morning ritual but doesn't go deep enough.

### Color Scheme & Typography
- **Bright, minimal, white-dominant**: Clean white backgrounds, accent colors for categories/tags (user-selectable color tags for priorities).
- **Sans-serif typography**: Standard iOS system font feel. No distinctive typographic identity.
- **Beginner-friendly aesthetic**: Designed to feel approachable, not premium. The simplicity reads as "light" rather than "luxurious."
- **DayFlow takeaway**: Avoid the "too bare" trap reviewers call out. DayFlow should use richer typography (a distinctive sans-serif like Inter, SF Pro Display, or a geometric like Outfit) and a more intentional color palette to signal premium.

### Navigation Patterns
- **Bottom tab bar**: Standard iOS tab bar with sections for My Day, Tasks, Calendar, and more.
- **Swipe gestures**: Swipe-to-complete on tasks, standard iOS back navigation.
- **Natural language input**: Type or speak "Call mom tomorrow at 2pm" and it auto-creates a structured task with reminder. This is a signature ease-of-use pattern.
- **DayFlow takeaway**: The NLP input is aspirational for P3. For P0, a clean bottom tab bar (Day / Log / Insights) is the right call. Keep navigation to 3-4 tabs max.

### Task Completion States
- **Checkbox tap with subtle animation**: Standard checkmark animation, nothing celebratory. Clean and fast.
- **No confetti or reward animations** (unlike Asana): Any.do keeps completions quiet and low-key.
- **DayFlow takeaway**: Match this restraint. A satisfying but subtle completion animation (200-400ms, gentle opacity fade + checkmark draw) fits a luxury productivity brand. Save celebratory moments for end-of-day review/reflection.

### Empty States & Onboarding
- **Morning briefing as onboarding hook**: "Plan My Day" serves double duty — it's the daily ritual AND the way new users learn the app.
- **Empty states are functional**: When no tasks exist, the empty state guides you to add your first task. Nothing decorative.
- **DayFlow takeaway**: Use the hourly canvas as the onboarding surface. An empty day canvas with a single prompt ("What's your first block today?") is more inviting than a blank task list.

### Signature Interactions
- **WhatsApp integration**: Send voice messages to add tasks. Unique channel play.
- **Smart Grocery Lists**: Auto-categorizes items by store department. Clever but irrelevant to DayFlow.
- **DayFlow takeaway**: The voice-to-task pattern is interesting for future consideration but not P0.

---

## 2. Sunsama — Design Patterns

### Daily View / Time-Blocking Canvas
- **Calendar + task list side by side**: The desktop layout shows your task list on the left and calendar on the right. Drag tasks onto the calendar to timebox them. This is the gold standard for time-blocking UI.
- **Timeboxed tasks create real calendar events**: When you drag a task onto the calendar, it creates a corresponding event in Google/Outlook. Bidirectional sync.
- **Estimated durations on every task**: Each task has a time estimate. Sunsama sums these and warns you if your planned work exceeds your available hours.
- **Workload indicator**: Shows total planned hours vs. your preferred shutdown time. Visual "you're overcommitted" warning.
- **DayFlow takeaway**: The workload indicator and overcommitment warning are excellent patterns. DayFlow's hourly canvas should show a running total of blocked time vs. available hours. The side-by-side layout is desktop-native — for mobile, stack vertically (timeline on top, task backlog below or in a bottom sheet).

### Color Scheme & Typography
- **Muted, warm palette**: White background with soft, muted accent colors. Channels/projects get color-coded pills (users request more vibrant options, suggesting the defaults are deliberately subdued).
- **Typography**: Clean sans-serif, reportedly similar to Avenir. Readable, calm, professional. Users have requested font customization, suggesting the typography is distinctive enough to have opinions about.
- **Dark mode**: Available for late-night planning sessions.
- **DayFlow takeaway**: Sunsama proves that muted/warm colors signal "premium calm." DayFlow should use a similar approach: warm off-whites (not stark #FFFFFF), muted accent palette, and one distinctive typeface. The "calm professional" aesthetic is the target.

### Navigation Patterns
- **Keyboard-first on desktop**: Heavy keyboard shortcut usage (F for focus mode, etc.). Power-user oriented.
- **Left sidebar navigation**: Channels, contexts, integrations panel. Not a mobile-first design.
- **Mobile is secondary**: The Plan My Day and Shutdown rituals were recently added to mobile (Jan 2026), suggesting mobile was an afterthought.
- **DayFlow takeaway**: DayFlow's mobile-first advantage is real. Sunsama's weakest surface is mobile. Build the hourly canvas for thumb-first interaction.

### Task Completion States
- **Quiet completion**: Check off a task, it dims/strikes through. No celebration.
- **"Actual time" tracking**: When you complete a task, you can log how long it actually took vs. the estimate.
- **DayFlow takeaway**: The actual-vs-estimated time tracking is powerful for the experience log. When completing a time block in DayFlow, prompt for a quick reflection (mood, energy, would-repeat) rather than just checking a box.

### Empty States & Onboarding
- **Guided daily planning ritual**: Step-by-step morning flow that reviews yesterday's leftovers, pulls tasks from integrations, and builds today's plan. This IS the onboarding — you learn the app by doing the ritual.
- **Daily shutdown ritual**: End-of-day review of what got done, what didn't, move unfinished work. Takes 5-10 minutes. Closes cognitive loops.
- **Weekly review**: Friday summary of time allocation across projects/channels.
- **DayFlow takeaway**: The shutdown ritual is the single most borrowable pattern. DayFlow's experience log IS the shutdown ritual, but richer (mood, energy, reflection, not just task status). The morning planning + evening reflection bookends are the core loop.

### Signature Interactions
- **Focus Mode**: Press F, everything disappears except the current task and its timer. Removes all distractions.
- **Pull tasks from integrations**: Drag tasks from Asana/Jira/Linear/Notion panels directly into your daily plan. Sunsama is a "daily planner layer" on top of your existing tools.
- **Backlog 2.0 (Dec 2025)**: New list view for organizing non-daily tasks. First deviation from their kanban card style.
- **DayFlow takeaway**: Focus mode is a P1 feature worth building. The "pull from integrations" model is Sunsama's real moat for teams — DayFlow should counter with the experience log moat for individuals.

---

## 3. Tiimo — Design Patterns

### Daily View / Time-Blocking Canvas
- **Visual timeline, not a list**: Instead of text-heavy task lists, Tiimo shows your day as a color-coded vertical timeline. Each block is a large, rounded, colorful card.
- **Icon-driven, not text-driven**: Activities use icons and colors as primary identifiers, with text as secondary. This makes scanning instantaneous.
- **Drag-and-drop scheduling**: Move blocks around the timeline to reschedule.
- **DayFlow takeaway**: The visual-timeline-first approach is what DayFlow's hourly canvas should feel like. Large, colorful time blocks > tiny calendar cells. Use generous sizing, rounded corners, and color as the primary organizational signal.

### Color Scheme & Typography
- **3,000+ user-selectable colors**: Users pick their own palette. High-contrast for ADHD seekers, soft pastels for autism-friendly calm.
- **Soft gradients, rounded shapes**: The overall aesthetic is warm, bubbly, and approachable. Rounded rectangles everywhere. No sharp edges.
- **Soothing defaults with strong customization**: Good defaults that work for most, with deep customization for those who need it.
- **DayFlow takeaway**: Borrow the rounded, soft aesthetic but pitch it as "luxury" rather than "accessibility." Generous border-radius (12-16px), soft shadows, and a curated default palette (not 3,000 colors — pick 8-12 intentional ones). Customization as a premium unlock.

### Navigation Patterns
- **Minimal chrome**: The timeline IS the app. Very little navigation overhead.
- **Bottom actions**: Add activity, start timer. The timeline is always visible.
- **DayFlow takeaway**: Keep the hourly canvas as the hero. Navigation should be minimal — the canvas is always one tap away.

### Task Completion / Timer States
- **Visual focus timer**: Unlike countdown clocks, Tiimo shows time "moving" in a visual, intuitive way. Progress is visible as a filling/depleting shape, not just numbers.
- **Gentle transitions**: No harsh alerts. Transitions between activities are smooth and non-jarring.
- **No productivity shaming**: The app never makes you feel bad for not completing something. This is a deliberate design choice.
- **DayFlow takeaway**: The "no shaming" philosophy is critical for DayFlow's reflection layer. When a time block is missed or partially completed, the log prompt should be curious ("How did that go?") not judgmental ("You didn't finish"). The visual timer pattern (progress as shape, not number) is worth exploring for focus mode.

### Empty States & Onboarding
- **Onboarding flow**: Guided sign-up that showcases core features and encourages engagement. Available on Mobbin for reference.
- **Calendar import**: Onboarding includes importing existing calendar to populate the timeline immediately. No empty state — you start with your real schedule.
- **DayFlow takeaway**: Import from calendar on day 1 so the hourly canvas is never empty. An empty canvas is intimidating; a pre-populated one with existing commitments says "I already know your day, let's plan around it."

### Signature Interactions
- **Sensory-friendly design**: Every element tested for sensory comfort. Font selection, transition timing, color intensity — all shaped by neurodivergent user research.
- **iPhone App of the Year 2025**: Apple's stamp of design excellence.
- **Apple Design Award finalist 2024 (Inclusivity)**: Recognized specifically for inclusive design.
- **DayFlow takeaway**: Tiimo proves that accessibility-first design wins design awards. Build DayFlow with generous touch targets, adjustable text sizes, and reduced-motion options from day 1. It's not just ethical — it's a competitive advantage.

---

## Design Patterns Worth Borrowing for DayFlow

### From Any.do
- [ ] **Morning "Plan My Day" ritual** — guided daily planning flow that surfaces yesterday's unfinished work
- [ ] **Natural language task input** (P3) — "Call mom tomorrow at 2pm" auto-structures the task
- [ ] **Restrained completion animations** — satisfying but not celebratory (200-400ms, subtle)

### From Sunsama
- [ ] **Workload indicator with overcommitment warning** — sum of planned hours vs. shutdown time
- [ ] **Daily shutdown ritual** — end-of-day review that closes cognitive loops (DayFlow's evening reflection)
- [ ] **Focus Mode** (P1) — single-task view with timer, everything else hidden
- [ ] **Actual vs. estimated time tracking** — feeds directly into DayFlow's experience log
- [ ] **Muted, warm color palette** — warm off-whites, subdued accents, "calm professional" aesthetic
- [ ] **Keyboard shortcuts** (future desktop/iPad) — power-user velocity

### From Tiimo
- [ ] **Visual timeline as hero view** — large colorful blocks on a vertical timeline, not a text list
- [ ] **Icon + color as primary identifiers** — scan-first, read-second
- [ ] **Rounded, soft aesthetic** — generous border-radius, soft shadows, no sharp edges
- [ ] **Visual progress timer** — progress as filling shape, not ticking numbers
- [ ] **"No shaming" philosophy** — missed blocks prompt curiosity, not guilt
- [ ] **Calendar import on onboarding** — pre-populate the canvas so it's never empty
- [ ] **Sensory-friendly defaults** — generous touch targets, adjustable text, reduced-motion support

### Synthesis: DayFlow's Design Identity

```
Position on the spectrum:

Any.do          Sunsama          Tiimo           DayFlow (target)
|               |                |               |
Simple/Light    Calm/Pro         Warm/Inclusive   Warm/Luxurious
Mass market     Power users      Neurodivergent  Structured Achievers
$5/mo           $16-20/mo        $9/mo           $12-16/mo
```

**DayFlow should feel like**: Sunsama's calm professionalism meets Tiimo's visual warmth, wrapped in a premium material design language. Think: a beautifully bound leather planner, not a corporate SaaS tool.

**Core design principles**:
1. **The canvas is the app** — hourly timeline is always visible, always primary (Tiimo pattern)
2. **Ritual bookends** — morning plan + evening reflection frame every day (Sunsama pattern)
3. **Warm restraint** — muted palette, generous spacing, subtle animations (Sunsama + Tiimo)
4. **Curious, not judgmental** — reflection prompts explore, never shame (Tiimo philosophy)
5. **Pre-populated, never empty** — calendar import ensures day 1 value (Tiimo pattern)

---

## Sources

- [Any.do — The Ultimate Planner App](https://www.any.do/blog/planner-app-for-all-your-needs/)
- [Any.do — Time Blocking Complete Guide](https://www.any.do/blog/time-blocking/)
- [Any.do Review — Simple Task Management](https://www.primeproductiv4.com/apps-tools/anydo-review)
- [Any.do Review 2025 — Laird Page](https://lairdpage.com/anydo-review/)
- [Any.do Review — TechRepublic](https://www.techrepublic.com/article/any-do-review/)
- [Any.do Review — Cloudwards 2026](https://www.cloudwards.net/any-do-review/)
- [Any.do Review — The Digital Project Manager](https://thedigitalprojectmanager.com/tools/anydo-review/)
- [Sunsama — Daily Planning and Shutdown](https://www.sunsama.com/features/daily-planning-and-shutdown)
- [Sunsama — Timeboxing](https://help.sunsama.com/docs/timeboxing)
- [Sunsama — Focus Mode](https://www.sunsama.com/features/focus-mode)
- [Sunsama — Workspace Navigation](https://help.sunsama.com/docs/workspace-navigation)
- [Sunsama Review 2026 — Efficient App](https://efficient.app/apps/sunsama)
- [Sunsama Review — Productive with Chris](https://productivewithchris.com/app-reviews/sunsama-review-2025/)
- [Sunsama Review — Work Management](https://work-management.org/productivity-tools/sunsama-review/)
- [Sunsama Review — Saner AI 2026](https://blog.saner.ai/sunsama-reviews/)
- [Sunsama Changelog — Backlog 2.0](https://roadmap.sunsama.com/changelog)
- [Sunsama — Timeboxing 2.0 Roadmap](https://roadmap.sunsama.com/improvements/p/timeboxing-20)
- [Tiimo — Visual Planner for Every Neurotype](https://www.tiimoapp.com/)
- [Tiimo — Product Features](https://www.tiimoapp.com/product)
- [Tiimo — Sensory-Friendly Design](https://www.tiimoapp.com/resource-hub/sensory-design-neurodivergent-accessibility)
- [Tiimo — Visual Focus Timers](https://www.tiimoapp.com/timers)
- [Tiimo — Apple Design Award Finalist 2024](https://www.tiimoapp.com/resource-hub/tiimo-2024-apple-design-awards)
- [Tiimo iOS Animations — 60fps.design](https://60fps.design/apps/tiimo)
- [Tiimo Onboarding Flow — Mobbin](https://mobbin.com/explore/flows/16df946d-5f8e-45f7-b93d-951241938530)
- [Tiimo Calendar View — Mobbin](https://mobbin.com/explore/screens/0b24fb9a-3423-4b17-8d29-84c2260959c0)
- [Sunsama UI/UX — SaaS UI](https://www.saasui.design/application/sunsama)
- [UI/UX Evolution 2026 — Primotech](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)
- [Mobbin — UI & UX Design Inspiration](https://mobbin.com/)
