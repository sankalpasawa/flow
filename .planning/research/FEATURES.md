# Feature Landscape

**Domain:** Wedding command center — personal task management + research curation + comparison boards + card creation
**Researched:** 2026-04-03
**Confidence:** HIGH for table stakes (well-established patterns), MEDIUM for differentiators (validated by gap analysis)

---

## Context

This tool sits at the intersection of four distinct UX domains. Each has its own table stakes. The key insight from research: **no existing tool combines all four**. Zola/The Knot/Joy each handle a narrow slice (registry + guest list + wedding website), none handle personal task management + research + comparison + creative tools as a unified command center. The gap is real.

The primary user is a groom, not a vendor marketplace customer. That's the design constraint everything else follows.

---

## Table Stakes

Features users expect from each domain. Missing any of these and the tool feels incomplete for its stated purpose.

### Task Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create / edit / complete tasks | Foundational. Any task tool without this is unusable. | Low | Title, optional notes, optional due date |
| Due dates with visual urgency | Users need to see what's overdue vs upcoming | Low | Date picker + "overdue" visual treatment |
| Categories / labels | Wedding tasks span wildly different domains — grouping is essential | Low | Fixed 8 categories as per PROJECT.md: Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative |
| Today view with overdue surfacing | Reduces cognitive load — users shouldn't have to hunt for what's urgent | Medium | Show today's tasks + any overdue items at the top |
| Task completion with persistence | Checked = done, and it stays done | Low | Trivial with Supabase |
| Task list per category | Filtered view per domain | Low | URL-routable so `/tasks/shopping` is shareable |
| Mobile-readable layout | Primary viewing context is a phone (WhatsApp recipient) | Low | Tailwind responsive |

### Research Pages

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Curated links with title + description | A list of raw URLs is useless. Context is everything. | Low | Manual entry or AI-generated summary |
| Source attribution | Users need to know where a link came from to trust it | Low | Domain name + favicon sufficient |
| Readable summaries | Users won't visit every link — summaries let them triage | Medium | Claude Haiku via Vercel AI SDK |
| Category or topic grouping | Research sprawls — grouping prevents information overload | Low | Per-page or tagged |
| Mobile-readable card layout | Pages are shared on WhatsApp, viewed on phones | Low | Card grid or list |

### Comparison Boards

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Side-by-side layout (2-4 items) | The core purpose. Without it, it's just a list. | Medium | CSS Grid. Research says 3-4 items max before overload. |
| Item name + image + price + link | Minimum viable comparison row: what is it, what does it look like, what does it cost, where do I get it | Medium | Image upload or URL. Price as text. External link. |
| Notes per item | Users need space for qualitative judgments | Low | Free text textarea |
| Winner / decision marker | Boards are for deciding. Let the user mark a choice. | Low | Single "selected" flag per board |
| Shareable URL | The distribution mechanic. Must work as a WhatsApp link. | Low | /compare/[id] route |
| Mobile-scannable layout | Side-by-side on mobile is hard. Must degrade gracefully. | Medium | Horizontal scroll or stacked cards on small screens |

### Greeting Card Creator

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| AI-generated card design | That's the core value prop. Manual design tools are Canva's job. | High | Claude + image generation API or CSS-based generation |
| Editable text overlay | Generated text is a starting point, not final | Low | Simple textarea over rendered card |
| Preview before sharing | Must see what the recipient will see | Low | Live preview panel |
| Shareable URL | Cards are sent on WhatsApp. URL = distribution. | Low | /card/[id] route |
| Mobile-renderable output | Card is viewed on a phone | Low | CSS card that looks good on 375px+ |
| Multiple tone options | "Romantic", "funny", "heartfelt" — AI output varies with tone | Medium | Enum passed to prompt |

