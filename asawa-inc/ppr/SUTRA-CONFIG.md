# PPR — Sutra Configuration

## A/B Test Config

| Feature # | Feature | Mode | Why |
|-----------|---------|------|-----|
| 1 | Task management | SUTRA | First feature — use full pipeline to establish baseline |
| 2 | Research pages | DIRECT | Speed matters — 93 days to wedding |
| 3 | Comparison boards | SUTRA | Creative feature — benefits from brainstorming |
| 4 | Greeting card creator | DIRECT | Build fast, iterate on design |
| 5 | Shareable pages | DIRECT | Infrastructure feature — just ship it |

## Mode Definitions

**SUTRA mode**: `/office-hours` -> `/autoplan` -> build -> `/qa` -> `/ship` -> `/canary`
**DIRECT mode**: build -> `/review` -> `/ship`

## Founder Involvement

Level: **Hands-on** (initially, adaptive later)

- All business/product/strategy decisions require founder approval
- Execution decisions (file structure, code patterns) are Sutra's
- Design taste decisions surface to founder
