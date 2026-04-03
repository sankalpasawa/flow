# Technology Stack

**Project:** PPR — Personal Wedding Command Center
**Researched:** 2026-04-03
**Overall confidence:** HIGH (core stack), MEDIUM (image generation tooling)

---

## Validated Stack

The founder's chosen stack — Next.js App Router, Tailwind CSS, shadcn/ui, Supabase, Claude via Vercel AI SDK, deployed on Vercel — is the correct choice for this product. It is the canonical 2025/2026 stack for this class of web app. No substitutions recommended.

---

## Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16 (latest, released Oct 2025) | Full-stack web framework | App Router is stable and production-ready. Server Components reduce client JS. SSR is required for WhatsApp OG tag scraping — WhatsApp's crawler does not execute JavaScript, so tags must be in server-rendered HTML. Next.js 16 adds Cache Components (use cache directive), stable Turbopack, React 19.2 features. Vercel-first deployment means zero-config edge functions. |
| React | 19.2 (bundled with Next.js 16) | UI rendering | Ships with Next.js 16. View Transitions and Activity component are immediately useful for card animations. |
| TypeScript | 5.x | Type safety | Required by shadcn/ui and Supabase JS v2. Next.js 16 minimum is TypeScript 5.1. |

**Install:**
```bash
npx create-next-app@latest
# Select: App Router, TypeScript, Tailwind, ESLint
```

