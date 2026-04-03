# Maze — Operating System V1

**Company**: Maze (M-A-Z-E)
**Product type**: Content platform (humor feed)
**Platform**: Web (mobile-optimized, Next.js 16 on Vercel)
**Stage**: Pre-launch (1 person, 0 users)
**Core bet**: Retention — users come back repeatedly for humor
**Sutra version**: v1.0

---

## What You Need Right Now (and nothing else)

### Before Building Anything
1. **One sentence**: "A never-ending humor feed — jokes, memes, dark humor, dad jokes — shareable via WhatsApp."
2. **PR/FAQ test**: Done. See PRODUCT-BRIEF.md.
3. **P0 only**: 8 features that test the core bet (retention via quality humor + WhatsApp virality).

### When Building
4. **Read ARCHITECTURE.md** before changing any data-related code. Check the content pipeline flow and data model.
5. **One file at a time.** Commit after each file. Type-check after each change.
6. **Design-in-code** for V1. Tailwind + shadcn/ui. Iterate in the browser. No Figma.
7. **Intent + boundaries** for every task: what outcome, what constraints, method is free.

### After Building
8. **Does it work on mobile?** Open the Vercel preview URL on your phone. Actually scroll through jokes.
9. **Does sharing work?** Share a joke to WhatsApp. Does the preview card render? Does the link open correctly?
10. **Commit and push.** Every working change, immediately.

### Weekly
11. **What did we ship?** List features that reached production.
12. **What broke?** Any bugs or regressions. Feed back to Sutra.
13. **What's next?** Top 3 items from TODO.md.

---

## Functions Active at This Stage

| Function | What it does now | What it does NOT do yet |
|----------|-----------------|----------------------|
| **Product** | Decide what to build. Say no to everything else. | User research (no users yet) |
| **Design** | Design-in-code with Tailwind + shadcn. Visual QA after each feature. | Formal design system (use theme tokens in tailwind config) |
| **Engineering** | Build the feed, content pipeline, sharing flow, AI generation. | CI/CD beyond Vercel auto-deploy, performance optimization |
| **Content** | Seed 500+ jokes from APIs. Set up cron for ongoing ingestion. AI joke generation. | User-generated content moderation, editorial curation |
| **Security** | Don't expose API keys. Supabase RLS on user data. Privacy policy. | Pen testing, SOC2, rate limiting (add at scale) |
| **Quality** | Test on mobile. Test WhatsApp sharing. Check OG previews render. | Automated test suite, visual regression |
| **Growth** | WhatsApp viral loop IS the growth strategy. Measure share rate + viral coefficient. | Paid acquisition, SEO, app store optimization |
| **Data** | Track: D1 retention, share rate, session duration, scroll depth. Add PostHog before 100 users. | A/B testing, cohort analysis, ML personalization |
| **Ops** | Git push. Vercel auto-deploys. That's it. | Monitoring, alerting, on-call |
| **Finance** | Don't run out of API credits. Track Supabase/Vercel/HumorAPI costs. | Unit economics, pricing model |
| **Legal** | Privacy policy before sharing publicly. Attribute content sources. | IP review, terms of service |

---

## The Only Process

