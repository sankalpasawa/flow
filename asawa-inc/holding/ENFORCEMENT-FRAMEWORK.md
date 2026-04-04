# Enforcement Framework
**Owner**: Asawa Inc. (holding company)
**Scope**: Universal mechanism — applies to all companies via Sutra compilation
**Enforcement**: HARD — this IS the enforcement

---

## What This Document Is

This defines HOW enforcement works — the machinery. Sutra's `ENFORCEMENT.md` defines WHAT gets enforced — the rules. These are complementary:

- **This document** (Asawa): the hook API, gate types, override protocol, state machine, deployment model
- **Sutra's ENFORCEMENT.md**: which process steps are gated, at which tier, for which protocols

Sutra reads both documents to compile a company-specific enforcement bundle.

---

## 1. Three Enforcement Types

| Type | Exit Code | Agent Experience | Use When |
|------|-----------|-----------------|----------|
| **Hard Gate** | exit 2 | Tool call BLOCKED. Agent sees error message. Must resolve before proceeding. | Process violations, boundary violations, missing required artifacts |
| **Soft Gate** | exit 0 + stdout message | Tool call ALLOWED. Agent sees advisory message in context. | Self-assessment reminders, optional process steps, informational warnings |
| **Audit** | exit 0 (silent) | Tool call allowed. No visible message. Decision logged. | Override tracking, decision logging, compliance scoring |

Convention: exit 2 = block (matching existing enforce-boundaries.sh). Exit 0 = allow.

---

## 2. Hook API Contract

Every enforcement hook follows this contract:

### Input
Hooks receive context via environment variables (set by Claude Code):
- `TOOL_INPUT_file_path` — the file being edited/written (for Edit/Write hooks)
- `TOOL_INPUT_command` — the command being run (for Bash hooks)
- `TOOL_USE_ID` — unique identifier for this tool call

Additional context read by the hook:
- `.claude/active-role` — current session role (asawa, sutra, company-{name})
- Company's `SUTRA-CONFIG.md` — tier, mode, stage

### Output
- **stdout**: messages shown to the agent (guidance, warnings, block reasons)
- **stderr**: debug output (not shown to agent)
- **exit code**: 0 = allow, 2 = block

### Rules
1. **Complete in <500ms.** No network calls. No LLM calls. Pure file system checks.
2. **Log every decision** to `.enforcement/audit.log` (format below).
3. **Be deterministic.** Same input = same output. No randomness.
4. **Fail open on error.** If the hook itself crashes, allow the action (exit 0). Log the crash. Never let a broken hook lock the developer out.
5. **One concern per hook.** Each hook checks one thing. Composition happens in settings.json.

### Audit Log Format
```
{ISO-timestamp} | {hook-name} | {ALLOW|BLOCK|WARN|OVERRIDE|ERROR} | {file-path} | {reason}
```
Example:
```
2026-04-04T03:30:00Z | process-gate | BLOCK | mobile/src/features/canvas/CanvasScreen.tsx | No SHAPE.md in .planning/features/current/
2026-04-04T03:30:15Z | process-gate | ALLOW | mobile/src/features/canvas/CanvasScreen.tsx | SHAPE.md exists
2026-04-04T03:31:00Z | self-assessment | WARN | asawa-inc/holding/ENFORCEMENT-FRAMEWORK.md | Foundational file edit, no research marker
```

---

## 3. Override Protocol

When a human explicitly says "bypass {hook-name}" or "skip the process":

### Steps
1. Agent creates `.enforcement/override-{hook-name}` containing:
   ```
   reason: {why the human wants to bypass}
   timestamp: {ISO-8601}
   requested_by: human
   ```
2. On next tool call, hook checks for override file → allows the action
3. Override is logged to audit.log with action=OVERRIDE
4. Override file **expires after 1 hour** (cleaned up by override-tracker.sh)
5. All overrides surface in the weekly enforcement review

### Rules
- Only the HUMAN can request an override. The agent never creates override files on its own judgment.
- Override is scoped to ONE hook. "Bypass process-gate" doesn't bypass self-assessment.
- Override is time-limited. After 1 hour, the gate re-engages.
- Every override is logged. No silent bypasses.

### Override Files
- Location: `.enforcement/override-{hook-name}`
- Lifecycle: created by agent on human request → checked by hooks → expired by override-tracker.sh
- Git: added to `.gitignore` (ephemeral, not committed)

---

## 4. Feature State Machine

Each feature tracked through the process gets a directory. Files represent completed steps.

### Structure
```
.planning/features/{slug}/
  SHAPE.md          ← Step 1: what, why, who benefits, P1 scope, edge cases
  DESIGN.md         ← Step 2: mockup reference, or "no visual change" with rationale
  SPECIFY.md        ← Step 3: files to change, boundaries crossed, approach
  BUILD.log         ← Step 4: auto-generated from git commits during build
  VERIFY.md         ← Step 5: sensor output, QA results, design compliance
  SHIP.md           ← Step 6: commit SHA, push confirmation, deploy status
  LEARN.md          ← Step 7: surprises, new knowledge, Sutra feedback
```

### Current Feature
The "current feature" is indicated by `.planning/features/current` — a symlink or directory for what's being actively worked on.

### How Hooks Use It
- `process-gate.sh` checks: does `.planning/features/current/SHAPE.md` exist?
- Future hooks can check for DESIGN.md, VERIFY.md, etc.
- If no `.planning/features/current/` exists, the agent is not in a feature flow — hooks allow freely.

