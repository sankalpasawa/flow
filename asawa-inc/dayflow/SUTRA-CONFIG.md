# DayFlow — Sutra Configuration

**Sutra version pinned**: v1.0
**Mode**: A/B TEST (alternating)

## Operating Modes

DayFlow can operate in three modes. The founder or the system sets the mode per feature.

| Mode | What happens | When to use |
|------|-------------|-------------|
| **SUTRA** | Full OS: shape → design → specify → build → verify → learn | New features, risky changes, cross-layer work |
| **DIRECT** | Just do it. No process. Read knowledge system, build, ship. | Bug fixes, small changes, urgent work |
| **AUTO** | System decides based on size: small = DIRECT, medium/large = SUTRA | Default after A/B test completes |

## Current Setting: A/B Test

The next 5 features alternate between SUTRA and DIRECT to measure which produces better outcomes.

| Feature # | Mode | Feature (TBD) | Ship Time | Breaks | Quality |
|-----------|------|---------------|-----------|--------|---------|
| 1 | SUTRA | | | | |
| 2 | DIRECT | | | | |
| 3 | SUTRA | | | | |
| 4 | DIRECT | | | | |
| 5 | (winner) | | | | |

## How It Works in Practice

**When mode = SUTRA:**
```
Before coding, the agent reads:
  1. asawa-inc/dayflow/OPERATING-SYSTEM-V2.md
  2. PRODUCT-KNOWLEDGE-SYSTEM.md
  3. Follows the full flow: shape → design → specify → build → verify → learn
  4. Logs: ship time, break rate, quality score
```

**When mode = DIRECT:**
```
The agent reads:
  1. CLAUDE.md (code quality rules only)
  2. PRODUCT-KNOWLEDGE-SYSTEM.md (change flow map only)
  3. Just builds. No mockup. No formal specify step. No node structure.
  4. Logs: ship time, break rate, quality score
```

**When mode = AUTO (after A/B test):**
```
The agent assesses the change:
  - Touches 1 file, 1 layer → DIRECT
  - Touches 2-3 files, 1-2 layers → DIRECT with knowledge system check
  - Touches 4+ files or 3+ layers → SUTRA
  - Any data model change → SUTRA always
  - Any design-visible change → SUTRA always
```

## How to Set the Mode

At the start of any feature, the founder says one of:
- "Use Sutra for this" → SUTRA mode
- "Just do it" → DIRECT mode
- (says nothing) → AUTO mode decides

Or: the system reads this config file and applies the A/B test schedule automatically.

## After A/B Test

When all 5 features are logged:
1. Compare ship time (average per mode)
2. Compare break rate (total per mode)
3. Compare quality (design QA score per mode)
4. Decide: SUTRA default, DIRECT default, or AUTO

Result logged here and fed back to Sutra as feedback.

## Bypass

If the founder says "bypass Sutra" at any point, switch to DIRECT immediately. No questions. The founder always has override.

If the founder says "full Sutra" at any point, switch to SUTRA immediately regardless of schedule.