**Confidence:** HIGH — Verified against [Next.js 16 release notes](https://nextjs.org/blog/next-16).

---

## Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility CSS | v4 is the current release. CSS-first configuration (no tailwind.config.js required). 3-10x faster full builds than v3. Auto-scans project. Compatible with Next.js 16. |
| shadcn/ui | CLI v4 (March 2026) | Component primitives | Not a dependency — components are copied into the project, owned by you. Built on Radix UI. Kanban board, data table, form, dialog, dropdown — all exist. Tailwind v4 compatible. `npx shadcn@latest` installs current CLI. |

**Install:**
```bash
npm install tailwindcss @tailwindcss/postcss
npx shadcn@latest init
```

**Confidence:** HIGH — Verified against [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) and [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide).

---

## Database and Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase (@supabase/supabase-js) | 2.101.1 | Postgres database + auth + realtime | Correct choice. Row-level security, edge functions, and auth are all ready when the product needs them. V1 has no auth per PROJECT.md, but Supabase is wired for it. |
| @supabase/ssr | latest | Next.js App Router cookie auth | Required for correct session management in Server Components. Creates separate client instances for Server vs Client contexts. Use `supabase.auth.getUser()` only in Server Components. |

**Install:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Data model approach:** Start with a single `tasks` table (id, title, category, due_date, notes, completed, created_at, user_id). Add `research_pages` and `comparison_boards` tables in subsequent phases. Keep schema minimal until each feature is proven.

**Confidence:** HIGH — Verified against [Supabase npm package](https://www.npmjs.com/package/@supabase/supabase-js) and [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

---

## AI Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ai (Vercel AI SDK) | 6.0.143 | Streaming text, tool calls, agents | Current major version. streamText for research summaries. generateText for card copy. generateObject for structured comparison data. LLM-agnostic — swap providers without rewriting callers. |
| @ai-sdk/anthropic | latest | Anthropic Claude provider | Direct Anthropic API for local dev. |
| @ai-sdk/vercel | 2.0.39 | Vercel AI Gateway provider | Preferred for production. Access claude-sonnet-4-5 (or newer) via Vercel AI Gateway. Handles rate limits, logging, observability. |

**Model selection:** Always query the gateway for the current model list before hardcoding:
```bash
curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '[.data[] | select(.id | startswith("anthropic/")) | .id] | reverse | .[]'
```
At time of research: `anthropic/claude-opus-4` and `anthropic/claude-sonnet-4-5` are available. Use sonnet-class for research summaries and card copy (cost-effective). Use haiku-class for real-time streaming (lowest latency).

**Install:**
```bash
npm install ai @ai-sdk/anthropic @ai-sdk/vercel
```

**Confidence:** HIGH for SDK version — verified at [ai npm](https://www.npmjs.com/package/ai). MEDIUM for model IDs — always fetch current list from gateway at build time.

---

## OG Image Generation (WhatsApp Previews)

This is a critical missing piece the founder hasn't specified. WhatsApp's crawler scrapes og:image at share time. The image must be a static URL returning a real PNG.

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| next/og (ImageResponse) | built into Next.js | Dynamic OG images | Ships with Next.js — zero extra install. Generates PNG via Satori + Resvg at the Edge runtime. Cacheable on Vercel CDN. Create `app/og/route.tsx` per page type. |

**WhatsApp requirements:**
- Recommended: 1200 × 630px (1.91:1 aspect ratio)
- Minimum: 300px wide (below 100px = no preview)
- Format: PNG, JPG, or WebP
- Max file size: 600KB
- WhatsApp crawler does NOT execute JavaScript — og:image must be a direct image URL, not a JS-rendered tag

**Implementation pattern per shareable page:**
```tsx
// app/tasks/[id]/opengraph-image.tsx  (Next.js auto-registers as og:image)
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage({ params }) {
  return new ImageResponse(
    <div style={{ display: 'flex', ... }}>
      {/* Card design using flexbox only — Satori ignores CSS Grid */}
    </div>
  )
}
```

**Critical Satori limitation:** Satori supports flexbox and absolute positioning ONLY. No CSS Grid, no `calc()`, no CSS variables. Keep OG image layouts flex-based. This is a compile-time gotcha that breaks silently.

**Confidence:** HIGH — [Vercel OG docs](https://vercel.com/docs/og-image-generation), [Next.js ImageResponse docs](https://nextjs.org/docs/app/api-reference/functions/image-response).

---

## AI Image Generation (Greeting Cards)

For greeting card generation, the product needs AI-generated images based on prompts (wedding themes, couple initials, floral designs). This is not covered by the Claude text models.

**Recommended: fal.ai**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @fal-ai/client | latest | AI image generation for cards | Best for serverless Next.js: sub-second cold starts, predictable per-image pricing ($0.01-$0.08 per 1024×1024), Vercel-native integration. Supports Flux.1 (state-of-the-art quality) and Flux Schnell (fast/cheap). 985 endpoints available. |
| @fal-ai/server-proxy | latest | Proxy layer for Next.js | Prevents API key exposure. Create `app/api/fal/proxy/route.ts` re-exporting `createRouteHandler`. Required for production security. |

**Install:**
```bash
npm install @fal-ai/client @fal-ai/server-proxy
```

**Model selection for cards:**
- `fal-ai/flux/schnell` — Fast, cheap, good for iteration. Use as default.
- `fal-ai/flux-pro/v1.1` — Higher quality for final card renders.
- Do NOT use Stable Diffusion variants — quality gap is significant vs Flux in 2025/2026.

**Alternatives considered:**

| Option | Why Not |
|--------|---------|
| OpenAI DALL-E 3 | Higher cost per image, slower, less flexible for wedding aesthetic fine-tuning |
| Replicate | Per-second GPU billing makes cost unpredictable for a personal tool. No latency advantage over fal.ai |
| Stability AI API | More complex setup, less community tooling for Next.js, quality similar to Flux |
| Calling Claude for images | Claude cannot generate images directly — only text |

**Confidence:** MEDIUM — fal.ai pricing and model availability verified via [fal.ai pricing comparison](https://pricepertoken.com/image) and [fal.ai Next.js integration docs](https://docs.fal.ai/model-apis/integrations/nextjs). Flux Schnell quality advantage over SDXL is MEDIUM confidence based on community consensus, not benchmarks.

---

## Card Download and Sharing

For users to download and share greeting cards on WhatsApp:

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| html-to-image | latest (npm) | Convert React card component to downloadable PNG | Simpler API than html2canvas. Uses `toPng(ref.current)` → data URL → download anchor. Works in Next.js App Router as a client component. |

**Alternative considered:** html2canvas — older, more battle-tested but known Next.js image compatibility issues (next/image optimization breaks cross-origin capture). html-to-image has cleaner output for CSS-heavy designs.

**Pattern:**
```tsx
import { toPng } from 'html-to-image'

const cardRef = useRef<HTMLDivElement>(null)

async function downloadCard() {
  const dataUrl = await toPng(cardRef.current, { quality: 0.95 })
  const link = document.createElement('a')
  link.download = 'wedding-card.png'
  link.href = dataUrl
  link.click()
}
```

**Sharing to WhatsApp:** Use the Web Share API (native browser API, no library needed) with fallback to a deep link. The Web Share API triggers the native share sheet on iOS/Android, which includes WhatsApp.
```tsx
if (navigator.share) {
  await navigator.share({ title, text, url })
} else {
  window.open(`https://wa.me/?text=${encodeURIComponent(url)}`)
}
```

**Confidence:** MEDIUM — html-to-image approach verified by community patterns. Known issue: Next.js `<Image>` components may not capture correctly inside html-to-image — use standard `<img>` tags inside cards that will be downloaded.

---

## Task Management UI

For the task list and drag-to-reorder (future enhancement):

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shadcn/ui (built-in) | CLI v4 | Task cards, checkboxes, badges, dialogs | Use shadcn's Checkbox, Badge, Card, Dialog, Select components. No extra dependency needed for the list view. |
| @dnd-kit/core + @dnd-kit/sortable | ^6.x | Drag-and-drop reordering (Phase 2+) | The shadcn kanban board example uses dnd-kit. Lightweight (~10kb), keyboard accessible, touch-friendly. Only add this when drag-to-reorder is actively built — not Phase 1. |

**Confidence:** HIGH for shadcn task components. MEDIUM for dnd-kit version (verified at [npm](https://www.npmjs.com/package/@dnd-kit/core), but @dnd-kit/react 0.3.x is still pre-1.0).

---

## Deployment

| Technology | Purpose | Why |
|------------|---------|-----|
| Vercel | Hosting + CDN + Edge Functions + OG image caching | Zero-config for Next.js. OG images auto-cached on Vercel CDN. Edge runtime available for ImageResponse. Supabase environment variables via Vercel project settings. Free tier is sufficient for a personal tool. |

**Environment variables needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
FAL_KEY=
ANTHROPIC_API_KEY=          # local dev only
VERCEL_AI_GATEWAY_TOKEN=    # production via @ai-sdk/vercel
```

---

## Alternatives Considered (Full Stack)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 App Router | Remix, Astro | Remix has good DX but smaller ecosystem. Astro is wrong for dynamic data (tasks, real-time). Next.js has best Vercel integration. |
| Database | Supabase | PlanetScale, Neon, Firebase | PlanetScale deprecated free tier. Neon is excellent but adds auth work. Firebase is overkill for Postgres-native use case. |
| AI text | Vercel AI SDK + Claude | Direct Anthropic SDK | Direct SDK couples to one provider. Vercel AI SDK is provider-agnostic and handles streaming, tool calls, structured output with one API. |
| AI images | fal.ai | Replicate, OpenAI | Replicate cost unpredictable. OpenAI DALL-E 3 more expensive, less flexible. fal.ai best dev UX for Next.js. |
| OG images | next/og (ImageResponse) | Puppeteer/headless Chrome | Puppeteer has cold-start latency of 2-10 seconds on serverless. next/og is sub-100ms. |
| Styling | Tailwind v4 + shadcn | Chakra UI, MUI | Chakra/MUI ship opinionated design that fights customization. Tailwind+shadcn gives full ownership. |

---

## Full Installation Command

```bash
# 1. Scaffold
npx create-next-app@latest ppr --typescript --tailwind --app --eslint

# 2. shadcn
cd ppr && npx shadcn@latest init

# 3. Supabase
npm install @supabase/supabase-js @supabase/ssr

# 4. Vercel AI SDK
npm install ai @ai-sdk/anthropic @ai-sdk/vercel

# 5. fal.ai (for card image generation)
npm install @fal-ai/client @fal-ai/server-proxy

# 6. Card download
npm install html-to-image

# 7. Drag-and-drop (defer to Phase 2+)
# npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Missing Pieces (Not in Founder's Original Stack List)

These are gaps the founder has not yet specified but are required for the stated requirements:

| Gap | Solution | Why Needed |
|-----|----------|------------|
| OG image generation | `next/og` (ImageResponse) — already in Next.js | Every shareable page needs a server-rendered og:image URL. WhatsApp won't generate a preview without it. |
| AI image generation | fal.ai + Flux Schnell | The greeting card creator requires generative images. Claude (text model) cannot produce images. |
| Card download | html-to-image | Users need to save cards as PNG to share on WhatsApp (Web Share API can share URLs but not inline generated images). |
| WhatsApp sharing | Web Share API (native, no library) | Deep-link fallback via `wa.me/?text=` is the correct pattern. No library needed. |

---

## Sources

- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — verified Oct 2025
- [Next.js ImageResponse API](https://nextjs.org/docs/app/api-reference/functions/image-response) — official docs
- [Vercel OG Image Generation](https://vercel.com/docs/og-image-generation) — official docs
- [Supabase @supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — version 2.101.1 confirmed
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — official docs
- [AI SDK npm package](https://www.npmjs.com/package/ai) — version 6.0.143 confirmed
- [AI SDK 6 announcement](https://vercel.com/blog/ai-sdk-6) — Vercel blog
- [Vercel AI Gateway models](https://vercel.com/docs/ai-gateway/models-and-providers) — official docs
- [fal.ai Next.js integration](https://docs.fal.ai/model-apis/integrations/nextjs) — official docs
- [Vercel fal integration](https://vercel.com/docs/ai/fal) — Vercel docs
- [AI image API comparison 2026](https://www.teamday.ai/blog/ai-image-video-api-providers-comparison-2026) — third-party benchmark
- [WhatsApp link preview guide 2026](https://www.ogrilla.com/blog/whatsapp-link-preview-guide) — comprehensive spec reference
- [shadcn/ui changelog](https://ui.shadcn.com/docs/changelog) — CLI v4 March 2026
- [Tailwind CSS upgrade guide](https://tailwindcss.com/docs/upgrade-guide) — v4 CSS-first config
- [dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) — official package
