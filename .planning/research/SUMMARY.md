# Project Research Summary

**Project:** PPR — Personal Wedding Command Center
**Domain:** Personal productivity tool — task management, research curation, comparison boards, AI greeting card creation
**Researched:** 2026-04-03
**Confidence:** HIGH

---

## Executive Summary

PPR is a personal wedding command center built for a groom with 93 days until the wedding. The tool combines four distinct UX domains — task management, research curation, visual comparison boards, and AI greeting card generation — into a single WhatsApp-shareable web app. No existing wedding planning tool covers this combination; the gap is real and validated. The recommended approach is a server-first Next.js 16 App Router application with Supabase for persistence, Claude via Vercel AI SDK for text generation, fal.ai for image generation, and WhatsApp link previews as the primary distribution channel.

The architecture constraint that shapes everything else is WhatsApp sharing. Every route must generate a valid og:image returned from a stable HTTPS URL before WhatsApp's crawler processes it. This means OG image generation infrastructure, correct metadataBase configuration, and a real-device preview test must happen in Phase 1 — not bolted on after features are built. The founder's stack choice (Next.js, Tailwind, shadcn/ui, Supabase, Vercel) is validated and correct; the only gap is the image generation layer, which requires fal.ai for greeting cards (Claude cannot produce images) and next/og's built-in ImageResponse for OG previews.

The single biggest risk is scope creep against a hard deadline. The wedding is July 5–6, 2026. Building features competes directly with using the tool. The four-layer MVP (tasks → comparison boards → research pages → greeting cards) should be treated as a fixed scope. Any feature not in that list goes to a "Later" backlog, not the sprint. The second-highest risk is a cascade of WhatsApp sharing failures caused by OG configuration mistakes that are invisible in browser testing but broken on real devices.

---

## Key Findings

### Recommended Stack

The founder's chosen stack is the canonical 2025/2026 approach for this class of application and requires no substitutions. Next.js 16 App Router provides server-rendered HTML that WhatsApp's non-JavaScript crawler can read, built-in OG image generation via ImageResponse, and zero-config Vercel deployment. Supabase provides Postgres with Row Level Security, edge functions, and a JavaScript client with first-class Next.js App Router support. The Vercel AI SDK v6 wraps all LLM providers behind a single interface and handles streaming out of the box.

The two gaps in the founder's original stack list are both resolved: (1) OG image generation uses `next/og` (ImageResponse), which ships with Next.js at no extra installation cost, and (2) greeting card image generation uses fal.ai with Flux Schnell, since Claude is a text-only API.

**Core technologies:**

- **Next.js 16 (App Router):** Full-stack framework — server-rendered HTML required for WhatsApp OG scraping; colocated opengraph-image.tsx files per route; zero-config Vercel deployment
- **Tailwind CSS v4 + shadcn/ui CLI v4:** Styling and component primitives — owned by the project (not a runtime dependency), built on Radix UI, CSS-first configuration
- **Supabase (@supabase/supabase-js v2.101.1):** Postgres + auth + storage — Row Level Security for no-auth V1 security; @supabase/ssr for correct server vs client session handling
- **Vercel AI SDK v6 (ai package) via AI Gateway:** LLM-agnostic streaming text — streamText for research summaries, generateObject for structured data; use `anthropic/claude-haiku-4.5` for latency-sensitive generation
- **fal.ai (Flux Schnell):** AI image generation for greeting cards — fastest serverless inference, predictable per-image pricing, official Vercel integration; fal-ai/flux/schnell for draft renders, fal-ai/flux-pro/v1.1 for finals
- **next/og (ImageResponse):** OG image generation — built into Next.js, sub-100ms at edge runtime, required for WhatsApp previews on every route
- **html-to-image:** Card download to PNG — simpler API than html2canvas, cleaner output for CSS-heavy card designs; use standard `<img>` tags (not next/image) inside cards

**Deferred to Phase 2+:**
- @dnd-kit/core + @dnd-kit/sortable: drag-to-reorder — not needed until Phase 2; shadcn's built-in components handle all Phase 1 task UI

---

### Expected Features

No existing wedding tool unifies personal task management, research curation, comparison boards, and creative card generation. The groom-centric framing (categories: Shopping, Family, Logistics, Romance, Bride, Ceremony, Documents, Creative) and WhatsApp-first distribution are the differentiating design decisions.

