# Hehe — Sutra Configuration

**Sutra version pinned**: v1.0
**Mode**: A/B TEST (per feature build order)

## Operating Modes

| Mode | What happens | When to use |
|------|-------------|-------------|
| **SUTRA** | Full process: brief → build → test → verify → learn | New features, AI integration, risky changes |
| **DIRECT** | Just do it. Read brief, build, ship. | Small features, bug fixes, content updates |
| **AUTO** | System decides based on size | Default after A/B test completes |

## Current Setting: A/B Test

| Feature # | Mode | Feature | Ship Time | Breaks | Quality |
|-----------|------|---------|-----------|--------|---------|
| 1 | SUTRA | Joke feed (seed data) | | | |
| 2 | DIRECT | Category filter | | | |
| 3 | SUTRA | AI joke generation | | | |
| 4 | DIRECT | Vote system | | | |
| 5 | DIRECT | Share button | | | |

## Bypass

Founder says "bypass Sutra" → switch to DIRECT immediately.
Founder says "full Sutra" → switch to SUTRA regardless of schedule.
