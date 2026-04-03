# Requirements: PPR

**Defined:** 2026-04-03
**Core Value:** Every wedding task, research link, and creative project lives in one place with shareable URLs — nothing gets forgotten, nothing gets lost in tabs.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: App deploys to Vercel with working home page and navigation
- [ ] **FOUND-02**: Supabase database is provisioned with schema and RLS policies
- [ ] **FOUND-03**: All pages have metadataBase configured for correct OG tag resolution
- [ ] **FOUND-04**: Server-side writes only (service role key) — no client-side mutations without RLS

### Tasks

- [ ] **TASK-01**: User can create a task with title, category, due date, and notes
- [ ] **TASK-02**: User can edit an existing task (title, category, due date, notes)
- [ ] **TASK-03**: User can mark a task as complete
- [ ] **TASK-04**: User can view tasks filtered by category (Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative)
- [ ] **TASK-05**: User can view today's tasks and overdue tasks in a daily view
- [ ] **TASK-06**: User can delete a task

### Comparison

- [ ] **COMP-01**: User can create a comparison board with a title (e.g., "Wedding Suits")
- [ ] **COMP-02**: User can add items to a comparison board (name, image URL, price, link, notes)
- [ ] **COMP-03**: User can view items side-by-side in a card layout
- [ ] **COMP-04**: User can mark a winner / favorite on a comparison board

### Research

- [ ] **RSRCH-01**: User can create a research page with a title and topic
- [ ] **RSRCH-02**: User can add curated links to a research page (URL, title, notes)
- [ ] **RSRCH-03**: AI can summarize a research page's links into a brief overview (streaming)
- [ ] **RSRCH-04**: Research pages render as clean, readable articles

### Cards

- [ ] **CARD-01**: User can select a card type (save-the-date, thank-you, invitation)
- [ ] **CARD-02**: User can enter custom text for the card message
- [ ] **CARD-03**: AI generates a card design based on type and message
- [ ] **CARD-04**: User can download the card as an image (PNG)

### Sharing

- [ ] **SHARE-01**: Every page (task list, comparison, research, card) has a shareable URL
- [ ] **SHARE-02**: Shared URLs render WhatsApp-friendly previews (og:image 1200x630, og:title, og:description)
- [ ] **SHARE-03**: Share button copies URL to clipboard or triggers native share sheet
- [ ] **SHARE-04**: All pages are mobile-responsive (recipients view on phones)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Tasks

- **TASK-07**: Countdown timer to wedding day (July 5)
- **TASK-08**: Task templates (pre-populated wedding checklist)
- **TASK-09**: Task delegation (assign to family members)

### Budget

- **BUDG-01**: Budget tracker with per-category spending
- **BUDG-02**: Budget vs actual comparison

### Guest Management

- **GUEST-01**: Guest list with RSVP tracking
- **GUEST-02**: Seating arrangement tool

### Auth

- **AUTH-01**: User authentication (email/password)
- **AUTH-02**: Multi-user support (couple can both access)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Vendor marketplace | Anti-pattern — every competitor does this; PPR serves the couple, not vendors |
| Native mobile app | Web URLs are the distribution channel; WhatsApp sharing is the UX |
| Real-time collaboration | Async sharing via URLs is sufficient for V1 |
| Guest RSVP | Not core to the task management + research + creative tools bet |
| Payment processing | No monetization in V1 |
| Calendar sync (Google, Apple) | Nice-to-have but not core to testing the bet |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| TASK-01 | Phase 2 | Pending |
| TASK-02 | Phase 2 | Pending |
| TASK-03 | Phase 2 | Pending |
| TASK-04 | Phase 2 | Pending |
| TASK-05 | Phase 2 | Pending |
| TASK-06 | Phase 2 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| RSRCH-01 | Phase 4 | Pending |
| RSRCH-02 | Phase 4 | Pending |
| RSRCH-03 | Phase 4 | Pending |
| RSRCH-04 | Phase 4 | Pending |
| CARD-01 | Phase 5 | Pending |
| CARD-02 | Phase 5 | Pending |
| CARD-03 | Phase 5 | Pending |
| CARD-04 | Phase 5 | Pending |
| SHARE-01 | Phase 1 | Pending |
| SHARE-02 | Phase 1 | Pending |
| SHARE-03 | Phase 2 | Pending |
| SHARE-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
