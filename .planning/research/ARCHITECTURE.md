# Architecture Patterns

**Domain:** Wedding command center — task management + research pages + comparison boards + AI-generated greeting cards
**Researched:** 2026-04-03
**Confidence:** HIGH (Next.js App Router patterns well-established; OG image requirements verified against official docs and real-world reports)

---

## Recommended Architecture

The system is a **server-first Next.js App Router application** with a thin Supabase backend. No authentication for V1. All write operations go through Server Actions. All reads happen in Server Components where possible. Client Components exist only where interactivity is required (drag/drop on comparison boards, AI streaming output, task completion toggling).

The distribution model is WhatsApp links, which dictates that every route must generate correct OG metadata including images. This is not an afterthought — it is a first-class architecture constraint that shapes how routes are structured.

---

## Route Structure

```
app/
  layout.tsx                        # Root layout: fonts, globals, metadataBase
  page.tsx                          # / → redirect to /tasks

  (app)/                            # Route group: authenticated-feel pages (no auth, just layout)
    layout.tsx                      # Sidebar / nav shell
    tasks/
      page.tsx                      # /tasks → daily view, today's tasks + overdue
      [id]/
        page.tsx                    # /tasks/[id] → single task detail (shareable)
        opengraph-image.tsx         # Dynamic OG: task title + category + due date
    research/
      page.tsx                      # /research → list of all research topics
      [slug]/
        page.tsx                    # /research/[slug] → research page (links + AI summary)
        opengraph-image.tsx         # Dynamic OG: topic title + summary excerpt
    compare/
      page.tsx                      # /compare → list of active comparison boards
      [slug]/
        page.tsx                    # /compare/[slug] → side-by-side evaluation board
        opengraph-image.tsx         # Dynamic OG: board name + item count + category
    cards/
      page.tsx                      # /cards → list of created greeting cards
      new/
        page.tsx                    # /cards/new → card creator (AI generation form)
      [id]/
        page.tsx                    # /cards/[id] → view/share single card
        opengraph-image.tsx         # Dynamic OG: the card image itself

  api/
    ai/
      summarize/route.ts            # POST: summarize research links → streaming response
      generate-card/route.ts        # POST: generate greeting card text/design → streaming
    og/
      card/[id]/route.ts            # GET: render card as image (used by opengraph-image)
```

### Route Design Decisions

**Route groups `(app)/`**: Wraps all content pages in a shared nav layout. The parentheses mean `(app)` does not appear in the URL. This lets `/tasks` and `/compare` share a sidebar without putting "app" in every URL.

**Dynamic segments for shareability**: Every entity (task, research page, comparison board, card) has a stable slug/ID-based URL. The ID comes from Supabase's UUID or a URL-safe slug stored in the database.

**No `/dashboard`**: The landing page redirects to `/tasks` directly. There is no hub page — tasks is the primary surface.

---

## Component Boundaries

### What is a Server Component

Everything by default. Server Components fetch their own data directly from Supabase using the server client. They render HTML on the server, which means:

- OG images can be generated with access to live database data
- No client JS bundle cost for read-only views
- WhatsApp scrapers get fully rendered HTML with correct meta tags

### What is a Client Component

Only components that require browser APIs or React state:

| Component | Why Client | Notes |
|-----------|-----------|-------|
| `TaskCheckbox` | `onClick` to toggle complete | Calls server action, optimistic update via `useOptimistic` |
| `ComparisonBoard` | Drag to reorder columns, hover states | May use `dnd-kit` for drag/drop |
| `AIStreamingOutput` | `useChat` / reading a streaming response | Receives streamed text from API route |
| `CardEditor` | Form state for card text, live preview | Uses `useState` for text fields |
| `SearchFilter` | Input state for filtering tasks/research | Local filter — no server round trip |
| `DatePicker` | Calendar interaction | shadcn DatePicker is client-side |

**Rule**: If a component only reads data and has no user interaction, it is a Server Component. If it has a `useState`, `useEffect`, or event handler, it is a Client Component.

