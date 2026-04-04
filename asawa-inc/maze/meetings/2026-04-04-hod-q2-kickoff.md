# Maze — HOD Meeting: Q2 2026 Kickoff

**Date**: April 4, 2026
**Type**: Quarterly Planning
**Framework**: V2MOM (Vision, Values, Methods, Obstacles, Measures)
**Attendees**: All department heads
**Company age**: Day 1

---

## Company V2MOM

**Vision**: Maze becomes the place Indian adults go for a quick laugh — a dedicated humor feed that replaces scrolling Instagram or YouTube for jokes.

**Values** (in priority order):
1. Retention over acquisition — she comes back, that's the bet
2. Content quality over content volume — 50 great jokes beat 500 mediocre ones
3. Shareability over features — every feature that doesn't drive sharing is a distraction
4. Speed over polish — ship fast, learn fast, fix fast
5. Free over paid — $0 infrastructure until proven

**Methods**: See department reports below

**Obstacles**: See department reports below

**Measures**:
| Metric | Q2 Target | Current |
|--------|-----------|---------|
| D1 retention | 30%+ | No data (0 users) |
| Weekly active users | 100+ | 0 |
| Content library | 1,000+ jokes | 312 |
| Share rate | 15%+ sessions | No data |
| Viral coefficient | >0.5 | No data |
| Monthly cost | <$5 | $0 |

---

## Department Reports

### 1. PRODUCT (Head of Product)

**Status**: MVP shipped. 8 of 8 P0 user-facing features built. Product is live at https://maze-app-fawn.vercel.app

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| P1 | Validate the retention bet | D1 retention > 20% with 50+ users | April 30 |
| P2 | Activate AI joke generation | Google API key configured, feature live | April 7 |
| P3 | Ship "Joke of the Day" | Highlighted card at top of feed daily | April 14 |
| P4 | Hindi joke category | Content sourced, category live | April 21 |

**Key Decision Needed**: When do we share the link publicly? Should we soft-launch with 10 friends first or go wide immediately?

**Recommendation**: Soft-launch. Share with fiancée + 10 people this week. Observe behavior. Fix what breaks. Go wider in week 2.

---

### 2. DESIGN (Head of Design)

**Status**: Design-in-code (Tailwind + shadcn). Dark theme. Mobile-optimized. No formal design system yet.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| D1 | Mobile-first visual polish | Pass visual QA on iPhone 15, Pixel 8 | April 10 |
| D2 | Brand identity | Logo, favicon, app icon, consistent color palette per category | April 14 |
| D3 | Share card design | OG preview card is visually compelling (people WANT to click) | April 10 |
| D4 | Empty/loading states | Skeleton screens feel polished, not broken | April 7 |

**Blockers**: None. Design-in-code means no handoff friction.

**Risks**: No formal design system. As features grow, inconsistency will creep in. Recommend creating DESIGN.md before feature #10.

---

### 3. ENGINEERING (Head of Engineering)

**Status**: Next.js 16 + Supabase + Vercel. All APIs working. 15/25 P0 tasks done. Clean type-check. 15 commits.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| E1 | Auto-ingestion | Vercel Cron running every 6h, 0 manual intervention | April 7 |
| E2 | AI generation live | Google API key → Gemini streaming works | April 7 |
| E3 | Content to 1,000+ | Multiple ingestion runs + new API sources | April 14 |
| E4 | Performance baseline | LCP < 2s on mobile, feed loads in < 1s | April 14 |
| E5 | Optional auth | Supabase Auth with magic link, preserves session | April 21 |

