# PPR — Operating System V1

## Identity

PPR is a personal wedding command center. It combines task management, research/discovery, and creative tools into one web app for a groom managing his July 5-6, 2026 wedding.

PPR is NOT a vendor marketplace. It has no ads, no vendor commissions, no registry fees. It exists to serve the couple, not to sell to them.

## Stage: Pre-Launch (1 person, 0 users)

This is a personal tool. The founder IS the user. Stage graduation criteria don't apply until PPR is offered to other couples.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js (App Router) | Fast to build, static pages shareable via URL, SSR for dynamic content |
| Styling | Tailwind CSS | Rapid iteration, no design system overhead |
| UI Components | shadcn/ui | Polished components out of the box, customizable |
| Backend | Supabase (Postgres + Auth + Edge Functions) | Fast setup, real-time for task updates |
| AI | Claude via Vercel AI SDK | Research summarization, card copy, task suggestions |
| Deploy | Vercel | Instant deploys, preview URLs, shareable WhatsApp links |
| Analytics | None yet | Add PostHog before offering to other couples |

## Architecture Rules

1. **Pages are URLs.** Every view (task list, research page, comparison board, card) has a shareable URL. This is the core product requirement.
2. **No auth for V1.** The founder accesses directly. Shared pages are public. Add auth when offering to others.
3. **AI assists, doesn't decide.** AI curates research, suggests tasks, generates card designs. The founder approves everything.
4. **Data in Supabase.** Tasks, research links, comparisons, card templates — all in Postgres. No localStorage-only data.
5. **Mobile-friendly.** The founder will share links on WhatsApp. Recipients view on phones. Every page must work on mobile.

## The Only Process (Stage 1)

```
NEED → Is it P0? → YES → Build it → Test on phone → Deploy → Share URL
                  → NO  → Add to TODO.md for later
```

### Before Building Anything
1. Is this one of the 5 P0 features? If not, add to backlog.
2. Will this be ready before the wedding? If timeline is tight, cut scope.

### When Building
3. One feature at a time. Ship it. Then next.
4. Every page must be shareable via URL.
5. Test on mobile (WhatsApp preview, responsive layout).

### After Building
6. Share the URL. Does it work when opened from WhatsApp?
7. Commit and push. Vercel auto-deploys.

### Weekly
8. What wedding tasks got done this week?
9. What's coming up next week? (Check the wedding timeline)
10. What pages need updating? (Fashion trends change, prices change)

## Functions Active

| Function | What It Does Now | Not Yet |
|----------|-----------------|---------|
| Product | Decide what to build. P0 only. | User research (founder is the user) |
| Design | Design-in-code. Tailwind + shadcn. | Design system docs |
| Engineering | Build fast. Ship daily. | CI/CD, monitoring |
| Quality | Test on phone. Check WhatsApp sharing. | Automated tests |
| Content | Task templates, research curation | SEO, blog |
| Security | Don't expose API keys. Sanitize inputs. | Auth, privacy policy |
| Growth | Not yet. | Everything |
| Data | Not yet. | Analytics |

## P0 Features (Build Order)

1. **Task management** — The foundation. Add tasks, categorize, check off, see daily view.
2. **Research pages** — Fashion trends, shopping links. AI-curated, manually reviewed.
3. **Comparison boards** — Side-by-side options with links and prices.
4. **Greeting card creator** — AI-generated designs, editable templates.
5. **Shareable pages** — Clean URLs for every view. WhatsApp preview cards (og:image, og:title).

Build in this order. Each builds on the previous.

## Categories

Wedding tasks fall into these categories:

| Category | Examples |
|----------|---------|
| Shopping | T-shirts, suits, gifts, decorations, rings |
| Family | Duties, visits, traditions, elder care |
| Logistics | Venue, transport, accommodation, catering |
| Romance | Date ideas, surprises, gestures, letters |
| Bride | Everything for/about the bride |
| Ceremony | Rituals, timeline, rehearsal |
| Documents | Invitations, legal, contracts |
| Creative | Greeting cards, photo albums, videos |

## Available Skills

You have 89 skills across two systems (gstack + GSD).
See `asawa-inc/sutra/layer2-operating-system/b-agent-architecture/SKILL-CATALOG.md` for the complete catalog.

Quick start:
- New project: `/gsd:new-project`
- Plan a feature: `/gsd:plan-phase`
- Build it: `/gsd:execute-phase`
- Test it: `/qa`
- Ship it: `/ship` then `/canary`
- Learn: `/retro`

## Feedback to Sutra

When building PPR reveals something Sutra should learn:
1. Write to `asawa-inc/ppr/feedback-to-sutra/{date}-{topic}.md`
2. Format: what happened, what principle was missing, what we learned
3. CEO of Sutra reviews in a Sutra session