### Sharing Mechanics (Cross-Cutting)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| og:title + og:description + og:image per page | Without these, WhatsApp shows a blank preview — kills click-through | Low | Next.js `generateMetadata` per route |
| og:image at 1200x630px via HTTPS | WhatsApp will not show images smaller than 300x200 or served over HTTP | Medium | Static generation or dynamic OG image via @vercel/og |
| Shareable URL on every entity | Tasks lists, research pages, comparison boards, cards — all must have a stable URL | Low | Route structure from day 1 |
| Public read access without login | Recipient has no account. Pages must render without auth. | Low | No auth in V1 — all pages are public |

---

## Differentiators

Features that set this tool apart. Not expected by users, but they create "wow" and stickiness.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Groom-specific categories | Every other tool is built for brides. 8 categories designed around a groom's actual work (Shopping, Family, Logistics, Romance, etc.) feels immediately right. | Low | Configuration, not code |
| 93-day countdown context | Show days remaining to wedding on the dashboard. Creates urgency and relevance that generic task tools lack. | Low | Static date math |
| AI-summarized research pages | No other wedding tool auto-summarizes a set of fashion/shopping links into a readable brief. Genuinely useful, genuinely novel. | Medium | Claude Haiku call on page creation or manual trigger |
| Comparison boards with image + price | Most wedding vendor comparisons happen in spreadsheets. A visual, shareable comparison board (especially for suits, venues, gifts) has no direct equivalent in wedding tools. | Medium | Core differentiator — invest here |
| WhatsApp-first sharing | Zola/The Knot share via email or their own notification system. Sharing a clean WhatsApp link that previews beautifully is designed for how Indian/South Asian weddings actually coordinate. | Low | OG tags + URL design |
| Greeting card with AI generation | No wedding planning tool does this. Creative output as a feature is a novel addition to the command center paradigm. | High | Most complex feature — has API cost per generation |
| Single-purpose pages per entity | A comparison board at `/compare/suits-shortlist` is clean, fast, and shareable. Most tools bury comparisons inside complex dashboards. | Low | URL design decision |
| No vendor lock-in | Zero paywalls, zero ads, zero "upgrade to see this." Trust with the primary user is the product. | Low | Architecture decision, not a feature |

---

## Anti-Features

Features to explicitly NOT build. These are things competitors do that this tool should actively avoid.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Vendor marketplace / vendor directory | The Knot and Zola rank vendors by who pays most. It corrupts the tool's neutrality. PPR serves the couple, not vendors. | Link to external vendor pages in comparison boards. No native directory. |
| Guest list / RSVP management | Complex feature with its own database, communication flows, and edge cases. Not the core pain point. Distraction from MVP. | Add to "Later" list. Mention it as planned. Don't build V1. |
| Budget tracker with forecasting | Couples already have wedding budgets in spreadsheets. Replacing that is a complex, high-trust feature. | Let comparison boards show prices for ad-hoc cost awareness. |
| Push notifications / email reminders | Adds backend complexity (notification queues, unsubscribes, opt-ins). Primary user is the founder — they check the app directly. | Rely on due dates surfaced in Today view. |
| Multi-user accounts / invites | Auth complexity balloons for V1. Coordination happens via WhatsApp links, not in-app collaboration. | URL sharing is the collaboration model. |
| Drag-and-drop task reordering | Looks impressive, adds complexity, low actual value. Wedding tasks don't have a meaningful manual order — due date is the ordering signal. | Sort by due date + overdue status. |
| Rich text in task notes | Not worth a WYSIWYG editor. Notes are short and functional. | Plain text textarea. |
| Recurring tasks | Wedding is a one-time event. Recurring tasks are a generic task tool concern. | Not applicable domain. |
| In-app chat / comments | Async coordination via WhatsApp is the pattern. In-app comments add complexity without matching existing behavior. | Share the URL. Comment in WhatsApp. |
| Social features (public profiles, feeds, discovery) | Not a platform. A personal tool. | Stay private by default, shareable by choice. |
| Mobile app (iOS/Android) | URL sharing on WhatsApp means web is the right form factor. App install friction kills recipient experience. | Web-only. Responsive. |
| "AI suggestions" for vendors | Requires knowledge of local vendors, pricing, availability. Hallucination risk high. Trust destruction if wrong. | AI for research summarization and card generation only — bounded, verifiable tasks. |
| Gamification (streaks, points, badges) | Wedding planning is stressful. Gamification feels tone-deaf in this context. | Clean progress indicators (tasks complete / total) are sufficient. |

