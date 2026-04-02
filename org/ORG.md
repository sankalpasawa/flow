# DayFlow — The Autonomous Org

DayFlow runs like a company. AI agents act as CXOs of each department. They analyze the current state of the product, make decisions, prioritize work, and coordinate across functions. The founder (you) sets direction. The org executes.

## How It Works

```
Founder (you)
  → Sets vision, approves strategy, makes taste decisions
  → Runs: /standup (daily) to get cross-department report
  → Runs: /strategy (weekly) for strategic planning

Org (AI agents)
  → Each CXO agent owns a domain
  → Reads codebase, analytics, user feedback, competitor data
  → Produces: priorities, decisions, alerts, tasks
  → Coordinates with other CXOs via shared decision log
```

## The C-Suite

| Role | Agent | Domain | Runs When |
|------|-------|--------|-----------|
| **CEO** | Strategy Agent | Vision, priorities, cross-department coordination | Weekly + on demand |
| **CPO** | Product Agent | Features, roadmap, user needs, metrics | Daily |
| **CDO** | Design Agent | UI/UX quality, design system, pixel perfection | Daily + every commit |
| **CTO** | Engineering Agent | Architecture, tech debt, performance, code quality | Daily |
| **CISO** | Security Agent | Auth, privacy, vulnerabilities, compliance | Weekly + every deploy |
| **CDaO** | Data Agent | Analytics, experiments, user behavior, insights | Daily |
| **CGO** | Growth Agent | Onboarding, retention, notifications, virality | Weekly |
| **CQO** | Quality Agent | Testing, QA, regression, bug triage | Daily + every commit |
| **CCO** | Content Agent | Copy, app store listing, docs, changelog | On release |

## Daily Standup Protocol

Run `/standup` to trigger all daily agents. Each produces a short report:

```
[CPO] Product: 3 features in progress. Top priority: Play screen chat history.
[CDO] Design: 2 pixel mismatches found in CanvasScreen. Fix committed.
[CTO] Engineering: Tech debt score 6/10. Calendar.ts needs refactor.
[CDaO] Data: 0 users (pre-launch). Recommend setting up PostHog before launch.
[CQO] Quality: 312/338 tests passing. 26 need implementation. 0 regressions.
```

The CEO agent synthesizes all reports into a prioritized action list for the day.

## Weekly Strategy Session

Run `/strategy` to trigger the CEO agent for a deep review:
- What changed this week across all departments?
- Are we on track for launch?
- What's the biggest risk right now?
- What should we focus on next week?
- Cross-department dependencies and blockers

## Decision Log

Every significant decision gets logged to `org/decisions/` with date, who decided (which agent or founder), rationale, and impact. This is the institutional memory.

## Files

```
org/
├── ORG.md                  — This file (org structure)
├── agents/
│   ├── ceo.md              — CEO/Strategy agent instructions
│   ├── cpo.md              — Product agent instructions
│   ├── cdo.md              — Design agent instructions
│   ├── cto.md              — Engineering agent instructions
│   ├── ciso.md             — Security agent instructions
│   ├── cdao.md             — Data/Analytics agent instructions
│   ├── cgo.md              — Growth agent instructions
│   ├── cqo.md              — Quality agent instructions
│   └── cco.md              — Content agent instructions
├── standup/
│   └── YYYY-MM-DD.md       — Daily standup reports
└── decisions/
    └── YYYY-MM-DD-topic.md — Decision records
```
