# DayFlow — Product Knowledge System

> Dependencies are not a thing to be mapped once. They are a force to be continuously managed.

This system replaces the CXO org structure. It models how the PRODUCT works, not how people are organized. Any agent (or human) reads this before making changes.

## Research Foundation
Synthesized from 55+ sources: Senge, Meadows, Evans, Skelton, Ford, Forsgren, Ousterhout, Kleppmann, Bungay, Gall, Weinberg, Brand, Nygard + practical approaches from Stripe, Spotify, Figma, Linear, Amazon, Aider, Cursor, and AI agent orchestration research.

---

## Part 1: Shearing Layers

Things that change at different rates MUST be loosely coupled. Things that change at the same rate CAN be tightly coupled.

| Layer | Rate of Change | What Lives Here | DayFlow Files |
|-------|---------------|-----------------|---------------|
| **0. Vision** | Yearly | Why this exists. Cognitive architecture. North star. | ARCHITECTURE.md |
| **1. Data Model** | Quarterly | Activity schema, ID conventions, type system, DB tables | types/index.ts, recurrence.ts, DB schema, migrations |
| **2. Business Logic** | Monthly | Store functions, rendering rules, AI command layer, recurrence engine | activitiesStore.ts, commandLayer.ts, actionEngine.ts, parseActivity.ts |
| **3. Product Features** | Weekly | Screens, user flows, navigation, feature-specific logic | CanvasScreen, ActivityForm, PlayScreen, SearchScreen, QuickAdd |
| **4. Design System** | Biweekly | Theme tokens, component specs, glass morphism, typography scale | theme.ts, DESIGN.md, FEATURE-SPECS.md |
| **5. UI Components** | Daily | Individual component rendering, styles, layout | ActivityCard, BottomTaskBar, DateStrip, etc. |
| **6. Content** | Anytime | Button labels, placeholders, error messages, mindset prompts | Inline strings in components, mindsetGenerator.ts |
| **7. Ops/Config** | On deploy | Env vars, API keys, edge functions, feature flags, rate limits | .env, supabase/functions/, Supabase dashboard |

### The Rule
**You can freely change anything within your layer. When you cross a layer boundary, you MUST check the flow maps below for that boundary.**

Fast layers depend on slow layers (fine). If a slow layer depends on a fast layer, that's a bug in the architecture.

---

## Part 2: Four Flow Maps

