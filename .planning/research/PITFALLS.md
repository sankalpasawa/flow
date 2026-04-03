# Domain Pitfalls

**Domain:** Wedding command center — task management, AI research, comparison boards, greeting card creator, WhatsApp-shareable URLs
**Researched:** 2026-04-03
**Confidence:** HIGH for WhatsApp/OG pitfalls (multiple verified sources), HIGH for Supabase security, HIGH for AI image gap, MEDIUM for scope creep patterns

---

## Critical Pitfalls

Mistakes that cause rewrites, broken features on the wedding day, or days of debugging.

---

### Pitfall 1: Claude Cannot Generate Images — Greeting Card Feature Needs a Different Provider

**What goes wrong:** The PROJECT.md specifies "Claude via Vercel AI SDK for research summarization and card generation." Claude (Anthropic's API) does not support image generation as of 2026. Calling it for image output returns only text — SVG code at best, no raster images. Building the greeting card creator assuming Claude generates images leads to a non-functional feature discovered at implementation time.

**Why it happens:** Claude's API is text-in, text-out. The Vercel AI SDK wraps multiple providers; Claude and image generation are separate capabilities that happen to live in the same SDK.

**Consequences:** Greeting card feature either ships as SVG-only (limited visual quality) or requires a mid-build provider swap to fal.ai, Replicate, or OpenAI's gpt-image-1. Either way, unexpected complexity and time cost.

**Prevention:** Decide now. Options with Vercel AI SDK:
- `fal.ai` — fastest inference for Stable Diffusion models, first-party Vercel integration, official template exists
- `@ai-sdk/openai` with `openai.image('dall-e-3')` — reliable but slow and expensive at $0.04/image
- `@ai-sdk/replicate` — widest model selection, pay-per-use

Recommend: Use fal.ai for card generation. Use Claude only for text (research summaries, card copy suggestions). Keep the providers separate from day one.

**Detection warning sign:** Any code that calls `anthropic.messages.create()` and expects an image URL in the response.

**Phase:** Address in Phase 1 (foundation) when wiring the AI SDK. Do not defer.

---

### Pitfall 2: WhatsApp OG Image Previews Have Strict, Invisible Size Constraints

**What goes wrong:** The og:image renders correctly in browsers and passes og:image validators, but WhatsApp silently drops the preview. The most common cause is the og:image file exceeding 300KB. WhatsApp's crawler fetches the image before showing a preview and silently fails at size thresholds with no error message.

**Why it happens:** WhatsApp does not expose crawler errors. The og:image URL is technically valid but the crawler abandons it. Next.js `@vercel/og` ImageResponse can produce PNG images well over 300KB with complex designs.

**Consequences:** Shared URLs look like plain text links in WhatsApp. The entire distribution channel (WhatsApp sharing) stops working on real devices, discovered only when testing on an actual phone.

**Prevention:**
1. Keep og:image under 300KB. Measure before shipping.
2. Use Next.js `ImageResponse` with minimal design — flat colors, no gradients, no embedded photos.
3. Provide two image entries: `1200x630` (primary) and `400x400` (fallback). WhatsApp picks the smaller one if the primary fails.
4. Always use absolute HTTPS URLs. `metadataBase` must be set in `layout.tsx` to a production domain — relative paths break all OG tags.
5. Add og:image routes to `robots.txt` Allow list so crawlers can reach them.

**Detection warning sign:** OG preview works in `ogpreview.app` or Facebook Sharing Debugger but fails when pasted into WhatsApp. This is almost always a size or URL issue.

**Phase:** Phase 1 (sharing infrastructure). Set up a real WhatsApp preview test on day one. Do not build 10 pages then discover previews are broken.

---

### Pitfall 3: WhatsApp Preview Cache Has No Official Invalidation

**What goes wrong:** A shared URL is sent in WhatsApp with the wrong title/image. The og tags are fixed and redeployed. But the old preview persists for days or weeks in every chat where the link was already shared — there is no official API to bust WhatsApp's preview cache.

**Why it happens:** WhatsApp caches link previews on its servers. Facebook provides a Sharing Debugger to force re-scrape; WhatsApp provides nothing equivalent.

**Consequences:** Comparison boards or research pages shared during planning have stale titles. Guest-facing greeting card links previewed incorrectly cannot be fixed retroactively in existing chats.

**Prevention:**
- Append a version query parameter (`?v=2`) to create a URL WhatsApp treats as new. The app must handle this gracefully (query params should not affect page rendering).
- For mutable content (comparison boards, task summaries), include the core information in the og:title itself so a stale image is still informative.
- For guest-facing cards: generate a new unique URL (`/card/[uuid]`) per share rather than reusing the same URL. This ensures each reshare gets a fresh preview.

**Detection warning sign:** Fixed og tags not showing up even after redeployment when tested from an existing WhatsApp thread.

**Phase:** Phase 2 (shareable pages). Design URL scheme with query param versioning from the start.

---

### Pitfall 4: No-Auth + Supabase anon Key = Public Write Access If RLS Is Skipped

**What goes wrong:** The app has no auth (intentional for V1). The Supabase anon key is visible in client-side JS. If RLS is not explicitly enabled on every table, any person who extracts the anon key from browser devtools can INSERT, UPDATE, or DELETE all wedding data. This is not theoretical — Supabase anon key exposure is a documented attack vector.

**Why it happens:** Supabase's anon key is intentionally public — it is safe only when combined with Row Level Security. Without RLS, the anon key is a master key. Many developers enable RLS on auth-protected tables but forget to configure it for "public" tables because they think "no auth = nothing to protect."

**Consequences:** Tasks deleted, comparison boards cleared, or garbage data inserted. No way to detect or recover unless Supabase backups are configured. In 93 days before a wedding, data corruption is a critical event.

**Prevention:**
- Enable RLS on all tables immediately when creating them.
- For read-only public access: `CREATE POLICY "public read" ON table FOR SELECT USING (true);`
- For write access: use a service-role key in server-side Route Handlers or Server Actions only. Never expose it client-side.
- The pattern: all writes go through Next.js Route Handlers (server-side, service role) → Supabase. No direct client-to-Supabase writes.
- Use Supabase CLI migrations (`supabase db diff`, `supabase db push`) to version-control schema and RLS policies.

**Detection warning sign:** Any Supabase client initialized in a client component with write permissions and no RLS policy on the target table.

**Phase:** Phase 1 (Supabase setup). RLS and server-only write pattern must be established before the first table is created.

---

### Pitfall 5: Vercel Free Plan Serverless Function Timeout Kills AI Research Summaries

**What goes wrong:** AI research summary generation calls an LLM and takes 8-25 seconds depending on prompt length and model load. Vercel's free plan defaults to a 10-second function timeout. The function times out mid-response, returning a 504 to the user. Streaming is not configured, so the user sees a loading spinner then an error.

**Why it happens:** Serverless function timeouts default to 10 seconds on Vercel Hobby. LLM calls with long context routinely exceed this. Non-streaming AI calls block until the full response arrives.

**Consequences:** Research summary pages never work. Users get 504 errors. The AI feature that is a core differentiator is non-functional on the free tier.

**Prevention:**
- Use Vercel AI SDK streaming (`streamText`) for all AI responses — streams begin returning within 1-2 seconds and stay alive as tokens arrive, avoiding the timeout.
- Set `maxDuration` on the Route Handler: `export const maxDuration = 60;` (requires Vercel Pro for values above 10s, but streaming bypasses the issue on any tier).
- Test AI responses locally with `next dev` and artificially slow responses before deploying.
- For greeting card image generation: images from fal.ai typically complete in 3-8 seconds — should stay within limits but monitor.

**Detection warning sign:** AI calls work locally (`next dev` has no timeout) but fail with 504 on Vercel deployment.

**Phase:** Phase 3 (AI features). Use streaming from the first AI route, not retrofitted later.

---

## Moderate Pitfalls

Issues that cause friction, bugs, or technical debt but not catastrophic failure.

---

### Pitfall 6: Scope Creep Against a Hard Wedding Deadline

**What goes wrong:** The wedding is July 5-6, 2026. That is 93 days. Each new feature added competes directly with using the tool for its actual purpose. The risk is building features instead of planning the wedding.

**Why it happens:** The founder is a full-stack developer. Building is easier than planning. "Just add a budget tracker" takes a day and feels productive.

**Prevention:**
- Lock the V1 feature set now (as PROJECT.md does). Treat any addition as requiring explicit removal of something else.
- Features not in `PROJECT.md` Active list go to a "Later" backlog, not the sprint.
- Time-box every phase. If a feature takes more than 2x estimated time, cut it from V1.
- The primary success metric is: "Is the wedding well-organized?" not "Is the app feature-complete?"

**Warning sign:** Working on the fourth comparison board component when task list hasn't been tested with real data yet.

**Phase:** Ongoing. Roadmap must enforce sequential shipping: task management usable before AI features are built.

---

### Pitfall 7: Dynamic OG Image Generation Requires metadataBase or All URLs Break

**What goes wrong:** `generateMetadata` returns `{ openGraph: { images: ['/og/page-name.png'] } }`. Relative URLs in OG tags are not resolved by social crawlers. WhatsApp, iMessage, and Telegram all receive a relative path, attempt to fetch it, fail, and show no preview. This is easy to miss because it works in browser tab previews but fails in social sharing contexts.

**Why it happens:** Next.js App Router does not automatically convert OG image paths to absolute URLs unless `metadataBase` is set in `layout.tsx`. This is a known footgun that affects many production deployments.

**Consequences:** All shareable links show no preview image, making the WhatsApp sharing feature look broken even though the metadata is technically present.

**Prevention:**
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-app.vercel.app'
  ),
}
```
Set `NEXT_PUBLIC_SITE_URL` as a Vercel environment variable pointing to the production domain. Do not hardcode.

**Warning sign:** OG tags show relative paths (`/og/...`) in the page source's `<meta property="og:image">` tag.

**Phase:** Phase 1 (foundation). Add `metadataBase` before writing the first page.

---

### Pitfall 8: Supabase Connection Pooling Not Configured for Serverless

**What goes wrong:** Each Vercel serverless function invocation opens a direct Postgres connection (port 5432). Under moderate traffic or rapid function cold starts, the "too many connections" error surfaces. Supabase free tier allows 30 direct connections.

**Why it happens:** Serverless functions spin up and down independently; connection state is not shared between invocations. Direct Postgres connections accumulate faster than they release.

**Prevention:** Use Supabase's connection pooler (Suvisor) with port 6543 instead of 5432. The connection string is available in the Supabase project settings under "Connection pooling." Configure this from the start — changing the connection string later requires updating all environment variables and redeploying.

**Warning sign:** `FATAL: remaining connection slots are reserved for non-replication superuser connections` errors in Vercel logs.

**Phase:** Phase 1 (Supabase setup). Use the pooler URL from day one.

---

### Pitfall 9: Comparison Board Images Loaded from External URLs Fail OG Previews

**What goes wrong:** Comparison boards store product images as external URLs (scraped from shopping sites or pasted from WhatsApp). When the comparison board's OG image is dynamically generated using these external URLs, `@vercel/og`'s ImageResponse fails silently or throws if the external image is unreachable, returns a redirect, or requires auth. The OG image endpoint returns an error, breaking the page's preview card.

**Why it happens:** `@vercel/og` fetches images via `fetch()` at render time. External image URLs from shopping sites frequently rotate, expire, or block server-side fetches. The failure is not visible in development because images are usually accessible.

**Prevention:**
- For OG image generation, use only locally stored images or images with guaranteed availability (Supabase Storage).
- Design comparison board OG images to use text-only or category icons rather than product images.
- Add a `try/catch` around external image fetches in the OG endpoint with a fallback to a placeholder.

**Warning sign:** OG image endpoint returns 500 errors in Vercel Functions logs when specific comparison pages are shared.

**Phase:** Phase 2 (comparison boards + sharing).

---

## Minor Pitfalls

---

### Pitfall 10: shadcn/ui Table Components Are Not Mobile-Optimized by Default

**What goes wrong:** Comparison boards are built using shadcn's `Table` component. On a 375px mobile screen (the most common WhatsApp recipient viewport), 4-column comparison tables overflow horizontally without user-obvious scroll affordance. Recipients opening shared comparison links on phones cannot see all columns.

**Prevention:** Wrap comparison tables in a horizontal scroll container and add a subtle scroll hint or shadow. Alternatively, use a card-stack layout on mobile (stacked cards instead of columns) and reserve the table layout for desktop.

**Warning sign:** Comparison board looks correct in browser devtools mobile emulation but columns are cut off on a real iPhone (devtools emulation does not replicate touch scroll behavior accurately).

**Phase:** Phase 2 (comparison boards). Test on a real phone before considering it done.

---

### Pitfall 11: Supabase Schema Changes Without Migrations Cause Silent Data Bugs

**What goes wrong:** Schema is modified manually in the Supabase dashboard (e.g., adding a `notes` column to tasks). The Next.js app is updated to read `notes`. But development and production Supabase projects are out of sync — a column exists in one but not the other. Queries return `null` silently instead of throwing, causing hard-to-trace bugs.

**Prevention:** Use the Supabase CLI from day one. All schema changes go through `supabase/migrations/`. Never use the dashboard for schema edits in production.

**Warning sign:** A field returns `null` in production but works locally.

**Phase:** Phase 1 (Supabase setup).

---

### Pitfall 12: AI Research Summaries Regenerated on Every Page Load

**What goes wrong:** Research pages call the LLM on every render. Each page load costs $0.002-0.01 and takes 5-15 seconds. Over a wedding planning period with frequent revisits, costs accumulate and UX degrades. If the AI call fails (rate limit, timeout), the entire research page fails to render.

**Prevention:**
- Store AI summaries in Supabase with a `generated_at` timestamp.
- Regenerate only when the user explicitly requests a refresh or when underlying research links change.
- Use Next.js `unstable_cache` or ISR with long revalidation intervals for research pages.
- The LLM call is a write operation (generates content to persist), not a read operation — treat it as such.

**Warning sign:** Network tab shows an AI API call on every research page visit.

**Phase:** Phase 3 (AI features). Design the caching layer before writing the first AI route.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Supabase initial setup | No RLS on tables, direct Postgres connections | Enable RLS immediately; use pooler port 6543 |
| First shareable page | Relative OG URLs, missing metadataBase | Set metadataBase in layout.tsx on day one |
| WhatsApp sharing | Image over 300KB, stale cache | Test on real device immediately; provide fallback 400x400 image |
| AI research summaries | 504 timeout on free tier | Use streaming from the start; add database caching |
| Greeting card creator | Claude cannot generate images | Decide on fal.ai or DALL-E before writing any card code |
| Comparison boards | External image URLs failing OG generation | Text-only OG images for comparison pages |
| Mobile views | Table overflow on comparison boards | Test on physical iPhone, not devtools emulation |
| Any new feature request | Scope creep against 93-day deadline | Gate against PROJECT.md Active list |

---

## Sources

- [WhatsApp OG Image Fix — Next.js (Fabian Rosenthal)](https://fabian-rosenthal.com/blog/fix-whatsapp-is-not-showing-the-open-graph-image)
- [WhatsApp Open Graph Specs & Preview (ogpreview.app)](https://ogpreview.app/open-graph/whatsapp/)
- [Next.js + Vercel OG Image Discussion #84537](https://github.com/vercel/next.js/discussions/84537)
- [Supabase Common Mistakes (hrekov.com)](https://hrekov.com/blog/supabase-common-mistakes)
- [Supabase Security — Exposed Anon Keys (stingrai.io)](https://www.stingrai.io/blog/supabase-powerful-but-one-misconfiguration-away-from-disaster)
- [Supabase anon Key Security (AuditYourApp)](https://www.audityour.app/guides/supabase-anonymous-key-security-guide)
- [Vercel Serverless Timeout Solutions (Inngest)](https://www.inngest.com/blog/how-to-solve-nextjs-timeouts)
- [Vercel Functions Limitations (official docs)](https://vercel.com/docs/functions/limitations)
- [AI SDK Rate Limiting Issue #7247](https://github.com/vercel/ai/issues/7247)
- [Vercel AI Gateway Image Generation](https://vercel.com/docs/ai-gateway/image-generation/ai-sdk)
- [fal.ai Provider for AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/fal)
- [Claude Cannot Generate Images (support.claude.ai)](https://support.claude.ai/en/articles/9002504-can-claude-produce-images)
- [Next.js OG Image Generation (official docs)](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [WhatsApp Link Preview Cache Guide (ogrilla.com)](https://www.ogrilla.com/blog/whatsapp-link-preview-guide)
- [Next.js Security Guide 2025 (turbostarter.dev)](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
