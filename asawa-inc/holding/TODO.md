# Asawa Inc. — Holding Company TODO

## Active Companies

| # | Company | Type | Platform | Status |
|---|---------|------|----------|--------|
| 1 | DayFlow | Productivity tool | iOS (Expo) | Active, pre-launch |

## Future Companies

To be onboarded through Sutra when the founder is ready. Ideas discussed:
- Wedding consultant service (July 2025 wedding)
- Humor/jokes app (web)
- Developer CLI tool
- Browser extension
- Slack bot

## Holding Company Tasks

- [x] Build evolution visualization (designs/company-evolution.html)
- [x] Install GSD v1 skills (57 commands at ~/.claude/commands/gsd/)
- [x] Create /sutra-onboard command (.claude/commands/sutra-onboard.md)
- [x] Create unified skill catalog (89 skills: gstack + GSD)
- [x] Define 5-level session isolation protocol
- [ ] Update visualization to reflect current portfolio (DayFlow only for now)
- [ ] Implement Daily Pulse auto-generation at session start
- [ ] Run first A/B test feature for DayFlow (Feature #1 from SUTRA-CONFIG.md)
- [ ] Implement Level 2 hooks (PreToolUse file boundary enforcement)
- [ ] Onboard next company through Sutra when founder decides

## Hard Isolation: Git Submodule Architecture (must do)

Restructure from single repo to meta repo with submodules. This is the only way to get true hard enforcement on both reads AND writes.

**Current problem**: All companies share one repo. The LLM can read any file even if hooks block writes. Instructions are soft. A `/sutra-onboard` session can read Sutra's internal process docs.

**Target architecture**:
```
asawa-holding/              ← Meta repo (CEO of Asawa clones with --recursive)
├── sutra/                  ← Submodule (separate git repo)
├── dayflow/                ← Submodule (separate git repo)
├── {new companies}/        ← Each a submodule (separate git repo)
└── holding/                ← Holding-level docs (in meta repo itself)
```

**What this gives us**:
- CEO of DayFlow clones `dayflow` repo only. Physically cannot see Sutra source.
- CEO of Sutra clones `sutra` repo only. Cannot see client code.
- CEO of Asawa clones meta repo with `--recursive`. Sees everything.
- New founder gets their own repo. Gets OS copy, not Sutra source.

**How Sutra delivers to clients** (post-restructure):
- Sutra generates OS files during onboarding
- Pushes OUTPUT to the new company's repo (not Sutra source, just the deliverable)
- Client has a copy of their OS, not access to Sutra internals

**Feedback flows via git**:
- Client pushes to `feedback-to-sutra/` in their repo
- Sutra pulls from client repos to read feedback
- Sutra pushes updates to `feedback-from-sutra/` in client repos

**Steps to implement**:
- [ ] Create separate GitHub repos: `asawa-holding`, `sutra`, `dayflow`
- [ ] Move files to correct repos
- [ ] Set up submodules in meta repo
- [ ] Update `/sutra-onboard` to create new repos and push OS files
- [ ] Update feedback flow to work across repos (git pull/push)
- [ ] Update `start.sh` to clone the right repo per role
- [ ] Test: CEO of DayFlow cannot read Sutra source (physically impossible)
- [ ] Migrate existing DayFlow code and history

## Human-AI Interaction Framework (PRIORITY — foundational to everything)

The rules for how humans interact with AI agents. Lives at Asawa level, flows down to all companies.

### Interaction Types to Define

- [ ] **Human ↔ LLM interaction principles** — research best practices from gstack, AGENTS.md conventions, Anthropic guidelines, and real-world AI workflow tools. Define the core rules: when to follow process vs follow the human, when deeper research is needed before acting, when to ask vs act autonomously.
- [ ] **Self-assessment rule** — before acting on any fundamental design/architecture question, the agent must check: "Does this require deeper knowledge than my default? Should I research first?" Add as an enforceable rule in the interaction policy.
- [ ] **Agent ↔ Agent interaction rules** — how agents hand off context between roles (CPO → Engineer → QA). Authority hierarchy. What one agent can override vs what requires human.
- [ ] **Session ↔ Session continuity** — how context persists across sessions. Memory system rules. What gets saved vs what's ephemeral. Handoff protocols.
- [ ] **Company ↔ Company boundaries** — how DayFlow gives feedback to Sutra. How Sutra deploys updates to clients. Cross-company information flow.
- [ ] **Process enforcement framework** — the universal mechanism (hooks, state machines, sensors, audit trails) that ensures processes aren't skipped. This is the "court system" — Sutra provides the laws, Asawa provides the enforcement.
- [ ] **Natural language vs process authority** — core principle: "Natural language is intent, not override." When human says "fix this," agent follows the process to fix it. Only explicit override ("skip the process") bypasses. Agent must ask permission before skipping any defined step.

### Research Required Before Design

- [ ] Study gstack's enforcement model (hooks, skill routing, proactive behavior)
- [ ] Study GSD's workflow enforcement (how /gsd:execute-phase prevents skipping)
- [ ] Research AGENTS.md / CLAUDE.md conventions across popular open-source repos
- [ ] Research Anthropic's guidelines for agent authority and human oversight
- [ ] Study how Cursor rules, Windsurf rules, and other AI IDE configs handle process enforcement
- [ ] Look at multi-agent frameworks (CrewAI, AutoGen, LangGraph) for agent ↔ agent authority patterns
- [ ] Synthesize into: what works, what doesn't, what's novel about our setup

### Where Rules Live (decided)

| Interaction | Owner | Enforcement |
|-------------|-------|-------------|
| Human ↔ LLM | Asawa Inc (holding) | Asawa enforcement framework |
| Agent ↔ Agent | Sutra (operating system) | Sutra protocols |
| Company ↔ Company | Sutra (protocols) | Sutra + Asawa oversight |
| Session ↔ Session | Asawa Inc (holding) | Asawa enforcement framework |

## Adaptive Judgment for Enforcement Tiers (future — evolve over time)

Current tier classification uses change SIZE (file count, layer crossings) as a proxy for risk. But small changes can be highly sensitive (auth, payment, data model constraints).

- [ ] **Sensitivity scoring** — beyond size, classify by: area sensitivity (auth > CSS), blast radius (shared util > leaf component), past incident history (files that caused bugs before get higher sensitivity)
- [ ] **Per-company sensitivity map** — each company builds a map of which files/areas are sensitive, informed by their bug history and architecture. Sutra compiles this into tier classification at deploy time.
- [ ] **Self-improving judgment** — every time a change causes a bug, the system records: what was the change, what tier was it classified as, what tier SHOULD it have been? This feedback loop tightens classification over time. Specific to each company and layer.
- [ ] **Judgment inheritance** — Asawa-level learnings (e.g., "auth changes are always sensitive") flow down to all companies. Company-level learnings (e.g., "DayFlow's recurrence.ts is fragile") stay local.
- [ ] **Design the feedback format** — how does "this change caused a bug" become "this area is now higher sensitivity"? Probably a sensitivity.jsonl log that the tier classifier reads.

## Enforcement Review Cadence (add after system is built)

- [ ] **3-day micro-review** — automated sensor: count how many times hooks fired (blocked vs allowed), how many overrides happened, which steps get skipped most. Output: one-paragraph pulse in DAILY-PULSE.md. No human effort needed.
- [ ] **Weekly enforcement review** — part of weekly review cadence. Questions: Is the system working? Which rules are getting bypassed? Are hooks too strict (blocking legitimate work) or too loose (letting violations through)? Any new rule types needed? Output: update ENFORCEMENT-FRAMEWORK.md if adjustments needed.
- [ ] **Monthly calibration** — promote soft gates to hard gates based on violation frequency. Demote hard gates that have 0 fires (unnecessary friction). Review compliance scores across all companies. Output: new version of enforcement hooks deployed via Sutra.
- [ ] **Build the review dashboard** — automated report from hook logs + sensor output. Shows: violations/week, override frequency, compliance score per company, time-to-ship impact (is enforcement slowing things down?).

## Asawa Inc as a Sutra Client (meta — add later)

Asawa Inc is itself a company. Sutra provides operating systems to companies. Should Asawa run on Sutra too?

- [ ] **Evaluate:** Does Asawa Inc need its own OS from Sutra? It's a holding company, not a product company. Its "product" is managing other companies. Different process needs.
- [ ] **If yes:** Onboard Asawa through Sutra. It would be Tier 1 (internal, no external users). Sensors would check: are holding-level docs current? Are cross-company reviews happening? Is the enforcement system itself being reviewed?
- [ ] **If no:** Asawa operates on its own lighter process. But still uses the same enforcement hooks (since it defined them).
- [ ] **The recursive question:** If Sutra enforces processes, and Asawa owns enforcement, who enforces Asawa? This is the "who watches the watchmen" problem. Answer: the weekly review cadence above + the human (Sankalp) is the final authority.

## Sutra Distribution (future — solve when ready for real clients)

- [ ] **Package Sutra as npm**: `npx sutra-os@latest` installs gstack + GSD + Sutra commands in one shot. Starter structure at `asawa-inc/sutra/package/`.
- [ ] **Hide Sutra internals**: The onboarding process, templates, classification logic, and tech stack selection matrix are IP. Options explored:
  - Option B (npm): Ship as compiled package. Prompts are still readable on disk after install. Good enough for early clients.
  - Option C (MCP server): Sutra runs as a remote service. Founder's Claude Code connects via MCP protocol. They call tools but never see the prompts. This is the real product.
- [ ] **Bundle gstack into Sutra**: gstack skills should install as part of Sutra, not separately. Founder runs one command, gets everything. Package structure started at `asawa-inc/sutra/package/`.
- [ ] **Decide pricing/access model**: Free tier? Per-company license? Open core + premium modules?
- [ ] **Auth for MCP server**: How do client companies authenticate with Sutra's MCP server?
