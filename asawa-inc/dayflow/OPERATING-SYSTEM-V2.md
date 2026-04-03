# DayFlow Operating System v2
**Derived from**: Sutra v1.0
**Principle**: This IS how the company operates. Driven by LLMs. Same information flow and decision-making as an idealistic company. Not adapted for LLMs — driven by them.

---

## The Team

DayFlow operates with the same roles as any B2C company. The information flow, decision checkpoints, and quality gates are identical to a 10-person team. The actors are agents and one founder.

### The Roles

| Role | What they do | Who does it today |
|------|-------------|-------------------|
| **CEO / Founder** | Vision, taste, final decisions, user conversations | Sankalp |
| **Product Manager** | Prioritize features, write specs, track metrics | Claude (CPO agent) + Sankalp approves |
| **Designer** | Mockups, design system, pixel QA | Claude (CDO agent) + Sankalp taste calls |
| **Lead Engineer** | Architecture, code quality, tech debt | Claude (main agent) |
| **QA Engineer** | Test on device, regression, design compliance | Claude (CQO agent) + sensors |
| **Data Analyst** | Analytics, user behavior, experiment results | Not active yet (Stage 2) |
| **Security Engineer** | Auth, privacy, compliance | Claude (CISO agent) on demand |
| **Growth Lead** | Onboarding, retention, distribution | Not active yet (Stage 2) |
| **Content Writer** | Copy, docs, app store listing | Claude + Sankalp voice/tone |
| **Ops / DevOps** | Deploy, monitor, incident response | Claude + Supabase |

---

## The Daily Operating Rhythm

### Morning (start of session)

**Process:** Stand-up. Each person says what they did yesterday, what they're doing today, what's blocking them.

**Execution:**
1. Read CLAUDE.md (auto-loaded)
2. Read TODO.md — what's the top priority?
3. Quick health check:
   - Any bugs reported? (check Expo logs)
   - Any design drift? (run design token sensor)
   - Is the app running? (check Expo server)
4. State the day's focus: one Mission, 2-3 Commitments

```
Today's focus:
  Mission: Ship morning briefing feature
  Commitments:
    1. Design mockup for briefing card
    2. Build the component
    3. Fix DateStrip scroll bug (carry-over)
```

### Working on a Feature

**Process:**

```
PM writes spec → Designer creates mockup → PM + Designer review →
Engineering builds → QA tests → Designer pixel-checks →
PM verifies it meets the spec → Ship
```

**Execution:**

```
Step 1: SHAPE (PM role — Claude + Sankalp)
  - One-paragraph brief: what, why, who benefits
  - P1 scope: the minimum that tests the idea
  - Edge cases listed

Step 2: DESIGN (Designer role — Claude creates, Sankalp approves)
  - HTML mockup in designs/
  - Open in browser for Sankalp to see
  - Sankalp: "yes" / "change X" / "try a different approach"
  - Only proceed after visual approval

Step 3: SPECIFY (Engineer role — Claude)
  - Read PRODUCT-KNOWLEDGE-SYSTEM.md
  - Which shearing layers does this touch?
  - Which files change? (change flow map)
  - Any boundary crossings? Check contracts.
  - Write the approach: "I'll change these 3 files in this order"

Step 4: BUILD (Engineer role — Claude)
  - One file at a time
  - Type-check after each file (if TypeScript)
  - Commit after each working change
  - Follow the 17 code quality rules in CLAUDE.md

Step 5: VERIFY (QA + Designer roles — Claude + sensors)
  - Run the 5 sensors
  - Test on phone via Expo Go (or DesignQA screenshots)
  - Does it match the mockup?
  - Does it break anything else?

Step 6: SHIP
  - Commit + push
  - Update TODO.md

Step 7: LEARN
  - Did the feature work as expected?
  - Any surprises during build? (feed back to Sutra)
  - Any new entries needed in PRODUCT-KNOWLEDGE-SYSTEM.md?
```

### Handling Bugs

**Process:**
```
User reports bug → QA reproduces → Engineer diagnoses root cause →
Engineer fixes → QA verifies → Ship
```

**Execution:**

```
Step 1: REPRODUCE
  - Can we see the bug? (screenshot, Expo logs, QA system)
  - What exactly happens vs what should happen?

Step 2: DIAGNOSE
  - Read PRODUCT-KNOWLEDGE-SYSTEM.md for the affected area
  - Trace the data flow end to end
  - Identify the EXACT line that fails and WHY
  - Do NOT guess. Do NOT write a fix until you understand the cause.

Step 3: FIX
  - One file, one change
  - The fix should be SIMPLER than the bug, not more complex
  - If the fix touches more than 2 files, stop and rethink

Step 4: VERIFY
  - Run sensors
  - Test the specific scenario that was broken
  - Test adjacent scenarios (did the fix break something else?)

Step 5: LEARN
  - Update PRODUCT-KNOWLEDGE-SYSTEM.md if a new dependency was discovered
  - Add a sensor if this class of bug should be caught automatically
  - Feed back to Sutra if a principle was missing
```

