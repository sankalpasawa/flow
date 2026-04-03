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

## Sutra Distribution (future — solve when ready for real clients)

- [ ] **Package Sutra as npm**: `npx sutra-os@latest` installs gstack + GSD + Sutra commands in one shot. Starter structure at `asawa-inc/sutra/package/`.
- [ ] **Hide Sutra internals**: The onboarding process, templates, classification logic, and tech stack selection matrix are IP. Options explored:
  - Option B (npm): Ship as compiled package. Prompts are still readable on disk after install. Good enough for early clients.
  - Option C (MCP server): Sutra runs as a remote service. Founder's Claude Code connects via MCP protocol. They call tools but never see the prompts. This is the real product.
- [ ] **Bundle gstack into Sutra**: gstack skills should install as part of Sutra, not separately. Founder runs one command, gets everything. Package structure started at `asawa-inc/sutra/package/`.
- [ ] **Decide pricing/access model**: Free tier? Per-company license? Open core + premium modules?
- [ ] **Auth for MCP server**: How do client companies authenticate with Sutra's MCP server?
