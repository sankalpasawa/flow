# Asawa Inc. — Session Isolation & Constraint Enforcement

## The Problem

When one LLM session works on multiple companies, cognitive contamination happens. Company A's patterns bleed into Company B. Different product types have different thinking. The LLM makes inconsistent decisions because it's holding two operating systems in the same context.

## The Five Levels

All five levels are active. They layer on top of each other.

### Level 1: Instructions (soft)

Every company has an OPERATING-SYSTEM file. When a session starts, it loads ONLY that company's OS. The OS contains principles, processes, tech stack, and metrics specific to that company.

**Files**: `asawa-inc/{company}/OPERATING-SYSTEM-V*.md`, `CLAUDE.md`

**Enforcement**: Soft. The LLM reads instructions but may drift under context pressure. This is the baseline, not the guarantee.

### Level 2: Hooks (hard)

PreToolUse hooks block cross-company file edits. If a session is working on Company B, it physically cannot edit Company A's files.

**Implementation**:
```json
// .claude/settings.json — PreToolUse hooks
// Block editing files outside the active company directory
// The active company is determined by the session's working directory
```

**Enforcement**: Hard. The shell blocks the action before the LLM can execute it.

### Level 3: Directory Isolation (hard)

Each company session opens in that company's context. The session sees only the files it needs.

**Protocol**:
- Holding company session: opens in `flow/` root, reads `asawa-inc/holding/` and `asawa-inc/sutra/`
- DayFlow session: opens in `flow/`, loads DayFlow OS, works in `mobile/` and `asawa-inc/dayflow/`
- {Other company} session: opens in `flow/`, loads that company's OS, works in its code dir and `asawa-inc/{company}/`

**Enforcement**: Hard when combined with Level 2 hooks. The session can read Sutra (shared OS), but can only EDIT its own company's files.

### Level 4: Agent Isolation (hard)

When the holding company needs to coordinate across companies, it uses subagents with bounded context.

```
Parent Agent (Asawa Holding)
├── reads: asawa-inc/holding/, asawa-inc/sutra/
├── coordinates, does NOT edit company files
│
├── spawns: DayFlow Agent (bounded to DayFlow context)
│   └── can only edit: mobile/, asawa-inc/dayflow/
│
└── spawns: {Company} Agent (bounded to that company's context)
    └── can only edit: {company-code}/, asawa-inc/{company}/
```

**Enforcement**: Hard. Subagents receive only the files in their scope. They cannot access other companies' context because it was never loaded.

### Level 5: Fresh Context Per Task (hard, conditional)

GSD's `/gsd:execute-phase` spawns a fresh subagent for each task. The subagent gets only its PLAN.md, STATE.md, and relevant code files. When the task finishes, the context is destroyed. State persists only through files.

**Enforcement**: Hard. Context is destroyed after each task. No contamination possible.

---

## When to Use Level 5

Level 5 is not always appropriate. Use judgment.

### USE Level 5 when:

- **Independent tasks**: Tasks that don't share state or depend on each other's output. Each task reads from files, writes to files, done.
- **SUTRA-mode features**: Full process, multi-task, multiple phases. The planning overhead is worth the isolation.
- **Cross-cutting changes**: When a task touches multiple layers (UI + DB + API). Fresh context forces the task to read the current state of each layer, not assume it from memory.
- **After an incident**: When a previous task caused a bug, fresh context ensures the fix isn't biased by the same reasoning that caused the bug.

### DO NOT use Level 5 when:

- **Interdependent tasks**: When task B needs to understand HOW task A solved something, not just WHAT it produced. Fresh context loses the reasoning, the trade-offs considered, the alternatives rejected. STATE.md captures decisions but not the full thinking.
- **Design iteration**: When you're going back and forth on visual choices, each iteration builds on the previous one's context. Destroying context between iterations means re-explaining the aesthetic direction every time.
- **Debugging chains**: When bug investigation spans multiple steps where each step's finding informs the next hypothesis. `/gsd:debug` with persistence is better than fresh context here.
- **Rapid prototyping**: When shipping speed matters more than isolation. Manual coding in a single session is faster than GSD's subagent overhead.
- **Small features (DIRECT mode)**: The overhead of spawning fresh contexts for a 5-minute change is not worth it.

### The Rule

```
SUTRA mode + independent tasks → Level 5 (use /gsd:execute-phase)
SUTRA mode + interdependent tasks → Levels 1-4 only (single session, bounded context)
DIRECT mode → Levels 1-4 only (fast, manual, single session)
Debugging → Levels 1-4 + /gsd:debug persistence (NOT fresh context)
```

---

## Session Protocol

### Starting a session

1. Decide which company you're working on
2. Load ONLY that company's OS file
3. Level 2 hooks automatically enforce file boundaries
4. If continuing from a previous session: `/gsd:resume-work`

### Switching companies

**DO NOT switch companies within a session.** Start a new session.

If you absolutely must (urgent bug in another company):
1. Run `/gsd:pause-work` for the current company
2. Note in the pause file: "switching to {other company}"
3. Start a NEW session for the other company
4. When done, start a NEW session to resume the original company with `/gsd:resume-work`

### Holding company coordination

The holding company session (this one) can:
- Read all company OS files (to understand the portfolio)
- Update Sutra (the shared operating system)
- Update holding company docs (DAILY-PULSE, AGENT-INCENTIVES, this file)
- Dispatch subagents to specific companies (Level 4)

The holding company session CANNOT:
- Edit any individual company's code directly
- Make product decisions for individual companies
- Mix company contexts in the same reasoning chain

### Daily Pulse generation

The Daily Pulse reads from all companies but doesn't edit any. This is a read-only cross-company operation. Safe.

---

## Enforcement Summary

| Level | What | Hard/Soft | Always Active | When to Skip |
|-------|------|-----------|---------------|-------------|
| 1 | OS file instructions | Soft | Yes | Never |
| 2 | PreToolUse hooks | Hard | Yes | Never |
| 3 | Directory isolation | Hard | Yes | Never |
| 4 | Agent isolation | Hard | Yes (for cross-company) | Single-company sessions don't need this |
| 5 | Fresh context per task | Hard | No | Interdependent tasks, debugging, rapid prototyping, DIRECT mode |
