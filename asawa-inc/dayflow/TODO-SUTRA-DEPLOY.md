# DayFlow — Full Sutra Deployment

## Framing: Mid-Stage Company Onboarding

**DayFlow is NOT a greenfield deploy.** It's an existing company with:
- Working app (Expo React Native, 5 screens, real user data)
- 400+ lines of CLAUDE.md conventions accumulated over weeks
- Existing architecture debt (dual DB paths, web DB parser, no shared interface)
- A PRODUCT-KNOWLEDGE-SYSTEM.md that exists but isn't consulted
- An OS (OPERATING-SYSTEM-V2.md) that was written but never enforced
- Habits: "just code it" is the default, process is theoretical

**Treat this as**: Sutra onboarding a company that's been running without an OS. Not a rewrite. Not a cleanup. A systematic installation of process onto a running system.

**The approach**: Plan first, show the founder the plan, get approval, then execute phase by phase. Each phase should leave the company better than it found it without breaking what works.

## Phase 0: Assess (before touching anything)
- Audit current state: what works, what's broken, what's ignored
- Map existing conventions (CLAUDE.md) to Sutra processes — what overlaps, what conflicts, what's missing
- Identify the top 3 risks of deploying process onto this codebase
- Present the plan to the founder before executing

**This phase produces a DEPLOYMENT-PLAN.md that the founder reviews.**

## Phase 1-7: Execute (after founder approves)

## 1. Node Structure (replace flat TODO.md)
- Rewrite TODO.md as Missions → Commitments → Tasks
- Current mission: M-001 Ship to TestFlight
- Derive commitments from existing P0 items
- Derive tasks from existing unchecked items
- Keep the same content, restructure into hierarchy

## 2. Daily Standup Protocol
- Activate the standup from OPERATING-SYSTEM-V2.md
- At session start: state Mission, 3 Commitments, blockers
- daily-pulse.sh already generates company health — integrate standup into it
- Update CLAUDE.md "On Every Session Start" section

## 3. Weekly Review Cadence
- What shipped, what broke, what we learned, what's next
- Schedule: end of week or end of session batch
- Output: weekly entry in a WEEKLY-REVIEW.md or similar
- Feed learnings back to Sutra via feedback-to-sutra/

## 4. 5 Sensors Activated
- Design token sensor: grep for hardcoded hex outside theme.ts
- Virtual ID sensor: check all DB writes handle virtual IDs (originalId_YYYY-MM-DD)
- Rendering rules sensor: verify activity_type determines rendering, not data shape
- Seed safety sensor: all seeds use INSERT OR IGNORE, not INSERT OR REPLACE
- Theme compliance sensor: no inline styles that should use theme tokens
- Build as shell scripts, wire into process-compliance.sh or as separate PostToolUse hooks

## 5. Metrics Logging on Every Feature
- METRICS.md already exists with 6 entries from Apr 3
- Make it mandatory: every feature logs ship time, break rate, decision speed
- process-compliance.sh already checks for metrics at Tier 2 — verify it's working

## 6. PRODUCT-KNOWLEDGE-SYSTEM.md Consultation
- Before every code change, the process should reference the knowledge system
- Add to SHAPE.md template: "Which shearing layers does this touch?"
- Add to SPECIFY step: "Read the change flow map for affected files"
- Could add a soft hook that warns if knowledge system wasn't read this session

## 7. First Feature Through Full 7-Step Process
- Pick the top P0 item from TODO.md
- Run it through: Shape → Design → Specify → Build → Verify → Ship → Learn
- Log metrics
- This is the real test of whether the system works end-to-end

## What's Already Done (2026-04-04)
- HUMAN-AI-INTERACTION.md (7 principles) — committed
- ENFORCEMENT-FRAMEWORK.md (mechanism spec) — committed
- 3 new hooks (process-gate, self-assessment, override-tracker) — committed + wired
- .enforcement/ audit trail — committed
- Sutra ENFORCEMENT.md cross-referenced — committed
- CLIENT-ONBOARDING.md Phase 7 updated — committed
- QA: 8 bugs found and fixed in DayFlow app — committed
