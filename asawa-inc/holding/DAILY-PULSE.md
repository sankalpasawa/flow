# Asawa Inc. — Daily Pulse

## What This Is

Every day, at session start, you get a one-page pulse of all companies. No need to dig into files. The system produces this automatically via `.claude/hooks/daily-pulse.sh`.

## The Pulse Format

```
═══════════════════════════════════════════
ASAWA INC. — DAILY PULSE — {date}
═══════════════════════════════════════════

SUTRA (the OS company)
├── Version: v{X} (current release)
├── Clients: {N} ({list})
├── Feedback pending: {count} items
└── Health: green / yellow (if feedback pending)

DAYFLOW (productivity app)
├── Tier: 2 (Product)
├── Open TODOs: {count}
├── Yesterday: {commits or "no commits"}
└── Health: green / yellow / red (based on TODO count)

PPR (wedding command center)
├── Tier: 1 (Personal)
├── Open TODOs: {count}
├── Yesterday: {commits or "no commits"}
├── Days to wedding: {calculated from July 5, 2026}
└── Health: green / yellow / red (factors in deadline proximity)

HOLDING COMPANY
├── Open TODOs: {count from holding/TODO.md}
└── Pending decisions: {HIGH priority items or "none"}

═══════════════════════════════════════════
```

## How It Gets Generated

The script `.claude/hooks/daily-pulse.sh` runs at session start and:

1. Discovers all client companies in `asawa-inc/` (excluding `holding/` and `sutra/`)
2. Reads `TODO.md` in each company directory (falls back to repo-root TODO.md for DayFlow)
3. Reads `SUTRA-CONFIG.md` for tier info (with known defaults: DayFlow=2, PPR=1)
4. Counts files in all `feedback-to-sutra/` directories
5. Extracts Sutra version from `RELEASES.md` or pinned version in any SUTRA-CONFIG
6. Checks `git log --since="yesterday"` for each company's directory
7. For PPR, calculates days remaining until the wedding (July 5, 2026)
8. Outputs the formatted pulse to stdout

### Health logic

- **Sutra**: green if no pending feedback, yellow if feedback exists
- **Client companies**: green (<=5 TODOs), yellow (<=20), red (>20)
- **PPR special rule**: if <=30 days to wedding AND >10 open TODOs, forced to red

### Adding a new company

When a new company is onboarded via Sutra, the pulse auto-discovers it — no script changes needed. The new company just needs a directory in `asawa-inc/` with an optional `TODO.md` and `SUTRA-CONFIG.md`.

## The Company Meeting (when founder requests)

If the founder says "company meeting" or "deep review", a longer session runs:

```
SUTRA REVIEW
├── What's working in the OS? (from client feedback)
├── What's not working? (from client feedback)
├── What should the next version include?
├── Any research insights to incorporate?
└── Sutra's incentive check: are clients shipping faster WITH Sutra?

DAYFLOW REVIEW
├── Mission progress (key results status)
├── Feature pipeline (what's next in TODO.md)
├── Bug backlog
├── Design debt
├── Technical debt (files > 400 lines)
├── DayFlow's incentive check: is Sutra helping or slowing us down?
└── Feedback to send to Sutra

PPR REVIEW
├── Days to wedding countdown
├── Feature completion vs deadline
├── Blocked tasks
├── What needs to ship this week to stay on track?
└── Any tasks that can be cut?

CROSS-COMPANY
├── Is each client getting what it needs from Sutra?
├── Is Sutra learning from all clients?
├── Any decisions founder needs to make?
└── Next week's focus for each company
```
