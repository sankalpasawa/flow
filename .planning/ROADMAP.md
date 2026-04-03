# Roadmap: PPR — Personal Wedding Command Center

## Overview

Five phases deliver a complete wedding command center before July 5, 2026. Phase 1 lays the
infrastructure that every other phase depends on — Supabase schema, RLS, and WhatsApp OG
preview wiring. Phases 2-5 add features in order of immediate usefulness: tasks first (the
daily driver), then comparison boards (decision-making), then research + AI summarization,
then greeting cards (most technically complex, least time-sensitive). Sharing infrastructure
is built once in Phase 1 and reused by every subsequent phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation + Sharing** - Deploy app scaffold, provision Supabase schema, wire WhatsApp OG infrastructure
- [ ] **Phase 2: Tasks** - Full task management with daily view, categories, and shareable task URLs
- [ ] **Phase 3: Comparison Boards** - Side-by-side comparison boards for suits, venues, and gifts
- [ ] **Phase 4: Research + AI** - Curated research pages with streaming AI summaries
- [ ] **Phase 5: Greeting Cards** - AI-generated greeting cards with download and WhatsApp sharing

## Phase Details

### Phase 1: Foundation + Sharing
**Goal**: A deployed app with working Supabase schema, correct OG preview infrastructure, and shareable URLs that work on WhatsApp before any feature content exists
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, SHARE-01, SHARE-02, SHARE-04
**Success Criteria** (what must be TRUE):
  1. App is live on Vercel and navigable via a public URL
  2. Supabase has all 5 tables provisioned with RLS enabled and no client-side write access
  3. Sharing a page URL on WhatsApp displays a preview card with title, description, and image
  4. All pages render correctly on a mobile phone browser
**Plans**: TBD
**UI hint**: yes

### Phase 2: Tasks
**Goal**: User can manage every wedding task — create, edit, complete, delete, filter by category — and share any task view as a WhatsApp link
**Depends on**: Phase 1
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, SHARE-03
**Success Criteria** (what must be TRUE):
  1. User can create a task with title, category (from 8 wedding categories), due date, and notes
  2. User can edit and delete an existing task
  3. User can mark a task complete and see it reflected immediately
  4. User can view today's tasks and all overdue tasks in a single daily view
  5. User can filter tasks by category and copy/share that filtered URL
**Plans**: TBD
**UI hint**: yes

### Phase 3: Comparison Boards
**Goal**: User can create and share side-by-side comparison boards for wedding decisions, with a winner marker to close the decision loop
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. User can create a comparison board with a title and add 2-4 items (name, image URL, price, link, notes)
  2. User can view items in a side-by-side card layout on both desktop and mobile
  3. User can mark one item as the winner and that choice persists
**Plans**: TBD
**UI hint**: yes

### Phase 4: Research + AI
**Goal**: User can curate research pages with saved links and trigger streaming AI summaries, with results cached so the LLM is not called on every page load
**Depends on**: Phase 3
**Requirements**: RSRCH-01, RSRCH-02, RSRCH-03, RSRCH-04
**Success Criteria** (what must be TRUE):
  1. User can create a research page with a title and add curated links (URL, title, notes)
  2. User can trigger an AI summary and see it stream in real-time without a timeout error
  3. AI summary is cached in the database and does not regenerate on each page reload
  4. Research page renders as a clean, readable article when shared via WhatsApp
**Plans**: TBD

### Phase 5: Greeting Cards
**Goal**: User can generate AI-designed greeting cards with custom text, download them as images, and share them via WhatsApp with a working preview
**Depends on**: Phase 4
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04
**Success Criteria** (what must be TRUE):
  1. User can select a card type (save-the-date, thank-you, invitation), enter a message, and generate a card
  2. AI generates both card text (Claude) and card image (fal.ai) without error
  3. User can download the card as a PNG
  4. Card shareable URL displays a WhatsApp preview showing the generated card image
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Sharing | 0/? | Not started | - |
| 2. Tasks | 0/? | Not started | - |
| 3. Comparison Boards | 0/? | Not started | - |
| 4. Research + AI | 0/? | Not started | - |
| 5. Greeting Cards | 0/? | Not started | - |
