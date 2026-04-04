# Asawa Inc. — System Map

*Before suggesting anything, check here first. If it exists, don't rebuild it. (PROTO-001)*

## The Structure

```
asawa-inc/
│
├── holding/                                    ← ASAWA (governance + infrastructure)
│   ├── Governance
│   │   ├── HUMAN-AI-INTERACTION.md             7 principles for human-AI collaboration
│   │   ├── ENFORCEMENT-FRAMEWORK.md            Hooks, gates, override protocol
│   │   ├── SESSION-ISOLATION.md                5 levels of company separation
│   │   ├── AGENT-INCENTIVES.md                 What each agent optimizes for
│   │   ├── INSTRUCTION-ROUTING.md              How policies become hooks
│   │   └── PRINCIPLES.md                       Founding principles (P8+)
│   │
│   ├── Infrastructure
│   │   ├── AI-PROVIDERS.md                     Approved AI providers + policies
│   │   ├── EXTERNAL-SYSTEMS.md                 External API dependencies
│   │   ├── OVERRIDE-RULES.md                   Who can change what
│   │   ├── INFRASTRUCTURE-ARCHITECTURE.md      Inheritance model
│   │   └── templates/ai-provider.ts            Code template for AI integration
│   │
│   ├── Coordination
│   │   ├── DAILY-PULSE.md                      Cross-company health view
│   │   ├── SYSTEM-MAP.md                       This file — what exists
│   │   ├── TODO.md                             Holding company backlog
│   │   └── GETTING-STARTED.md                  Entry point for new sessions
│   │
│   └── hooks/                                  Hook templates (compiled to companies)
│
├── sutra/                                      ← OPERATING SYSTEM
│   ├── layer1-abstraction/                     Research foundation (45+ sources)
│   │
│   ├── layer2-operating-system/                The OS core
│   │   ├── OPERATING-MODEL.md                  Master document (P1-P8, T1-T6, Idea Flow)
│   │   ├── ENFORCEMENT.md                      Cross-cutting enforcement rules
│   │   ├── PROTOCOLS.md                        Convergence layer (principles → executable rules)
│   │   ├── CLIENT-ONBOARDING.md                8-phase company intake
│   │   ├── VERSION-UPDATES.md                  OS evolution protocol
│   │   ├── PROCESSES.md                        Process index
│   │   │
│   │   ├── a-company-architecture/             How real companies work
│   │   │   ├── CHARTER.md                      Org structure, governance
│   │   │   ├── ROUTING.md                      Cross-department info flow (60 routes)
│   │   │   ├── COMPLEXITY-TIERS.md             Personal → Product → Company scaling
│   │   │   ├── STANDUP-PROTOCOL.md             Daily rhythm
│   │   │   ├── CONTINUOUS-IMPROVEMENT.md       Feedback loops
│   │   │   ├── COMPLICATIONS.md                Edge case handling
│   │   │   └── processes/
│   │   │       ├── DAILY-STANDUP.md
│   │   │       ├── DECISION-MAKING.md
│   │   │       ├── FEATURE-LIFECYCLE.md
│   │   │       ├── HOD-MEETING.md
│   │   │       ├── INCIDENT-RESPONSE.md
│   │   │       └── WEEKLY-PLANNING.md
│   │   │
│   │   ├── b-agent-architecture/               How AI agents operate
│   │   │   ├── SKILL-CATALOG.md                89 skills mapped by situation
│   │   │   ├── GSTACK-INTEGRATION.md           Sutra phases → skills
│   │   │   ├── AB-TEST-FRAMEWORK.md            SUTRA vs DIRECT mode
│   │   │   └── AGENT-PROTOCOLS.md              Coordination, delegation, escalation
│   │   │
│   │   └── c-human-agent-interface/            How humans + agents collaborate
│   │       ├── INVOLVEMENT-LEVELS.md           Hands-on / Strategic / Delegated
│   │       └── SOVEREIGNTY.md                  WHAT=human, HOW=agent, override protocol
│   │
│   ├── layer3-modules/                         Domain-specific templates
│   │   └── b2c-consumer-app/
│   │       ├── STAGE-1-PRE-LAUNCH.md
│   │       └── departments/ (9 departments)
│   │
│   └── layer4-department-skills/               Functional principles by role
│       └── PRINCIPLES-BY-FUNCTION.md           17 domains, 100+ principles
│
├── dayflow/                                    Client #1 — iOS productivity app
├── ppr/                                        Client #2 — Wedding command center
└── maze/                                       Client #3 — Humor feed platform
```