These are the real dependency structure. Not what files import what (that's static analysis). What actually flows between components at runtime and during changes.

### Flow Map A: Data Flow
Where data is created, transformed, and consumed.

```
User Input (text)
  → parseActivity.ts (extracts fields)
  → actionEngine.ts (detects intent)
  → activitiesStore.ts (writes to DB via activities.ts)
  → SQLite DB (stores with real UUID)
  → activitiesStore.loadDay() (reads back, generates virtual instances)
  → recurrence.ts (creates virtual IDs: realId_YYYY-MM-DD)
  → CanvasScreen (renders as pills, watermarks, or tasks)

ID FORMAT:
  Real (DB): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (hyphens only)
  Virtual (runtime): realId_YYYY-MM-DD (underscore + date suffix)

  RULE: Virtual IDs exist ONLY in the store's activities array.
        They must be resolved to real IDs before ANY DB write.
        Resolution point: the CALLER (screen), NOT the store.
```

### Flow Map B: Decision Flow
Whose intent constrains whose actions.

```
Founder (vision, taste, priorities)
  → ARCHITECTURE.md (what to build)
  → DESIGN.md (how it looks)
  → CLAUDE.md (how to build it)
  → Agent (executes within these constraints)

For features:
  Product intent ("user should be able to X")
  → Design spec (how X looks and behaves)
  → Tech spec (how X is implemented)
  → Code (the implementation)
  → Tests (verify the implementation matches intent)

RULE: Decisions flow downward. Code should never force a change
      to the design spec. Design should never contradict the product intent.
```

### Flow Map C: Failure Flow
When X fails, what else fails.

```
Supabase edge function fails
  → sendCommand() returns null
  → QuickAdd falls back to local parser (graceful)
  → PlayScreen falls back to local HTML generation (graceful)
  → SearchScreen shows text results only (graceful)

SQLite DB write fails
  → editActivity throws → form shows error message
  → BUT: if virtual ID passed, DB silently does nothing (NO ERROR)
    This is the most dangerous failure mode. Silent no-op.

recurrence.ts generates bad virtual ID
  → Every screen showing recurring activities breaks
  → Store operations on those activities silently fail
  → This is a Layer 1 failure cascading to ALL layers

Expo hot-reload
  → seed.ts re-runs if using INSERT OR REPLACE (overwrites user edits)
  → RULE: Seeds must use INSERT OR IGNORE for data, OR REPLACE only for schema

Theme token wrong in theme.ts
  → Every component using that token renders incorrectly
  → This is a Layer 4 failure cascading to Layer 5
  → Detection: grep for the old value in all .tsx files
```

### Flow Map D: Change Flow
When X changes, what else must change.

```
IF YOU CHANGE: types/index.ts (Activity type)
  CHECK: activitiesStore.ts, all DB functions in activities.ts,
         every screen that renders Activity fields,
         recurrence.ts (virtual instance creation),
         seed.ts (seed data shape)
  LAYER CROSSING: 1 → 2, 3, 5

IF YOU CHANGE: activitiesStore.ts (editActivity, quickToggleComplete)
  CHECK: every screen that calls these functions (grep for editActivity)
         CanvasScreen, ActivityFormScreen, QuickAddScreen, PlanScreen
  LAYER CROSSING: 2 → 3
  ID WARNING: callers may pass virtual IDs. Store passes to DB.
              Resolution must happen at the caller.

IF YOU CHANGE: theme.ts (any color, spacing, or typography value)
  CHECK: DESIGN.md (does the spec need updating?)
         DESIGN-QA-CHECKLIST.md (update the expected values)
         Every component using the changed token
  LAYER CROSSING: 4 → 5
  DETECTION: grep for the old value in all .tsx files

IF YOU CHANGE: recurrence.ts (virtual instance generation)
  CHECK: activitiesStore.ts (loadDay merges virtual instances)
         CanvasScreen (renders virtual instances, has navigateToActivity)
         Every function that receives an activity ID
  LAYER CROSSING: 1 → 2, 3
  THIS IS HIGH RISK. Virtual IDs affect the entire system.

IF YOU CHANGE: DESIGN.md (design spec)
  CHECK: theme.ts (tokens match?), FEATURE-SPECS.md (component specs match?)
         Every component that implements the changed spec
  LAYER CROSSING: 4 → 5

IF YOU CHANGE: supabase/functions/ (edge function)
  CHECK: lib/ai.ts (client that calls it), PlayScreen, SearchScreen, QuickAddScreen
         .env (API keys), Supabase secrets
  LAYER CROSSING: 7 → 2, 3
  DEPLOY: must run supabase functions deploy

IF YOU CHANGE: rendering rules (what becomes pill vs watermark vs task)
  CHECK: CanvasScreen (timedActivities filter, watermarkActivities filter)
         DESIGN.md (rendering rules section)
         ARCHITECTURE.md (rendering rules section)
         seed.ts (test data should cover all combinations)
  LAYER CROSSING: 2 → 3, 4, 0
  THIS IS HIGH RISK. Changes here affect what users see everywhere.

IF YOU CHANGE: navigation (AppNavigator.tsx)
  CHECK: every screen's Props interface, deep links, QA commands
  LAYER CROSSING: 3 → 5
```

---

## Part 3: Boundary Contracts

Every cross-layer dependency has an explicit contract.

### Layer 1 → Layer 2: Data Model to Business Logic
**Contract**: The Activity type in types/index.ts is the single source of truth.
- Store functions consume and produce Activity objects
- ID format is defined in Layer 1 (UUID for real, UUID_date for virtual)
- Store NEVER transforms IDs. Passes through.

### Layer 2 → Layer 3: Business Logic to Product Features
**Contract**: Store functions are the API for screens.
- Screens call store functions (addActivity, editActivity, quickToggleComplete, loadDay)
- Screens receive Activity objects from the store's arrays
- **Virtual ID resolution happens at this boundary** (in the screen, before calling store)

### Layer 3 → Layer 4: Product Features to Design System
**Contract**: theme.ts defines all visual tokens.
- Screens import from theme.ts, never hardcode colors/spacing/typography
- DESIGN.md is the spec. theme.ts is the implementation. They must match.

### Layer 4 → Layer 5: Design System to UI Components
**Contract**: Components use theme tokens exclusively.
- No hardcoded hex values in component StyleSheets
- Glass morphism values from colors.glass.*
- Shadows from shadows.*
- Typography from typography.* or type.*

---

## Part 4: Sensors

Automated checks that detect when dependencies are causing problems. Run these before every commit.

### Sensor 1: Design Token Compliance
```bash
grep -r "#2D4A3E\|#FAF7F2\|#1A1A1A\|#5A5550\|#4B4642\|#746E69\|#DED6CA" mobile/src/**/*.tsx
```
Expected: zero results. Any match = Layer 4→5 boundary violation.

### Sensor 2: Theme Values Match Spec
Read theme.ts, verify:
- colors.bg = #F5F0E8
- colors.text = #1A1714
- colors.primary = #2D5A3E
- colors.muted = #8C857D
- colors.categoryTint = 0.12

### Sensor 3: Virtual ID Safety
```bash
grep -n "updateActivity\|removeActivity" mobile/src/store/activitiesStore.ts
```
Verify: no function in the store manipulates IDs. They pass through.

```bash
grep -n "editActivity\|quickToggleComplete" mobile/src/features/**/*.tsx
```
Verify: every caller that might receive a virtual ID resolves it first.

### Sensor 4: Rendering Rule Consistency
Read CanvasScreen.tsx timedActivities and watermarkActivities filters.
Verify they match:
- start_time + duration > 0 + type TIME_BLOCK → pill
- start_time + duration 0 + type TASK → watermark at time
- no start_time + recurring → watermark distributed
- no start_time + not recurring → task in bottom bar

Cross-check with DESIGN.md rendering rules section.

### Sensor 5: Seed Data Safety
```bash
grep -n "INSERT OR REPLACE" mobile/src/lib/db/seed.ts
```
Verify: only used for schema/meta, never for activity data that users might edit.

---

## Part 5: Change Protocol

Before making ANY change:

1. **Identify the layer.** Which layer does this file belong to?
2. **Check if you're crossing a boundary.** Does your change affect a different layer?
3. **If crossing a boundary**, read the Change Flow Map for that boundary. What else must change?
4. **Read the boundary contract.** What rules apply at this crossing?
5. **Make the change.** One layer at a time. One commit per layer crossing.
6. **Run sensors.** All four sensors before committing.
7. **If a sensor fails**, fix the violation before committing.

### When Fixing Bugs
8. **Trace the failure flow.** Which flow map shows the failure path?
9. **Find the boundary where it breaks.** The fix point is usually AT the boundary, not deep inside a layer.
10. **Fix at the boundary.** Don't change internal layer logic to compensate for a boundary problem.

---

## Part 6: How This Grows

As the product grows, this system grows by:

1. **Adding entries to the Change Flow Map** when new cross-layer dependencies emerge
2. **Adding sensors** when a new class of bug is discovered
3. **Splitting layers** if a layer becomes too large (e.g., Layer 3 might split into "Core Features" and "AI Features")
4. **Adding boundary contracts** for new integration points

What this system does NOT grow into:
- An org chart (people don't matter here, connections do)
- A process document (there's one process: the change protocol above)
- A testing framework (sensors are specific and actionable, not exhaustive checklists)

Keep it lean. Gall's Law: the system to manage dependencies must not itself become a complex dependency.
