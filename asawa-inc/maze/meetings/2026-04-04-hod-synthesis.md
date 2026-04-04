# Maze — HOD Synthesis (Agent-Informed)
## Q2 2026 | April 4, 2026 | Produced by P8-compliant process

> This report was synthesized AFTER all 3 parallel department agents completed.
> Agent 1: Product + Growth + Content (63s, 3 tool calls)
> Agent 2: Engineering + Design + Quality (101s, 15 tool calls — deep code audit)
> Agent 3: Data + Legal + Finance + Ops + Security (112s, 12 tool calls)
> No findings were substituted or bypassed.

---

## CORRECTED SIGNAL MAP

```
═══════════════════════════════════════════════════════════════
SIGNAL MAP — Maze — April 4, 2026
(Corrected from agent findings — differs from rushed version)
═══════════════════════════════════════════════════════════════

                 GREEN          YELLOW          RED
Product          [●]
Design                          [●]
Engineering                     [●]
Content                         [●]
Growth                                          [●]
Data                                            [●]
Quality                                         [●]  ← was YELLOW, agents say RED
Security                        [●]                  ← was GREEN, agents say YELLOW
Finance          [●]
Legal                                           [●]
Ops                             [●]

HEALTH: 2 GREEN | 4 YELLOW | 5 RED
(Previous rushed assessment: 4 GREEN | 4 YELLOW | 3 RED — was too optimistic)
═══════════════════════════════════════════════════════════════
```

**What the agents found that the rushed version missed:**

| Department | Rushed | Agent-Corrected | Why |
|------------|--------|-----------------|-----|
| Quality | YELLOW | **RED** | Zero tests. Known bugs: unlike doesn't persist, reaction counts never decrement, feed can fetch duplicate pages. |
| Security | GREEN | **YELLOW** | RLS policies are no-ops (`using(true)` on all tables). `increment_content_score` is a score manipulation vector. Anyone can write to any table. |
| Engineering | GREEN | **YELLOW** | Stale closure bug in feed. Sequential DB inserts (200 serial round-trips). Raw `<img>` instead of next/image. AI provider mismatch between docs and code. |

---

## CRITICAL BUGS (from CQO Agent — code-level audit)

These were invisible without reading the actual code:

| # | Bug | File | Line | Severity |
|---|-----|------|------|----------|
| 1 | **Unlike never persists.** Clicking like twice sets `newReaction=null`, guard skips API call. DB keeps the like. | `joke-card.tsx` | 44-46 | HIGH — data integrity |
| 2 | **Reaction counts never decrement.** `increment_content_score` RPC only adds, never subtracts. | `joke-card.tsx` + `api/react` | — | HIGH — scores drift |
| 3 | **Feed can fetch duplicate pages.** Stale closure on `cursor` in IntersectionObserver. | `feed.tsx` | 74 | MEDIUM — UX |
| 4 | **Share tracking is fire-and-forget.** No `await`, no error handling. Share count unreliable. | `joke-card.tsx` | 69 | LOW — analytics |
| 5 | **200 sequential DB inserts in ingestion.** Will hit Vercel 10s timeout. | `api/ingest` | — | HIGH — ops |
| 6 | **No rate limiting on /api/generate.** Anyone can spam AI endpoint. | `api/generate` | — | MEDIUM — cost |

---

## SECURITY FINDINGS (from CISO Agent)

**RLS policies are effectively disabled:**

```sql
-- What exists (all tables):
create policy "..." on {table} for all using (true) with check (true);

-- What this means:
-- ANY anonymous user with the anon key can INSERT, UPDATE, DELETE
-- on content, sessions, interactions, and ingestion_log.
-- This is not security. This is an open door.
```

**What should exist:**
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| content | public | service-role only | service-role only | service-role only |
| sessions | own session only | public (create own) | own session only | none |
| interactions | own session | own session | none | own session |
| ingestion_log | service-role only | service-role only | none | none |

---

## LAUNCH READINESS (Agent Consensus)

All three agents independently flagged the same verdict:

**NOT READY for soft launch this week.**

| Blocker | Owner | Fix Time |
|---------|-------|----------|
| Privacy policy page | Legal (CLO) | 1 hour |
| RLS policies rewrite | Security (CISO) | 30 min |
| Unlike/decrement bugs | Quality (CQO) | 1 hour |
| Supabase already connected | ~~Ops~~ | ~~Done~~ (agents had stale STATUS.md) |

**Note:** Agents 1 and 3 flagged "Supabase not connected" as a blocker because STATUS.md was stale (said "pending"). Supabase IS connected — 312 jokes are in the DB. This is a documentation bug, not a real blocker. STATUS.md needs updating.

**Actual blockers: 3 items, ~2.5 hours of work.**

---

## INITIATIVE MAP (Updated with Agent Findings)