### Component Hierarchy

```
(Server) ResearchPage
  ├── (Server) ResearchHeader — title, topic metadata
  ├── (Server) LinkList — list of curated links from DB
  └── (Client) AISummarySection
        ├── [fetch summary from DB if cached]
        └── [stream new summary from /api/ai/summarize if stale]

(Server) ComparisonPage
  ├── (Server) BoardHeader — board name, description
  └── (Client) ComparisonBoard
        ├── (Server, rendered inside) ComparisonItem × N
        │     ├── image, price, name (from DB)
        │     └── notes field (editable inline)
        └── AddItemButton → server action

(Server) CardPage
  ├── (Server) CardDisplay — renders the card at full size
  └── (Client) ShareButton — copy URL, native share API
```

---

## Data Flow

### Supabase Schema

```sql
-- Tasks: the core daily management surface
tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  category    text NOT NULL,           -- one of 8 wedding categories
  due_date    date,
  notes       text,
  completed   boolean DEFAULT false,
  completed_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  slug        text GENERATED ALWAYS AS (id::text) STORED
)

-- Research pages: topic + curated links + AI summary cache
research_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,    -- URL slug e.g. "bridal-fashion-2026"
  title       text NOT NULL,
  description text,
  ai_summary  text,                    -- cached; regenerated when links change
  summary_generated_at timestamptz,
  created_at  timestamptz DEFAULT now()
)

research_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_page_id uuid REFERENCES research_pages(id) ON DELETE CASCADE,
  url             text NOT NULL,
  title           text,
  notes           text,
  sort_order      int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)

-- Comparison boards: named boards with items for evaluation
comparison_boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,    -- URL slug e.g. "wedding-suits"
  title       text NOT NULL,
  category    text,
  created_at  timestamptz DEFAULT now()
)

comparison_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id    uuid REFERENCES comparison_boards(id) ON DELETE CASCADE,
  name        text NOT NULL,
  image_url   text,
  price       numeric,
  source_url  text,
  notes       text,
  rating      int,                     -- 1-5, nullable
  sort_order  int DEFAULT 0,
  created_at  timestamptz DEFAULT now()
)

-- Greeting cards: generated content with editable text overlay
greeting_cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  recipient   text,
  occasion    text,
  message     text NOT NULL,           -- AI-generated or edited
  design_style text,                   -- prompt context for future image generation
  shared_at   timestamptz,             -- null = private, set = published/shareable
  created_at  timestamptz DEFAULT now()
)
```

### Row Level Security

For V1 with no auth: disable RLS on all tables (or set permissive policies). The app is a personal tool with no sensitive data that requires access control. Add RLS when multi-user support is introduced.

### Data Flow Direction

```
User action
  → Client Component (form submit / button click)
    → Server Action (lib/actions/*.ts)
      → Supabase server client (lib/supabase/server.ts)
        → Postgres table mutation
          → revalidatePath() invalidates Next.js cache
            → Server Component re-renders with fresh data
              → Browser receives updated HTML
```

For reads:

```
URL request
  → Next.js Route Handler (page.tsx)
    → Server Component fetches from Supabase directly
      → Renders HTML with data
        → Sent to browser / WhatsApp scraper
```

For AI operations:

```
User triggers AI (summarize / generate card)
  → Client Component calls /api/ai/[action]
    → Route Handler streams via Vercel AI SDK streamText
      → Client receives streaming response via useChat or custom fetch
        → Result saved to Supabase (summary_cache / card message)
          → revalidatePath() called after save
```

---

## Shareable URLs and OG Images

### How It Works

Every shareable route has a colocated `opengraph-image.tsx` file. Next.js automatically serves this as the OG image when the URL is scraped by WhatsApp, Facebook, or any Open Graph crawler.

