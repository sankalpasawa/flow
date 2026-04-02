# DayFlow Testing Framework

> Related documents: [FEATURE-SPECS.md](./FEATURE-SPECS.md) | [TEST-PLAN.md](./TEST-PLAN.md) | [DESIGN.md](./DESIGN.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)
>
> If FEATURE-SPECS.md or TEST-PLAN.md exist alongside this document, they are the source of truth for feature definitions and test execution plans respectively. This document defines the **tooling, strategy, patterns, and complete test case inventory** (both automated and manual).

This document has two parts:
1. **Part A** -- Automated testing framework (tooling, pyramid, CI, 500+ automated test cases)
2. **Part B** -- Design QA testing (pixel-level verification, manual checks, 500 design test cases)

---

# PART A: Automated Testing Framework

## A1. Tooling

### A1.1 Unit & Component Tests: Jest + React Native Testing Library

```
jest + @testing-library/react-native
```

- **Why Jest**: Standard for React Native, excellent mocking, snapshot support, fake timers.
- **Why RNTL**: Queries by accessibility roles/text (not implementation details), encourages testing what the user sees.
- Config: `mobile/jest.config.js` with `preset: 'jest-expo'`.

### A1.2 E2E Tests: Maestro

```
maestro test .maestro/
```

- **Why Maestro**: YAML-based (easy to write/review), works natively with Expo, no Detox flakiness.
- Flows live in `mobile/.maestro/` directory.
- CI: Run via `maestro cloud` or self-hosted on macOS runners.

### A1.3 Visual Regression: jest-image-snapshot

```
jest + jest-image-snapshot (0.1% diff threshold)
```

- Screenshot comparison against committed baselines in `mobile/__image_snapshots__/`.
- Threshold: **0.1%** pixel difference triggers failure.
- Key screens captured at key states (empty, loaded, error, edge cases).
- Baselines updated explicitly via `--updateSnapshot` when design intentionally changes.

### A1.4 Design Token Compliance: Custom ESLint + Grep Checks