**Must have (table stakes):**
- Create / edit / complete tasks with category + due date — foundational, tool is unusable without this
- Today view with overdue surfacing — essential for day-of use 93 days from a deadline
- Category-filtered task lists at routable URLs — required for WhatsApp shareability
- Side-by-side comparison boards (2-4 items) with name, image URL, price, link, notes — the core value of comparison, cannot be a list
- Mark winner on comparison board — boards are for deciding; without this, it's just storage
- Research pages with curated links and AI-generated summaries — the research curation use case
- AI-generated greeting card text with editable overlay — the stated core of the cards feature
- og:title + og:description + og:image on every shareable route — non-negotiable for WhatsApp distribution
- All pages publicly readable without login — recipients have no account

**Should have (competitive differentiators):**
- 93-day countdown on the dashboard — situational urgency no generic tool provides
- AI summarization of research pages — novel in the wedding tools space, genuinely useful
- Shareable URL per entity (task list, comparison board, research page, card) — the distribution mechanic
- Tone options for card generation (romantic, funny, heartfelt) — expands AI output variety at low cost
- Winner/decision marker on comparison boards — closes the decision loop
- Mobile-scannable comparison layout (horizontal scroll or stacked cards on small viewports)

**Defer to v2+:**
- Guest list / RSVP management — own database + communication flows, out of scope
- Budget tracker — high-trust feature; comparison board prices cover ad-hoc cost awareness
- Multi-user accounts / invites — URL sharing is V1's collaboration model
- Push notifications / email reminders — backend complexity, primary user checks app directly
- Drag-and-drop task reordering — low value; sort by due date + overdue status is sufficient
- Vendor marketplace — corrupts tool neutrality; explicitly out of scope
- Recurring tasks — one-time event, domain doesn't apply
- Mobile app (iOS/Android) — web is correct form factor for WhatsApp sharing

---

### Architecture Approach

The system is a server-first Next.js App Router application. All pages render on the server so WhatsApp's non-JavaScript crawler receives complete HTML with correct OG metadata. Client Components exist only where browser interactivity is required (task completion toggle, comparison board editor, AI streaming output, card editor). All mutations go through Server Actions; Route Handlers handle only AI streaming and external webhooks. The Supabase server client is used for all reads in Server Components. No REST API layer is needed or recommended.

**Major components:**

1. **Route structure with colocated OG images** — `app/(app)/tasks/`, `app/(app)/research/[slug]/`, `app/(app)/compare/[slug]/`, `app/(app)/cards/[id]/`; each has a `page.tsx` (Server Component), `generateMetadata` export, and `opengraph-image.tsx` file for dynamic OG images
2. **Server Actions layer (`lib/actions/`)** — all write operations; calls Supabase server client with service-role key; calls `revalidatePath()` after mutation; handles task CRUD, board/card creation, link management
3. **AI Route Handlers (`app/api/ai/summarize/route.ts`, `app/api/ai/generate-card/route.ts`)** — streaming text via Vercel AI SDK's `streamText` and `toTextStreamResponse()`; AI Gateway OIDC auth on Vercel (zero config), `vercel env pull` for local dev; summaries cached to DB, not regenerated on every load
4. **Supabase schema (5 tables)** — `tasks`, `research_pages`, `research_links`, `comparison_boards`, `comparison_items`, `greeting_cards`; RLS enabled from day one; write access via server-side service-role key only; connection pooler port 6543 (not 5432)
5. **fal.ai image generation layer** — `app/api/fal/proxy/route.ts` wrapping `@fal-ai/server-proxy` prevents client-side API key exposure; client calls proxy, proxy calls fal.ai

---

### Critical Pitfalls

1. **Claude cannot generate images** — fal.ai must be wired for greeting card image generation from Phase 1. Any code path expecting an image URL from an Anthropic API call will fail silently. Use Claude for text only; fal.ai (Flux Schnell) for images.

2. **WhatsApp silently drops OG images over 300KB** — No error message, no crawler feedback. Discovered only when testing on a real device. Test on a physical phone after the first shareable page ships. Keep og:image designs flat (no gradients, no embedded photos). Provide a 400x400 fallback image entry alongside the 1200x630 primary.

3. **Missing metadataBase breaks all OG image URLs in production** — Next.js resolves OG image paths relative to `localhost:3000` without `metadataBase`. Every WhatsApp preview shows a broken image. Set `metadataBase` in `app/layout.tsx` using `NEXT_PUBLIC_SITE_URL` before writing the first page.

4. **No-auth + Supabase anon key = public write access if RLS is skipped** — The anon key is visible in client-side JS. Without RLS policies, anyone who finds the key can delete all wedding data. Enable RLS on all tables on creation. Route all writes through Server Actions using the service-role key server-side only.

