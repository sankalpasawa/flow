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

## Sutra Distribution (future — solve when ready for real clients)

- [ ] **Package Sutra as npm**: `npx sutra-os@latest` installs gstack + GSD + Sutra commands in one shot. Starter structure at `asawa-inc/sutra/package/`.
- [ ] **Hide Sutra internals**: The onboarding process, templates, classification logic, and tech stack selection matrix are IP. Options explored:
  - Option B (npm): Ship as compiled package. Prompts are still readable on disk after install. Good enough for early clients.
  - Option C (MCP server): Sutra runs as a remote service. Founder's Claude Code connects via MCP protocol. They call tools but never see the prompts. This is the real product.
- [ ] **Bundle gstack into Sutra**: gstack skills should install as part of Sutra, not separately. Founder runs one command, gets everything. Package structure started at `asawa-inc/sutra/package/`.
- [ ] **Decide pricing/access model**: Free tier? Per-company license? Open core + premium modules?
- [ ] **Auth for MCP server**: How do client companies authenticate with Sutra's MCP server?
