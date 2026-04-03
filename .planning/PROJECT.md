# PPR — Personal Wedding Command Center

## What This Is

A web app that gives a groom one place to manage his entire wedding — tasks, research, comparisons, and creative tools like greeting cards. Built as fast, clean HTML pages on Vercel, shareable via WhatsApp links. Currently a personal tool for one wedding (July 5-6, 2026); potentially a service for other couples later.

## Core Value

Every wedding task, research link, and creative project lives in one place with shareable URLs — nothing gets forgotten, nothing gets lost in tabs.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Task management with wedding-specific categories (Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative)
- [ ] Add/edit/complete tasks with due dates, notes, and category
- [ ] Daily view showing today's tasks + overdue items
- [ ] Research pages with curated links and AI summaries (fashion trends, shopping options)
- [ ] Comparison boards for side-by-side evaluation (suits, venues, gifts) with images, prices, links
- [ ] Greeting card creator with AI-generated designs and editable text
- [ ] Every page has a shareable URL that works when opened from WhatsApp
- [ ] WhatsApp-friendly previews (og:image, og:title, og:description)
- [ ] Mobile-responsive — recipients view on phones
- [ ] Clean, fast, minimal UI — functional over flashy

### Out of Scope

- Guest list / RSVP management — not the core bet, add later
- Budget tracker — not founder's primary pain point
- Vendor marketplace — explicitly anti-pattern (every competitor does this, we don't)
- Native mobile app — web URLs are the distribution channel
- Multi-user auth for V1 — founder accesses directly, shared pages are public
- Real-time collaboration — async sharing via URLs is sufficient

## Context

- **Timeline**: Wedding is July 5-6, 2026. 93 days from today (April 3, 2026). Tool must be usable immediately.
- **Market**: Every major wedding tool (Zola, The Knot, Joy) is a vendor marketplace. No tool combines task management + research + creative tools. Groom-specific tools don't exist.
- **Founder**: Full-stack developer with AI tooling expertise. Can iterate fast. Is also the primary user.
- **Distribution**: WhatsApp is the coordination channel. Every page must be shareable as a clean link.
- **Design**: Design-in-code with Tailwind + shadcn/ui. Speed over polish. Iterate live.

## Constraints

- **Timeline**: Must be usable within first build session. Wedding is in 93 days.
- **Platform**: Web only. Next.js on Vercel. No native apps.
- **Auth**: No auth for V1. Direct access. Shared pages are public.
- **AI**: Claude via Vercel AI SDK for research summarization and card generation.
- **Database**: Supabase (Postgres + Edge Functions).
- **Sharing**: Every page must generate a valid WhatsApp preview card.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web over mobile app | URLs are shareable on WhatsApp; no app install friction | — Pending |
| No auth for V1 | Speed; founder is sole user; shared pages are read-only | — Pending |
| No vendor marketplace | Anti-pattern — every competitor does this; we serve the couple, not vendors | — Pending |
| Next.js + Vercel | Instant deploys, shareable URLs, SSR for dynamic content | — Pending |
| Supabase for backend | Fast setup, real-time, auth-ready when needed | — Pending |
| shadcn/ui components | Pre-built, customizable, saves days on UI | — Pending |
| Categories over tags | Fixed wedding categories (8) are clearer than freeform tags | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