---

## Feature Dependencies

```
WhatsApp sharing
  └── og:title, og:description, og:image (must exist on every route)
       └── @vercel/og or static OG image generation

Comparison boards
  └── Image storage (Supabase storage or URL-based images)
  └── Shareable URL routing (/compare/[id])

Greeting card creator
  └── AI image generation OR CSS-based card rendering
  └── Shareable URL routing (/card/[id])
  └── Claude Haiku API (text generation)

Research pages
  └── Claude Haiku API (summarization)
  └── Shareable URL routing (/research/[id])

Task management
  └── Supabase Postgres (tasks table)
  └── Category enum (Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative)
  └── Today view requires due_date field

All features
  └── Next.js App Router (for generateMetadata per route)
  └── Supabase (auth-free for V1, rows are public-read)
  └── No auth gate (every page renders without login)
```

---

## MVP Recommendation

Ship in this order — each layer adds standalone value:

**Layer 1 — Task Management (day 1)**
The primary daily driver. Without this the tool is useless as a command center.
1. Create / edit / complete tasks with category + due date
2. Today view with overdue surfacing
3. Category-filtered list views
4. WhatsApp-shareable task list URLs with OG preview

**Layer 2 — Comparison Boards (day 2-3)**
The most differentiated feature with the clearest use case (suits, venues, gifts). High perceived value, medium complexity.
1. Create comparison board with 2-4 items
2. Each item: name, image (URL), price, link, notes
3. Mark a winner
4. Shareable URL with OG preview

**Layer 3 — Research Pages (day 3-4)**
Supports the "fashion trends / shopping options" use case. Relies on AI summarization.
1. Create research page with topic + links
2. AI summary of the page
3. Shareable URL with OG preview

**Layer 4 — Greeting Card Creator (day 4-5)**
Most complex, highest delight. Save for when foundation is solid.
1. Prompt-based card generation (text + CSS-rendered design)
2. Editable text overlay
3. Shareable URL

**Defer indefinitely:**
- Guest list / RSVP
- Budget tracker
- Vendor marketplace
- Multi-user accounts

---

## Sources

- [Best Free Wedding Planning App 2026: What Actually Matters](https://vula.app/en/blog/best-free-wedding-planning-app-2026) — MEDIUM confidence (single source)
- [Zola vs Joy vs The Knot vs Guesticon: Best Free Wedding Website 2026](https://guesticon.com/blog/zola-vs-joy-vs-the-knot-wedding-website-comparison-2025) — MEDIUM confidence
- [Comparison Tables for Products, Services, and Features — NN/G](https://www.nngroup.com/articles/comparison-tables/) — HIGH confidence (authoritative UX research)
- [How to design feature comparison tables — LogRocket](https://blog.logrocket.com/ux-design/ui-design-comparison-features/) — HIGH confidence
- [WhatsApp Link Preview Requirements 2026 — ogrilla.com](https://www.ogrilla.com/blog/whatsapp-link-preview-guide) — MEDIUM confidence
- [Top Wedding Planning Apps 2026 — presidentialctr.com](https://presidentialctr.com/best-wedding-planning-apps/) — MEDIUM confidence
- [20 Best Task Management Software Tools 2026 — ClickUp Blog](https://clickup.com/blog/task-management-software/) — HIGH confidence (well-established patterns)
- [Ecommerce Comparison Tool Design Examples — Baymard Institute](https://baymard.com/ecommerce-design-examples/39-comparison-tool) — HIGH confidence (Baymard is authoritative on e-commerce UX research)