### Making Decisions

**Process:** PM proposes, team discusses, CEO decides on taste/strategy, PM decides on scope/priority, Engineer decides on technical approach.

**Execution:**

| Decision type | Who decides | Process |
|--------------|------------|---------|
| What to build next | Sankalp | Review TODO.md, pick based on gut + strategy |
| How it should look | Sankalp | Claude creates mockup, Sankalp approves/adjusts |
| How it should work (UX) | Sankalp | Claude proposes flow, Sankalp validates |
| How to implement (code) | Claude | Read knowledge system, follow architecture |
| Which file to change | Claude | Change flow map in PRODUCT-KNOWLEDGE-SYSTEM.md |
| Whether to refactor | Sankalp | Claude flags tech debt, Sankalp decides when |
| P1 vs P2 vs defer | Sankalp | Claude provides options with trade-offs |
| Taste calls (fonts, spacing, color, tone) | Sankalp | Always. Non-negotiable. |

### Design Reviews

**Process:** Weekly design review. Designer presents all work-in-progress. Team critiques. PM checks alignment with product goals.

**Execution:**
- After every visible change: screenshot via DesignQA
- Compare against DESIGN.md specs
- Run design token sensor (grep for hardcoded hex)
- Sankalp reviews on phone: "this looks right" or "fix X"
- Formal design review: before any new feature ships, mockup → approval → build

### Weekly Review

**Process:** Weekly team meeting. Review metrics, discuss priorities, plan next week.

**What we do (end of week or end of session):**

```
1. WHAT SHIPPED this week?
   - List of committed features/fixes

2. WHAT BROKE?
   - Bugs found, regressions, design drift
   - Root causes (not just symptoms)

3. WHAT DID WE LEARN?
   - New entries for PRODUCT-KNOWLEDGE-SYSTEM.md
   - New principles for Sutra (feedback)
   - Things that worked well (keep doing)
   - Things that didn't work (stop doing)

4. WHAT'S NEXT?
   - Top 3 priorities for next week
   - Any blockers?
   - Any decisions needed from Sankalp?
```

---

## The Node Structure for DayFlow

### Active Missions
```
M-001: Ship DayFlow to TestFlight (Stage 1 → Stage 2)
  Status: In Progress
  Key Results:
    - App runs smoothly on iPhone ✓
    - 5 screens functional ✓
    - Morning water bug fixed ✓
    - Privacy policy written ✗
    - PostHog analytics integrated ✗
    - 25 beta users invited ✗
```

### This Week's Commitments
```
C-001: Fix remaining UX bugs (under M-001)
C-002: Add onboarding flow (under M-001)
C-003: Integrate PostHog (under M-001)
```

### Today's Tasks
```
T-001: Fix fontSize runtime error (under C-001)
T-002: Design onboarding screens mockup (under C-002)
T-003: Install PostHog SDK (under C-003)
```

---

## Cross-Cutting Concerns

These apply to EVERY feature, not just specific ones:

### Before Every Code Change
1. Read the change flow map for affected files
2. Check if crossing a shearing layer boundary
3. One file at a time
4. Type-check after each change

### Before Every Design Change
1. Read DESIGN.md for the component spec
2. Create mockup before code
3. Use theme tokens (no hardcoded values)
4. Get Sankalp's approval on taste calls

### Before Every Product Decision
1. Does this serve the current Mission?
2. Is this P1 (must do) or P2 (can wait)?
3. What's the simplest version that tests the hypothesis?
4. Say no to everything that isn't P1 for the current Mission

### After Every Session
1. Commit and push all changes
2. Update TODO.md
3. Note any learnings for Sutra feedback
4. Update PRODUCT-KNOWLEDGE-SYSTEM.md if new dependencies found

---

## How This Evolves

This OS is v2 for DayFlow, derived from Sutra v1.0.

When DayFlow hits Stage 2 (25 beta users), this document gets updated:
- Data Analyst role activates (PostHog reviews)
- Growth Lead role activates (onboarding optimization)
- Weekly metrics review added
- User interview cadence added
- A/B testing process added

The current document covers Stage 1: pre-launch, building, shipping.