```typescript
// app/(app)/compare/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getComparisonBoard } from '@/lib/db/compare'

export const runtime = 'edge'  // REQUIRED — edge starts faster, runs closer to user
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'  // PNG works reliably on WhatsApp (WEBP also supported)

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const board = await getComparisonBoard(slug)

  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
                  backgroundColor: '#fff', padding: 48 }}>
      <div style={{ fontSize: 48, fontWeight: 700 }}>{board.title}</div>
      <div style={{ fontSize: 24, color: '#666' }}>{board.item_count} options compared</div>
    </div>,
    { ...size }
  )
}
```

### WhatsApp-Specific Requirements

- **Image format**: PNG works reliably. WEBP also works per official WhatsApp spec but PNG is safer as a default.
- **Dimensions**: 1200x630px exactly.
- **metadataBase**: Must be set in root layout's `metadata` export. Without it, Next.js resolves OG image URLs relative to `localhost:3000` in production, breaking previews.
- **Cache headers**: OG images should be cached (`Cache-Control: public, max-age=3600`). WhatsApp caches aggressively; after updating content, use Facebook's Sharing Debugger to force a refresh.
- **Absolute image URL**: The `og:image` must be a fully-qualified absolute URL. Next.js handles this automatically when `metadataBase` is set correctly.

### metadataBase in Root Layout

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://your-app.vercel.app'),  // set to production URL
}
```

### Per-Route metadata

Each page exports a `generateMetadata` function that fetches the entity and returns title/description for the `<head>`:

```typescript
// app/(app)/tasks/[id]/page.tsx
export async function generateMetadata({ params }) {
  const task = await getTask(params.id)
  return {
    title: task.title,
    description: `Due: ${task.due_date} · ${task.category}`,
  }
}
```

---

## AI Integration Architecture

### Two AI Operations

**1. Research Summarization** (`/api/ai/summarize`)
- Input: research page ID
- Operation: fetch all links for the page, send to Claude, request a summary
- Output: streaming text, then save final summary to `research_pages.ai_summary`
- Trigger: "Refresh Summary" button on research page, or auto-trigger when no summary exists
- Cache strategy: summary is stored in DB; only regenerate when user explicitly requests or when links have changed since `summary_generated_at`

**2. Greeting Card Generation** (`/api/ai/generate-card`)
- Input: recipient name, occasion, tone, key notes
- Operation: send to Claude with a structured prompt for card text
- Output: streaming text shown in real-time in the card editor
- Save: user edits the generated text, then explicitly saves to DB

### AI SDK Pattern (verified against AI SDK v6 + Vercel AI Gateway docs)

Use `streamText` from the `ai` package in Route Handlers. The Vercel AI Gateway is used as the provider — it routes to any underlying model via a `provider/model` string format, with no separate provider package required.

**Do not** use Server Actions for streaming — they cannot return streaming responses. Route Handlers are the correct location.

**Response method**: In AI SDK v6, `toDataStreamResponse()` is renamed. Use:
- `toTextStreamResponse()` — for text-only streaming (research summary, card generation)
- `toUIMessageStreamResponse()` — for chat UIs with tool calls (not needed for this project)

```typescript
// app/api/ai/summarize/route.ts
import { streamText } from 'ai'

// AI Gateway: no provider package needed.
// The 'ai' package resolves 'provider/model' strings automatically.
// Auth is handled by OIDC on Vercel deployments (zero config).
// For local dev, run: vercel env pull  (generates a 12-hour token)
// Model IDs verified 2026-04-03 via https://ai-gateway.vercel.sh/v1/models
// anthropic/claude-haiku-4.5 = fastest + cheapest Claude for summarization

export const runtime = 'edge'

export async function POST(req: Request) {
  const { links, topic } = await req.json()
  const result = streamText({
    model: 'anthropic/claude-haiku-4.5',
    prompt: buildSummaryPrompt(links, topic),
  })
  return result.toTextStreamResponse()  // AI SDK v6: not toDataStreamResponse()
}
```

### AI Gateway Authentication

Two paths — prefer OIDC, fall back to API key:

**Production on Vercel (preferred):** OIDC tokens are generated automatically per deployment. No environment variable needed. The `ai` package detects the Vercel environment and uses the OIDC token transparently. Zero key rotation required.

**Local development:** Run `vercel link` once to associate the project, then `vercel env pull` before each dev session to get a fresh OIDC token (valid 12 hours). No manual key management.

**Fallback / non-Vercel environments:** Create a key in the Vercel dashboard under AI Gateway > API Keys and set:
```bash
# .env.local — only needed if not using OIDC
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