- **Custom ESLint rule**: `no-hardcoded-colors` -- flags any hex literal (#XXX, #XXXXXX, #XXXXXXXX), rgb(), rgba() outside of `theme.ts`.
- **Grep-based CI check**: Scans all `.ts`/`.tsx` files (excluding `theme.ts` and test files) for hardcoded color values.
- **Glass value enforcement**: All glass/blur values must use `colors.glass.*` tokens from theme.
- Runs in CI as a lint step before tests.

---

## A2. Test Pyramid

```
         /\
        /  \       10-15% E2E (Maestro)
       / E2E\      Critical user journeys
      /------\
     /        \    25-30% Component (RNTL)
    / Component\   UI rendering, interactions, states
   /------------\
  /              \ 55-65% Unit (Jest)
 /    Unit Tests  \ Pure functions, stores, data logic
/------------------\
```

| Layer     | Coverage | Tools                  | Speed   | What it tests                                    |
|-----------|----------|------------------------|---------|--------------------------------------------------|
| Unit      | 55-65%   | Jest                   | <5s     | Pure functions, stores, data transforms          |
| Component | 25-30%   | Jest + RNTL            | <30s    | Rendering, user interactions, state transitions  |
| E2E       | 10-15%   | Maestro                | <5min   | Full user journeys on real device/simulator      |

---

## A3. Visual Regression Strategy

### A3.1 Capture Points

| Screen                | States to capture                                           |
|-----------------------|-------------------------------------------------------------|
| CanvasScreen          | Empty day, populated day, with now-indicator, scrolled      |
| ActivityCard          | Each category tint, completed state, overdue badge          |
| BottomTaskBar         | Collapsed (0 tasks), 1 task, many tasks, expanded sheet     |
| DateStrip             | Today selected, past date, future date                      |
| ActivityFormScreen    | Empty form, filled form, validation errors                  |
| ExperienceLogScreen   | Empty log, partially filled, complete                       |
| PlayScreen            | Active session, paused, completed                           |
| SearchScreen          | Empty state, with results, no results                       |
| InsightsScreen        | No data, with data, loading                                 |
| GoalFormScreen        | Empty, filled, accordion expanded/collapsed                 |
| PlanScreen            | Empty week, populated week                                  |
| BacklogScreen         | Empty, with items                                           |
| OnboardingScreen      | Each step/page                                              |
| SettingsScreen        | Default state                                               |

### A3.2 CI Integration

1. On every PR, visual regression tests run against `main` baselines.
2. Failures produce a diff image (expected vs actual vs diff) attached as CI artifact.
3. Intentional design changes: update baselines on the PR branch, reviewer confirms visually.

---

## A4. Animation Testing Strategy

Animations are core to DayFlow's identity (spring physics everywhere). Testing approach:

### A4.1 Principles

- **Test outcomes, not intermediate frames.** Assert final position/opacity/scale, not frame-by-frame.
- **Use `jest.useFakeTimers()`** to advance animations to completion deterministically.
- **Verify spring configs produce correct final values.** A spring with `damping: 15, stiffness: 200` should settle at the target value.
- **Record video in CI** (Maestro) for manual review of animation quality.

### A4.2 What to Test

| Animation                     | Test approach                                      |
|-------------------------------|----------------------------------------------------|
| Press feedback (scale 0.97)   | Assert `transform.scale` reaches 0.97 on press     |
| Sheet spring open/close       | Assert final translateY matches open/closed state   |
| Swipe-to-complete             | Assert element removed after swipe threshold met    |
| Date strip swipe              | Assert selected date updates after swipe            |
| Pull to refresh               | Assert refresh callback fires                       |
| Task bar expand               | Assert sheet reaches expanded height                |

---

## A5. Design Token Compliance (Automated)

### A5.1 ESLint Rule: `no-hardcoded-colors`

```js
// BAD - will be flagged
const styles = { backgroundColor: '#F5F0E8' };
const styles = { color: 'rgba(255,255,255,0.65)' };

// GOOD - uses theme tokens
const styles = { backgroundColor: colors.background };
const styles = { color: colors.glass.surface };
```

### A5.2 Grep-Based CI Check

```bash
# Fail CI if any hardcoded hex colors found outside theme.ts
grep -rn --include="*.ts" --include="*.tsx" \
  --exclude="theme.ts" --exclude-dir="__tests__" \
  -E "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src/ \
  && echo "FAIL: Hardcoded colors found" && exit 1 \
  || echo "PASS: No hardcoded colors"
```

### A5.3 Glass Token Enforcement

All glass/frosted-glass values must reference `colors.glass.*` tokens:
- `colors.glass.surface` (or `colors.glass.bg`) -- semi-transparent white fill
- `colors.glass.border` -- white border
- `colors.glass.blur` -- backdrop blur amount

Any direct use of `backdrop-filter`, `backdropFilter`, or glass-like rgba values outside `theme.ts` is flagged.

---

## A6. Automated Test Case Inventory (502 cases)

### A6.1 Unit Tests: `parseActivity` (`src/lib/parseActivity.ts`)

Natural language parsing of activity input strings.

| ID | Test case | Expected |
|----|-----------|----------|
| PA-001 | Parse "Gym at 7am" | title: "Gym", start_time: 07:00 |
| PA-002 | Parse "Meeting at 2:30pm" | title: "Meeting", start_time: 14:30 |
| PA-003 | Parse "Lunch at noon" | title: "Lunch", start_time: 12:00 |
| PA-004 | Parse "Dinner at midnight" | title: "Dinner", start_time: 00:00 |
| PA-005 | Parse "Work for 2 hours" | title: "Work", duration: 120 |
| PA-006 | Parse "Read for 30 minutes" | title: "Read", duration: 30 |
| PA-007 | Parse "Yoga at 6am for 1 hour" | title: "Yoga", start_time: 06:00, duration: 60 |
| PA-008 | Parse "Call Mom at 5pm for 15 min" | title: "Call Mom", start_time: 17:00, duration: 15 |
| PA-009 | Parse "Run" (no time) | title: "Run", start_time: null |
| PA-010 | Parse empty string | returns null or error |
| PA-011 | Parse "Meeting tomorrow at 3pm" | title: "Meeting", date: tomorrow, start_time: 15:00 |
| PA-012 | Parse "Gym every Monday" | title: "Gym", recurrence: weekly, day: Monday |
| PA-013 | Parse "Meditate daily at 6am" | title: "Meditate", recurrence: daily, start_time: 06:00 |
| PA-014 | Parse "Dentist on March 15" | title: "Dentist", date: March 15 |
| PA-015 | Parse "Team standup at 9:15am" | title: "Team standup", start_time: 09:15 |
| PA-016 | Parse "Workout at 7" (ambiguous am/pm) | title: "Workout", start_time: 07:00 (default AM for morning-plausible) |
| PA-017 | Parse "Review at 3" (ambiguous am/pm) | title: "Review", start_time: 15:00 (default PM for afternoon-plausible) |
| PA-018 | Parse "Study from 2pm to 4pm" | title: "Study", start_time: 14:00, duration: 120 |
| PA-019 | Parse "Nap from 1-2pm" | title: "Nap", start_time: 13:00, duration: 60 |
| PA-020 | Parse string with special characters "Meeting @ HQ!" | title: "Meeting @ HQ!", time parsed if present |
| PA-021 | Parse very long string (200+ chars) | truncates title to 80 chars |
| PA-022 | Parse "High priority: Ship feature" | title: "Ship feature", priority: HIGH |
| PA-023 | Parse "!!!urgent fix deployment" | title: "fix deployment", priority: HIGH |
| PA-024 | Parse "maybe grocery shopping" | title: "grocery shopping", priority: LOW |
| PA-025 | Parse "Gym at 25:00" (invalid time) | handles gracefully, no crash |

### A6.2 Unit Tests: `actionEngine` (`src/lib/actionEngine.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| AE-001 | Create activity action | Activity created in store |
| AE-002 | Update activity title | Title updated |
| AE-003 | Update activity time | start_time updated |
| AE-004 | Update activity duration | duration_minutes updated |
| AE-005 | Update activity category | category_id updated |
| AE-006 | Delete activity | Activity removed from store |
| AE-007 | Complete activity | status: COMPLETED |
| AE-008 | Skip activity | status: SKIPPED |
| AE-009 | Start activity (begin in-progress) | status: IN_PROGRESS |
| AE-010 | Bulk complete multiple activities | All statuses: COMPLETED |
| AE-011 | Undo last action | Previous state restored |
| AE-012 | Action with invalid activity ID | Error handled gracefully |
| AE-013 | Action with missing required fields | Validation error returned |
| AE-014 | Create activity with all fields | All fields persisted correctly |
| AE-015 | Update recurrence on activity | recurrence_type updated |
| AE-016 | Action when store is empty | No crash, appropriate error |
| AE-017 | Concurrent actions on same activity | Last-write-wins or conflict resolution |
| AE-018 | Create task (no time) | Activity created with start_time: null |
| AE-019 | Convert task to time block | start_time set, renders as pill |
| AE-020 | Convert time block to task | start_time cleared, renders in task bar |

### A6.3 Unit Tests: `commandLayer` (`src/lib/ai/commandLayer.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| CL-001 | Parse CREATE_ACTIVITY command | Correct action dispatched |
| CL-002 | Parse UPDATE_ACTIVITY command | Correct fields updated |
| CL-003 | Parse DELETE_ACTIVITY command | Activity deleted |
| CL-004 | Parse COMPLETE_ACTIVITY command | Status set to COMPLETED |
| CL-005 | Parse SUGGEST_PLAN command | Plan suggestions returned |
| CL-006 | Parse RESCHEDULE command | Time updated |
| CL-007 | Parse ambiguous command | Clarification requested |
| CL-008 | Parse command with typos | Fuzzy match works |
| CL-009 | Parse multi-action command | Multiple actions dispatched in order |
| CL-010 | Parse command with conflicting instructions | Conflict flagged |
| CL-011 | Schema validation: valid command | Passes schema check |
| CL-012 | Schema validation: extra fields | Extra fields ignored |
| CL-013 | Schema validation: missing required fields | Validation error |
| CL-014 | Schema validation: wrong types | Type error returned |
| CL-015 | Rate limiting: within limit | Command executed |
| CL-016 | Rate limiting: exceeded (30/day) | Queued, user notified |
| CL-017 | Command execution timeout | Graceful timeout with error message |
| CL-018 | Command with empty payload | Handled without crash |
| CL-019 | Malformed JSON from LLM | Parse error caught, fallback |
| CL-020 | Command referencing non-existent activity | "Not found" error |

### A6.4 Unit Tests: `recurrence` (`src/lib/recurrence.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| RE-001 | Daily recurrence: next occurrence | Tomorrow same time |
| RE-002 | Weekly recurrence: next occurrence | Same day next week |
| RE-003 | Monthly recurrence: next occurrence | Same day next month |
| RE-004 | Daily recurrence: generate 7 days | 7 correct dates |
| RE-005 | Weekly recurrence: generate 4 weeks | 4 correct dates |
| RE-006 | Monthly recurrence: 31st of month | Handles short months (28/29/30) |
| RE-007 | Recurrence with end date | Stops generating after end date |
| RE-008 | Recurrence with no end date | Generates up to limit |
| RE-009 | Skip occurrence (single instance) | Skipped date excluded, rest continue |
| RE-010 | Edit single occurrence | Only that instance modified |
| RE-011 | Edit all future occurrences | All future instances updated |
| RE-012 | Delete recurring series | All instances removed |
| RE-013 | Delete single occurrence | Only that instance removed |
| RE-014 | Weekday-only recurrence (M-F) | Skips weekends |
| RE-015 | Every other day recurrence | Correct alternating dates |
| RE-016 | Recurrence crossing month boundary | Correct dates across months |
| RE-017 | Recurrence crossing year boundary | Correct dates across years |
| RE-018 | Recurrence crossing DST boundary | Times stay consistent |
| RE-019 | Generate occurrences for date range | Only matching dates returned |
| RE-020 | Recurrence with timezone | Correct local times |

### A6.5 Unit Tests: `calendar` (`src/lib/calendar.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| CA-001 | Get hours for day (24h) | Array of 24 hour slots |
| CA-002 | Calculate HOUR_HEIGHT positioning | Correct pixel offset for each hour |
| CA-003 | Activity top position from time | Correct top = time * HOUR_HEIGHT |
| CA-004 | Activity height from duration | Correct height = duration/60 * HOUR_HEIGHT |
| CA-005 | Time to Y-position at 00:00 | top = 0 |
| CA-006 | Time to Y-position at 12:00 | top = 12 * HOUR_HEIGHT |
| CA-007 | Time to Y-position at 23:59 | top ~= 24 * HOUR_HEIGHT |
| CA-008 | Y-position to time (reverse) | Correct time from pixel offset |
| CA-009 | Now indicator position | Correct Y for current time |
| CA-010 | Is today check | true for today, false for other dates |
| CA-011 | Format date for display | "Today", "Tomorrow", "Mar 15" etc. |
| CA-012 | Format time for display | "7:00 AM", "2:30 PM" |
| CA-013 | Get week dates from a date | Array of 7 dates (Mon-Sun or Sun-Sat) |
| CA-014 | Get month calendar grid | 35 or 42 day grid |
| CA-015 | Date comparison (same day) | true when same calendar day |
| CA-016 | Date comparison across timezones | Handles correctly |
| CA-017 | Duration formatting: 30min | "30m" |
| CA-018 | Duration formatting: 90min | "1h 30m" |
| CA-019 | Duration formatting: 0min | "0m" or empty |
| CA-020 | Date arithmetic: add days | Correct result across month boundaries |
| CA-021 | Date arithmetic: subtract days | Correct result |
| CA-022 | Get day start/end timestamps | 00:00:00 and 23:59:59 |
| CA-023 | Overlapping time blocks detection | Correctly identifies overlaps |
| CA-024 | Non-overlapping time blocks | Returns no overlaps |
| CA-025 | Activities sorted by time | Chronological order |

### A6.6 Unit Tests: `activitiesStore` (`src/store/activitiesStore.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| AS-001 | Initial state is empty | activities: [], tasks: [] |
| AS-002 | Add activity to store | Activity in list |
| AS-003 | Remove activity from store | Activity removed |
| AS-004 | Update activity in store | Fields updated |
| AS-005 | Fetch activities for date | Only matching date returned |
| AS-006 | Fetch tasks (no time) | Only untimed activities returned |
| AS-007 | Fetch overdue activities | Past incomplete activities returned |
| AS-008 | Complete activity | status changes to COMPLETED |
| AS-009 | Filter by category | Only matching category returned |
| AS-010 | Sort by time | Chronological order |
| AS-011 | Sort by priority | HIGH > MEDIUM > LOW |
| AS-012 | Carry forward past incomplete | Shows on today with overdue badge |
| AS-013 | Multiple activities same time slot | All returned for that slot |
| AS-014 | Store persistence after reload | Data survives reload |
| AS-015 | Optimistic update + rollback on error | UI updates then reverts if DB fails |

### A6.7 Unit Tests: `goalsStore` (`src/store/goalsStore.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| GS-001 | Create goal | Goal added to store |
| GS-002 | Update goal progress | progress_pct updated |
| GS-003 | Delete goal | Goal removed |
| GS-004 | Filter goals by category | Only matching returned |
| GS-005 | Sort goals by target date | Nearest deadline first |
| GS-006 | Goal completion (100%) | Marked as complete |
| GS-007 | Goal with no target date | Sorted to end |
| GS-008 | Update goal title/description | Fields updated |

### A6.8 Unit Tests: `authStore` (`src/store/authStore.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| AU-001 | Dev mode auto-login | User set to dev-user-001 |
| AU-002 | Demo account login | User set to demo-user-001 |
| AU-003 | Sign out | User cleared, signed_out flag set |
| AU-004 | Sign back in after sign out | signed_out flag cleared |
| AU-005 | Invalid credentials | Error state set |
| AU-006 | Session persistence | User persists across reloads |
| AU-007 | Dev mode detection (placeholder URL) | Auto-bypasses auth |

### A6.9 Unit Tests: Database Layer (`src/lib/db/`)

| ID | Test case | Expected |
|----|-----------|----------|
| DB-001 | Create activity in DB | Row inserted, ID returned |
| DB-002 | Read activity by ID | Correct row returned |
| DB-003 | Update activity | Row updated |
| DB-004 | Delete activity | Row removed |
| DB-005 | Query activities by date | Only matching date |
| DB-006 | Query activities by user_id | Only user's data |
| DB-007 | Query with LEFT JOIN (logs) | Joined data correct |
| DB-008 | Insert with OR IGNORE (duplicate) | No error, no duplicate |
| DB-009 | Create category | Category inserted |
| DB-010 | Read system categories | is_system = true returned |
| DB-011 | Create experience log | Log inserted |
| DB-012 | Read logs for activity | Correct logs returned |
| DB-013 | Update log within 24h window | Update succeeds |
| DB-014 | Update log after 24h window | Update rejected |
| DB-015 | Create goal in DB | Goal inserted |
| DB-016 | Update goal progress | Row updated |
| DB-017 | Delete goal | Row removed |
| DB-018 | Query goals by category | Correct filtered set |
| DB-019 | Schema migration: new column | Column added, data preserved |
| DB-020 | Web DB: SELECT with WHERE | Correct filtering |
| DB-021 | Web DB: SELECT with ORDER BY | Correct ordering |
| DB-022 | Web DB: SELECT with LIMIT | Correct row count |
| DB-023 | Web DB: INSERT | Row added to memory store |
| DB-024 | Web DB: UPDATE | Row modified |
| DB-025 | Web DB: LEFT JOIN | Joined data correct |
| DB-026 | Web DB: WHERE with date() | Date comparison works |
| DB-027 | Web DB: WHERE IS NULL | Null check works |
| DB-028 | Web DB: WHERE IS NOT NULL | Not-null check works |
| DB-029 | Web DB: localStorage persistence | Data survives page reload |
| DB-030 | Web DB: user_id partitioning | Users don't see each other's data |

### A6.10 Unit Tests: AI Layer (`src/lib/ai/`)

| ID | Test case | Expected |
|----|-----------|----------|
| AI-001 | Mindset prompt generation (mock LLM) | Returns string prompt |
| AI-002 | Mindset prompt for different categories | Category-appropriate prompts |
| AI-003 | Mindset prompt with user history context | Personalized prompt |
| AI-004 | Auto-category classification | Correct category assigned |
| AI-005 | Auto-category with ambiguous input | Reasonable default |
| AI-006 | AI error handling: API timeout | Graceful fallback |
| AI-007 | AI error handling: rate limit | User notified, queued |
| AI-008 | AI error handling: invalid response | Fallback to defaults |
| AI-009 | Circuit breaker: under 30 calls | All calls succeed |
| AI-010 | Circuit breaker: over 30 calls | Calls queued |
| AI-011 | Command schema sent to LLM | Schema matches expected format |
| AI-012 | LLM response parsed to action | Correct action object |
| AI-013 | Planning suggestions | Returns activity suggestions |
| AI-014 | Planning context: includes existing activities | Context has today's activities |
| AI-015 | Model routing: Haiku for classification | Correct model used |
| AI-016 | Model routing: Sonnet for mindset | Correct model used |

### A6.11 Unit Tests: Seed Data (`src/lib/db/seed.ts`, `seedDemo.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| SD-001 | Seed creates activities for dev user | Activities exist for dev-user-001 |
| SD-002 | Seed creates categories | System categories exist |
| SD-003 | Seed version tracking | localStorage tracks version |
| SD-004 | Seed version bump re-seeds | Old data replaced |
| SD-005 | Demo seed creates 210 tasks | Correct count for demo-user-001 |
| SD-006 | Seed idempotency | Running twice doesn't duplicate |
| SD-007 | Seed data matches schema | All fields valid |

### A6.12 Unit Tests: Notifications (`src/lib/notifications.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| NT-001 | Schedule log prompt nudge | Fires 30min after end_time |
| NT-002 | Schedule planning nudge | Fires 8-9:30pm when <3 activities |
| NT-003 | Cancel notification | Notification removed |
| NT-004 | Notification permissions denied | Graceful handling |
| NT-005 | Notification with activity context | Correct title/body |
| NT-006 | Suppress nudge (user opted out) | No notification fired |
| NT-007 | Web notification fallback | Uses web notification API or no-op |

### A6.13 Unit Tests: Sync (`src/lib/sync.ts`)

| ID | Test case | Expected |
|----|-----------|----------|
| SY-001 | Sync push: local changes to server | Changes uploaded |
| SY-002 | Sync pull: server changes to local | Changes downloaded |
| SY-003 | Sync conflict: local and server modified | Conflict resolved (last-write-wins) |
| SY-004 | Sync offline queue | Changes queued, sent on reconnect |
| SY-005 | Sync partial failure | Successful items committed, failed retried |

### A6.14 Component Tests: `ActivityCard`

| ID | Test case | Expected |
|----|-----------|----------|
| AC-001 | Renders title text | Title visible |
| AC-002 | Renders time range | "7:00 AM - 8:00 AM" visible |
| AC-003 | Renders category tint (Work) | Glass pill has Work category tint overlay |
| AC-004 | Renders category tint (Health) | Health tint overlay |
| AC-005 | Renders category tint (Personal) | Personal tint overlay |
| AC-006 | Renders category tint (Learning) | Learning tint overlay |
| AC-007 | Renders category tint (Social) | Social tint overlay |
| AC-008 | Renders completed state | Visual completed treatment applied |
| AC-009 | Renders overdue badge | "Overdue" badge visible for past incomplete |
| AC-010 | Renders in-progress state | IN_PROGRESS visual indicator shown |
| AC-011 | Height proportional to duration (30min) | Height = 30/60 * HOUR_HEIGHT |
| AC-012 | Height proportional to duration (60min) | Height = HOUR_HEIGHT |
| AC-013 | Height proportional to duration (120min) | Height = 2 * HOUR_HEIGHT |
| AC-014 | Tap opens edit form | Navigation to ActivityFormScreen |
| AC-015 | Long press shows context menu | Menu appears with options |
| AC-016 | Swipe right to complete | Status changes to COMPLETED |
| AC-017 | Swipe threshold not met | Card returns to position |
| AC-018 | Renders mindset prompt (italic) | Mindset text visible at 0.6 opacity |
| AC-019 | Mindset text truncation | 2-line clamp with ellipsis |
| AC-020 | Glass morphism effect | Backdrop blur + semi-transparent white applied |
| AC-021 | Card with no category | Default glass without tint |
| AC-022 | Card with very long title | Title truncated properly |
| AC-023 | Card accessibility: role | Accessible button role |
| AC-024 | Card accessibility: label | Descriptive accessible label |
| AC-025 | Press feedback animation | Scale to 0.97 on pressIn |

### A6.15 Component Tests: `BottomTaskBar`

| ID | Test case | Expected |
|----|-----------|----------|
| BT-001 | Renders with 0 tasks | "No tasks" or empty state |
| BT-002 | Renders with 1 task | Task visible, count shows 1 |
| BT-003 | Renders with many tasks | Count accurate, scrollable |
| BT-004 | Tap expands sheet | Sheet animates to expanded height |
| BT-005 | Swipe up expands sheet | Sheet animates to expanded height |
| BT-006 | Swipe down collapses sheet | Sheet animates to collapsed |
| BT-007 | Task completion in bar | Task marked complete, removed or struck-through |
| BT-008 | Add task from bar | New task created |
| BT-009 | Task shows title | Title text visible |
| BT-010 | Task shows category color | Category indicator present |
| BT-011 | Completed tasks count | "3/5 done" or similar |
| BT-012 | All tasks complete state | Success state shown |
| BT-013 | Sheet spring animation | Spring physics (damping 15, stiffness 200) |
| BT-014 | Safe area inset respected | Bottom padding for home indicator |
| BT-015 | Accessibility: bar role | Correct accessible role |

### A6.16 Component Tests: `DateStrip`

| ID | Test case | Expected |
|----|-----------|----------|
| DS-001 | Shows current week dates | 7 dates rendered |
| DS-002 | Today highlighted | Today has active/accent style |
| DS-003 | Tap date selects it | Selection state updates |
| DS-004 | Swipe left: next week | Next 7 dates shown |
| DS-005 | Swipe right: previous week | Previous 7 dates shown |
| DS-006 | Date format: day name + number | "Mon 15" format |
| DS-007 | Past dates styling | Muted appearance |
| DS-008 | Future dates styling | Normal appearance |
| DS-009 | Activity indicators on dates | Dots showing activities exist |
| DS-010 | Smooth swipe animation | No jank, spring physics |

### A6.17 Component Tests: `TaskItem` & `TaskSection`

| ID | Test case | Expected |
|----|-----------|----------|
| TI-001 | TaskItem renders title | Title visible |
| TI-002 | TaskItem renders category color | Category indicator shown |
| TI-003 | TaskItem swipe right to complete | Status: COMPLETED |
| TI-004 | TaskItem tap opens edit | Navigates to edit form |
| TI-005 | TaskItem overdue badge | Badge shown for past tasks |
| TI-006 | TaskItem completed appearance | Strike-through or dimmed |
| TI-007 | TaskItem priority indicator | HIGH/MEDIUM/LOW visual |
| TS-001 | TaskSection renders header | "Tasks" header visible |
| TS-002 | TaskSection collapsible | Toggle collapses/expands |
| TS-003 | TaskSection count in header | "Tasks (5)" format |
| TS-004 | TaskSection empty state | "No tasks" or hidden |
| TS-005 | TaskSection sorted by priority | HIGH first |

### A6.18 Component Tests: `ActivityFormScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| AF-001 | Empty form renders | All fields shown with defaults |
| AF-002 | Title input | Text entered and reflected |
| AF-003 | Time picker: scroll wheel | Time selectable to minute precision |
| AF-004 | Duration: None option | No duration set |
| AF-005 | Duration: 15m preset | 15 minutes set |
| AF-006 | Duration: 30m preset | 30 minutes set |
| AF-007 | Duration: 1h preset | 60 minutes set |
| AF-008 | Duration: custom | Custom duration widget opens |
| AF-009 | Category dropdown | Categories listed |
| AF-010 | Category selection | Category ID set |
| AF-011 | Frequency: once | No recurrence |
| AF-012 | Frequency: repeat | Repeat options shown (Any.do style) |
| AF-013 | Save button: valid form | Activity created/updated |
| AF-014 | Save button: missing title | Validation error shown |
| AF-015 | Edit mode: pre-fills fields | Existing data shown |
| AF-016 | Delete button in edit mode | Activity deleted |
| AF-017 | Cancel dismisses form | No changes saved |
| AF-018 | No header (today/tom/date/someday) | Header absent per design rule |
| AF-019 | Keyboard avoidance | Form scrolls when keyboard opens |
| AF-020 | Form accessibility | All inputs labeled |

### A6.19 Component Tests: `ExperienceLogScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| EL-001 | Renders for activity | Activity title shown |
| EL-002 | Mood selector (1-5) | 5 options, tappable |
| EL-003 | Energy selector (1-5) | 5 options, tappable |
| EL-004 | Reflection text input | Text enterable |
| EL-005 | Save log | Log created in DB |
| EL-006 | Edit existing log | Pre-fills values |
| EL-007 | Log within 24h window | Save succeeds |
| EL-008 | Log after 24h window | Save blocked, message shown |
| EL-009 | Completion percentage | 0/50/100 selector |
| EL-010 | Cancel without saving | No log created |

### A6.20 Component Tests: `CanvasScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| CS-001 | Renders hour labels (24h) | All hours visible on scroll |
| CS-002 | Now indicator at current time | Line at correct Y position |
| CS-003 | Auto-scroll to current time on load | Scrolled to now |
| CS-004 | Activities rendered as pills | Glass pills at correct positions |
| CS-005 | Watermark chips for recurring untimed | Floating chips visible |
| CS-006 | Empty day state | Clean canvas, no activities |
| CS-007 | Populated day with 10+ activities | All rendered, scrollable |
| CS-008 | Date strip at top | DateStrip component shown |
| CS-009 | Task bar at bottom | BottomTaskBar shown |
| CS-010 | Pull to refresh | Activities reloaded |
| CS-011 | Quick add button | FAB visible, tappable |
| CS-012 | Background color = #F5F0E8 | Warm cream background |
| CS-013 | Hour label font = Geist Mono | Monospaced hour labels |
| CS-014 | Tap on empty time slot | Quick add at that time |
| CS-015 | Scroll performance (no jank) | Smooth 60fps scroll |

### A6.21 Component Tests: `QuickAddScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| QA-001 | Text input auto-focused | Keyboard open on mount |
| QA-002 | Natural language parsing preview | Parsed time/duration shown live |
| QA-003 | Submit creates activity | Activity in store |
| QA-004 | Cancel dismisses | No activity created |
| QA-005 | AI category suggestion | Category auto-filled |

### A6.22 Component Tests: `SearchScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| SR-001 | Search input renders | Input field visible |
| SR-002 | Search by title | Matching activities shown |
| SR-003 | Search by category | Matching activities shown |
| SR-004 | Empty search state | Placeholder or recent items |
| SR-005 | No results state | "No results" message |
| SR-006 | Search result tap | Navigates to activity |
| SR-007 | Debounced input | Search fires after typing pause |
| SR-008 | Clear search | Results cleared |
| SR-009 | Search across dates | Results from multiple days |
| SR-010 | Search performance (large dataset) | Results within 200ms |

### A6.23 Component Tests: `PlayScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| PL-001 | Renders active session | Activity title + timer shown |
| PL-002 | Timer counts up/down | Time updates every second |
| PL-003 | Pause button | Timer pauses |
| PL-004 | Resume button | Timer resumes |
| PL-005 | Complete button | Activity marked COMPLETED, log prompt |
| PL-006 | Skip button | Activity marked SKIPPED |
| PL-007 | No active session | Empty/start state shown |
| PL-008 | Session with mindset prompt | Prompt visible during session |
| PL-009 | Background timer | Timer continues when app backgrounded |
| PL-010 | Transition to next activity | Auto-advances if sequential |

### A6.24 Component Tests: `PlanScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| PS-001 | Renders week view | 7 days visible |
| PS-002 | Day summary cards | Activity count per day |
| PS-003 | Tap day navigates to canvas | CanvasScreen for that date |
| PS-004 | Empty week state | Encouraging message |
| PS-005 | AI planning suggestions | Suggested activities shown |
| PS-006 | Drag to reorder | Activities reorderable |
| PS-007 | Copy day to next | Activities duplicated |
| PS-008 | Week navigation | Swipe or arrows to change week |

### A6.25 Component Tests: `InsightsScreen`

| ID | Test case | Expected |
|----|-----------|----------|
| IN-001 | Renders with no data | "Start logging" message |
| IN-002 | Mood trend chart | Chart with mood data points |
| IN-003 | Energy trend chart | Chart with energy data points |
| IN-004 | Category breakdown | Pie/bar chart of time per category |
| IN-005 | Completion rate | Percentage of activities completed |
| IN-006 | Best time of day insight | "You're most productive at 10am" |
| IN-007 | Date range selector | Filter insights by period |
| IN-008 | Goals section | Goals with progress bars |
| IN-009 | Loading state | Skeleton/shimmer shown |
| IN-010 | Refresh data | Updated insights |

### A6.26 Component Tests: Goals

| ID | Test case | Expected |
|----|-----------|----------|
| GF-001 | GoalFormScreen: empty form | Accordion sections visible |
| GF-002 | GoalFormScreen: title input | Title enterable |
| GF-003 | GoalFormScreen: description input | Description enterable |
| GF-004 | GoalFormScreen: category picker | Categories available |
| GF-005 | GoalFormScreen: target date picker | Date selectable |
| GF-006 | GoalFormScreen: accordion toggle | Sections expand/collapse |
| GF-007 | GoalFormScreen: save goal | Goal created |
| GF-008 | GoalFormScreen: validation | Missing title shows error |
| GF-009 | GoalFormScreen: edit pre-fills | Existing data shown |
| GF-010 | GoalFormScreen: delete | Goal removed |
| GO-001 | GoalSection: renders goals | List of goals visible |
| GO-002 | GoalSection: progress bar | Width = progress_pct% |
| GO-003 | GoalSection: completed styling | Checkmark or completed visual |
| GO-004 | GoalSuggestionCard: renders | Suggestion title + description |
| GO-005 | GoalSuggestionCard: accept | Goal created from suggestion |
| GO-006 | GoalSuggestionCard: dismiss | Card removed |

### A6.27 Component Tests: Auth, Backlog, Onboarding, Settings, Logs, Categories

| ID | Test case | Expected |
|----|-----------|----------|
| SN-001 | SignInScreen renders | Email + password fields, sign in button |
| SN-002 | Valid login | Navigates to main app |
| SN-003 | Invalid login | Error message shown |
| SN-004 | Navigate to sign up | SignUpScreen shown |
| SN-005 | SignUpScreen renders | All registration fields |
| SN-006 | Valid signup | Account created, navigates to app |
| SN-007 | Duplicate email | Error message shown |
| SN-008 | Password validation | Minimum length enforced |
| BK-001 | BacklogScreen: renders | Backlog items visible |
| BK-002 | BacklogScreen: empty state | "No backlog" message |
| BK-003 | BacklogScreen: move to today | Item scheduled for today |
| BK-004 | BacklogScreen: delete item | Item removed |
| OB-001 | OnboardingScreen: step 1 | First onboarding step shown |
| OB-002 | OnboardingScreen: navigation | Can advance through steps |
| OB-003 | OnboardingScreen: skip | Jumps to main app |
| OB-004 | OnboardingScreen: complete | Navigates to app, onboarding flag set |
| ST-001 | SettingsScreen: renders | All settings visible |
| ST-002 | SettingsScreen: sign out | User signed out |
| ST-003 | SettingsScreen: change prefs | Preferences saved |
| LF-001 | LogFormScreen: renders | Form fields visible |
| LF-002 | LogFormScreen: save | Log entry created |
| LH-001 | LogHistoryScreen: renders logs | Log entries visible |
| LH-002 | LogHistoryScreen: empty state | "No logs yet" message |
| LH-003 | LogHistoryScreen: filter by date | Filtered list shown |
| CT-001 | CategoryListScreen: renders | Categories listed |
| CT-002 | CategoryListScreen: system categories | 8 system categories shown |
| CT-003 | CategoryListScreen: create custom | New category created |
| CT-004 | CategoryListScreen: edit | Category updated |
| CT-005 | CategoryListScreen: delete custom | Custom category removed |
| CT-006 | CategoryListScreen: system undeletable | Delete disabled for system categories |

### A6.28 Component Tests: Navigation & Theme

| ID | Test case | Expected |
|----|-----------|----------|
| NV-001 | Tab navigator renders 4 tabs | Today, Plan, Insights, Settings |
| NV-002 | Tab tap navigates | Correct screen shown |
| NV-003 | Deep link to activity | ActivityFormScreen opens |
| NV-004 | Back navigation | Returns to previous screen |
| NV-005 | Navigation state persistence | Tab preserved on app resume |
| TH-001 | Background uses colors.background | #F5F0E8 |
| TH-002 | Glass surface uses colors.glass.* | Correct rgba |
| TH-003 | Glass border uses colors.glass.border | Correct rgba |
| TH-004 | Primary color uses colors.primary | #2D5A3E |
| TH-005 | Accent color uses colors.accent | #C4795B |
| TH-006 | Text color uses colors.text | #1A1714 |
| TH-007 | Font family: display | Instrument Sans 700 |
| TH-008 | Font family: body | Instrument Sans 500 |
| TH-009 | Font family: mono | Geist Mono |
| TH-010 | Spacing follows 4px grid | All spacing values % 4 === 0 |

### A6.29 E2E Tests: Maestro Flows

| ID | Flow | Steps | Expected |
|----|------|-------|----------|
| E2E-001 | Create activity (timed) | Open app > tap FAB > enter "Gym at 7am" > save | Activity pill at 7am on canvas |
| E2E-002 | Create task (untimed) | Open app > tap FAB > enter "Buy groceries" > save | Task in bottom task bar |
| E2E-003 | Complete via swipe | Canvas > swipe activity right | Activity shows completed state |
| E2E-004 | Log experience | Tap activity > log > set mood 4, energy 3 > save | Log saved, visible in history |
| E2E-005 | Search for activity | Tap search > type "gym" | Gym activities shown |
| E2E-006 | Play screen flow | Tap activity > start play > wait > complete | Timer runs, activity completed |
| E2E-007 | Create recurring activity | FAB > "Meditate daily at 6am" > save | Recurring instances generated |
| E2E-008 | Navigate between tabs | Tap each tab | Each screen renders |
| E2E-009 | Date navigation | Swipe date strip left/right | Different dates shown |
| E2E-010 | Plan screen: view week | Tap Plan tab | Week view with activity counts |
| E2E-011 | Insights with data | Navigate to Insights after logging | Charts visible |
| E2E-012 | Create goal | Insights > Goals > New Goal > fill form > save | Goal visible in list |
| E2E-013 | Edit activity | Tap activity > change title > save | Updated title shown |
| E2E-014 | Delete activity | Tap activity > delete | Activity removed from canvas |
| E2E-015 | Quick add multiple | FAB > add 3 activities quickly | All 3 on canvas |
| E2E-016 | Onboarding flow | Clear data > open app | Onboarding steps shown, completable |
| E2E-017 | Sign out and sign in | Settings > sign out > sign in | Data preserved |
| E2E-018 | Pull to refresh | Pull canvas down | Activities reloaded |
| E2E-019 | Category management | Settings > categories > create new | New category usable in form |
| E2E-020 | Backlog flow | Create untimed task > view backlog > schedule | Task moved to day |
| E2E-021 | Overdue carry forward | Create task for yesterday (incomplete) > view today | Task shown with overdue badge |
| E2E-022 | Demo account | Sign out > login demo > verify 210 tasks | Demo data present |
| E2E-023 | Full day flow | Create 5 activities > complete 3 > log 2 > check insights | End-to-end data integrity |
| E2E-024 | Offline resilience | Disable network > create activity > re-enable | Activity syncs when online |
| E2E-025 | Performance: canvas with 20 activities | Seed 20 activities > scroll canvas | Smooth scrolling, no dropped frames |

---

## A7. CI/CD Integration

### A7.1 Pipeline Stages

```
1. Lint (ESLint + design token compliance)     ~30s
2. Type check (tsc --noEmit)                   ~15s
3. Unit tests (Jest)                           ~30s
4. Component tests (Jest + RNTL)               ~60s
5. Visual regression (jest-image-snapshot)     ~90s
6. E2E tests (Maestro)                         ~5min
7. Coverage report                             ~10s
```

### A7.2 PR Requirements

- All lint checks pass (including design token compliance)
- Unit + component test coverage >= 80%
- No visual regression failures (or explicit baseline update)
- All E2E flows pass
- No TypeScript errors

### A7.3 Coverage Thresholds

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/lib/": {
      "branches": 85,
      "functions": 90,
      "lines": 90
    }
  }
}
```

---

## A8. Test File Organization

```
mobile/
  src/
    __tests__/                          # Shared test utilities
      setup.ts                          # Jest global setup
      utils.ts                          # Test helpers (renderWithProviders, etc.)
    lib/
      __tests__/
        parseActivity.test.ts           # PA-001 to PA-025
        actionEngine.test.ts            # AE-001 to AE-020
        recurrence.test.ts              # RE-001 to RE-020
        calendar.test.ts                # CA-001 to CA-025
        notifications.test.ts           # NT-001 to NT-007
        sync.test.ts                    # SY-001 to SY-005
      ai/__tests__/
        commandLayer.test.ts            # CL-001 to CL-020
        mindsetGenerator.test.ts        # AI-001 to AI-016
      db/__tests__/
        activities.test.ts              # DB-001 to DB-008
        categories.test.ts              # DB-009 to DB-010
        logs.test.ts                    # DB-011 to DB-014
        goals.test.ts                   # DB-015 to DB-018
        schema.test.ts                  # DB-019
        db.web.test.ts                  # DB-020 to DB-030
        seed.test.ts                    # SD-001 to SD-007
    store/__tests__/
      activitiesStore.test.ts           # AS-001 to AS-015
      goalsStore.test.ts                # GS-001 to GS-008
      authStore.test.ts                 # AU-001 to AU-007
    features/
      canvas/components/__tests__/
        ActivityCard.test.tsx            # AC-001 to AC-025
        BottomTaskBar.test.tsx           # BT-001 to BT-015
        DateStrip.test.tsx              # DS-001 to DS-010
        TaskItem.test.tsx               # TI-001 to TI-007
        TaskSection.test.tsx            # TS-001 to TS-005
      canvas/screens/__tests__/
        CanvasScreen.test.tsx           # CS-001 to CS-015
        ActivityFormScreen.test.tsx     # AF-001 to AF-020
        ExperienceLogScreen.test.tsx    # EL-001 to EL-010
        QuickAddScreen.test.tsx         # QA-001 to QA-005
      search/screens/__tests__/
        SearchScreen.test.tsx           # SR-001 to SR-010
      play/screens/__tests__/
        PlayScreen.test.tsx             # PL-001 to PL-010
      plan/screens/__tests__/
        PlanScreen.test.tsx             # PS-001 to PS-008
      insights/screens/__tests__/
        InsightsScreen.test.tsx         # IN-001 to IN-010
      goals/screens/__tests__/
        GoalFormScreen.test.tsx         # GF-001 to GF-010
      goals/components/__tests__/
        GoalSection.test.tsx            # GO-001 to GO-006
      auth/screens/__tests__/
        SignInScreen.test.tsx           # SN-001 to SN-004
        SignUpScreen.test.tsx           # SN-005 to SN-008
      backlog/screens/__tests__/
        BacklogScreen.test.tsx          # BK-001 to BK-004
      onboarding/screens/__tests__/
        OnboardingScreen.test.tsx       # OB-001 to OB-004
    navigation/__tests__/
      AppNavigator.test.tsx             # NV-001 to NV-005
    theme/__tests__/
      compliance.test.ts               # TH-001 to TH-010
  .maestro/
    create-activity.yaml                # E2E-001
    create-task.yaml                    # E2E-002
    swipe-complete.yaml                 # E2E-003
    log-experience.yaml                 # E2E-004
    search.yaml                         # E2E-005
    play-screen.yaml                    # E2E-006
    recurring-activity.yaml             # E2E-007
    tab-navigation.yaml                 # E2E-008
    date-navigation.yaml                # E2E-009
    plan-screen.yaml                    # E2E-010
    insights.yaml                       # E2E-011
    create-goal.yaml                    # E2E-012
    edit-activity.yaml                  # E2E-013
    delete-activity.yaml                # E2E-014
    quick-add-multiple.yaml             # E2E-015
    onboarding.yaml                     # E2E-016
    auth-flow.yaml                      # E2E-017
    pull-refresh.yaml                   # E2E-018
    category-management.yaml            # E2E-019
    backlog-flow.yaml                   # E2E-020
    overdue-carry-forward.yaml          # E2E-021
    demo-account.yaml                   # E2E-022
    full-day-flow.yaml                  # E2E-023
    offline-resilience.yaml             # E2E-024
    performance-canvas.yaml             # E2E-025
  __image_snapshots__/                  # Visual regression baselines