### Starting a Feature
When the agent begins work on a feature:
1. Create `.planning/features/{slug}/`
2. Symlink or copy to `.planning/features/current`
3. Write SHAPE.md (the brief)
4. Now code edits are unblocked

### Finishing a Feature
1. Complete all required steps for the tier
2. Remove `.planning/features/current` symlink
3. Feature directory remains as a record

### Coexistence with GSD
`.planning/` is shared with GSD workflow tracking. Feature directories live under `.planning/features/` which doesn't conflict with GSD's `.planning/phases/`, `.planning/STATE.md`, etc.

---

## 5. Per-Change Tier Classification

Not every change needs 7 steps. The tier classifier determines the minimum process.

### v1: Size-Based Classification

| Tier | Trigger | Required Artifacts | Gate Types |
|------|---------|-------------------|------------|
| **Trivial** | 1 file, same layer, no visual change | None (just build) | No gates active |
| **Standard** | 2-3 files, OR any visual change | SHAPE.md + VERIFY.md | SHAPE = hard gate |
| **Significant** | 4+ files, OR crosses shearing layer, OR data model change | All 7 steps | SHAPE + DESIGN = hard gates |

### Auto-Promotion
If the agent classifies a change as Trivial but the change grows:
- Touches 3+ files → auto-promotes to Standard
- Crosses a shearing layer → auto-promotes to Significant
- The hook warns: "This change has grown beyond Trivial. SHAPE.md now required."
- Agent must retroactively create the brief before continuing

### Future: Learned Sensitivity (v2+)
v1 uses file count + layer crossing as proxy for risk. Future versions will learn which areas are sensitive based on bug history: a one-line auth change may be more sensitive than a 10-file CSS refactor. See `asawa-inc/holding/TODO.md` "Adaptive Judgment" section.

---

## 6. Self-Assessment Trigger

### When It Fires
PreToolUse on Edit/Write when the file matches foundational patterns:
- Filename contains: DESIGN, ARCHITECTURE, FRAMEWORK, PROCESS, INTERACTION, ENFORCEMENT, CHARTER
- New `.md` file being created in `asawa-inc/` (any level)

### What It Does
Soft gate. Checks for `.enforcement/research-done` marker file:
- If marker exists and is <1 hour old: allow silently
- If no marker: display advisory message reminding the agent of Principle 3 (self-assessment before foundational work)
- Never blocks. The agent can proceed, but the warning is in its context.

### Creating the Marker
After researching (WebSearch, WebFetch, reading reference docs), the agent creates:
```
.enforcement/research-done
```
This signals "I've done my due diligence." Expires after 1 hour (cleaned up by override-tracker.sh alongside override files).

---

## 7. Compile-Time Deployment Model

Enforcement is compiled at deploy time, not resolved at runtime. Companies run pre-configured hooks, not a rule engine.

### The Compilation Flow
```
Sutra reads:
  1. asawa-inc/holding/ENFORCEMENT-FRAMEWORK.md (this document — the mechanism)
  2. asawa-inc/sutra/layer2-operating-system/ENFORCEMENT.md (the rules)
  3. asawa-inc/{company}/SUTRA-CONFIG.md (tier, mode, stage)

Sutra produces:
  1. Hook scripts configured for the company's tier
  2. settings.json entries with correct matchers and order
  3. .enforcement/ directory with audit.log

Sutra installs:
  1. Copies hooks to .claude/hooks/
  2. Updates .claude/settings.json
  3. Creates .enforcement/ and .planning/features/
  4. Verifies: triggers a test action, confirms hooks fire
```

### What This Means for Companies
- Companies don't build enforcement. They receive it.
- Hooks are copies, not symlinks. Companies can't accidentally modify templates.
- Updates require a Sutra redeployment (version-controlled, not silent).

### Hook Order (Critical)
PreToolUse hooks fire in array order. The correct sequence:
1. `enforce-boundaries.sh` — most critical, blocks cross-company edits
2. `process-gate.sh` — blocks code without process artifacts
3. `self-assessment.sh` — warns on foundational work

If boundaries are violated, process-gate never fires. If process-gate blocks, self-assessment never fires. This is correct — more critical checks first.

---

## 8. Existing Hooks (Already Deployed)

| Hook | Type | Fires On | Purpose |
|------|------|----------|---------|
| enforce-boundaries.sh | Hard gate | PreToolUse Edit/Write | Blocks cross-company file edits based on active-role |
| process-compliance.sh | Tiered | PostToolUse Bash (git commit) | Tier 1: soft reminder. Tier 2: warn. Tier 3: block without metrics |
| daily-pulse.sh | Informational | SessionStart | Generates daily status of all companies |
| session-feedback-check.sh | Soft gate | PostToolUse Bash (git push) | Reminds to write feedback after pushing |

### New Hooks (This Deployment)

| Hook | Type | Fires On | Purpose |
|------|------|----------|---------|
| process-gate.sh | Hard gate | PreToolUse Edit/Write | Blocks source code edits without SHAPE.md |
| self-assessment.sh | Soft gate | PreToolUse Edit/Write | Warns on foundational file edits without research |
| override-tracker.sh | Audit | PostToolUse Edit/Write | Logs overrides, cleans expired override files |

---

## Evolution

This framework is v1. Known limitations and planned improvements:
- Tier classification is size-based only (sensitivity learning is TODO)
- Self-assessment check is pattern-based (can't truly verify research quality)
- Override protocol trusts the agent to only create overrides when human requests
- No cross-session enforcement yet (each session starts fresh)

Changes to this document require CEO of Asawa approval and trigger a Sutra redeployment to all companies.