5. **Vercel free plan 10-second function timeout kills AI research summaries** — LLM calls take 8-25 seconds. A non-streaming implementation returns 504 errors on every call. Use `streamText` with `toTextStreamResponse()` from the first AI route — streaming starts within 1-2 seconds and avoids the timeout threshold entirely.

---

## Implications for Roadmap

Based on combined research findings, six phases are recommended. The ordering is driven by two rules: (1) WhatsApp sharing infrastructure must exist before any page is shared, and (2) task management is immediately useful while cards are technically complex and less time-sensitive.

---

### Phase 1: Foundation + Sharing Infrastructure

**Rationale:** Everything depends on this. Supabase schema and client wiring block all features. The OG/metadataBase configuration must be correct before any page is made shareable — retrofitting breaks existing shares. RLS and server-only writes must be established before data is created.

**Delivers:** Working app scaffold; Supabase schema (all 5 tables); server and client Supabase clients; root layout with metadataBase; nav shell; /tasks redirect from /; dev and prod environment wired

**Addresses:** Sharing mechanics (og:title, og:description, og:image infrastructure); all table-stakes features that depend on Supabase schema

**Avoids:**
- Pitfall 3 (missing metadataBase) — set in layout.tsx before writing any page
- Pitfall 4 (no RLS = public writes) — RLS enabled on table creation
- Pitfall 8 (Postgres connection limit) — Supabase pooler port 6543 from day one
- Pitfall 11 (schema drift) — Supabase CLI migrations from day one

**Research flag:** Standard patterns, well-documented. No research-phase needed.

---

### Phase 2: Task Management (Complete Feature)

**Rationale:** The primary daily driver. Without usable task management, the tool provides no immediate value. This phase is the foundation the founder will use every day for 93 days. It is also the simplest feature to build with the chosen stack.

**Delivers:** /tasks daily view with today + overdue surfacing; create/edit/complete tasks with category + due date; category-filtered views at /tasks/[category]; /tasks/[id] shareable single-task pages; opengraph-image.tsx per task page; real WhatsApp preview test on device

**Addresses:** All task management table stakes; WhatsApp-shareable task list URLs

**Avoids:**
- Pitfall 2 (OG image size) — test on real WhatsApp after first shareable page ships
- Pitfall 7 (relative OG URLs) — already mitigated by Phase 1 metadataBase setup

**Research flag:** Standard patterns. Server Actions + shadcn checkbox + Supabase is a well-documented pattern. No research-phase needed.

---

### Phase 3: Comparison Boards

**Rationale:** The most differentiated feature with the clearest use case (suits, venues, gifts). High perceived value, medium complexity. Builds on the routing and OG patterns established in Phase 2. Should ship before research pages because comparison boards are more immediately decision-useful.

**Delivers:** /compare list; /compare/[slug] side-by-side board with 2-4 items; item fields (name, image URL, price, link, notes); winner marker; opengraph-image.tsx for boards (text-only design — avoids external image fetch failures); mobile-responsive layout tested on physical iPhone

**Addresses:** Comparison board table stakes; WhatsApp-shareable board URLs; winner/decision marking

**Avoids:**
- Pitfall 9 (external images in OG generation) — OG image uses board title and item count, not product images
- Pitfall 10 (table overflow on mobile) — horizontal scroll container + test on real iPhone, not devtools

**Research flag:** Baymard Institute and NN/G patterns for comparison tables are well-established. No research-phase needed for UX. Consider research-phase if image upload via Supabase Storage is added in this phase.

---

### Phase 4: Research Pages + AI Summarization

**Rationale:** The research curation feature relies on the AI SDK streaming infrastructure. Build it after comparison boards so the AI integration is a contained addition. The caching layer for AI summaries must be designed before writing the first AI route — retrofitting a cache to an uncached AI feature requires rewriting the component boundary.

**Delivers:** /research list; /research/[slug] detail with link list; add/edit research links; AI summarization route (/api/ai/summarize) with streaming via streamText; AISummarySection client component streaming display; summary cached to DB with generated_at timestamp; refresh-on-demand only; opengraph-image.tsx for research pages

**Addresses:** Research page table stakes; AI-summarized research as differentiator

**Avoids:**
- Pitfall 5 (504 timeout) — streaming from day one; summary cached in DB, not regenerated per load
- Pitfall 12 (AI call on every page load) — cache check before every LLM call; regenerate only on user request or link change
- Pitfall 1 (Claude for images) — Claude used for text only in this phase