```
IDEA → Does it pass the PR/FAQ test? → Is it P0?
  YES → Build (one file at a time, design-in-code)
      → Test on mobile → Test WhatsApp sharing → Commit → Push
  NO  → Add to TODO.md for later
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | SSR for OG tags, Server Components, Vercel-native |
| Styling | Tailwind CSS v4 + shadcn/ui | Speed, component ownership, no dependency lock-in |
| Backend | Supabase (Postgres + Auth + Edge Functions) | Content DB, sessions, optional auth, founder knows it |
| AI | Vercel AI SDK v6 + Claude via Vercel AI Gateway | Joke generation, quality scoring, topic-based humor |
| Content APIs | JokeAPI + icanhazdadjoke + HumorAPI | Free joke/meme sources, category-based, no auth for basic |
| Deploy | Vercel | CDN, cron jobs, OG image caching, preview URLs |
| Analytics | PostHog (add before 100 users) | Event tracking, funnel analysis, retention |
| Image storage | Vercel Blob (if needed for meme images) | Public access, CDN-cached |

---

## Content Pipeline

Every 6 hours (Vercel Cron):
1. Fetch from JokeAPI (all categories)
2. Fetch from icanhazdadjoke (dad jokes)
3. Fetch from HumorAPI (jokes + memes)
4. Dedup against existing content (source + source_id)
5. Classify into categories
6. Insert new content to DB

AI-generated content:
1. User types a topic in the "AI Jokes" section
2. Claude generates 5 jokes via Vercel AI SDK (streamText)
3. User can like/dislike each one
4. Liked AI jokes (score > threshold) get added to the public feed

---

## Personalization (V1 — Simple)

- Anonymous sessions (client-generated UUID in localStorage)
- Like/dislike interactions stored per session
- Feed algorithm: `score = global_score + (category_preference * boost_factor)`
- Category preferences computed from interaction history
- Cold start: serve globally top-scored content
- No ML. No embeddings. Just weighted category scoring.

---

## WhatsApp Viral Loop

This is the primary growth mechanism. It MUST work perfectly.

1. User taps "Share" on any joke
2. App generates URL: `maze.app/j/{content-id}`
3. `/j/{content-id}` has server-rendered OG tags:
   - `og:title` = joke setup or "Maze — {category}"
   - `og:description` = joke punchline (truncated)
   - `og:image` = dynamically generated card via next/og (ImageResponse)
4. Web Share API opens WhatsApp (or fallback to `wa.me/?text=`)
5. WhatsApp shows preview card with the joke
6. Recipient taps → Opens `maze.app/j/{content-id}`
7. Page shows the joke + "Keep laughing →" CTA
8. CTA leads to the feed → New session created → Loop repeats

---

## Metrics

| Metric | Target | Priority |
|--------|--------|----------|
| D1 retention | 30%+ | PRIMARY — this IS the bet |
| D7 retention | 10%+ | Secondary |
| Share rate | 15%+ of sessions | Growth |
| Viral coefficient | >0.5 | Growth |
| Session duration | 3+ min | Engagement |
| Scroll depth | 20+ items | Engagement |
| Bounce rate | <50% | Guardrail |

---

## Stage Graduation Criteria

**Stage 1 → Stage 2** (when ALL true):
- 100+ unique visitors
- D1 retention > 20%
- PostHog analytics live
- Privacy policy published
- At least 5 user interviews (or feedback from WhatsApp shares)

**Stage 2 adds**: user research, analytics review, push notifications (PWA), user-submitted content with moderation, A/B testing.

---

## Available Skills

Maze uses gstack skills for building and GSD for visualization/session management.

### Building & Shipping
| Purpose | Skill | When |
|---------|-------|------|
| Brainstorm a feature | `/office-hours` | Before building anything new |
| Plan review | `/autoplan` | For complex features |
| Build | Just code it from TODO.md | Default |
| Test | `/qa` | After each feature ships |
| Code review | `/review` | Before merge |
| Ship | `/ship` | When ready to deploy |
| Post-deploy check | `/canary` | After every deploy |
| Debug | `/investigate` | When something breaks |
| Design explore | `/design-shotgun` | When exploring visual direction |
| Design polish | `/design-review` | After features are live |
| Update docs | `/document-release` | After shipping |
| Weekly retro | `/retro` | Every Monday |

### Session Management (GSD)
| Purpose | Skill | When |
|---------|-------|------|
| Check progress | `/gsd:progress` | Start of session |
| Pause session | `/gsd:pause-work` | End of session |
| Resume session | `/gsd:resume-work` | Start of next session |
| Session report | `/gsd:session-report` | End of session |
| View stats | `/gsd:stats` | Anytime |

---

## A/B Test Configuration

Maze runs Sutra's built-in A/B test: alternating features between SUTRA mode (full pipeline) and DIRECT mode (just build it).

- **Feature #1**: SUTRA mode — full pipeline to establish baseline quality
- **Feature #2**: DIRECT mode — just build, review, ship
- **Feature #3**: SUTRA mode
- Continue alternating. Compare: ship time, break rate, quality score.

---

## Feedback to Sutra

When Maze discovers something Sutra should learn:
1. Write to `asawa-inc/maze/feedback-to-sutra/{date}-{topic}.md`
2. Format: what happened, what principle was missing/wrong, what we learned
3. CEO of Sutra reviews in the next Sutra session
