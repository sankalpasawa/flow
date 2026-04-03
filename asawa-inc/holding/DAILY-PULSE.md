# Asawa Inc. — Daily Pulse

## What This Is

Every day, at session start, you get a one-page pulse of both companies. No need to dig into files. The system produces this automatically.

## The Pulse Format

```
═══════════════════════════════════════════
ASAWA INC. — DAILY PULSE — {date}
═══════════════════════════════════════════

SUTRA (the method company)
├── Version: v1.0 (current release)
├── Clients: 1 (DayFlow)
├── A/B Test: Feature {N} of 5 — mode: {SUTRA/DIRECT}
├── Feedback received: {count} items since last version
├── Open improvements: {list of pending changes}
└── Health: 🟢 / 🟡 / 🔴

DAYFLOW (the product)
├── Mission: {current mission, e.g., "Ship to TestFlight"}
├── This week's commitments: {2-3 items}
├── Yesterday shipped: {what was committed}
├── Breaks yesterday: {count}
├── Sutra mode: {SUTRA/DIRECT/AUTO}
├── Metrics: ship time avg {X}h | break rate {Y} | decisions {Z}
├── Blocked by: {anything blocking, or "nothing"}
└── Health: 🟢 / 🟡 / 🔴

DECISIONS NEEDED FROM FOUNDER
├── {decision 1, if any}
├── {decision 2, if any}
└── (or: "No decisions pending — proceed with current plan")

TODAY'S FOCUS
├── Top priority: {the ONE thing}
├── Secondary: {1-2 more}
└── Mode: {SUTRA / DIRECT}

═══════════════════════════════════════════
```

## How It Gets Generated

At session start, the system:
1. Reads TODO.md (DayFlow priorities)
2. Reads SUTRA-CONFIG.md (A/B test state)
3. Reads METRICS.md (recent performance)
4. Reads asawa-inc/dayflow/feedback-to-sutra/ (pending feedback)
5. Checks git log for yesterday's commits
6. Produces the pulse
7. Speaks the top priority via Tara

## The Company Meeting (when founder requests)

If the founder says "company meeting" or "deep review", a longer session runs:

```
SUTRA REVIEW
├── What's working in the OS? (from DayFlow feedback)
├── What's not working? (from DayFlow feedback)
├── What should v1.1 include?
├── Any research insights to incorporate?
└── Sutra's incentive check: is DayFlow shipping faster WITH Sutra?

DAYFLOW REVIEW
├── Mission progress (key results status)
├── Feature pipeline (what's next in TODO.md)
├── Bug backlog
├── Design debt
├── Technical debt (files > 400 lines)
├── DayFlow's incentive check: is Sutra helping or slowing us down?
└── Feedback to send to Sutra

CROSS-COMPANY
├── Is DayFlow getting what it needs from Sutra?
├── Is Sutra learning from DayFlow?
├── Any decisions founder needs to make?
└── Next week's focus for each company
```
