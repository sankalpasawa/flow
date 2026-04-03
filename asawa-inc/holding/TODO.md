# Asawa Inc. — Holding Company TODO

## Active Companies

| # | Company | Type | Platform | Status |
|---|---------|------|----------|--------|
| 1 | DayFlow | Productivity tool | iOS (Expo) | Active, pre-launch |
| 2 | Hehe | Content platform (humor) | Web (Next.js) | Active, pre-MVP |
| 3 | Kiro | Developer tool (CLI) | CLI + Web dashboard | Proposed |

## Proposed: Company #3 — Kiro

**What**: A CLI tool that watches your git commits and generates a daily standup summary. You run `kiro` at 9 AM and it tells your team what you shipped yesterday, what you're working on today, and what's blocked.

**Why this stress-tests Sutra differently**:
- DayFlow = iOS native app (UI-heavy, offline-first, single user)
- Hehe = Web content platform (content-heavy, real-time, anonymous users)
- Kiro = CLI tool + web dashboard (developer tool, API-heavy, team-oriented)

Three completely different product types forces Sutra to be truly generic.

**Core bet**: Developers hate writing standups but love showing what they shipped. If the AI summary is accurate and saves 5 minutes/day, teams will adopt it.

**Platform**: Node.js CLI (npm install -g kiro) + optional web dashboard for managers.

**Alternative ideas for Company #3**:
- **Browser extension** — "Save for later" that actually works (not bookmarks). Saves page content, not just URL. AI summarizes later.
- **Slack bot** — Monitors channels, surfaces important messages you missed, generates daily digest.
- **API wrapper** — Takes any REST API and generates a natural-language chat interface for it.

Founder to decide which one. All stress-test Sutra differently.

## Holding Company Tasks

- [ ] Build evolution visualization (time-lapse of company being built)
  - Single HTML file, self-contained, SVG building metaphor
  - Shows layers: Foundation → Structure → Product → Users
  - Each company gets its own "building" side by side
  - Auto-play timeline animation (10 seconds covers full evolution)
  - Hover on any floor to see what was built and when
  - Design: glass-pill aesthetic matching DayFlow
  - Pattern: GSD-PI self-contained reports (inlined CSS/JS, zero deps)

- [ ] Implement Daily Pulse auto-generation at session start
- [ ] Choose and onboard Company #3 through Sutra
- [ ] Run first A/B test feature for Hehe (Feature #1: joke feed, SUTRA mode)
- [ ] Run first A/B test feature for DayFlow (Feature #1 from SUTRA-CONFIG.md)
- [ ] Create Sutra v1.1 release incorporating feedback from first two clients

## Visualization Spec

The evolution visualization lives at `designs/company-evolution.html` and shows:

```
ASAWA INC.
├── [Building 1: DayFlow]     [Building 2: Hehe]     [Building 3: ???]
│   Floor 5: Users            Floor 5: Users          Floor 5: Users
│   Floor 4: Product          Floor 4: Product        Floor 4: Product
│   Floor 3: Design System    Floor 3: Design System  Floor 3: Design System
│   Floor 2: Architecture     Floor 2: Architecture   Floor 2: Architecture
│   Floor 1: Foundation       Floor 1: Foundation     Floor 1: Foundation
│   ─── Ground ───            ─── Ground ───          ─── Ground ───
│
├── [Sutra OS: The Blueprint]
│   Visible as the architect's plan that all buildings reference
│   Shows version (v1.0), feedback arrows flowing back from buildings
│
└── [Timeline slider at bottom]
    Drag to see each company being built over time
```

Where this lives: Asawa Inc. (holding company) because it visualizes the portfolio.
Not Sutra (Sutra is the blueprint, not the viewer).
Not DayFlow/Hehe (they're individual buildings, not the whole picture).
