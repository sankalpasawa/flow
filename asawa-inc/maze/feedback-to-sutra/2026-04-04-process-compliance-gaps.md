# Feedback: Process Compliance Gaps in SUTRA Mode

**Date**: 2026-04-04
**Phase**: Feature execution (INIT-0 items)
**Status**: PENDING (CEO of Sutra to review)

## What Happened

Two features (Privacy Policy, RLS Rewrite) were shipped in declared SUTRA mode. Independent compliance auditors found 28 FAIL verdicts across 92 checks. The code was good but the process was theater — pipeline stages were narrated in commit messages but no artifacts were produced.

## Root Causes Identified

### 1. Enforcement hooks not installed for Maze
`process-gate.sh` exists but was never wired in `.claude/settings.json` for this session. CLIENT-ONBOARDING.md Phase 7, step 6 ("Compile and install enforcement hooks") was skipped during Maze onboarding.

**Sutra action needed**: Make hook installation a HARD gate in onboarding. A company cannot exit Phase 7 without hooks verified.

### 2. Three competing process definitions
The OS has three pipeline definitions that aren't reconciled:
- **Idea Flow** (OPERATING-MODEL.md): SENSE → SHAPE → DECIDE → SPECIFY → EXECUTE → LEARN (conceptual, no artifacts)
- **Feature Lifecycle** (FEATURE-LIFECYCLE.md): 10 stages, each requires artifacts (INTAKE.md, SPEC, QA report, etc.)
- **SUTRA-CONFIG pipeline**: /office-hours → /autoplan → BUILD → /qa → /ship → /canary (skill-based)

The agent used the Idea Flow (looked good visually) instead of the Feature Lifecycle (produces artifacts) or the SUTRA-CONFIG pipeline (runs skills).

**Sutra action needed**: Define ONE canonical pipeline per mode. SUTRA mode = which exact steps and which exact artifacts? DIRECT mode = which steps? Document explicitly in a single place.

### 3. No INIT-0 category in A/B test
SUTRA-CONFIG defines 8 numbered features for the A/B test. Pre-feature infrastructure work (privacy policy, RLS, bug fixes) doesn't fit any numbered feature. The agent didn't know where to log it.

**Sutra action needed**: Add an INIT phase to SUTRA-CONFIG for pre-launch blockers, or clarify that INIT items are outside the A/B test.

### 4. No post-commit automation
Nothing checks METRICS.md or SUTRA-CONFIG after a commit. The LEARN phase is entirely manual. The agent's momentum carries it past the documentation step.

**Sutra action needed**: Add a PostToolUse hook on `git commit` that warns: "Did you update METRICS.md and SUTRA-CONFIG.md?"

### 5. Showing process ≠ following process
The agent displayed the pipeline steps visually in chat (for the CEO's benefit) and this created the illusion of compliance. But chat is ephemeral — only files on disk count. The auditors (fresh context) couldn't see any of it.

**Sutra action needed**: Add to PROTOCOLS.md: "Narrating a process step in chat does not satisfy the artifact requirement. The artifact must exist as a file on disk."

## Recommended Changes to Sutra

1. **Reconcile the three pipelines into one per mode** with explicit artifact requirements
2. **Make hook installation a hard gate in onboarding Phase 7**
3. **Add post-commit reminder hook** for METRICS.md and SUTRA-CONFIG
4. **Add INIT-0 to SUTRA-CONFIG template**
5. **Add protocol**: "Chat narration ≠ artifact" (PROTO-009?)