The code is identical in all three cases — only the environment variable presence differs. Do not add `AI_GATEWAY_API_KEY` to Vercel environment variables if the project is deployed on Vercel; OIDC makes it redundant and the manual key creates a rotation burden.

---

## Suggested Build Order

Build order is determined by two rules:
1. **Foundation before features**: DB schema and Supabase client wiring must exist before any feature can be built.
2. **High-value, low-dependency first**: Tasks are the simplest feature and the most immediately useful. Build it first.

```
Phase 1: Foundation
  ├── Project scaffold (Next.js 15 + Tailwind + shadcn/ui)
  ├── Supabase project + schema migration (all 5 tables)
  ├── lib/supabase/server.ts + lib/supabase/client.ts
  ├── Root layout with metadataBase + nav shell
  └── /tasks page (daily view, no AI yet)

Phase 2: Task Management (complete)
  ├── Task list with category filtering
  ├── Add/edit/complete tasks (server actions)
  ├── Overdue detection (compare due_date to today)
  ├── /tasks/[id] shareable route
  └── opengraph-image.tsx for task pages

Phase 3: Research Pages
  ├── /research list page
  ├── /research/[slug] detail page with link list
  ├── Add/edit research links (server actions)
  ├── AI summarization route (/api/ai/summarize)
  ├── AISummarySection client component (streaming display)
  └── opengraph-image.tsx for research pages

Phase 4: Comparison Boards
  ├── /compare list page
  ├── /compare/[slug] board page
  ├── ComparisonBoard client component (add/remove items)
  ├── Item image upload via Supabase Storage
  └── opengraph-image.tsx for boards

Phase 5: Greeting Cards
  ├── /cards list page
  ├── /cards/new creation form
  ├── AI card generation route (/api/ai/generate-card)
  ├── CardEditor client component (live preview + edit)
  ├── /cards/[id] public shareable view
  └── opengraph-image.tsx that renders the card visually

Phase 6: Polish
  ├── shadcn/ui theming (colors, fonts consistent)
  ├── Mobile responsiveness pass
  └── WhatsApp preview testing (Facebook Sharing Debugger)
```

**Why this order:**
- Tasks first because the wedding is 93 days away and task capture is immediately useful
- Research before Compare because compare boards may reference research links
- Cards last because they are the most technically complex (AI + visual rendering) and least time-sensitive
- Foundation phase blocks everything; no phase can start without Supabase schema and client wiring

---

## Scalability Considerations

This is a personal tool for one wedding. Scalability to thousands of users is explicitly out of scope for V1. However, the architecture does not create traps:

| Concern | V1 Approach | When multi-user is added |
|---------|-------------|--------------------------|
| Auth | None — direct access | Add Supabase Auth, add `user_id` FK to all tables, enable RLS |
| Data isolation | Single user, no RLS needed | RLS policies per `user_id` |
| AI cost | Claude Haiku via Vercel AI Gateway | Add request rate limiting per user |
| Image storage | Supabase Storage (free tier sufficient) | Same, with Storage policies |
| OG images | Per-entity, generated at edge | Same pattern scales naturally |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: API Routes for Simple CRUD
**What:** Creating `/api/tasks`, `/api/research` REST endpoints for every table.
**Why bad:** Next.js App Router provides Server Actions which are more ergonomic, have built-in CSRF protection, and integrate with `revalidatePath`. REST routes add a round trip and require manual cache invalidation.
**Instead:** Use Server Actions in `lib/actions/` for all mutations. Reserve Route Handlers for AI streaming and external webhooks only.

