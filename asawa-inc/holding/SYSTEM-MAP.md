# Asawa Inc. — System Map

*Before suggesting anything, check here first. If it exists, don't rebuild it.*

## The Structure

```
Asawa Inc. (holding)
├── Sutra (operating system company)
│   ├── Layer 1: Research & theory (45+ sources synthesized)
│   ├── Layer 2: Operating system (processes, onboarding, skills, enforcement)
│   ├── Layer 3: Modules (B2C template, 9 departments)
│   └── Layer 4: Functional principles (by department)
│
├── DayFlow (product company — iOS productivity app)
│   ├── OS v2, Sutra config, metrics, testing framework
│   └── Pinned to Sutra v1.0, A/B test mode
│
└── (Next company — onboard via /sutra-onboard)
```

## What Already Exists (by capability)

### "I want to onboard a new company"
DONE: `/sutra-onboard` command, 8-phase CLIENT-ONBOARDING.md, START-HERE.md

### "I want to know which skill to use"
DONE: SKILL-CATALOG.md — 89 skills (gstack + GSD) mapped by situation

### "I want skills mapped to the operating model"
DONE: GSTACK-INTEGRATION.md — every Sutra phase → gstack + GSD skills

### "I want to track metrics"
DONE: METRICS.md per company, AB-TEST-FRAMEWORK.md, DAILY-PULSE.md

### "I want agents with competing incentives"
DONE: AGENT-INCENTIVES.md — Sutra agents vs DayFlow agents, productive tension

### "I want session isolation between companies"
DONE: SESSION-ISOLATION.md — 5 levels (instructions, hooks, directory, agent, fresh context)

### "I want hard enforcement of rules"
DONE: ENFORCEMENT.md — default HARD, compliance checks, violation handling

### "I want findings to flow to the right place"
DONE: CONTINUOUS-IMPROVEMENT.md — bugs → TODO, process gaps → feedback-to-sutra/

### "I want Sutra to evolve from client feedback"
DONE: VERSION-UPDATES.md — feedback arrives → Sutra evaluates → publishes version → notifies clients

### "I want to test if Sutra's process helps"
DONE: AB-TEST-FRAMEWORK.md + SUTRA-CONFIG.md — alternating SUTRA/DIRECT mode per feature

### "I want a daily status report"
DONE: DAILY-PULSE.md — format defined, auto-generation TODO

### "I want websites for companies"
DONE: Sutra website (asawa-inc/sutra/website/), Asawa website (asawa-inc/holding/website/). Default in onboarding checklist.

### "I want to visualize company evolution"
DONE: designs/company-evolution.html — building-by-building timeline

### "I want to package Sutra for distribution"
STARTED: asawa-inc/sutra/package/ — npm installer structure. TODO: MCP server for hiding internals.

### "I want adversarial reviews"
DONE: 5 reviews in holding/reviews/ (investor, competitor, first-user, minimalist, skeptic)

### "I want department templates"
DONE: 9 departments in layer3-modules/b2c-consumer-app/departments/

### "I want processes for daily/weekly work"
DONE: 5 processes in layer2/processes/ (standup, weekly planning, decision-making, feature lifecycle, incident response)

## What Does NOT Exist Yet

| Gap | Where It Should Go | Priority |
|-----|-------------------|----------|
| Level 2 hooks actually implemented (PreToolUse) | .claude/settings.json | HIGH — enforcement is documented but not wired |
| Daily Pulse auto-generation at session start | Holding company protocol | HIGH |
| Sutra v1.1 (incorporating all feedback from this session) | Sutra releases | MEDIUM |
| DayFlow validation of new protocols | dayflow/feedback-from-sutra/ | MEDIUM — next DayFlow session |
| MCP server for hiding Sutra internals | Sutra distribution | LOW — when real clients exist |
| Founder involvement level config per company | Sutra onboarding Phase 1 | HIGH |
| More product type templates beyond B2C | Sutra layer 3 modules | MEDIUM — as new companies onboard |
| Vercel deployment of websites | Requires `vercel login` | HIGH |

## File Count: 83

| Area | Files | What's There |
|------|-------|-------------|
| Holding | 11 | Governance, reviews, isolation, incentives, websites |
| Sutra | 30 | OS, processes, modules, departments, skills, onboarding |
| DayFlow | 10 | OS, config, metrics, testing, knowledge system |
| Designs | 31 | Mockups, visualizations, research |
| Commands | 1 | /sutra-onboard |
