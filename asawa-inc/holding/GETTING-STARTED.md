# Asawa Inc. — Getting Started

## What is Asawa Inc.?

Asawa Inc. is a holding company that builds and operates AI-native businesses. Our mission: empowering every individual to reach their highest potential.

We don't build one company. We build the system that builds companies. That system is called Sutra.

---

## The Structure

```
Asawa Inc. (holding company)
├── Sutra — The operating system for building companies
├── DayFlow — Personal OS for daily life (iOS app, first company built with Sutra)
└── Your Company — Built through Sutra in ~60 minutes
```

---

## How to Start a New Company

### Prerequisites

1. Clone the repo:
   ```
   git clone <repo-url>
   cd flow
   ```

2. Install GSD (Get Shit Done) skills:
   ```
   npx get-shit-done-cc@latest --claude --global
   ```

3. Have Claude Code installed (CLI, desktop app, or web at claude.ai/code)

### Launch

Open a terminal and run:

```
cd ~/Claude/flow && claude --dangerously-skip-permissions
```

Or use the shell aliases (after setup):
```
asawa      → CEO of Asawa (full authority)
sutra      → CEO of Sutra (processes feedback, updates protocols)
dayflow    → CEO of DayFlow
```

Or use the start script:
```
./start.sh              → CEO of Asawa
./start.sh sutra        → CEO of Sutra
./start.sh dayflow      → CEO of DayFlow
./start.sh mycompany    → CEO of any new company
```

### Build a New Company

In Claude Code, type:

```
/sutra-onboard
```

Sutra walks you through 8 phases:

| Phase | What Happens | Time |
|-------|-------------|------|
| 1. Intake | Sutra asks 11 questions about your idea | 5 min |
| 2. Market | Sutra researches competitors, APIs, user complaints | 10 min |
| 3. Shape | PR/FAQ test, feature carve, risk map, success metrics | 10 min |
| 4. Decide | You commit: build, reshape, or kill | 2 min |
| 5. Architect | Tech stack, data model, deployment plan | 15 min |
| 6. Configure | Sutra generates your company's operating system | 10 min |
| 7. Deploy | Company folder created, website deployed, committed to git | 5 min |
| 8. Activate | GSD project initialized, roadmap ready, start building | 5 min |

Total: ~60 minutes from idea to building.

---

## After Onboarding

Your company lives at `asawa-inc/{your-company}/`. Your OS is at `OPERATING-SYSTEM-V1.md`.

### Day-to-day commands

```
/gsd:plan-phase 1       → Plan your first feature
/gsd:execute-phase 1     → Build it (parallel wave execution)
/qa                       → Test + fix + verify
/ship                     → Deploy to production
/canary                   → Post-deploy health monitoring
/gsd:progress             → Where am I? What's next?
/gsd:pause-work           → Save state, resume later
/gsd:resume-work          → Pick up where you left off
```

### 89 Skills Available

Full catalog at `asawa-inc/sutra/layer2-operating-system/b-agent-architecture/SKILL-CATALOG.md`.

Organized by what you're doing:
- **Planning**: /office-hours, /gsd:plan-phase, /autoplan, /plan-ceo-review
- **Building**: /gsd:execute-phase, /gsd:quick, /gsd:fast, /gsd:autonomous
- **Testing**: /qa, /design-review, /benchmark, /gsd:verify-work
- **Shipping**: /ship, /land-and-deploy, /canary
- **Debugging**: /investigate, /gsd:debug
- **Learning**: /retro, /document-release, /learn

---

## Role-Based Permissions

The system uses roles, not personal names.

| Role | Authority | Session context |
|------|-----------|----------------|
| CEO of Asawa | Full authority over everything | `asawa-inc/holding/` or `asawa-inc/sutra/` |
| CEO of Sutra | Changes Sutra docs, processes client feedback | `asawa-inc/sutra/` |
| CEO of {Company} | Own company only. Feedback to Sutra = PENDING | `asawa-inc/{company}/` |

When you're building your company, you're CEO of that company. Feedback about Sutra's process is captured but not applied until CEO of Sutra reviews and approves it.

---

## Giving Feedback

During any session, just say it. The system routes it:

- **Feedback about your product**: Applied immediately to your company docs
- **Feedback about Sutra's process**: Written to `{company}/feedback-to-sutra/` as PENDING
- **Bugs found while building**: Added to your company's TODO.md

CEO of Sutra reviews pending feedback in Sutra sessions with explicit approve/reject on each item.

---

## Session Isolation

Each company runs in its own session. Five enforcement levels:

1. **Instructions** — OS file loaded per company (soft)
2. **Hooks** — PreToolUse blocks cross-company file edits (hard)
3. **Directory isolation** — Session scoped to company files (hard)
4. **Agent isolation** — Subagents bounded to one company (hard)
5. **Fresh context per task** — GSD spawns clean context per task (conditional)

Rule: Never switch companies within a session. Start a new session.

---

## Key Links

- **Asawa Inc. website**: https://asawa-inc.vercel.app
- **Sutra website**: https://sutra-os.vercel.app
- **System map** (what exists): `asawa-inc/holding/SYSTEM-MAP.md`
- **Skill catalog**: `asawa-inc/sutra/layer2-operating-system/b-agent-architecture/SKILL-CATALOG.md`
- **Onboarding process**: `asawa-inc/sutra/layer2-operating-system/CLIENT-ONBOARDING.md`

---

## First Time?

Just run:

```
cd ~/Claude/flow && claude --dangerously-skip-permissions
```

Then type:

```
/sutra-onboard
```

Sutra asks the questions. You bring the idea.