```

---

## A9. Test Utilities & Patterns

### A9.1 Render with Providers

```typescript
// __tests__/utils.ts
import { render } from '@testing-library/react-native';

export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NavigationContainer>
        <ThemeProvider>{children}</ThemeProvider>
      </NavigationContainer>
    ),
    ...options,
  });
}
```

### A9.2 Mock Patterns

```typescript
// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { signIn: jest.fn() } },
}));

// Mock AI layer
jest.mock('../lib/ai', () => ({
  generateMindset: jest.fn().mockResolvedValue('Focus on the process.'),
  classifyCategory: jest.fn().mockResolvedValue('health'),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
```

### A9.3 Animation Testing Pattern

```typescript
import { act } from '@testing-library/react-native';

it('press feedback scales to 0.97', () => {
  jest.useFakeTimers();
  const { getByTestId } = renderWithProviders(<ActivityCard {...props} />);

  fireEvent(getByTestId('activity-card'), 'pressIn');
  act(() => jest.advanceTimersByTime(300));

  // Assert final animated value, not intermediate frames
  expect(getAnimatedValue(getByTestId('activity-card'), 'transform.scale'))
    .toBeCloseTo(0.97);

  jest.useRealTimers();
});
```

### A9.4 Maestro Flow Template

```yaml
# .maestro/create-activity.yaml
appId: com.dayflow.app
---
- launchApp
- tapOn: ".*fab.*"          # Floating action button
- inputText: "Gym at 7am"
- tapOn: "Save"
- assertVisible: "Gym"
- assertVisible: "7:00 AM"
```

---

## A10. Getting Started

```bash
# Install test dependencies
cd mobile
npm install --save-dev @testing-library/react-native jest-image-snapshot

# Install Maestro (macOS)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run unit + component tests
npm test

# Run with coverage
npm test -- --coverage

# Update visual snapshots
npm test -- --updateSnapshot

# Run E2E (requires simulator or device)
maestro test .maestro/

# Run design token lint check
npx eslint src/ --rule 'no-hardcoded-colors: error'
```

---

## A11. Automated Test Count Summary

| Category | Count | IDs |
|----------|-------|-----|
| parseActivity | 25 | PA-001 to PA-025 |
| actionEngine | 20 | AE-001 to AE-020 |
| commandLayer | 20 | CL-001 to CL-020 |
| recurrence | 20 | RE-001 to RE-020 |
| calendar | 25 | CA-001 to CA-025 |
| activitiesStore | 15 | AS-001 to AS-015 |
| goalsStore | 8 | GS-001 to GS-008 |
| authStore | 7 | AU-001 to AU-007 |
| database layer | 30 | DB-001 to DB-030 |
| AI layer | 16 | AI-001 to AI-016 |
| seed data | 7 | SD-001 to SD-007 |
| notifications | 7 | NT-001 to NT-007 |
| sync | 5 | SY-001 to SY-005 |
| ActivityCard | 25 | AC-001 to AC-025 |
| BottomTaskBar | 15 | BT-001 to BT-015 |
| DateStrip | 10 | DS-001 to DS-010 |
| TaskItem + TaskSection | 12 | TI/TS-001 to TI/TS-005 |
| ActivityFormScreen | 20 | AF-001 to AF-020 |
| ExperienceLogScreen | 10 | EL-001 to EL-010 |
| CanvasScreen | 15 | CS-001 to CS-015 |
| QuickAddScreen | 5 | QA-001 to QA-005 |
| SearchScreen | 10 | SR-001 to SR-010 |
| PlayScreen | 10 | PL-001 to PL-010 |
| PlanScreen | 8 | PS-001 to PS-008 |
| InsightsScreen | 10 | IN-001 to IN-010 |
| Goals components | 16 | GF/GO-001 to GF/GO-010 |
| Auth/Backlog/Onboarding/etc. | 29 | SN/BK/OB/ST/LF/LH/CT-* |
| Navigation + Theme | 15 | NV/TH-001 to NV/TH-010 |
| E2E Maestro flows | 25 | E2E-001 to E2E-025 |
| **TOTAL (Part A)** | **505** | |

---
---

# PART B: Design QA Testing Framework

Exhaustive test suite covering every pixel, interaction, feature, and architectural rule in DayFlow. Each test has a unique ID, description, expected value, source file, and verification method.

**Verification methods:**
- **CODE** = Read the source file and verify the value in StyleSheet or inline styles
- **GREP** = Run a grep/search across the codebase
- **INTERACT** = Test on device via Expo Go or simulator
- **SCREENSHOT** = Capture and visually compare
- **RUNTIME** = Check via console log, profiler, or debugger

---

## 1. Design Pixel Tests

### 1.1 ActivityCard (Glass Pill)

**File:** `mobile/src/features/canvas/components/ActivityCard.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PILL-001 | Glass background color | `rgba(255,255,255,0.65)` via `colors.glass.bg` | CODE |
| PILL-002 | Glass border color | `rgba(255,255,255,0.75)` via `colors.glass.border` | CODE |
| PILL-003 | Glass border width | `1` (1px) | CODE |
| PILL-004 | Glass backdrop blur | `20` via `colors.glass.blur` | CODE |
| PILL-005 | Category tint opacity | `0.12` via `colors.categoryTint` (DESIGN.md says 0.06 — verify mismatch) | CODE |
| PILL-006 | Normal pill border radius | `14` via `radii.md` | CODE |
| PILL-007 | Compact pill border radius (height < 50px) | `12` | CODE |
| PILL-008 | Normal pill padding vertical | `10` | CODE |
| PILL-009 | Normal pill padding horizontal | `12` | CODE |
| PILL-010 | Compact pill padding vertical | `6` | CODE |
| PILL-011 | Compact pill padding horizontal | `10` | CODE |
| PILL-012 | Title font size | `14` via `typography.title.fontSize` | CODE |
| PILL-013 | Title font weight | `'700'` via `typography.title.fontWeight` | CODE |
| PILL-014 | Title color | `colors.text` (#1A1714) | CODE |
| PILL-015 | Compact title font size | `12` | CODE |
| PILL-016 | Category icon size | `15` | CODE |
| PILL-017 | Mindset font size | `9.5` via `typography.mindset.fontSize` | CODE |
| PILL-018 | Mindset font weight | `'400'` via `typography.mindset.fontWeight` | CODE |
| PILL-019 | Mindset font style | `'italic'` via `typography.mindset.fontStyle` | CODE |
| PILL-020 | Mindset line height | `13` via `typography.mindset.lineHeight` | CODE |
| PILL-021 | Mindset opacity | `0.6` | CODE |
| PILL-022 | Mindset color | `colors.text2` (#4A4540) | CODE |
| PILL-023 | Compact mindset font size | `8.5` | CODE |
| PILL-024 | Mindset always visible when set | No `overflow: hidden` clipping mindset text | CODE |
| PILL-025 | Mindset truncation (compact) | Single line with "..." ellipsis, `numberOfLines={1}` | CODE |
| PILL-026 | Mindset truncation (normal) | 2-line clamp, `numberOfLines={2}` | CODE |
| PILL-027 | Shadow color | `#000` via `shadows.pill.shadowColor` | CODE |
| PILL-028 | Shadow offset | `{ width: 0, height: 3 }` via `shadows.pill.shadowOffset` | CODE |
| PILL-029 | Shadow opacity | `0.06` via `shadows.pill.shadowOpacity` | CODE |
| PILL-030 | Shadow radius | `8` via `shadows.pill.shadowRadius` | CODE |
| PILL-031 | Shadow elevation (Android) | `3` via `shadows.pill.elevation` | CODE |
| PILL-032 | Done state opacity | `0.4` | CODE |
| PILL-033 | Done state title | `textDecorationLine: 'line-through'` | CODE |
| PILL-034 | Now card accent glow | Shadow using `colors.accent` (#C4795B) | CODE |
| PILL-035 | Press feedback scale | `0.97` | CODE |
| PILL-036 | Long-press scale | `1.03` | CODE |
| PILL-037 | Long-press delay | `400` ms | CODE |
| PILL-038 | Swipe-to-complete threshold | `80px` (QA says 80, DESIGN.md swipe thresholds differ — verify) | CODE |
| PILL-039 | Subtask progress bar height | `3px` | CODE |
| PILL-040 | Subtask progress bar color | `colors.primary` (#2D5A3E) | CODE |
| PILL-041 | No accent bars present | No left border or accent bar styling | CODE |
| PILL-042 | Category communicated via tint only | `glassTintBackground()` function used, not solid bg | CODE |
| PILL-043 | Completed/skipped activity opacity on canvas | `0.5` | CODE |
| PILL-044 | Overlapping pills column gap | `4px` minimum gap between columns | CODE |
| PILL-045 | No hardcoded hex colors | All colors reference `colors.*` tokens | CODE + GREP |
| PILL-046 | Pill left position | Starts at `HOUR_LABEL_WIDTH` | CODE |
| PILL-047 | Pill right margin | `12px` | CODE |

### 1.2 CanvasScreen

**File:** `mobile/src/features/canvas/screens/CanvasScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| CANV-001 | Background color | `colors.bg` (#F5F0E8) | CODE |
| CANV-002 | Header title text | "Today" | CODE |
| CANV-003 | Header title font size | `32` via `type.h1.fontSize` or `typography.display` | CODE |
| CANV-004 | Header title font weight | `'700'` | CODE |
| CANV-005 | Header title letter spacing | `-0.5` | CODE |
| CANV-006 | Today button size | `36x36px` | CODE |
| CANV-007 | Today button radius | `12px` | CODE |
| CANV-008 | Today button green top bar | Uses `colors.primary` accent | CODE |
| CANV-009 | Search button size | `36x36px` | CODE |
| CANV-010 | Search button radius | `12px` | CODE |
| CANV-011 | Hour label font size | `10` via `typography.caption.fontSize` | CODE |
| CANV-012 | Hour label font weight | `'600'` via `typography.caption.fontWeight` | CODE |
| CANV-013 | Hour label font family | Monospace (Menlo on iOS) | CODE |
| CANV-014 | Hour label default opacity | `0.35` | CODE |
| CANV-015 | Hour label color | `colors.muted` (#8C857D) | CODE |
| CANV-016 | Current hour label color | `colors.accent` (#C4795B) | CODE |
| CANV-017 | Current hour label weight | `'700'` | CODE |
| CANV-018 | Current hour label opacity | `1` | CODE |
| CANV-019 | Hour line width | `1px` | CODE |
| CANV-020 | Hour line color | `colors.border` (#E0D9CE) | CODE |
| CANV-021 | Hour line opacity | `0.2` | CODE |
| CANV-022 | Past hour line opacity | `0.1` | CODE |
| CANV-023 | Now indicator dot size | `10px` | CODE |
| CANV-024 | Now indicator dot color | `colors.accent` (#C4795B) | CODE |
| CANV-025 | Now indicator pulsing glow | `2.5s ease-in-out` animation | CODE |
| CANV-026 | Now line width | `2px` | CODE |
| CANV-027 | Now line color | `colors.accent` (#C4795B) | CODE |
| CANV-028 | Now line opacity | `0.8` | CODE |
| CANV-029 | FAB size | `52x52px` via `sizes.fab.size` | CODE |
| CANV-030 | FAB radius | `16px` via `sizes.fab.radius` | CODE |
| CANV-031 | FAB color | `colors.primary` (#2D5A3E) | CODE |
| CANV-032 | FAB shadow | `shadows.fab` values | CODE |
| CANV-033 | FAB position bottom | `88` | CODE |
| CANV-034 | FAB position right | `20` | CODE |
| CANV-035 | Hour height | `80px` per hour | CODE |
| CANV-036 | Watermark z-index | `8` (above pills) | CODE |
| CANV-037 | Watermark right-aligned | `right: 0` or similar right alignment | CODE |
| CANV-038 | Watermark font size | `9px` via `typography.micro` | CODE |
| CANV-039 | Watermark text color | `colors.watermark.text` (#8B4A30) | CODE |
| CANV-040 | Watermark bg color | `colors.watermark.bg` (rgba(181,99,74,0.12)) | CODE |
| CANV-041 | Auto-scroll to current time on load | `hasAutoScrolled` ref pattern | CODE |
| CANV-042 | Pinch-to-zoom min scale | `0.7x` | CODE |
| CANV-043 | Pinch-to-zoom max scale | `2.0x` | CODE |
| CANV-044 | List view title font size | `14px / 700` | CODE |
| CANV-045 | List view mindset | `9.5px / italic / 0.6 opacity` | CODE |
| CANV-046 | List view circles size | `24px` | CODE |
| CANV-047 | 10 PM hour label fully visible | `hourRow` has real height, not `height: 0` | CODE |
| CANV-048 | 11 PM hour label fully visible | Same check as CANV-047 | CODE |
| CANV-049 | 10 AM hour label fully visible | No clipping | CODE + SCREENSHOT |
| CANV-050 | 11 AM hour label fully visible | No clipping | CODE + SCREENSHOT |
| CANV-051 | 12 PM hour label fully visible | No clipping | CODE + SCREENSHOT |
| CANV-052 | Horizontal page padding | `24px` via `spacing.screen` | CODE |
| CANV-053 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.3 DateStrip

**File:** `mobile/src/features/canvas/components/DateStrip.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| DATE-001 | Chip dimensions | `48x60px` | CODE |
| DATE-002 | Chip border radius | `16px` via `radii.lg` | CODE |
| DATE-003 | Selected chip background | Primary green gradient (#3E7A55 to #2D5A3E) or `colors.primary` | CODE |
| DATE-004 | Selected chip shadow | Present, using primary color | CODE |
| DATE-005 | Today chip (unselected) background | `colors.primaryBg` (#E3ECE6) | CODE |
| DATE-006 | Day name font | `typography.micro` (9px / 600) | CODE |
| DATE-007 | Day name color | `colors.muted` | CODE |
| DATE-008 | Day number font size | `19px` | CODE |
| DATE-009 | Day number font weight | `'600'` | CODE |
| DATE-010 | Selected text color | White (`#FFFFFF` or `'white'`) | CODE |
| DATE-011 | Pull handle width | `36px` | CODE |
| DATE-012 | Pull handle height | `4px` | CODE |
| DATE-013 | Pull handle color | `colors.border` | CODE |
| DATE-014 | Calendar open: strip fades out | Fade animation, not both visible simultaneously | CODE |
| DATE-015 | Calendar month label font | `15px / 600` | CODE |
| DATE-016 | Calendar nav arrow buttons | `36x36px` | CODE |
| DATE-017 | Calendar day cell width | `14.28%` (1/7) | CODE |
| DATE-018 | Calendar selected day bg | `colors.primary` | CODE |
| DATE-019 | Calendar selected day radius | `18px` | CODE |
| DATE-020 | Calendar selected day text | White, `700` weight | CODE |
| DATE-021 | Calendar today (unselected) text | `colors.primary`, `700` weight | CODE |
| DATE-022 | Calendar other month days | `0.4` opacity | CODE |
| DATE-023 | "Go to Today" button | Shown when not on today | CODE + INTERACT |
| DATE-024 | useNativeDriver consistency | All `false` for height animations | CODE |
| DATE-025 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.4 BottomTaskBar

**File:** `mobile/src/features/canvas/components/BottomTaskBar.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| TASK-001 | Collapsed height | `44px` always (including empty state) | CODE |
| TASK-002 | Collapsed background | `rgba(255,255,255,0.75)` glass | CODE |
| TASK-003 | Border top width | `0.5px` | CODE |
| TASK-004 | Border top color | `rgba(224,217,206,0.5)` | CODE |
| TASK-005 | Next task title font size | `13px` via `typography.body` | CODE |
| TASK-006 | Next task title font weight | `'500'` | CODE |
| TASK-007 | Next task title color | `colors.text2` | CODE |
| TASK-008 | Count badge bg | `colors.primaryBg` | CODE |
| TASK-009 | Count badge text color | `colors.primary` | CODE |
| TASK-010 | Count badge font | Monospace, `10px` | CODE |
| TASK-011 | Checkbox size (collapsed) | `16x16px` | CODE |
| TASK-012 | Checkbox radius (collapsed) | `5px` | CODE |
| TASK-013 | Checkbox border width | `1.5px` | CODE |
| TASK-014 | Empty state text | "All done" with checkmark | CODE |
| TASK-015 | Empty state height | Same `44px` as normal collapsed | CODE |
| TASK-016 | Empty state "+" circle | Present | CODE |
| TASK-017 | Expanded sheet bg | `rgba(255,255,255,0.85)` via `colors.glass.sheet` | CODE |
| TASK-018 | Expanded sheet top radius | `20px` | CODE |
| TASK-019 | Expanded drag handle | `36x4px`, `colors.border` | CODE |
| TASK-020 | Task row padding | `11px` | CODE |
| TASK-021 | Task row bottom border | Hairline (0.5px or StyleSheet.hairlineWidth) | CODE |
| TASK-022 | Expanded checkbox size | `20x20px` | CODE |
| TASK-023 | Expanded checkbox radius | `10px` | CODE |
| TASK-024 | Task title font size | `14px` | CODE |
| TASK-025 | Task title font weight | `'500'` | CODE |
| TASK-026 | Category dot size | `8x8px` | CODE |
| TASK-027 | Category dot radius | `4px` | CODE |
| TASK-028 | Spring animation damping | `15` via `motion.spring.damping` | CODE |
| TASK-029 | Spring animation stiffness | `200` via `motion.spring.stiffness` | CODE |
| TASK-030 | Swipe down dismiss threshold | `50px` | CODE |
| TASK-031 | No gap between bar and tab bar | Empty state same height as filled state | CODE + SCREENSHOT |
| TASK-032 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.5 ActivityFormScreen

**File:** `mobile/src/features/canvas/screens/ActivityFormScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| FORM-001 | Sheet background | `colors.bg` (#F5F0E8) | CODE |
| FORM-002 | Drag handle dimensions | `36x4px` | CODE |
| FORM-003 | Title input font size | `20px` | CODE |
| FORM-004 | Title input font weight | `'600'` | CODE |
| FORM-005 | Title placeholder text | "What you want to do?" | CODE |
| FORM-006 | Chip background (unselected) | `rgba(255,255,255,0.55)` | CODE |
| FORM-007 | Chip selected color | `colors.primary` (#2D5A3E) | CODE |
| FORM-008 | Section title font size | `11px` | CODE |
| FORM-009 | Section title font weight | `'600'` | CODE |
| FORM-010 | Section title color | `colors.muted` | CODE |
| FORM-011 | Section title text transform | `uppercase` | CODE |
| FORM-012 | Section title letter spacing | `0.6` | CODE |
| FORM-013 | Duration chip labels | "---", "15m", "30m", "1h", "2h" (no "None", no "Custom") | CODE |
| FORM-014 | Repeat default chip text | "Once" with chevron | CODE |
| FORM-015 | Weekly repeat day circles | S M T W T F S | CODE |
| FORM-016 | Mindset input style | Single line | CODE |
| FORM-017 | Mindset sparkle icon | AI sparkle icon present, `24x24px` | CODE |
| FORM-018 | Category display | Inline chips with emoji | CODE |
| FORM-019 | Subtasks header label | None (no header) | CODE |
| FORM-020 | Subtasks add button | Green "+" circle | CODE |
| FORM-021 | Save button width | Full width | CODE |
| FORM-022 | Save button bg | `colors.primary` (green gradient) | CODE |
| FORM-023 | Save button radius | `12px` | CODE |
| FORM-024 | Conflict banner bg | Amber/accent color | CODE |
| FORM-025 | Modal presentation | `presentation: 'modal'` | CODE |
| FORM-026 | Gesture enabled | `gestureEnabled: true` | CODE |
| FORM-027 | Field order | Title > Date/Time/Duration > Repeat > Mindset > Notes > Category > Subtasks > Action | CODE |
| FORM-028 | Time unset icon | Clock emoji (🕐) | CODE |
| FORM-029 | Duration unset display | "---" (dash) | CODE |
| FORM-030 | No "Custom" duration chip | Not present in duration options | CODE |
| FORM-031 | Edit mode delete link | Red "Delete activity" text | CODE |
| FORM-032 | Delete link color | `colors.danger` or red | CODE |
| FORM-033 | No hardcoded hex colors | All via theme tokens | CODE + GREP |
| FORM-034 | Swipe down to dismiss | Modal gesture direction vertical | CODE |
| FORM-035 | Slide from bottom animation | `animation: 'slide_from_bottom'` | CODE |
| FORM-036 | Animation duration | `250ms` | CODE |

### 1.6 ExperienceLogScreen

**File:** `mobile/src/features/canvas/screens/ExperienceLogScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| ELOG-001 | Sheet background | `colors.bg` (#F5F0E8) | CODE |
| ELOG-002 | Drag handle | `36x4px` | CODE |
| ELOG-003 | Mood circle size | `44px` | CODE |
| ELOG-004 | Mood emojis (order) | 😞 😕 😐 🙂 😊 | CODE |
| ELOG-005 | Mood selected highlight | `colors.accent` | CODE |
| ELOG-006 | Energy circle size | `44px` | CODE |
| ELOG-007 | Energy emojis (order) | 🪫 😴 😌 ⚡ 🔥 | CODE |
| ELOG-008 | Energy selected highlight | `colors.primary` (green) | CODE |
| ELOG-009 | Completion chip options | "Skipped", "Half done", "Completed" | CODE |
| ELOG-010 | Reflection placeholder | "Any thoughts on how it went?" | CODE |
| ELOG-011 | Reflection input style | Single line | CODE |
| ELOG-012 | Button text | "Reflect & Close" (NOT "Done") | CODE |
| ELOG-013 | Button style | Full width, green gradient | CODE |
| ELOG-014 | Pencil edit icon | Present in header for switching to edit mode | CODE |
| ELOG-015 | Activity header not editable | Icon + name + time range, read-only | CODE |
| ELOG-016 | Time range font | Geist Mono / monospace | CODE |
| ELOG-017 | No skip button | Not present | CODE |
| ELOG-018 | Mood section title | "MOOD" | CODE |
| ELOG-019 | Energy section title | "ENERGY" | CODE |
| ELOG-020 | Section title style | 11px / uppercase / muted | CODE |
| ELOG-021 | Modal presentation | `presentation: 'modal'` | CODE |
| ELOG-022 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.7 QuickAddScreen

**File:** `mobile/src/features/canvas/screens/QuickAddScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| QADD-001 | Sheet drag handle | `36x4px` | CODE |
| QADD-002 | Text input font size | `20px` | CODE |
| QADD-003 | Text input font weight | `'500'` | CODE |
| QADD-004 | Text input placeholder | "What do you want to do?" | CODE |
| QADD-005 | Manual link text | "or fill form manually" | CODE |
| QADD-006 | Manual link font size | `13px` | CODE |
| QADD-007 | Manual link color | `colors.muted` (#8C857D) | CODE |
| QADD-008 | Parsed chip background | Glass bg + glass border | CODE |
| QADD-009 | Parsed chip radius | `12px` | CODE |
| QADD-010 | Parsed chip text size | `13px` | CODE |
| QADD-011 | Parsed chip text weight | `'500'` | CODE |
| QADD-012 | Title chip weight | `'700'` (bold) | CODE |
| QADD-013 | Create button bg | `colors.primary` (green) | CODE |
| QADD-014 | Create button radius | `12px` | CODE |
| QADD-015 | Create button min height | `52px` | CODE |
| QADD-016 | Action message bg | `colors.accent` at 0.08 opacity | CODE |
| QADD-017 | Action message text color | `colors.accent` | CODE |
| QADD-018 | LLM hint font size | `12px` | CODE |
| QADD-019 | LLM hint color | `colors.muted` | CODE |
| QADD-020 | LLM hint style | Italic | CODE |
| QADD-021 | Debounce delay | `600ms` | CODE |
| QADD-022 | Button label variants | Create / Update / Remove / Move / Done | CODE |
| QADD-023 | Chip spring animation stiffness | `200` | CODE |
| QADD-024 | Chip spring animation damping | `15` | CODE |
| QADD-025 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.8 PlayScreen

**File:** `mobile/src/features/play/screens/PlayScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PLAY-001 | Voice mic button size | `80px` | CODE |
| PLAY-002 | Voice mic button radius | `40px` | CODE |
| PLAY-003 | Voice mic button bg | `colors.primary` | CODE |
| PLAY-004 | Voice mic button shadow | `shadows.fab` | CODE |
| PLAY-005 | Hint text font size | `13px` | CODE |
| PLAY-006 | Hint text color | `colors.muted` | CODE |
| PLAY-007 | Suggestion chip bg | Glass bg + glass border | CODE |
| PLAY-008 | Suggestion chip radius | `20px` | CODE |
| PLAY-009 | Input bar bg | Glass input | CODE |
| PLAY-010 | Input bar radius | `24px` | CODE |
| PLAY-011 | Send button size | `40px` | CODE |
| PLAY-012 | WebView design tokens injected | DayFlow colors, fonts, spacing in HTML | CODE |
| PLAY-013 | Re-ask bar visible after results | Present at bottom | CODE |
| PLAY-014 | "New" button to reset | Present and functional | CODE |
| PLAY-015 | HTML classes used | card, chip, stat, sparkline | CODE |
| PLAY-016 | Background | `colors.bg` | CODE |
| PLAY-017 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.9 SearchScreen

**File:** `mobile/src/features/search/screens/SearchScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| SRCH-001 | Background | `colors.bg` | CODE |
| SRCH-002 | Search input styling | Glass surface, theme tokens | CODE |
| SRCH-003 | Result card styling | Glass morphism treatment | CODE |
| SRCH-004 | Result title font | `typography.title` (14px / 700) | CODE |
| SRCH-005 | Result body font | `typography.body` (13px / 500) | CODE |
| SRCH-006 | All colors use theme tokens | No hardcoded hex | CODE + GREP |
| SRCH-007 | Touch targets minimum | `44px` | CODE |

### 1.10 AppNavigator (Tab Bar)

**File:** `mobile/src/navigation/AppNavigator.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| TAB-001 | Tab bar height | `82px` via `sizes.tabBar.height` | CODE |
| TAB-002 | Tab bar padding bottom | `24px` via `sizes.tabBar.paddingBottom` | CODE |
| TAB-003 | Tab bar background | `rgba(255,255,255,0.70)` | CODE |
| TAB-004 | Tab bar border top width | `0.5px` | CODE |
| TAB-005 | Tab bar border top color | `rgba(224,217,206,0.5)` | CODE |
| TAB-006 | Active tint | `colors.primary` (#2D5A3E) | CODE |
| TAB-007 | Inactive tint | `colors.muted` (#8C857D) | CODE |
| TAB-008 | Label font size | `11px` | CODE |
| TAB-009 | Label font weight | `'600'` | CODE |
| TAB-010 | Tab press feedback scale | `0.88` | CODE |
| TAB-011 | Hidden on keyboard open | Keyboard detection hides tab bar | CODE |
| TAB-012 | Tab icons correct | Correct symbols per tab (Today, Plan, Insights, Settings) | CODE |
| TAB-013 | Glass backdrop blur | `24px` | CODE |
| TAB-014 | No hardcoded hex colors | All via theme tokens | CODE + GREP |

### 1.11 SettingsScreen

**File:** `mobile/src/features/canvas/screens/SettingsScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| SETT-001 | Background | `colors.bg` (#F5F0E8) | CODE |
| SETT-002 | All text colors | Use theme tokens | CODE |
| SETT-003 | All button colors | Use theme tokens | CODE |
| SETT-004 | Section headers | Match `typography` scale | CODE |
| SETT-005 | No hardcoded hex values | GREP for common wrong values | GREP |

### 1.12 PlanScreen

**File:** `mobile/src/features/plan/screens/PlanScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PLAN-001 | Background | `colors.bg` | CODE |
| PLAN-002 | Calendar constants match canvas | Same HOUR_HEIGHT, colors, overlap layout | CODE |
| PLAN-003 | All text colors | Use theme tokens | CODE |
| PLAN-004 | All button colors | Use theme tokens | CODE |
| PLAN-005 | No hardcoded hex values | GREP check | GREP |
| PLAN-006 | Hours view uses same pill rendering as canvas | Shared component or identical values | CODE |

### 1.13 InsightsScreen

**File:** `mobile/src/features/insights/screens/InsightsScreen.tsx`

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| INSI-001 | Background | `colors.bg` | CODE |
| INSI-002 | All text colors | Use theme tokens | CODE |
| INSI-003 | Glass card treatment | Same glass morphism as pills | CODE |
| INSI-004 | Category tints on charts | Use `categoryColors` map | CODE |
| INSI-005 | No hardcoded hex values | GREP check | GREP |

---

## 2. Feature Tests

### 2.1 Activity Creation

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-001 | FAB opens QuickAdd screen | Tapping FAB opens the quick add bottom sheet | INTERACT |
| FEAT-002 | Quick add: type natural language | Text parsed into structured fields as chips | INTERACT |
| FEAT-003 | Quick add: "Gym at 7am for 1h" | Parses title="Gym", time=07:00, duration=60 | INTERACT |
| FEAT-004 | Quick add: "Read for 30 min" | Parses title="Read", duration=30, no time (task) | INTERACT |
| FEAT-005 | Quick add: "Call mom every evening" | Parses title="Call mom", time=18:00, recurrence=DAILY | INTERACT |
| FEAT-006 | Quick add: switch to form mode | "or fill form manually" link opens full form | INTERACT |
| FEAT-007 | Form: parsed fields carry over | Fields from quick add pre-fill the form | INTERACT |
| FEAT-008 | Form: title required | Cannot create without title | INTERACT |
| FEAT-009 | Form: date defaults to today | "Today" chip selected by default | INTERACT |
| FEAT-010 | Form: time unset shows clock icon | 🕐 displayed | CODE + INTERACT |
| FEAT-011 | Form: setting time changes rendering | Activity appears as pill on canvas | INTERACT |
| FEAT-012 | Form: duration presets | "---", "15m", "30m", "1h", "2h" chips work | INTERACT |
| FEAT-013 | Form: duration unset shows dash | "---" displayed | CODE + INTERACT |
| FEAT-014 | Form: repeat default | "Once" chip visible | INTERACT |
| FEAT-015 | Form: repeat popup options | Once, Daily, Weekly, Monthly, Yearly | INTERACT |
| FEAT-016 | Form: weekly shows day circles | S M T W T F S circles appear | INTERACT |
| FEAT-017 | Form: monthly shows "Repeat by" | "Repeat by: Day of the month" dropdown | INTERACT |
| FEAT-018 | Form: daily has no "every 1 day" | Just the label, no redundant text | INTERACT |
| FEAT-019 | Form: "Never ends" toggle | Present at bottom of repeat popup | INTERACT |
| FEAT-020 | Form: mindset input | Single line, placeholder "Set an intention..." | INTERACT |
| FEAT-021 | Form: AI sparkle generates mindset | Tapping sparkle icon calls AI for mindset | INTERACT |
| FEAT-022 | Form: notes input | Single line, placeholder "Add details..." | INTERACT |
| FEAT-023 | Form: category inline chips | Emoji + name chips always visible | INTERACT |
| FEAT-024 | Form: category not mandatory | Can create without selecting category | INTERACT |
| FEAT-025 | Form: "+ Add category" option | Present at end of category list | INTERACT |
| FEAT-026 | Form: subtasks no header | No "Subtasks" label | CODE |
| FEAT-027 | Form: subtask "+" circle | Green circle to add subtask | INTERACT |
| FEAT-028 | Form: subtask count | "2/5" inline when items exist | INTERACT |
| FEAT-029 | Form: create button | "Create" text, full width green | INTERACT |
| FEAT-030 | Form: conflict detection | Amber banner when time overlaps existing activity | INTERACT |
| FEAT-031 | Form: conflict suggestion | "Try [next free slot]?" tappable green chip | INTERACT |
| FEAT-032 | Form: "Saved as a Task" hint | Shown below time row when time unset | CODE + INTERACT |
| FEAT-033 | Quick add: 600ms debounce | AI parsing fires after 600ms pause | CODE |
| FEAT-034 | Quick add: loading shimmer | Subtle shimmer during API call | INTERACT |
| FEAT-035 | Quick add: local parser instant | Regex parsing shows chips immediately | INTERACT |
| FEAT-036 | Quick add: AI crossfade update | Chips crossfade (150ms) when AI differs from local | CODE |

### 2.2 Activity Editing

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-040 | Tap pill opens edit form | Bottom sheet with pre-filled fields | INTERACT |
| FEAT-041 | Edit form shows "Save" button | Not "Create" | INTERACT |
| FEAT-042 | Edit form shows delete link | "Delete activity" in red text | INTERACT |
| FEAT-043 | All fields editable | Title, time, duration, repeat, mindset, notes, category, subtasks | INTERACT |
| FEAT-044 | Changes persist after save | Activity updated in store and on canvas | INTERACT |
| FEAT-045 | Delete removes activity | Activity removed from canvas and store | INTERACT |
| FEAT-046 | Past activity tap opens experience log | Log takes precedence over edit for past/completed | INTERACT |
| FEAT-047 | Experience log pencil switches to edit | Pencil icon in header toggles to edit form | INTERACT |

### 2.3 Swipe to Complete

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-050 | Swipe right on pill | Green background reveal, checkmark animation | INTERACT |
| FEAT-051 | Swipe threshold (pill) | 15px minimum to start recognizing horizontal swipe | CODE |
| FEAT-052 | Page swipe threshold | 80px minimum to trigger page change | CODE |
| FEAT-053 | Pill swipe < page swipe | Pill: 15px, Page: 80px — pill wins on small swipes | CODE |
| FEAT-054 | Completed pill styling | Strikethrough + 0.4 opacity | INTERACT |
| FEAT-055 | Status changes to done | Activity status updated in store | INTERACT |
| FEAT-056 | Swipe reset | Pill returns to normal position if not completing | INTERACT |
| FEAT-057 | Haptic on complete | Haptic feedback fires | INTERACT |
| FEAT-058 | No completion circles on pills | No checkbox visual on pills | CODE |

### 2.4 Experience Log

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-060 | Opens for completed/past activities | Bottom sheet opens on tap | INTERACT |
| FEAT-061 | Mood selection works | Tap emoji, highlight appears | INTERACT |
| FEAT-062 | Only one mood selectable | Previous deselects on new tap | INTERACT |
| FEAT-063 | Energy selection works | Tap emoji, green highlight | INTERACT |
| FEAT-064 | Only one energy selectable | Previous deselects | INTERACT |
| FEAT-065 | Completion pre-selected | Based on activity status | INTERACT |
| FEAT-066 | Completion chips change | Tap changes selection | INTERACT |
| FEAT-067 | Reflection text input | Can type text | INTERACT |
| FEAT-068 | "Reflect & Close" saves and dismisses | Data saved, sheet closes | INTERACT |
| FEAT-069 | Pencil icon opens edit mode | Switches to ActivityFormScreen | INTERACT |
| FEAT-070 | Header shows activity details | Icon, name, checkmark, time range | INTERACT |

### 2.5 Date Navigation

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-080 | Horizontal swipe on date strip | Changes selected day | INTERACT |
| FEAT-081 | Tap date chip selects day | Canvas updates to that day | INTERACT |
| FEAT-082 | Pull handle opens calendar | Month calendar slides down | INTERACT |
| FEAT-083 | Calendar day tap selects | Canvas updates, calendar closes | INTERACT |
| FEAT-084 | Calendar month navigation | Arrow buttons change month | INTERACT |
| FEAT-085 | Swipe left/right changes day | Horizontal swipe on canvas area | INTERACT |
| FEAT-086 | No infinite scroll on canvas | Single day view, swipe changes day | INTERACT |
| FEAT-087 | Today always accessible | Today button or "Go to Today" returns to current day | INTERACT |

### 2.6 Bottom Task Bar

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-090 | Collapsed shows next task | First uncompleted task title visible | INTERACT |
| FEAT-091 | Collapsed shows +N badge | Count of remaining tasks | INTERACT |
| FEAT-092 | Tap expands to full list | Glass sheet slides up | INTERACT |
| FEAT-093 | Expanded shows all tasks | Full task list with checkboxes | INTERACT |
| FEAT-094 | Checkbox toggles completion | Task marks as done | INTERACT |
| FEAT-095 | Category dot color matches | Uses `getCategoryColor()` | INTERACT |
| FEAT-096 | Long-press task drag handle | Starts drag-to-schedule | INTERACT |
| FEAT-097 | Drag onto timeline | Dashed ghost shows landing position | INTERACT |
| FEAT-098 | Drop converts to pill | Task becomes timed activity | INTERACT |
| FEAT-099 | Time label during drag | Shows projected time | INTERACT |
| FEAT-100 | Swipe down dismisses expanded | Returns to collapsed state | INTERACT |
| FEAT-101 | Empty state shows "All done" | Checkmark + text + "+" circle | INTERACT |

### 2.7 Search

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-110 | Text search works | Filters activities by title | INTERACT |
| FEAT-111 | LLM search fallback | If LLM unavailable, text search still works | INTERACT |
| FEAT-112 | Result cards show details | Title, time, category, status | INTERACT |
| FEAT-113 | Tap result navigates | Opens the activity detail or edit | INTERACT |
| FEAT-114 | Search input styling | Glass surface, theme tokens | CODE |

### 2.8 Play Screen

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-120 | Chat history persists | Previous messages shown | INTERACT |
| FEAT-121 | Suggestion chips tappable | Pre-fill input or trigger action | INTERACT |
| FEAT-122 | LLM response renders | WebView shows formatted HTML | INTERACT |
| FEAT-123 | LLM fallback on timeout | Local generation activates | CODE + INTERACT |
| FEAT-124 | WebView auto-height | WebView adjusts to content height | INTERACT |
| FEAT-125 | Design tokens in WebView | HTML uses DayFlow colors, fonts, spacing | CODE |
| FEAT-126 | "New" button resets conversation | Clears history, fresh state | INTERACT |
| FEAT-127 | Re-ask bar shown after results | Input appears at bottom of results | INTERACT |

### 2.9 Watermarks

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-130 | Timed zero-duration: watermark at time | `top = time * HOUR_HEIGHT`, right-aligned | CODE |
| FEAT-131 | Untimed recurring: watermark distributed | Evenly spread on canvas | CODE |
| FEAT-132 | Watermark floats above pills | z-index 8, no pill shifting | CODE |
| FEAT-133 | Watermark content | Icon + name (e.g., "💧 Drink water") | INTERACT |
| FEAT-134 | Watermark no collision detection | Pill never moves for watermark | CODE |
| FEAT-135 | Watermark positioning formula | `top = time * HOUR_HEIGHT` | CODE |
| FEAT-136 | Watermark filter handles null and empty string | `!a.start_time \|\| a.start_time === ''` | CODE |

### 2.10 Recurring Activities

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-140 | Daily recurrence | Activity shows every day | INTERACT |
| FEAT-141 | Weekly recurrence | Activity shows on selected days of week | INTERACT |
| FEAT-142 | Monthly recurrence | Activity shows on day of month | INTERACT |
| FEAT-143 | Instance generation | Recurring activity creates instances for each occurrence | CODE |
| FEAT-144 | Completing one instance | Does not complete other instances | INTERACT |
| FEAT-145 | "Never ends" toggle works | No end date set for recurrence | INTERACT |
| FEAT-146 | Untimed + recurring = watermark | Rendering rule followed | CODE + INTERACT |

### 2.11 Categories

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-150 | Category emoji on pills | Emoji visible at 15px | INTERACT |
| FEAT-151 | Category tint on glass pills | Color at `categoryTint` opacity overlaid on glass | CODE |
| FEAT-152 | Inline chips in form | Always visible, emoji + name | INTERACT |
| FEAT-153 | Category color resolution | `getCategoryColor()` maps id to `{ solid, light }` | CODE |
| FEAT-154 | "+ Add category" in form | Present at end of category chips | INTERACT |
| FEAT-155 | Category not mandatory | Can create activity without category | INTERACT |
| FEAT-156 | Checkmark on selected category | Visual indicator in selector | INTERACT |

### 2.12 Duration Picker

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-160 | Preset chips | "---", "15m", "30m", "1h", "2h" | CODE |
| FEAT-161 | No "None" text | Dash "---" used for unset | CODE |
| FEAT-162 | No "Custom" chip | Not present | CODE |
| FEAT-163 | Duration sets pill height | Height proportional to duration | CODE |
| FEAT-164 | Duration on separate row | Not on same line as date/time | CODE |

### 2.13 Mindset

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-170 | AI sparkle generates mindset | Tapping sparkle calls AI | INTERACT |
| FEAT-171 | Generated mindset replaces (not appends) | Existing text replaced with new | INTERACT |
| FEAT-172 | Mindset always visible on pills | If set, shown even on compact pills | CODE + INTERACT |
| FEAT-173 | Mindset italic styling | 9.5px / 400 / italic | CODE |
| FEAT-174 | Mindset 2-line clamp (normal) | `numberOfLines={2}` | CODE |
| FEAT-175 | Mindset 1-line (compact) | `numberOfLines={1}` at 8.5px | CODE |
| FEAT-176 | Mindset placeholder | "Set an intention..." | CODE |

### 2.14 Pinch to Zoom

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-180 | Pinch gesture recognized | Canvas responds to pinch | INTERACT |
| FEAT-181 | Zoom in maximum | `2.0x` scale | CODE |
| FEAT-182 | Zoom out minimum | `0.7x` scale | CODE |
| FEAT-183 | Smooth zoom animation | No jumps or stutters | INTERACT |
| FEAT-184 | Pills scale with zoom | All elements resize proportionally | INTERACT |

### 2.15 List View vs Hours View

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| FEAT-190 | Toggle between views | UI toggle switches canvas rendering | INTERACT |
| FEAT-191 | List view shows title + mindset | 14px/700 title, 9.5px/italic mindset | INTERACT |
| FEAT-192 | List view circles | 24px, three states (empty/half/full) | INTERACT |
| FEAT-193 | Hours view shows time-proportional pills | Standard canvas rendering | INTERACT |
| FEAT-194 | Both views use same data | Same activities, different rendering | INTERACT |

---

## 3. Micro-Interaction Tests

### 3.1 Spring Animation Values

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-001 | Global spring damping | `15` via `motion.spring.damping` | CODE |
| MOTI-002 | Global spring stiffness | `200` via `motion.spring.stiffness` | CODE |
| MOTI-003 | All `Animated.spring()` calls use theme values | No hardcoded spring configs | GREP |
| MOTI-004 | Sheet expand uses spring | damping 15, stiffness 200 | CODE |
| MOTI-005 | Chip entrance uses spring | damping 15, stiffness 200 | CODE |
| MOTI-006 | Bottom task bar expand uses spring | damping 15, stiffness 200 | CODE |
| MOTI-007 | Quick add sheet height change uses spring | Spring on mode switch | CODE |

### 3.2 Press Feedback

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-010 | Pill press scale | `0.97` | CODE |
| MOTI-011 | Tab press scale | `0.88` | CODE |
| MOTI-012 | Button press scale | `0.88` (or 0.97 — verify consistency) | CODE |
| MOTI-013 | FAB press feedback | Scale animation present | CODE |
| MOTI-014 | Date chip press feedback | Scale animation present | CODE |
| MOTI-015 | Category chip press feedback | Scale animation present | CODE |
| MOTI-016 | Long-press scale (pill) | `1.03` | CODE |
| MOTI-017 | Press feedback uses spring | Not linear timing | CODE |

### 3.3 Swipe Thresholds

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-020 | Pill horizontal swipe threshold | `15px` to start recognizing | CODE |
| MOTI-021 | Page swipe threshold | `80px` to trigger day change | CODE |
| MOTI-022 | Pill threshold < page threshold | `15 < 80` — verified in code | CODE |
| MOTI-023 | Swipe-to-complete threshold | `80px` to trigger completion | CODE |
| MOTI-024 | Sheet dismiss (swipe down) threshold | `120px` (or per bottom sheet config) | CODE |
| MOTI-025 | Bottom task bar dismiss threshold | `50px` | CODE |
| MOTI-026 | Tap outside sheet dismisses | Dim overlay with `onPress` → `goBack()` | CODE |

### 3.4 Long Press

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-030 | Long press delay (pill) | `400ms` | CODE |
| MOTI-031 | Long press activates drag | Scale to 1.03, drag mode enabled | CODE |
| MOTI-032 | Long press on task bar item | Activates drag-to-schedule | CODE |
| MOTI-033 | Tap gesture does not fire in long press handler | Separate handlers, no conflict | CODE |

### 3.5 Haptic Feedback

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-040 | Complete activity | Medium impact haptic | CODE |
| MOTI-041 | Long press begin | Light impact haptic | CODE |
| MOTI-042 | Drop on timeline | Medium impact haptic | CODE |
| MOTI-043 | Toggle checkbox | Selection haptic | CODE |
| MOTI-044 | Sheet open | No haptic (or light) | CODE |
| MOTI-045 | Error / conflict | Warning haptic | CODE |

### 3.6 Sheet Animations

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-050 | Sheet slides from bottom | `animation: 'slide_from_bottom'` | CODE |
| MOTI-051 | Sheet animation duration | `250ms` | CODE |
| MOTI-052 | Sheet dismiss swipe down | Gesture enabled, vertical direction | CODE |
| MOTI-053 | Sheet dismiss tap outside | Dim overlay with dismiss handler | CODE |
| MOTI-054 | Sheet drag handle | `36x4px` gray bar at top | CODE |
| MOTI-055 | NEVER use transparentModal | All sheets use `'modal'` presentation | CODE + GREP |
| MOTI-056 | All sheets have swipe dismiss | `gestureEnabled: true`, `gestureDirection: 'vertical'` | CODE |

### 3.7 Chip & Element Animations

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-060 | Parsed chips spring entrance | stiffness 200, damping 15 | CODE |
| MOTI-061 | AI chip crossfade | `150ms` when AI differs from local parse | CODE |
| MOTI-062 | Now indicator pulse | `2.5s ease-in-out` animation cycle | CODE |
| MOTI-063 | Calendar fade transition | Strip fades out, calendar fades in (not both visible) | CODE |
| MOTI-064 | Completed pill strikethrough animation | Smooth transition, not instant | CODE |
| MOTI-065 | FAB press animation | Scale spring feedback | CODE |

### 3.8 Timing Constants

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| MOTI-070 | Fast transitions | `150ms` via `motion.fast` | CODE |
| MOTI-071 | Normal transitions | `250ms` via `motion.normal` | CODE |
| MOTI-072 | Slow transitions | `400ms` via `motion.slow` | CODE |
| MOTI-073 | Easing curve | `cubic-bezier(0.2, 0, 0, 1)` for interactive transitions | CODE |
| MOTI-074 | No useNativeDriver mismatches | All animations in `parallel()` use same value | CODE + GREP |

---

## 4. Architecture Tests

### 4.1 Data Flow

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-001 | Store to component data flow | Zustand stores provide data, components render | CODE |
| ARCH-002 | No business logic in components | Components only render, logic in store/utils | CODE |
| ARCH-003 | Activities store exists | `activitiesStore.ts` manages all activity data | CODE |
| ARCH-004 | Auth store exists | `authStore.ts` manages auth state | CODE |
| ARCH-005 | Store updates trigger re-render | Zustand subscription pattern | CODE |
| ARCH-006 | Offline-first: SQLite on native | `db.ts` for native SQLite | CODE |
| ARCH-007 | Offline-first: localStorage on web | `db.web.ts` for web fallback | CODE |
| ARCH-008 | Schema shared between platforms | `schema.ts` defines tables for both | CODE |

### 4.2 Rendering Rules (Data to UI)

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-010 | start_time + duration > 0 = pill | Timed block on canvas | CODE |
| ARCH-011 | start_time + zero duration = watermark | Watermark chip at that time | CODE |
| ARCH-012 | No start_time + recurring = watermark | Distributed watermark | CODE |
| ARCH-013 | No start_time + not recurring = task | Appears in bottom task bar | CODE |
| ARCH-014 | Empty string start_time = null | Treated identically, both = no time | CODE |
| ARCH-015 | start_time is nullable string | `string \| null` in types | CODE |
| ARCH-016 | is_scheduled is derived | `start_time !== null` (not a stored field) | CODE |
| ARCH-017 | Pill height proportional to duration | `height = duration * HOUR_HEIGHT / 60` | CODE |
| ARCH-018 | Pill top from start time | `top = hourOffset * HOUR_HEIGHT` | CODE |
| ARCH-019 | Overlapping pills split width | 50/50 (or column-based) with gap | CODE |
| ARCH-020 | HOUR_HEIGHT constant | `80px` per hour | CODE |

### 4.3 LLM & AI

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-030 | LLM timeout threshold | `8s` or less | CODE |
| ARCH-031 | LLM fallback to local on timeout | Regex parser activates silently | CODE |
| ARCH-032 | No error toast on LLM failure | Silent fallback, no user-facing error | CODE |
| ARCH-033 | Local parser response time | `< 50ms` (regex-based, synchronous) | RUNTIME |
| ARCH-034 | Local and AI parsers same output shape | Both return `ActivityFields` type | CODE |
| ARCH-035 | Confidence threshold: > 0.7 | Show preview immediately | CODE |
| ARCH-036 | Confidence threshold: 0.3-0.7 | Show "Did you mean...?" disambiguation | CODE |
| ARCH-037 | Confidence threshold: < 0.3 | Fall back to title as-is | CODE |
| ARCH-038 | Edge function endpoint | `POST /functions/v1/parse-activity` | CODE |
| ARCH-039 | Request includes categories | `{ text, categories, recent_titles }` | CODE |
| ARCH-040 | Response includes confidence | `{ parsed, confidence, action }` | CODE |

### 4.4 Local Parser Patterns

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-050 | Parse "at 7am" | `07:00` | CODE |
| ARCH-051 | Parse "at 3:30pm" | `15:30` | CODE |
| ARCH-052 | Parse "morning" | `07:00` | CODE |
| ARCH-053 | Parse "afternoon" | `13:00` | CODE |
| ARCH-054 | Parse "evening" | `18:00` | CODE |
| ARCH-055 | Parse "night" | `21:00` | CODE |
| ARCH-056 | Parse "for 30 min" | duration `30` | CODE |
| ARCH-057 | Parse "for 1 hour" | duration `60` | CODE |
| ARCH-058 | Parse "for 2 hours" | duration `120` | CODE |
| ARCH-059 | Parse "30m" | duration `30` | CODE |
| ARCH-060 | Parse "1h" | duration `60` | CODE |
| ARCH-061 | Parse "1.5h" | duration `90` | CODE |
| ARCH-062 | Parse "today" | current date | CODE |
| ARCH-063 | Parse "tomorrow" | +1 day | CODE |
| ARCH-064 | Parse "next Monday" | next occurrence of Monday | CODE |
| ARCH-065 | Parse "every day" / "daily" | `FREQ=DAILY` | CODE |
| ARCH-066 | Parse "every week" / "weekly" | `FREQ=WEEKLY` | CODE |
| ARCH-067 | Parse "every morning" | `FREQ=DAILY` + time `07:00` | CODE |
| ARCH-068 | Parse "every evening" | `FREQ=DAILY` + time `18:00` | CODE |
| ARCH-069 | Parse "every Monday" | `FREQ=WEEKLY;BYDAY=MO` | CODE |
| ARCH-070 | Category fuzzy match | "gym" matches Health category | CODE |
| ARCH-071 | Title extraction | Non-pattern text becomes title | CODE |

### 4.5 Scope Classification

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-080 | Scope classification exists | `buildContext()` or equivalent function | CODE |
| ARCH-081 | Light scope | Simple queries, fast response | CODE |
| ARCH-082 | Medium scope | Multi-step operations | CODE |
| ARCH-083 | Heavy scope | Complex AI operations | CODE |

### 4.6 Context Building

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-090 | buildContext() output format | Structured object with user data, categories, recent activities | CODE |
| ARCH-091 | Context includes categories | Array of `{ id, name, emoji }` | CODE |
| ARCH-092 | Context includes recent titles | Array of recent activity title strings | CODE |
| ARCH-093 | Context is LLM-agnostic | No vendor-specific formatting | CODE |

### 4.7 Category Color Resolution

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| ARCH-100 | getCategoryColor() function | Maps category ID to `{ solid, light }` | CODE |
| ARCH-101 | Unknown category fallback | Returns `{ solid: colors.primary, light: colors.primaryBg }` | CODE |
| ARCH-102 | glassTintBackground() | Applies category color at `categoryTint` opacity over glass | CODE |
| ARCH-103 | All system categories mapped | sys-deep-work, sys-meetings, sys-admin, sys-health, sys-learning, sys-personal, sys-creative, sys-rest | CODE |
| ARCH-104 | Custom categories mapped | cust-social, cust-family, cust-finance, cust-wedding, cust-chores, cust-explore, cust-mumbai, cust-fashion, cust-duniyadari, cust-professional | CODE |

---

## 5. Accessibility Tests

### 5.1 Touch Targets

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| A11Y-001 | Pill touch target | Minimum 44px height | CODE |
| A11Y-002 | Tab bar button touch target | Minimum 44px | CODE |
| A11Y-003 | FAB touch target | 52px (passes) | CODE |
| A11Y-004 | Date chip touch target | 48x60px (passes) | CODE |
| A11Y-005 | Header button touch target | 36x36px (FAILS — below 44px minimum) | CODE |
| A11Y-006 | Checkbox touch target (collapsed) | 16x16px visible but touch area should be 44px | CODE |
| A11Y-007 | Checkbox touch target (expanded) | 20x20px visible but touch area should be 44px | CODE |
| A11Y-008 | Mood circle touch target | 44px (passes) | CODE |
| A11Y-009 | Energy circle touch target | 44px (passes) | CODE |
| A11Y-010 | Subtask "+" button touch target | 24px visible (should have 44px touch area) | CODE |
| A11Y-011 | Duration chips touch target | Minimum 44px tall hit area | CODE |
| A11Y-012 | Category chips touch target | Minimum 44px tall hit area | CODE |
| A11Y-013 | Quick add manual link touch target | Minimum 44px tall hit area | CODE |
| A11Y-014 | Drag handle touch target | 36x4px visible but 44px minimum touch area | CODE |
| A11Y-015 | Suggestion chips (Play) touch target | Minimum 44px | CODE |
| A11Y-016 | Send button (Play) touch target | 40px (close but below 44px) | CODE |

### 5.2 Color Contrast

| Test ID | Description | Expected Ratio | How to Verify |
|---------|-------------|----------------|---------------|
| A11Y-020 | Primary text on bg | #1A1714 on #F5F0E8 — minimum 4.5:1 | RUNTIME (contrast checker) |
| A11Y-021 | Secondary text on bg | #4A4540 on #F5F0E8 — minimum 4.5:1 | RUNTIME |
| A11Y-022 | Muted text on bg | #8C857D on #F5F0E8 — minimum 3:1 (large text) | RUNTIME |
| A11Y-023 | Hour label at 0.35 opacity on bg | #8C857D at 0.35 on #F5F0E8 — may fail | RUNTIME |
| A11Y-024 | Watermark text on watermark bg | #8B4A30 on rgba(181,99,74,0.12) over #F5F0E8 | RUNTIME |
| A11Y-025 | White text on primary green | #FFF on #2D5A3E — minimum 4.5:1 | RUNTIME |
| A11Y-026 | White text on selected date chip | #FFF on primary green | RUNTIME |
| A11Y-027 | Mindset text at 0.6 opacity | #4A4540 at 0.6 on glass bg — check ratio | RUNTIME |
| A11Y-028 | Completed pill at 0.4 opacity | Text may not meet contrast requirements | RUNTIME |
| A11Y-029 | Past hour lines at 0.1 opacity | Decorative, not informational — acceptable | RUNTIME |
| A11Y-030 | Count badge text on primaryBg | #2D5A3E on #E3ECE6 | RUNTIME |

### 5.3 Screen Reader Labels

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| A11Y-040 | Activity pills have accessibilityLabel | Title + time + category announced | CODE |
| A11Y-041 | FAB has accessibilityLabel | "Create new activity" or similar | CODE |
| A11Y-042 | Tab bar items have labels | Each tab announces its name | CODE |
| A11Y-043 | Date chips have labels | "Monday, April 2" format | CODE |
| A11Y-044 | Mood emojis have labels | "Bad", "Low", "Okay", "Good", "Great" | CODE |
| A11Y-045 | Energy emojis have labels | "Drained", "Low", "Steady", "High", "Peak" | CODE |
| A11Y-046 | Completion chips have labels | "Skipped", "Half done", "Completed" | CODE |
| A11Y-047 | Checkboxes have labels | "Complete [task name]" | CODE |
| A11Y-048 | Search input has label | "Search activities" or similar | CODE |
| A11Y-049 | Forms have field labels | Each input announces its purpose | CODE |
| A11Y-050 | Buttons have labels | All buttons announce their action | CODE |

### 5.4 Keyboard Navigation

| Test ID | Description | Expected Behavior | How to Verify |
|---------|-------------|-------------------|---------------|
| A11Y-060 | Tab navigation works | Can navigate between interactive elements | INTERACT |
| A11Y-061 | Enter/Space activates buttons | Standard keyboard interaction | INTERACT |
| A11Y-062 | Escape dismisses sheets | Alternative to swipe dismiss | INTERACT |
| A11Y-063 | Focus order logical | Top-to-bottom, left-to-right | INTERACT |
| A11Y-064 | Focus visible | Focused element has visible indicator | INTERACT |

---

## 6. Performance Tests

### 6.1 Scroll Performance

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PERF-001 | Canvas scroll FPS | 60fps sustained | RUNTIME (profiler) |
| PERF-002 | Canvas scroll with 20+ pills | 60fps sustained | RUNTIME |
| PERF-003 | Date strip scroll FPS | 60fps | RUNTIME |
| PERF-004 | Task list scroll FPS | 60fps | RUNTIME |
| PERF-005 | No jank during scroll | No dropped frames | RUNTIME |
| PERF-006 | Scroll with pinch zoom active | Smooth at all zoom levels | RUNTIME |

### 6.2 LLM Performance

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PERF-010 | LLM response time | < 8s timeout | CODE + RUNTIME |
| PERF-011 | LLM parsing time (Haiku) | < 500ms target | RUNTIME |
| PERF-012 | Local parser response time | < 50ms | RUNTIME |
| PERF-013 | Debounce prevents excessive API calls | 600ms debounce | CODE |
| PERF-014 | LLM timeout triggers fallback | Within 8s, fallback activates | CODE + RUNTIME |

### 6.3 Rendering Performance

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PERF-020 | Initial load time | < 3s to interactive | RUNTIME |
| PERF-021 | Screen transition time | < 250ms (normal motion) | RUNTIME |
| PERF-022 | Sheet open time | < 250ms to fully visible | RUNTIME |
| PERF-023 | Activity creation to canvas update | < 100ms | RUNTIME |
| PERF-024 | No unnecessary re-renders | Zustand selectors prevent excess renders | RUNTIME (profiler) |
| PERF-025 | WebView render time (Play) | < 1s for HTML content | RUNTIME |

### 6.4 Memory

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| PERF-030 | Memory after 30 min use | No significant growth | RUNTIME (profiler) |
| PERF-031 | WebView memory cleanup | WebView memory freed on unmount | RUNTIME |
| PERF-032 | Large activity list (100+ items) | No memory pressure | RUNTIME |
| PERF-033 | Image/screenshot cleanup | No leaked image references | RUNTIME |

---

## 7. Theme Token Compliance Tests

### 7.1 Color Token Verification (theme.ts vs DESIGN.md)

| Test ID | Description | theme.ts Value | DESIGN.md Value | Status |
|---------|-------------|----------------|-----------------|--------|
| TOKEN-001 | colors.bg | #F5F0E8 | #F5F0E8 | MATCH |
| TOKEN-002 | colors.text | #1A1714 | #1A1714 | MATCH |
| TOKEN-003 | colors.text2 | #4A4540 | #4A4540 | MATCH |
| TOKEN-004 | colors.muted | #8C857D | #8C857D | MATCH |
| TOKEN-005 | colors.border | #E0D9CE | #E0D9CE | MATCH |
| TOKEN-006 | colors.primary | #2D5A3E | #2D5A3E | MATCH |
| TOKEN-007 | colors.accent | #C4795B | #C4795B | MATCH |
| TOKEN-008 | colors.glass.bg | rgba(255,255,255,0.65) | rgba(255,255,255,0.65) | MATCH |
| TOKEN-009 | colors.glass.border | rgba(255,255,255,0.75) | rgba(255,255,255,0.75) | MATCH |
| TOKEN-010 | colors.glass.blur | 20 | 20 | MATCH |
| TOKEN-011 | colors.glass.sheet | rgba(255,255,255,0.85) | rgba(255,255,255,0.85) | MATCH |
| TOKEN-012 | colors.watermark.text | #8B4A30 | #8B4A30 | MATCH |
| TOKEN-013 | colors.watermark.bg | rgba(181,99,74,0.12) | rgba(181,99,74,0.12) | MATCH |
| TOKEN-014 | colors.categoryTint | 0.12 | 0.06 (DESIGN.md) | **MISMATCH** — theme.ts uses 0.12, DESIGN.md specifies 0.06 |
| TOKEN-015 | colors.terra | #B5634A | #B5634A | MATCH |
| TOKEN-016 | colors.sage | #5A8C6A | #5A8C6A | MATCH |
| TOKEN-017 | colors.slate | #3D5F80 | #3D5F80 | MATCH |
| TOKEN-018 | colors.mauve | #7D5A7C | #7D5A7C | MATCH |
| TOKEN-019 | colors.amber | #A67B0A | #A67B0A | MATCH |

### 7.2 Typography Token Verification

| Test ID | Description | theme.ts Value | DESIGN.md Value | Status |
|---------|-------------|----------------|-----------------|--------|
| TOKEN-020 | typography.display | 32px / 700 | 32px / 700 | MATCH |
| TOKEN-021 | typography.heading | 22px / 700 | 22px / 700 | MATCH |
| TOKEN-022 | typography.title | 14px / 700 | 14px / 700 | MATCH |
| TOKEN-023 | typography.body | 13px / 500 | 13px / 500 | MATCH |
| TOKEN-024 | typography.small | 11px / 500 | 11px / 500 | MATCH |
| TOKEN-025 | typography.caption | 10px / 600 | 10px / 600 (Geist Mono) | MATCH |
| TOKEN-026 | typography.micro | 9px / 600 | 9px / 600 | MATCH |
| TOKEN-027 | typography.mindset | 9.5px / 400 / italic / lineHeight 13 | 9.5px / 400 / italic | MATCH |
| TOKEN-028 | type.h3 (exists in theme.ts) | 18px / 600 | NOT in DESIGN.md scale | **ORPHAN** — not in design system |
| TOKEN-029 | type.body (exists in theme.ts) | 15px / 600 | NOT in DESIGN.md scale | **ORPHAN** — not in design system |

### 7.3 Size Token Verification

| Test ID | Description | theme.ts Value | DESIGN.md Value | Status |
|---------|-------------|----------------|-----------------|--------|
| TOKEN-030 | sizes.fab.size | 52 | 52 | MATCH |
| TOKEN-031 | sizes.fab.radius | 16 | 16 | MATCH |
| TOKEN-032 | sizes.tabBar.height | 82 | 82 | MATCH |
| TOKEN-033 | sizes.tabBar.paddingBottom | 24 | 24 (implied) | MATCH |
| TOKEN-034 | sizes.touchTarget | 44 | 44 | MATCH |
| TOKEN-035 | radii.md (pill normal) | 14 | 14 | MATCH |
| TOKEN-036 | radii.sheet | 24 | 20-20-0-0 top radius | **CHECK** — sheet spec says 20, theme says 24 |
| TOKEN-037 | spacing.screen | 24 | 20-24 (range) | MATCH (within range) |

### 7.4 Motion Token Verification

| Test ID | Description | theme.ts Value | DESIGN.md Value | Status |
|---------|-------------|----------------|-----------------|--------|
| TOKEN-040 | motion.spring.damping | 15 | 15 | MATCH |
| TOKEN-041 | motion.spring.stiffness | 200 | 200 | MATCH |
| TOKEN-042 | motion.fast | 150 | 150 | MATCH |
| TOKEN-043 | motion.normal | 250 | 250 | MATCH |
| TOKEN-044 | motion.slow | 400 | 400 | MATCH |

### 7.5 Shadow Token Verification

| Test ID | Description | theme.ts Value | DESIGN.md Value | Status |
|---------|-------------|----------------|-----------------|--------|
| TOKEN-050 | shadows.pill.shadowColor | #000 | #000 | MATCH |
| TOKEN-051 | shadows.pill.shadowOffset | {0, 3} | offset 0/3 | MATCH |
| TOKEN-052 | shadows.pill.shadowOpacity | 0.06 | 0.06 | MATCH |
| TOKEN-053 | shadows.pill.shadowRadius | 8 | radius 8 | MATCH |
| TOKEN-054 | shadows.pill.elevation | 3 | elevation 3 | MATCH |

---

## 8. Hardcoded Value Detection Tests

These tests detect values that should be using theme tokens but are hardcoded.

| Test ID | Pattern to GREP | Expected Results | Command |
|---------|-----------------|------------------|---------|
| HARD-001 | `#2D4A3E` (wrong primary) | 0 results | `grep -r "#2D4A3E" mobile/src/` |
| HARD-002 | `#FAF7F2` (wrong bg) | 0 results | `grep -r "#FAF7F2" mobile/src/` |
| HARD-003 | `#1A1A1A` (wrong text) | 0 results | `grep -r "#1A1A1A" mobile/src/` |
| HARD-004 | `#5A5550` (wrong text2) | 0 results | `grep -r "#5A5550" mobile/src/` |
| HARD-005 | `#4B4642` (wrong muted) | 0 results | `grep -r "#4B4642" mobile/src/` |
| HARD-006 | `#746E69` (wrong muted variant) | 0 results | `grep -r "#746E69" mobile/src/` |
| HARD-007 | `#DED6CA` (wrong border) | 0 results | `grep -r "#DED6CA" mobile/src/` |
| HARD-008 | `'white'` (should use token) | Review all — may be legitimate in some contexts | `grep -r "'white'" mobile/src/` |
| HARD-009 | `'#FFF'` or `'#fff'` or `'#FFFFFF'` | Review all — may be legitimate in glass spec | `grep -rE "'#[Ff]{3,6}'" mobile/src/` |
| HARD-010 | `backgroundColor:.*'#` in non-theme files | 0 results (all should use tokens) | `grep -rn "backgroundColor.*'#" mobile/src/ --include="*.tsx"` |
| HARD-011 | `color:.*'#` in non-theme files | Review — should reference `colors.*` | `grep -rn "color.*'#" mobile/src/ --include="*.tsx"` |
| HARD-012 | `fontSize:` not using typography | Review — all should reference `typography.*` | `grep -rn "fontSize:" mobile/src/ --include="*.tsx"` |
| HARD-013 | `fontWeight:` not using typography | Review — all should reference `typography.*` | `grep -rn "fontWeight:" mobile/src/ --include="*.tsx"` |
| HARD-014 | `borderRadius:` not using radii | Review — all should reference `radii.*` | `grep -rn "borderRadius:" mobile/src/ --include="*.tsx"` |
| HARD-015 | `padding:` not using spacing | Review — all should reference `spacing.*` | `grep -rn "padding:" mobile/src/ --include="*.tsx"` |
| HARD-016 | `damping:` not 15 | 0 results (all should be 15) | `grep -rn "damping:" mobile/src/ --include="*.tsx"` |
| HARD-017 | `stiffness:` not 200 | 0 results (all should be 200) | `grep -rn "stiffness:" mobile/src/ --include="*.tsx"` |
| HARD-018 | `transparentModal` usage | 0 results (NEVER use) | `grep -r "transparentModal" mobile/src/` |
| HARD-019 | `useNativeDriver: true` in groups with `false` | 0 mismatches | `grep -rn "useNativeDriver" mobile/src/` |
| HARD-020 | `overflow: 'hidden'` on pill containers | 0 results (causes mindset clipping) | `grep -B5 "overflow.*hidden" mobile/src/features/canvas/components/ActivityCard.tsx` |

---

## 9. Cross-Component Consistency Tests

### 9.1 Glass Morphism Consistency

| Test ID | Component | Expected Glass Values | How to Verify |
|---------|-----------|----------------------|---------------|
| GLASS-001 | ActivityCard | bg 0.65, border 0.75, blur 20 | CODE |
| GLASS-002 | BottomTaskBar (collapsed) | bg rgba(255,255,255,0.75) | CODE |
| GLASS-003 | BottomTaskBar (expanded) | bg 0.85, blur 24 | CODE |
| GLASS-004 | Tab bar | bg 0.70, blur 24 | CODE |
| GLASS-005 | Task sheet | bg 0.85, blur 24, radius 20-20-0-0 | CODE |
| GLASS-006 | QuickAdd chips | glass bg + glass border | CODE |
| GLASS-007 | PlayScreen suggestion chips | glass bg + glass border | CODE |
| GLASS-008 | Form chips | rgba(255,255,255,0.55) | CODE |

### 9.2 Typography Consistency

| Test ID | Context | Expected Typography | How to Verify |
|---------|---------|--------------------| -------------|
| TYPO-001 | All pill titles across all screens | 14px / 700 | GREP |
| TYPO-002 | All mindset text across all screens | 9.5px / italic / 0.6 opacity | GREP |
| TYPO-003 | All hour labels | 10px / 600 / monospace | GREP |
| TYPO-004 | All watermark chips | 9px / 600 | GREP |
| TYPO-005 | All section titles (forms) | 11px / 600 / uppercase / muted | GREP |
| TYPO-006 | No font size orphans | All font sizes match one of: 9, 9.5, 10, 11, 13, 14, 19, 20, 22, 32 | GREP for `fontSize:` |
| TYPO-007 | No weight orphans | All weights match: 400, 500, 600, 700 | GREP for `fontWeight:` |

### 9.3 Spacing Consistency

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| SPACE-001 | All horizontal page padding | `24px` via `spacing.screen` | GREP |
| SPACE-002 | All values on 4px grid | Every spacing value divisible by 4 | GREP |
| SPACE-003 | All drag handles | `36x4px` centered | GREP |
| SPACE-004 | All sheet top radii | `24px` via `radii.sheet` (or 20 per DESIGN.md — verify) | GREP |

### 9.4 Animation Consistency

| Test ID | Description | Expected Value | How to Verify |
|---------|-------------|----------------|---------------|
| ANIM-001 | All spring configs | damping 15, stiffness 200 (or `motion.spring`) | GREP |
| ANIM-002 | All pill press scales | 0.97 | GREP |
| ANIM-003 | All tab/button press scales | 0.88 | GREP |
| ANIM-004 | All fast transitions | 150ms (or `motion.fast`) | GREP |
| ANIM-005 | All normal transitions | 250ms (or `motion.normal`) | GREP |
| ANIM-006 | No useNativeDriver conflicts | All animations in same group use same value | GREP |

---

## 10. Daily QA Run Protocol

### Step 1: Hardcoded Value Audit (5 minutes)

Run all HARD-* tests from Section 8. Every grep must return expected results.

```bash
# Run from mobile/ directory
echo "=== HARDCODED VALUE AUDIT ==="

echo "--- Wrong color values (expect 0 results each) ---"
grep -rn "#2D4A3E" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#FAF7F2" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#1A1A1A" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#5A5550" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#4B4642" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#746E69" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules
grep -rn "#DED6CA" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules

echo "--- Never use transparentModal ---"
grep -rn "transparentModal" src/ --include="*.tsx" --include="*.ts"

echo "--- Check overflow hidden near pills ---"
grep -B5 "overflow.*hidden" src/features/canvas/components/ActivityCard.tsx

echo "--- useNativeDriver mismatches ---"
grep -rn "useNativeDriver" src/ --include="*.tsx" --include="*.ts"
```

### Step 2: Theme Token Verification (3 minutes)

Open `mobile/src/theme.ts` and compare every value against DESIGN.md.

Known mismatches to check:
- `categoryTint`: theme.ts says `0.12`, DESIGN.md says `0.06`
- `radii.sheet`: theme.ts says `24`, DESIGN.md task sheet says `20 20 0 0`
- `type.h3` and `type.body`: exist in theme.ts but not in DESIGN.md scale

### Step 3: Known Recurring Issues (5 minutes)

Check each issue from the QA checklist:

1. **10 PM / 11 PM hour labels** — Open `CanvasScreen.tsx`, verify `hourRow` has real height
2. **Bottom task bar gap** — Open `BottomTaskBar.tsx`, verify empty state = 44px
3. **Pills intersecting** — Verify overlap code has 4px gap between columns
4. **Mindset text clipping** — Verify no `overflow: hidden` on pill container
5. **Swipe conflict** — Verify pill swipe threshold (15px) < page swipe (80px)
6. **Watermarks not showing** — Verify filter: `!a.start_time || a.start_time === ''`
7. **Long-press conflict** — Verify tap and longPress are separate gesture handlers
8. **Screen reset** — Verify `hasAutoScrolled` ref persists
9. **useNativeDriver mismatch** — Verify all parallel animations match

### Step 4: Component StyleSheet Walk-Through (20 minutes)

For each component file, open the StyleSheet.create block and verify every value:

**Order:**
1. `ActivityCard.tsx` — All PILL-* tests
2. `CanvasScreen.tsx` — All CANV-* tests
3. `DateStrip.tsx` — All DATE-* tests
4. `BottomTaskBar.tsx` — All TASK-* tests
5. `ActivityFormScreen.tsx` — All FORM-* tests
6. `ExperienceLogScreen.tsx` — All ELOG-* tests
7. `QuickAddScreen.tsx` — All QADD-* tests
8. `PlayScreen.tsx` — All PLAY-* tests
9. `SearchScreen.tsx` — All SRCH-* tests
10. `AppNavigator.tsx` — All TAB-* tests
11. `SettingsScreen.tsx` — All SETT-* tests
12. `PlanScreen.tsx` — All PLAN-* tests
13. `InsightsScreen.tsx` — All INSI-* tests

### Step 5: Cross-Component Verification (5 minutes)

Run all GLASS-*, TYPO-*, SPACE-*, and ANIM-* tests from Section 9.

```bash
echo "=== CROSS-COMPONENT CHECKS ==="

echo "--- Glass morphism values ---"
grep -rn "rgba(255,255,255" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules

echo "--- Font sizes (should all match design scale) ---"
grep -rn "fontSize:" src/ --include="*.tsx" | grep -v node_modules | grep -v theme.ts

echo "--- Spring configs (all should be damping 15, stiffness 200) ---"
grep -rn "damping\|stiffness" src/ --include="*.tsx" --include="*.ts" | grep -v theme.ts | grep -v node_modules

echo "--- Press scale values ---"
grep -rn "scale.*0\." src/ --include="*.tsx" | grep -v node_modules

echo "--- Drag handles (all should be 36x4) ---"
grep -rn "dragHandle\|DragHandle\|handleWidth\|handleHeight" src/ --include="*.tsx" | grep -v node_modules
```

### Step 6: Feature Spot Checks (10 minutes)

On device (Expo Go), verify:

1. **Create activity:** FAB > type "Gym at 7am for 1h" > verify chips > create > verify pill on canvas
2. **Edit activity:** Tap pill > verify pre-filled form > change title > save > verify update
3. **Complete activity:** Swipe pill right > verify strikethrough + opacity
4. **Experience log:** Tap completed pill > verify mood/energy/completion/reflection
5. **Date navigation:** Swipe date strip > verify day changes > pull handle > verify calendar
6. **Task bar:** Verify collapsed state > tap to expand > verify full list > swipe dismiss
7. **Search:** Tap search > type query > verify results
8. **Watermarks:** Verify untimed recurring activities show as right-aligned chips
9. **Quick add:** Type natural language > verify chip parsing > switch to form > verify carry-over

### Step 7: Interaction Spot Checks (5 minutes)

1. **Spring feel:** Press a pill — does it bounce with spring physics?
2. **Tab press:** Tap inactive tab — does it scale to 0.88?
3. **Sheet dismiss:** Swipe down on any sheet — smooth dismissal?
4. **Long press:** Long press a pill — 400ms delay, then scale to 1.03?
5. **Now indicator:** Is it pulsing with 2.5s ease-in-out?
6. **Haptics:** Complete a task — do you feel haptic feedback?

### Step 8: Performance Check (2 minutes)

1. Scroll the canvas rapidly — smooth 60fps?
2. Open quick add, type fast — debounce working?
3. Navigate between tabs — transitions under 250ms?
4. Open/close sheets — spring animation smooth?

### Step 9: Three-Pass Rule

After completing Steps 1-8:
- **Pass 1:** Initial check (done above)
- **Pass 2:** Re-read every StyleSheet from Step 4 with fresh eyes
- **Pass 3:** Confirm zero issues remain

### Step 10: Log Results

Record any failures with:
- Test ID
- Actual value found
- File and line number
- Fix applied (or TODO if deferred)

Add new recurring issues to `DESIGN-QA-CHECKLIST.md` "Known Recurring Issues" section.

---

## Appendix A: File Reference Map

| Component | File Path |
|-----------|-----------|
| ActivityCard | `mobile/src/features/canvas/components/ActivityCard.tsx` |
| CanvasScreen | `mobile/src/features/canvas/screens/CanvasScreen.tsx` |
| DateStrip | `mobile/src/features/canvas/components/DateStrip.tsx` |
| BottomTaskBar | `mobile/src/features/canvas/components/BottomTaskBar.tsx` |
| ActivityFormScreen | `mobile/src/features/canvas/screens/ActivityFormScreen.tsx` |
| ExperienceLogScreen | `mobile/src/features/canvas/screens/ExperienceLogScreen.tsx` |
| QuickAddScreen | `mobile/src/features/canvas/screens/QuickAddScreen.tsx` |
| PlayScreen | `mobile/src/features/play/screens/PlayScreen.tsx` |
| SearchScreen | `mobile/src/features/search/screens/SearchScreen.tsx` |
| AppNavigator | `mobile/src/navigation/AppNavigator.tsx` |
| SettingsScreen | `mobile/src/features/canvas/screens/SettingsScreen.tsx` |
| PlanScreen | `mobile/src/features/plan/screens/PlanScreen.tsx` |
| InsightsScreen | `mobile/src/features/insights/screens/InsightsScreen.tsx` |
| Theme | `mobile/src/theme.ts` |
| Types | `mobile/src/types/index.ts` |
| Activities DB | `mobile/src/lib/db/activities.ts` |
| Activities Store | `mobile/src/store/activitiesStore.ts` |
| TaskItem | `mobile/src/features/canvas/components/TaskItem.tsx` |
| TaskSection | `mobile/src/features/canvas/components/TaskSection.tsx` |

## Appendix B: Known Mismatches (As of Framework Creation)

| ID | Issue | Details | Resolution |
|----|-------|---------|------------|
| MISMATCH-001 | categoryTint | theme.ts = `0.12`, DESIGN.md = `0.06` (pill tints) and QA checklist says `0.06` | Determine intended value and align |
| MISMATCH-002 | Sheet top radius | theme.ts `radii.sheet` = `24`, DESIGN.md task sheet spec says `20px 20px 0 0` | Determine intended value and align |
| MISMATCH-003 | type.h3 orphan | `18px / 600` exists in theme.ts `type` aliases, not in DESIGN.md scale | Remove or add to design system |
| MISMATCH-004 | type.body orphan | `15px / 600` exists in theme.ts `type` aliases, not in DESIGN.md scale | Remove or add to design system |
| MISMATCH-005 | shadows.card vs shadows.pill | `card.shadowOpacity` = 0.08, `pill.shadowOpacity` = 0.06. QA checklist says pill = 0.06 | Verify which shadow is used on ActivityCard |

## Appendix C: Test Count Summary

### Part B: Design QA Tests

| Section | Count |
|---------|-------|
| 1. Design Pixel Tests | 185 |
| 2. Feature Tests | 101 |
| 3. Micro-Interaction Tests | 48 |
| 4. Architecture Tests | 53 |
| 5. Accessibility Tests | 30 |
| 6. Performance Tests | 20 |
| 7. Theme Token Compliance | 25 |
| 8. Hardcoded Value Detection | 20 |
| 9. Cross-Component Consistency | 18 |
| **Part B Total** | **500** |

### Part A: Automated Tests

| Section | Count |
|---------|-------|
| Unit Tests (pure functions, stores, DB, AI) | 205 |
| Component Tests (RNTL) | 275 |
| E2E Tests (Maestro) | 25 |
| **Part A Total** | **505** |

### Grand Total

| | Count |
|-|-------|
| **All Tests (Part A + Part B)** | **1,005** |