### Anti-Pattern 2: Client-Side Supabase for Reads
**What:** Fetching data in `useEffect` from the Supabase JS client in every page component.
**Why bad:** Exposes the Supabase anon key logic in client bundle, adds waterfall (page loads, then fetch fires), and breaks OG metadata because the page HTML arrives empty.
**Instead:** Fetch in Server Components using the server client. OG scrapers receive fully rendered HTML.

### Anti-Pattern 3: Missing metadataBase
**What:** Not setting `metadataBase` in root layout.
**Why bad:** Next.js resolves OG image URLs relative to `localhost:3000`, so WhatsApp and other scrapers get broken image URLs in production. This is the most common WhatsApp preview failure mode.
**Instead:** Set `metadataBase` to the Vercel deployment URL in the root layout, even before going to production. Use a `NEXT_PUBLIC_APP_URL` env variable.

### Anti-Pattern 4: Streaming AI from Server Actions
**What:** Trying to stream AI output from a Server Action.
**Why bad:** Server Actions return a single response object; they cannot stream. Attempting this causes the UI to hang until the full generation completes.
**Instead:** Use Route Handlers (`app/api/ai/[action]/route.ts`) for all streaming AI calls. Server Actions are for non-streaming mutations only.

### Anti-Pattern 5: Storing Large Images in Postgres
**What:** Storing base64 card images or uploaded comparison item images as `bytea` in Postgres.
**Why bad:** Bloats the database, slow to query, expensive on Supabase storage limits.
**Instead:** Use Supabase Storage for all binary files. Store only the URL in Postgres.

### Anti-Pattern 6: Using a Direct Provider Package Instead of AI Gateway
**What:** Installing `@ai-sdk/anthropic` and calling `anthropic('claude-haiku-4')` directly.
**Why bad:** Requires managing separate API keys per provider, no cost monitoring, no fallback routing, and hardcodes a vendor assumption. Model IDs differ between the direct SDK and the gateway.
**Instead:** Use the Vercel AI Gateway with `model: 'anthropic/claude-haiku-4.5'` (provider/model string format). One key, provider-agnostic, built-in observability and fallbacks.

### Anti-Pattern 7: Setting AI_GATEWAY_API_KEY on Vercel Deployments
**What:** Adding `AI_GATEWAY_API_KEY` as a Vercel environment variable when deploying to Vercel.
**Why bad:** Vercel deployments use OIDC automatically — no key needed. Adding a manual key creates a rotation burden for no benefit and introduces a secret that can leak.
**Instead:** Use OIDC (zero config on Vercel). Only set `AI_GATEWAY_API_KEY` in `.env.local` for non-Vercel environments, or use `vercel env pull` locally for OIDC-based local development.

---

## Sources

- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure) — official route and file conventions
- [Next.js Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images) — opengraph-image.tsx file convention
- [Next.js ImageResponse API Reference](https://nextjs.org/docs/app/api-reference/functions/image-response) — edge runtime, JSX image generation
- [WhatsApp Open Graph Preview with Next.js — Medium](https://medium.com/@eduardojs999/how-to-use-whatsapp-open-graph-preview-with-next-js-avoiding-common-pitfalls-88fea4b7c949) — WEBP requirement, 1200x630 dimensions, caching
- [Supabase + Next.js Auth Server-Side Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — server vs client Supabase client pattern
- [CRUD with Next.js Server Actions and Supabase — Makerkit](https://makerkit.dev/courses/nextjs-app-router/managing-posts) — server action mutation + revalidatePath pattern
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway) — unified API, provider/model format, OIDC auth
- [Vercel AI Gateway Authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok/authentication) — OIDC vs API key, vercel env pull workflow
- [Vercel AI Gateway Text Quickstart](https://vercel.com/docs/ai-gateway/getting-started/text) — streamText pattern, model string format
- [AI SDK v6 Generating Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) — toTextStreamResponse vs toUIMessageStreamResponse
- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — (folder) grouping for layout isolation
- [Next.js 15 Dynamic OG Image Guide — Build with Matija](https://www.buildwithmatija.com/blog/complete-guide-dynamic-og-image-generation-for-next-js-15) — per-route dynamic OG with params