**Tech debt**:
- STATUS.md is stale (says "Supabase pending" but it's connected)
- SUTRA-CONFIG A/B test not being tracked (all features built in DIRECT mode)
- Feature ship log in METRICS.md is empty

**Architecture concern**: The shared AI provider layer (`asawa-inc/shared/`) is good but the Conductor pattern is future. Current single-model approach is correct for the scale.

---

### 4. CONTENT (Head of Content)

**Status**: 312 jokes across 5 categories. 3 API sources active. No editorial curation. No quality scoring.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| C1 | 1,000 jokes in DB | Add new sources (Reddit, HumorAPI premium) | April 14 |
| C2 | Quality scoring | AI rates each joke 1-10, filter below 5 | April 21 |
| C3 | Hindi content | 100+ Hindi jokes from Indian sources | April 21 |
| C4 | Trending/fresh rotation | New content surfaces daily, stale drops | April 28 |

**Content mix target**:
| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Dad Jokes | 153 (49%) | 250 (25%) | Need more variety in other categories |
| General | 77 (25%) | 200 (20%) | +123 |
| Programming | 28 (9%) | 100 (10%) | +72 |
| Puns | 28 (9%) | 100 (10%) | +72 |
| Dark Humor | 26 (8%) | 150 (15%) | +124 |
| Hindi | 0 (0%) | 100 (10%) | +100 (new) |
| One Liners | 0 (0%) | 100 (10%) | +100 (new) |

**Key insight**: Dad jokes are 49% of content. Feed feels one-note. Need to diversify urgently before sharing with real users.

---

### 5. GROWTH (Head of Growth)

**Status**: 0 users. Growth strategy is 100% WhatsApp viral loop. No other channels.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| G1 | First 10 users | Founder shares with fiancée + friends | April 7 |
| G2 | First 50 users | Viral loop: each user shares → brings 0.5 new users | April 14 |
| G3 | First 100 users | Add PostHog, measure real metrics | April 28 |
| G4 | WhatsApp preview optimization | A/B test preview card text (joke vs teaser) | April 21 |

**Growth funnel**:
```
Founder shares link (seed: 10 people)
  → They open Maze, scroll, laugh
  → They share a joke to WhatsApp (target: 15% share rate)
  → Recipient sees preview card, taps
  → New user enters feed (target: viral coeff > 0.5)
  → Repeat
```

**Risks**: 
- WhatsApp might not render OG previews correctly on all devices — need to test
- If share rate < 10%, organic growth stalls and we need to rethink distribution
- No push notifications means we rely entirely on users remembering to come back

---

### 6. DATA (Head of Data)

**Status**: No analytics. No tracking. No data. Flying blind.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| DA1 | PostHog integration | Events firing for: page view, scroll, like, dislike, share, generate | April 10 |
| DA2 | Retention dashboard | D1 and D7 cohort charts visible | April 14 |
| DA3 | Content performance | Which jokes get liked/shared most → inform content strategy | April 21 |

**Critical gap**: We have 312 jokes and 0 data on which ones are good. The like/dislike data in Supabase will tell us, but only after real users interact. PostHog is the highest leverage thing we can add right now.

---

### 7. QUALITY (Head of Quality)

**Status**: No QA process. No tests. Manual testing only (screenshots in headless browser).

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| Q1 | Mobile QA pass | Test on 3 devices (iPhone, Android, tablet) | April 7 |
| Q2 | WhatsApp share QA | Verified OG card renders on WhatsApp iOS + Android | April 7 |
| Q3 | Feed edge cases | Empty state, network error, slow connection tested | April 10 |

**Known issues**:
- WhatsApp preview not tested on real device yet
- No error boundary — if feed API fails, user sees broken page
- No offline handling

---

### 8. FINANCE (Head of Finance)

**Status**: $0 monthly cost. All free tiers.

| Service | Current Cost | When It Changes |
|---------|-------------|-----------------|
| Vercel | $0 (Hobby) | >100GB bandwidth/month or need team features |
| Supabase | $0 (Free) | >500MB DB or >2GB bandwidth or >50K MAU auth |
| Google Gemini | $0 (Free) | >15 RPM or >1M tokens/day |
| PostHog | $0 (Free) | >1M events/month |
| **Total** | **$0/month** | Likely stays $0 through Q2 at current scale |

**Q2 budget**: $0. We don't expect to breach free tiers with <1,000 users.

**When to reconsider**: If we hit 1,000+ MAU, Supabase and Vercel will need paid plans (~$25+$20 = $45/month). That's the trigger for monetization discussion.

---

### 9. LEGAL (Head of Legal)

**Status**: No privacy policy. No terms of service. No content attribution.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| L1 | Privacy policy | Page live at /privacy before sharing publicly | April 7 |
| L2 | Content attribution | Source credited on each joke card (or in footer) | April 14 |
| L3 | Cookie/tracking consent | Banner before PostHog tracking starts | April 14 |

**Risk**: Sharing publicly without a privacy policy is a liability. This MUST be done before Growth's G1 objective (first 10 users).

---

### 10. OPS (Head of Operations)

**Status**: Vercel auto-deploy from git. No monitoring. No alerting. No on-call.

**Q2 Objectives**:
| # | Objective | Key Result | Deadline |
|---|-----------|------------|----------|
| O1 | Vercel Cron for ingestion | Auto-ingest every 6 hours, no manual runs | April 7 |
| O2 | Uptime monitoring | Get notified if site goes down | April 14 |
| O3 | Custom domain | maze.fun or getmaze.app (check availability) | April 21 |

---

## Cross-Department Dependencies

```
LEGAL (privacy policy) ──blocks──→ GROWTH (first users)
                                        │
ENGINEERING (AI key) ──blocks──→ PRODUCT (AI generation live)
                                        │
DATA (PostHog) ──blocks──→ PRODUCT (retention measurement)
                                        │
CONTENT (diversify) ──blocks──→ GROWTH (quality feed for sharing)
                                        │
QUALITY (mobile QA) ──blocks──→ GROWTH (share link confidently)
```

**Critical path**: Legal → Quality → Growth. We cannot share publicly until privacy policy exists and mobile QA passes.

---

## Q2 Sprint Plan (4-week blocks)

### Week 1 (April 4-10): FOUNDATION
- [ ] Google API key → AI generation live
- [ ] Privacy policy page
- [ ] Vercel Cron for auto-ingestion
- [ ] Mobile QA on iPhone + Android
- [ ] WhatsApp sharing QA
- [ ] PostHog integration
- [ ] Soft-launch: share with fiancée + 5 friends

### Week 2 (April 11-17): CONTENT + GROWTH
- [ ] Content to 500+ (new API sources)
- [ ] Hindi joke category (100+ jokes)
- [ ] Brand identity (logo, favicon, colors)
- [ ] OG preview card redesign
- [ ] Share with 20 more people
- [ ] First retention data from PostHog

### Week 3 (April 18-24): PERSONALIZATION + QUALITY
- [ ] AI quality scoring on content
- [ ] "Joke of the Day" feature
- [ ] Content attribution
- [ ] Optional auth (magic link)
- [ ] A/B test preview card text
- [ ] Target: 50 users

### Week 4 (April 25-30): MEASURE + DECIDE
- [ ] Retention dashboard (D1, D7)
- [ ] Content performance analysis
- [ ] 100 users target
- [ ] Go/no-go decision on wider launch
- [ ] Q2 retro + Q3 planning

---

## Decisions Needed from CEO

1. **Soft-launch timing**: This week or next? (Recommendation: this week after privacy policy + QA)
2. **Hindi content**: Prioritize or defer? (Recommendation: prioritize — core Indian audience)
3. **Custom domain**: Budget for domain? maze.fun / getmaze.app / maze.lol
4. **Groot restoration**: Needs manual Supabase dashboard action (MCP blocked by user limit)

---

## Next Meeting

**Weekly HOD sync**: Every Monday, 15 minutes. Status + blockers only.
**Next quarterly**: July 1, 2026 (Q3 kickoff).
