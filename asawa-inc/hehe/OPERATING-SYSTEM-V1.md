# Hehe — Operating System v1.0

*Derived from Sutra B2C Consumer App, Stage 1: Pre-Launch*
*Sutra version: v1.0*

---

## Identity

**Mission**: Make people laugh. Every day. In under 30 seconds.

**Core bet**: People will return daily to a dedicated humor app if the hit rate is >70% funny.

**One rule**: If it's not funny, it doesn't ship.

---

## Before Building Anything

1. **One sentence**: "Hehe is a humor-only web app that delivers personalized jokes in 30 seconds."
2. **PR/FAQ test**: See PRODUCT-BRIEF.md. Passes.
3. **P0 only**: Feed + AI jokes + categories + share + vote. Nothing else until these work.

## When Building

4. **Read PRODUCT-BRIEF.md** before changing any code file. Know the scope.
5. **One feature at a time.** Commit after each. Test after each.
6. **Design in code** for web MVP. No Figma. Ship fast, iterate on live product.
7. **Intent + boundaries** for every feature: what outcome, what constraints, method is free.

## After Building

8. **Does it work in the browser?** Desktop + mobile Safari/Chrome. Actually click through it.
9. **Is it fast?** First load < 2 seconds. Joke load < 500ms.
10. **Is it funny?** Show 10 jokes to a real person. If < 5 get a laugh, the content is the problem.
11. **Commit and deploy.** Every working change goes live immediately.

## Weekly

12. **What shipped?** Features that reached production.
13. **What broke?** Bugs, content quality issues, slow loads.
14. **Is it funny enough?** Check upvote/downvote ratio. Target: >50% upvote rate.
15. **Feed back to Sutra**: What worked, what didn't, what Sutra should learn.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js (App Router) | Fast to ship, SSR for SEO, React ecosystem |
| Styling | Tailwind CSS | Rapid prototyping, no design system overhead for MVP |
| Backend | Supabase | Auth (later), Postgres DB, Edge Functions |
| AI | Gemini API (free tier) | Joke generation, cheap/free at this scale |
| Deploy | Vercel | Zero-config Next.js deploy, preview URLs |
| Analytics | None yet | Add PostHog before first 100 users |

---

## Data Model (minimal)

```sql
-- jokes table
create table jokes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  category text not null, -- 'dad', 'dark', 'pun', 'absurd', 'observational', 'one-liner'
  source text not null,   -- 'seed', 'ai-generated', 'user-submitted'
  upvotes int default 0,
  downvotes int default 0,
  created_at timestamptz default now()
);

-- votes table (anonymous, by session)
create table votes (
  id uuid primary key default gen_random_uuid(),
  joke_id uuid references jokes(id),
  session_id text not null,
  vote smallint not null, -- 1 = up, -1 = down
  created_at timestamptz default now(),
  unique(joke_id, session_id)
);
```

---

## Feature Build Order

| # | Feature | Mode | Est. Time |
|---|---------|------|-----------|
| 1 | Joke feed (static seed data) | SUTRA | 30 min |
| 2 | Category filter | DIRECT | 15 min |
| 3 | AI joke generation (Gemini) | SUTRA | 30 min |
| 4 | Vote system (up/down) | DIRECT | 15 min |
| 5 | Share button (clipboard) | DIRECT | 5 min |

Features 1 and 3 use SUTRA mode (new, risky). Features 2, 4, 5 use DIRECT (small, clear).

---

## Content Strategy

### Seed Library (ship with this)
- 200+ dad jokes
- 100+ one-liners
- 100+ puns
- 50+ observational humor
- 50+ absurd/surreal

Source: public domain joke databases, classic standup transcripts, crowd-sourced lists.

### AI Generation
- Prompt template per category
- Generate in batches of 10
- Quality filter: AI self-rates jokes 1-10, only show 7+
- Human spot-check: review 10 random AI jokes daily

### Content Rules
- No jokes targeting specific people, races, religions, or disabilities
- Dark humor is opt-in (category filter)
- Political humor is opt-in
- If in doubt, don't ship it

---

## Metrics

| Metric | What it means | Target |
|--------|--------------|--------|
| Upvote rate | % of jokes that get upvoted | > 50% |
| Session length | How long people stay | > 60 seconds |
| Return rate | % who come back next day | > 20% (D1) |
| Shares per session | Jokes shared per visit | > 0.5 |
| AI vs seed preference | Do people prefer AI or human jokes? | Track, no target |

Log in METRICS.md after each session.

---

## The Only Process

```
IDEA → Is it P0? → Is it funny?
  YES (SUTRA mode):
    /office-hours → brainstorm
    /autoplan → CEO + design + eng review
    /design-shotgun → visual options
    /design-html → production HTML
    [BUILD]
    /qa → test + fix + verify
    /design-review → visual audit
    /ship → PR + deploy
    /canary → post-deploy health
    /document-release → update docs

  YES (DIRECT mode):
    [BUILD]
    /review → code review
    /ship → deploy

  NO → Add to backlog
```

Ship fast, measure funny, iterate.

## gstack Skills Active

| Skill | When | Why |
|-------|------|-----|
| `/office-hours` | New feature ideation | Validate before building |
| `/autoplan` | SUTRA mode features | Full CEO + design + eng review |
| `/design-shotgun` | Visual decisions | Explore multiple options |
| `/design-html` | After design approval | Production HTML/CSS |
| `/qa` | After every feature | Test + fix + verify loop |
| `/design-review` | After deploy | Visual QA on live site |
| `/review` | Before every merge | Code review |
| `/ship` | Every deploy | PR + version bump |
| `/canary` | After every deploy | 10-min health watch |
| `/benchmark` | Weekly | Core Web Vitals tracking |
| `/investigate` | On bug | Root cause analysis |
| `/document-release` | After ship | Keep docs current |
| `/retro` | Weekly | What shipped, trends |
| `/cso` | Monthly | Security audit |

---

## Feedback to Sutra

When Hehe discovers something Sutra should learn:
1. Write a note in `asawa-inc/hehe/feedback-to-sutra/`
2. Format: what happened, what principle was missing, what we learned
3. Sutra picks this up in the next version

Examples:
- "Web MVP doesn't need the mockup step. Design-in-code is faster for solo web projects."
- "AI content quality is the product. Sutra needs a principle about content-as-feature."
- "Upvote/downvote is the core feedback loop, not bug reports. Sutra's quality metrics assume code quality, but for content apps, content quality is the metric."
