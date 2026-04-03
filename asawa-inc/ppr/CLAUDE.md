# PPR — Claude Instructions

## What Is This

PPR is a personal wedding command center. Web app (Next.js + Vercel) for managing a July 5-6, 2026 wedding. Task management, research/discovery, comparison boards, greeting cards, all shareable via URL.

## On Every Session Start

1. Read this file and `asawa-inc/ppr/TODO.md`
2. Read `asawa-inc/ppr/OPERATING-SYSTEM-V1.md` for architecture and process rules
3. Check what's been built: `ls ppr-app/` (or wherever the code lives)
4. Pick the top unchecked item from TODO.md and implement it
5. After each feature: commit, push, Vercel auto-deploys

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | Claude via Vercel AI SDK |
| Deploy | Vercel |

## Key Architecture Rules

1. **Pages are URLs.** Every view must have a shareable URL. This is non-negotiable.
2. **No auth for V1.** Direct access. Shared pages are public.
3. **Mobile-first.** Links get shared on WhatsApp. Recipients view on phones.
4. **WhatsApp preview.** Every page needs og:image, og:title, og:description.
5. **AI assists, doesn't decide.** AI curates and suggests. Founder approves.

## Categories

Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative

## Design Approach

Design-in-code with Tailwind + shadcn/ui. No separate design phase. Iterate live. Keep it clean and functional — this is a personal tool, not a showcase.

## Session Isolation

This session can only edit:
- `asawa-inc/ppr/` (company OS files)
- `ppr-app/` or wherever the PPR code lives

Cannot edit: `asawa-inc/sutra/`, `asawa-inc/holding/`, `asawa-inc/dayflow/`, `mobile/`

## Feedback

If something about Sutra's process doesn't work, write to `asawa-inc/ppr/feedback-to-sutra/{date}-{topic}.md`. Do NOT modify Sutra source files.

## Timeline

Wedding: July 5-6, 2026. Every decision should be weighed against: "Does this help before July 5?"