## What Already Exists (by capability)

### "I want to understand how the system is structured"
DONE: This file. Also `GETTING-STARTED.md` for new sessions, `INFRASTRUCTURE-ARCHITECTURE.md` for inheritance model.

### "I want to onboard a new company"
DONE: `/sutra-onboard` command, 8-phase CLIENT-ONBOARDING.md, START-HERE.md

### "I want principles compiled into executable rules"
DONE: `PROTOCOLS.md` — 8 protocols compiled from Asawa + Sutra principles. Each has trigger, check, enforcement, origin.

### "I want to know how humans and agents collaborate"
DONE: `c-human-agent-interface/` — INVOLVEMENT-LEVELS.md (3 levels), SOVEREIGNTY.md (WHAT=human, HOW=agent, override protocol). Also `holding/HUMAN-AI-INTERACTION.md` (7 foundational principles).

### "I want to know how agents should behave"
DONE: `b-agent-architecture/` — AGENT-PROTOCOLS.md (coordination, delegation, escalation), SKILL-CATALOG.md (89 skills), GSTACK-INTEGRATION.md (phase→skill mapping).

### "I want to know how a company should be structured"
DONE: `a-company-architecture/` — CHARTER, ROUTING (60 routes), COMPLEXITY-TIERS, 6 processes (standup, weekly, decisions, features, incidents, HOD meetings).

### "I want AI providers managed centrally"
DONE: `holding/AI-PROVIDERS.md` — 6 approved providers, default models, security + cost policies (LOCKED). Conductor pattern on roadmap.

### "I want external dependencies registered"
DONE: `holding/EXTERNAL-SYSTEMS.md` — all APIs, databases, services across the portfolio.

### "I want to know which skill to use"
DONE: `b-agent-architecture/SKILL-CATALOG.md` — 89 skills (gstack + GSD) mapped by situation.

### "I want to track metrics"
DONE: METRICS.md per company, AB-TEST-FRAMEWORK.md, DAILY-PULSE.md

### "I want agents with competing incentives"
DONE: `holding/AGENT-INCENTIVES.md` — productive tension between speed, quality, documentation.

### "I want session isolation between companies"
DONE: `holding/SESSION-ISOLATION.md` — 5 levels.

### "I want hard enforcement of rules"
DONE: `ENFORCEMENT.md` (rules) + `holding/ENFORCEMENT-FRAMEWORK.md` (mechanism) + 6 hooks deployed.

### "I want the OS to scale with company complexity"
DONE: `a-company-architecture/COMPLEXITY-TIERS.md` — 3 tiers.

### "I want findings to flow to the right place"
DONE: `a-company-architecture/CONTINUOUS-IMPROVEMENT.md`

### "I want Sutra to evolve from client feedback"
DONE: `VERSION-UPDATES.md`

### "I want processes for daily/weekly work"
DONE: 6 processes in `a-company-architecture/processes/`

## What Does NOT Exist Yet

| Gap | Where It Should Go | Priority |
|-----|-------------------|----------|
| Daily Pulse auto-generation at session start | Hook + DAILY-PULSE.md | HIGH |
| Sutra v1.1 (incorporating feedback from Maze onboarding) | Sutra releases | MEDIUM |
| Hard isolation via git submodules | See holding/TODO.md | HIGH |
| More product type templates beyond B2C | Sutra layer 3 modules | MEDIUM |
| Hook for PROTO-001 (new-path-detector) | .claude/hooks/ | LOW |
| Hook for PROTO-002 (agent-completion-check) | .claude/hooks/ | MEDIUM |

## Client Registry

| # | Company | Type | Platform | Stage | Sutra Version |
|---|---------|------|----------|-------|---------------|
| 1 | DayFlow | Productivity tool | iOS (Expo) | Pre-launch | v1.0 |
| 2 | PPR | Productivity tool | Web (Next.js) | Pre-launch | v1.0 |
| 3 | Maze | Content platform | Web (Next.js) | Pre-launch | v1.0 |
