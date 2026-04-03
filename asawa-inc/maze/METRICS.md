# Maze — Metrics

## Targets

| Metric | Target | How to Measure | Check Frequency |
|--------|--------|---------------|-----------------|
| D1 retention | 30%+ | PostHog: users returning within 24h | After 100 visitors |
| D7 retention | 10%+ | PostHog: users returning within 7 days | After 2 weeks live |
| Share rate | 15%+ | Share events / total sessions | Daily |
| Viral coefficient | >0.5 | Shared links → new unique visitors | Weekly |
| Session duration | 3+ min | PostHog: avg session time | Daily |
| Scroll depth | 20+ items | Feed items loaded / session | Daily |
| Bounce rate | <50% | Single-page visits <10s | On every deploy |

## Feature Ship Log

| # | Feature | Mode | Ship Time | Breaks | Quality (1-10) | Notes |
|---|---------|------|-----------|--------|----------------|-------|
| — | — | — | — | — | — | No features shipped yet |

## Onboarding Metrics

```yaml
onboarding_started: "2026-04-04"
onboarding_duration: "TBD"
phases_completed: 6
```

## Cost Tracking

| Service | Monthly Cost | Tier |
|---------|-------------|------|
| Vercel | $0 | Hobby (free) |
| Supabase | $0 | Free tier |
| Vercel AI Gateway | Pay per token | Usage-based |
| HumorAPI | $0 | Free tier |
| PostHog | $0 | Free tier (1M events/month) |