**Research flag:** Vercel AI Gateway OIDC auth and streamText patterns are verified and documented. No research-phase needed. The edge runtime + streaming combination has known behavior.

---

### Phase 5: Greeting Card Creator

**Rationale:** Most complex feature (AI text + AI image generation + live preview + shareable output). Should ship last when the foundation is solid and the developer has time to iterate. fal.ai must be wired before any card code is written — this is not optional given Pitfall 1.

**Delivers:** /cards list; /cards/new creation form (recipient, occasion, tone); AI card text generation via Claude (/api/ai/generate-card streaming); fal.ai image generation via proxy route (Flux Schnell draft, Flux Pro final); CardEditor client component with live preview and editable text overlay; /cards/[id] public shareable view; opengraph-image.tsx rendering the card visually; card download via html-to-image; WhatsApp sharing via Web Share API with wa.me fallback

**Addresses:** Greeting card creator table stakes and differentiator; AI-generated card design; WhatsApp-native sharing flow

**Avoids:**
- Pitfall 1 (Claude for images) — fal.ai wired before any card code is written
- Pitfall 3 (WhatsApp cache) — unique UUID per card URL ensures each reshare gets a fresh preview
- OG image size budget — card OG image tested against 300KB limit before shipping

**Research flag:** fal.ai + Vercel AI SDK integration needs a focused spike before this phase. The fal.ai proxy route pattern is documented but the interaction with next/og ImageResponse for the card's OG image is nuanced. Recommend 30-minute research spike on fal.ai webhook vs polling for image completion.

---

### Phase 6: Polish + WhatsApp QA

**Rationale:** A dedicated polish phase prevents shipping broken previews to real wedding guests. WhatsApp testing requires a real phone and real message threads — this cannot be simulated in devtools. This phase is time-boxed; scope creep here is the clearest risk.

**Delivers:** shadcn/ui theming consistent across all pages; mobile responsiveness pass on all four features; WhatsApp preview test for every shareable route using Facebook Sharing Debugger + real device; 93-day countdown on dashboard; performance audit (OG image sizes under 300KB confirmed)

**Addresses:** Mobile-readable layouts across all features; complete WhatsApp distribution channel verification

**Research flag:** Standard polish patterns. No research-phase needed.

---

### Phase Ordering Rationale

- **Foundation before everything:** Supabase schema, RLS, and Supabase CLI migrations must exist before any feature can be built without incurring schema drift debt
- **OG/metadataBase in Phase 1 not Phase 6:** WhatsApp preview failures are discovered on real devices, not in devtools — catching this late means rebuilding share links already distributed
- **Tasks before AI features:** Task management has zero dependencies on the AI layer; AI features depend on the Supabase client and caching infrastructure established during the tasks phase
- **Comparison before Research:** Comparison boards are more decision-useful day-to-day; research pages require the AI SDK streaming infrastructure, which adds a layer of complexity better addressed after the simpler features are stable
- **Cards last:** Most technically complex (two AI providers, live preview, download, unique URL per share); least time-sensitive (sending cards is a late-stage wedding activity)

---

### Research Flags

**Needs research-phase during planning:**
- **Phase 5 (Greeting Cards):** fal.ai webhook vs polling interaction with Next.js streaming needs a focused spike; also validate Flux model pricing against fal.ai current pricing page before committing

**Standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Next.js scaffold + Supabase + metadataBase is a documented, repeatable pattern
- **Phase 2 (Tasks):** Server Actions + shadcn + Supabase CRUD is the canonical App Router tutorial pattern
- **Phase 3 (Comparison Boards):** shadcn Card + CSS Grid comparison layout is well-documented; only flag if Supabase Storage image upload is in scope
- **Phase 4 (Research + AI):** Vercel AI SDK streaming with database caching is a documented pattern; AI Gateway OIDC is verified
- **Phase 6 (Polish):** No research needed; execution and testing only

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages version-verified against npm and official docs; Next.js 16, ai@6.0.143, @supabase/supabase-js@2.101.1 confirmed |
| Features | HIGH for table stakes, MEDIUM for differentiators | Table stakes validated against NN/G, Baymard, ClickUp blog (authoritative sources); differentiators validated by gap analysis against Zola/The Knot/Joy (medium-confidence comparison sources) |
| Architecture | HIGH | Server Component vs Client Component boundaries verified against Next.js official docs; Supabase SSR pattern from official quickstart; AI SDK streaming pattern from Vercel docs; WhatsApp OG requirements from multiple independent sources |
| Pitfalls | HIGH for WhatsApp/OG pitfalls and Supabase security, MEDIUM for scope creep patterns | WhatsApp OG failures documented from multiple production post-mortems; Supabase anon key exposure is a documented CVE-class issue; scope creep is pattern-matched from community experience, not hard data |

