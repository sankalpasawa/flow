# Sutra — Enforcement Protocol

## Default: Hard Enforcement

Every protocol in Sutra is HARD-enforced unless explicitly marked as soft. If a document says "do X," that means X is mandatory. Not a suggestion. Not a guideline. Mandatory.

## How Enforcement Works

### Level 1: Document-Level Enforcement

Every Sutra document that contains rules must have an enforcement marker:

```
ENFORCEMENT: HARD — violations are blocked
ENFORCEMENT: SOFT — violations are flagged but allowed
ENFORCEMENT: FOUNDER-OVERRIDE — hard by default, founder can override
```

If no marker exists, the default is **HARD**.

### Level 2: Session-Level Enforcement

When a session starts for any company, the OS file is loaded. The OS file contains the protocols. The session MUST follow them.

**How to verify compliance:**

At the end of every feature (before shipping), the session runs a self-check:

```
COMPLIANCE CHECK:
- [ ] Did we follow the correct mode? (SUTRA/DIRECT per SUTRA-CONFIG.md)
- [ ] Did we log metrics? (METRICS.md updated)
- [ ] Did we write feedback? (feedback-to-sutra/ if anything was learned)
- [ ] Did we run the gstack skills specified by the mode?
- [ ] Did we stay within our file boundaries? (Session isolation)
- [ ] Did we follow the build order? (TODO.md priorities)
```

If any check fails, the feature CANNOT ship until resolved.

### Level 3: Pre-Commit Enforcement (Hooks)

These fire automatically before git commits:

| Hook | What It Checks | Blocks Commit? |
|------|---------------|---------------|
| File boundary | Edited files are within session's company scope | YES |
| Metrics logged | METRICS.md has an entry for this feature | YES (SUTRA mode only) |
| Mode compliance | Feature used the correct mode per SUTRA-CONFIG.md | YES |
| OS loaded | Session has read the company's OPERATING-SYSTEM file | YES |

### Level 4: Cross-Session Enforcement (Sutra Agent)

When Sutra runs its own session, it checks all clients:

| Check | Frequency | Action on Violation |
|-------|-----------|-------------------|
| Mode compliance | Every feature | Flag in Daily Pulse |
| Metrics logged | Every feature | Block next feature until logged |
| Feedback written | Weekly | Flag if no feedback in 7 days |
| OS version current | Monthly | Notify of available upgrade |
| Landing page exists | After deploy | Add to TODO if missing |

---

## Current Protocols and Their Enforcement Level

### CLIENT-ONBOARDING.md
| Rule | Enforcement |
|------|-------------|
| 8-phase process (no skipping) | HARD |
| Phase gates must pass before proceeding | HARD |
| Market research before shaping | HARD |
| Founder must DECIDE (Phase 4) before building | HARD |
| Landing page by default | FOUNDER-OVERRIDE (default yes) |
| Analytics before 100 users | HARD |

### SESSION-ISOLATION.md
| Rule | Enforcement |
|------|-------------|
| Separate sessions per company | HARD |
| Level 2 hooks (file boundaries) | HARD |
| Level 3 directory isolation | HARD |
| Level 4 agent isolation (cross-company) | HARD |
| Level 5 fresh context (GSD) | SOFT (use judgment: independent tasks yes, interdependent no) |

### SKILL-CATALOG.md
| Rule | Enforcement |
|------|-------------|
| SUTRA mode uses full pipeline | HARD |
| DIRECT mode uses minimal pipeline | HARD |
| /canary after every deploy | HARD |
| /retro weekly | SOFT (but flagged if skipped 2 weeks) |

### VERSION-UPDATES.md
| Rule | Enforcement |
|------|-------------|
| Feedback written to feedback-to-sutra/ | HARD (after every incident, weekly otherwise) |
| Version update notice to clients | HARD (Sutra's job) |
| Client evaluates update | FOUNDER-OVERRIDE (can skip) |

### AGENT-INCENTIVES.md
| Rule | Enforcement |
|------|-------------|
| Metrics tracked per agent | HARD |
| Tension scenarios surfaced in Daily Pulse | HARD |
| Bypass tracking (when DIRECT used instead of SUTRA) | HARD |

### A/B-TEST-FRAMEWORK.md
| Rule | Enforcement |
|------|-------------|
| Alternating SUTRA/DIRECT per schedule | HARD |
| Metrics logged per feature per mode | HARD |
| Data decides mode after test completes | HARD |
| Founder can override at any time | FOUNDER-OVERRIDE |

---

## Adding New Protocols

When the founder adds a new protocol to Sutra:

1. Write it to the relevant document
2. Mark enforcement level: HARD, SOFT, or FOUNDER-OVERRIDE
3. If HARD: add it to the compliance check
4. Add validation task for existing clients: "validate against {company} next session"
5. Add to this file's protocol table

**Default is HARD.** If the founder doesn't specify, it's mandatory.

---

## Violation Handling

| Severity | Example | Action |
|----------|---------|--------|
| BLOCK | Skipping Phase 4 (DECIDE) | Cannot proceed. Must go back. |
| BLOCK | Editing another company's files | Hook blocks the edit. |
| FLAG | No feedback written this week | Daily Pulse highlights it. Decision needed. |
| FLAG | Skipped /canary after deploy | Added to next session's TODO. |
| LOG | Used DIRECT when schedule said SUTRA | Logged in A/B test metrics. Not blocked (founder has override). |