```
═══════════════════════════════════════════════════════════════
INITIATIVE MAP — Maze — Q2 2026 (Agent-Corrected)
═══════════════════════════════════════════════════════════════

INITIATIVE 0: LAUNCH BLOCKERS (Week 1, Day 1-2) ← NEW
├── Owner: CEO (cross-department)
├── Tasks:
│   ├── CLO: Ship /privacy page
│   ├── CISO: Rewrite RLS policies (restrict writes)
│   ├── CQO: Fix unlike bug + decrement bug
│   ├── CTO: Fix stale closure in feed
│   └── CPO: Update STATUS.md (remove stale info)
├── Bet: "Cannot soft launch until these are done"
└── Status: NOT STARTED — must start immediately

INITIATIVE 1: SOFT LAUNCH (Week 1, Day 3+)
├── Owner: Growth (CGO)
├── Blocked by: Initiative 0
├── Tasks:
│   ├── Share with fiancée + 10 people
│   ├── Monitor first sessions
│   └── Test WhatsApp OG preview on real phone
└── Status: BLOCKED by Initiative 0

INITIATIVE 2: CONTENT DIVERSIFICATION (Week 1-2)
├── Owner: Content (CCO)
├── Tasks:
│   ├── Run ingestion 3x more → 500+ jokes
│   ├── Batch inserts (fix 200 sequential calls)
│   ├── Hindi jokes via AI generation (needs API key)
│   └── Rebalance: reduce dad joke dominance from 49%
└── Status: PARTIALLY BLOCKED (AI needs Google key)

INITIATIVE 3: BRAND IDENTITY (Week 2)
├── Owner: Design (CDO)
├── Tasks:
│   ├── Logo (3 options)
│   ├── Favicon + OG template refresh
│   ├── Redesign AI output from <pre> to styled cards
│   └── Create DESIGN.md
└── Status: NOT STARTED

INITIATIVE 4: MEASUREMENT (Week 1-2)
├── Owner: Data (CDaO)
├── Tasks:
│   ├── PostHog integration (7 core events)
│   ├── Retention dashboard (D1/D7)
│   ├── Referral attribution (?ref=wa on shared links)
│   └── Content performance dashboard
└── Status: NOT STARTED — CRITICAL (launch data lost without this)

═══════════════════════════════════════════════════════════════
```

---

## AGENT TENSIONS (Productive Conflicts)

```
═══════════════════════════════════════════════════════════════
TENSION MAP — Who disagrees with whom and why
═══════════════════════════════════════════════════════════════

CGO (Growth) ←→ CLO (Legal)
  "Launch now" vs "Privacy policy first"
  Resolution: CLO wins. Legal risk > speed. Fix: 1 hour.

CGO (Growth) ←→ CQO (Quality)
  "Ship what we have" vs "Fix bugs first"
  Resolution: CQO wins. Unlike bug is data corruption.

CPO (Product) ←→ CDaO (Data)
  "Ship features" vs "Add PostHog first"
  Resolution: CDaO wins. Launch without analytics = wasted data.

CCO (Content) ←→ CTO (Engineering)
  "More content sources" vs "Fix ingestion performance"
  Resolution: CTO wins. 200 sequential inserts will timeout.

CISO (Security) ←→ COO (Ops)
  "Tighten RLS before launch" vs "It works, ship it"
  Resolution: CISO wins. Open write access = vote manipulation.

CDO (Design) ←→ CGO (Growth)
  "Logo before launch" vs "Launch without brand"
  Resolution: CGO wins. Logo is nice-to-have, not a blocker.

═══════════════════════════════════════════════════════════════
```

---

## WEEK 1 SPRINT (Corrected Priority Order)

```
DAY 1-2: UNBLOCK LAUNCH (Initiative 0)
  CLO  → Privacy policy page at /privacy
  CISO → Rewrite RLS policies
  CQO  → Fix unlike bug + reaction decrement
  CTO  → Fix stale closure in feed.tsx
  CPO  → Update STATUS.md

DAY 2-3: INSTRUMENT (Initiative 4)
  CDaO → PostHog integration + 7 core events
  CTO  → Add referral param to share links

DAY 3-5: LAUNCH (Initiative 1)
  CGO  → Share link with fiancée + 10 people
  CQO  → Test WhatsApp OG preview on real phone
  CDaO → Monitor first retention signals

DAY 3-5: CONTENT (Initiative 2, parallel)
  CCO  → Run ingestion 3x → 500+ jokes
  CTO  → Batch insert fix (replace sequential calls)
  CEO  → Add Google API key to Vercel → AI generation live
```

---

## P8 COMPLIANCE NOTE

This synthesis was produced after all 3 agents completed:
- Agent 1 completed at T+63s
- Agent 2 completed at T+101s  
- Agent 3 completed at T+112s
- Synthesis started at T+112s (after last agent)

The rushed version (written at T+63s while agents 2 and 3 were still running) missed:
- 6 code-level bugs
- RLS security vulnerability
- Quality health downgrade (YELLOW → RED)
- Security health downgrade (GREEN → YELLOW)
- Overall health: 2 GREEN / 4 YELLOW / 5 RED (not 4/4/3)

**P8 validated: waiting for agents produced a materially different and better assessment.**