**Overall confidence:** HIGH

---

### Gaps to Address

- **fal.ai image polling vs webhook:** The fal.ai async image generation flow (submit job → poll for completion vs submit job → webhook fires) needs a brief spike before Phase 5 starts. The Vercel AI Gateway image generation docs cover the `@ai-sdk/fal` pattern but the interaction with Next.js streaming responses in App Router edge functions is not fully documented in one place. Validate with a working prototype before writing CardEditor.

- **Supabase Storage CORS for comparison item images:** If Phase 3 includes image upload (rather than URL-only images), Supabase Storage CORS policy configuration for browser-to-storage direct upload needs verification. This is not a blocker for URL-based images in Phase 3 MVP but becomes relevant if upload is in scope.

- **Vercel AI Gateway model string format for fal.ai:** The gateway documentation shows `anthropic/model-id` format for Anthropic models. The format for fal.ai models via the gateway (vs direct fal.ai SDK) needs confirmation. If fal.ai is not available via the gateway, the direct `@fal-ai/client` SDK with the proxy route is the confirmed fallback pattern documented in STACK.md.

- **WhatsApp preview cache invalidation workflow:** The query-param versioning strategy (`?v=2`) recommended in PITFALLS.md needs to be verified against how Next.js handles query params in App Router dynamic routes. This is a low-risk gap — the fallback of generating a new UUID per card share is confirmed to work.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — framework version, Cache Components, React 19.2
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) — opengraph-image.tsx file convention, metadataBase
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) — edge runtime, Satori constraints (flexbox only, no Grid, no calc())
- [Supabase @supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.101.1 confirmed
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — server vs client Supabase pattern
- [AI SDK npm package](https://www.npmjs.com/package/ai) — v6.0.143 confirmed
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) — OIDC auth, provider/model format
- [Vercel AI Gateway Authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication) — vercel env pull workflow
- [AI SDK v6 Generating Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) — toTextStreamResponse vs toUIMessageStreamResponse
- [Comparison Tables — Nielsen Norman Group](https://www.nngroup.com/articles/comparison-tables/) — comparison board UX standards
- [Ecommerce Comparison Tool Design — Baymard Institute](https://baymard.com/ecommerce-design-examples/39-comparison-tool) — comparison UX best practices
- [Supabase Security — anon key exposure](https://www.stingrai.io/blog/supabase-powerful-but-one-misconfiguration-away-from-disaster) — RLS requirement
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) — 10-second free tier timeout
- [Claude Cannot Generate Images](https://support.claude.ai/en/articles/9002504-can-claude-produce-images) — confirmed text-only API

### Secondary (MEDIUM confidence)
- [WhatsApp link preview guide 2026 — ogrilla.com](https://www.ogrilla.com/blog/whatsapp-link-preview-guide) — 300KB limit, 1200x630 spec, crawler behavior
- [WhatsApp OG Image Fix — Fabian Rosenthal](https://fabian-rosenthal.com/blog/fix-whatsapp-is-not-showing-the-open-graph-image) — production post-mortem
- [fal.ai Next.js integration docs](https://docs.fal.ai/model-apis/integrations/nextjs) — proxy route pattern, Flux model selection
- [AI image API comparison 2026 — teamday.ai](https://www.teamday.ai/blog/ai-image-video-api-providers-comparison-2026) — fal.ai vs Replicate vs OpenAI pricing
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) — CLI v4 March 2026, Tailwind v4 compatibility
- [Best wedding apps 2026 — vula.app](https://vula.app/en/blog/best-free-wedding-planning-app-2026) — competitive landscape
- [Zola vs Joy vs The Knot comparison — guesticon.com](https://guesticon.com/blog/zola-vs-joy-vs-the-knot-wedding-website-comparison-2025) — feature gap analysis
- [Vercel Serverless Timeout Solutions — Inngest](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts) — streaming as timeout mitigation

### Tertiary (LOW confidence)
- Flux Schnell quality advantage over SDXL — community consensus, no formal benchmark cited

---
*Research completed: 2026-04-03*
*Ready for roadmap: yes*
