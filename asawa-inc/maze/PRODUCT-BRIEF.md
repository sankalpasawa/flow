# Maze — Product Brief (Shape)

## Exercise A: PR/FAQ

**FOR** Priya, a busy doctor in India who wants a quick laugh between shifts,
**MAZE** IS A never-ending humor feed
**THAT** delivers curated jokes, memes, dark humor, and dad jokes — all shareable with one tap to WhatsApp.
**UNLIKE** 9GAG (toxic, ad-heavy) or Instagram (algorithm buries jokes in lifestyle content),
**MAZE** is humor-only, clean, personalized to your taste, and designed so every shared link pulls the recipient back into the feed.

### FAQ

**Q: Why not just use Reddit or 9GAG?**
A: Reddit is a discussion platform, not a laugh feed. 9GAG is full of ads, toxicity, and recycled content. Maze is purpose-built: open → laugh → share → close. No comments section, no politics, no noise.

**Q: Where does the content come from?**
A: Three sources: (1) curated from Reddit, joke APIs, and meme databases, (2) AI-generated jokes based on trending topics, (3) eventually user-submitted content. All filtered for quality.

**Q: How is this different from WhatsApp forwards?**
A: WhatsApp forwards are random, low-quality, and arrive at someone else's pace. Maze is an infinite, personalized stream you control. And when you share from Maze, the recipient gets a real link preview and lands in the feed — not a forwarded image.

**Q: How do you make money?**
A: Not a V1 concern. Future options: tasteful native ads between feed items, premium ad-free tier, brand humor partnerships. The bet is retention first, monetization later.

---

## Exercise B: Feature Carve (Market-Informed)

| # | Feature | P0? | Market Signal | Build/Buy |
|---|---------|-----|--------------|-----------|
| 1 | Infinite scrollable humor feed (text jokes + memes/images) | YES | Core product. 9GAG/Reddit prove feed format works. | Build (custom feed component) |
| 2 | Category sections (dad jokes, dark humor, memes, one-liners, Indian humor) | YES | Reddit's subreddit model proves category browsing drives engagement. JokeAPI has categories built in. | Build (use API categories as base) |
| 3 | WhatsApp share with OG preview (shared link opens feed) | YES | Nobody does this well. This is the viral loop. WhatsApp is the distribution channel. | Build (next/og for OG images, Web Share API) |
| 4 | Like/Dislike personalization | YES | "People can type I like this / I don't like this" — founder requirement. 9GAG has upvote but no personalization. | Build (simple preference model) |
| 5 | AI joke generation (type a topic, get jokes) | YES | Founder requirement. LaughGen/Punchlines.ai prove demand. But none are integrated into a feed. | Build (LLM API call + UI) |
| 6 | Content aggregation pipeline (Reddit + JokeAPI + HumorAPI + icanhazdadjoke) | YES | Free APIs exist. This is the content engine. | Buy (APIs) + Build (aggregation layer) |
| 7 | Optional authentication (save preferences across devices) | YES | Founder requirement. Keep anonymous-first, auth optional. | Buy (Supabase Auth) |
| 8 | Mobile-optimized responsive web | YES | Founder requirement — web link opened from WhatsApp on phone. | Build (Next.js + Tailwind) |
| 9 | Deep linking (shared joke opens that specific joke, then continues feed) | NO — P1 | Would boost retention but not needed to test the bet. | Build later |
| 10 | User-submitted jokes | NO — P1 | Needs moderation. Add after community forms. | Build later |
| 11 | Push notifications (daily joke) | NO — P2 | Retention driver but needs native app or PWA. | Build later |
| 12 | Meme creator tool | NO — P2 | MemeChat territory. Not core to consumption bet. | Build later |
| 13 | Comments / reactions | NO — NEVER (V1) | 9GAG's toxic comments are a cautionary tale. Keep it clean. | Skip |

**P0 count: 8 features** — one over the 7 limit. But #6 (content pipeline) and #8 (mobile web) are infrastructure, not features. Effectively 6 user-facing features. **PASS.**

---

## Exercise C: Risk Map (Market-Informed)

| # | Risk | Likelihood | Market Evidence | Mitigation |
|---|------|-----------|----------------|------------|
| 1 | AI-generated jokes aren't funny enough | HIGH | AI joke generators (LaughGen etc.) get mixed reviews. Humor is hard for AI. | Use AI as supplement, not primary source. Curated content (Reddit, APIs) is the backbone. AI jokes get quality-filtered before entering feed. |
| 2 | Content runs out / feels repetitive | MEDIUM | 9GAG's biggest complaint is recycled memes. Reddit has infinite content but API access is rate-limited. | Multiple content sources (5+ APIs). AI generation for infinite supply. Track "seen" jokes per user to avoid repeats. |
| 3 | WhatsApp sharing loop doesn't work (people don't click links) | MEDIUM | WhatsApp forwards are ubiquitous in India, but links compete with images. | OG preview must be compelling (show the joke in the preview). Make the preview itself funny so people WANT to click. |
| 4 | No retention — people use it once and forget | HIGH | Core bet risk. Most content apps fail on D7 retention. | Personalization (like/dislike). Daily fresh content. Eventually push notifications. Make the first session magical. |
| 5 | Content moderation at scale | LOW (V1) | 9GAG's toxicity problem. But V1 has no user-generated content. | V1: curated sources only. Add moderation when UGC is enabled. |
| 6 | Reddit API pricing changes kill content source | MEDIUM | Reddit raised API prices in 2023, killed many third-party apps. | Don't depend solely on Reddit. Use multiple APIs. Build internal content database that grows over time. |
| 7 | Legal issues with meme/joke content | LOW | Jokes are generally not copyrightable. Meme images are fair use in most cases. | Attribute sources. Don't host copyrighted images — link to originals or use public domain. |

---

## Exercise D: Success Metrics

| Metric | Target | How to Measure | When to Check |
|--------|--------|---------------|---------------|
| **D1 retention** (the bet) | 30%+ | User returns within 24 hours of first visit | After 100 unique visitors |
| **D7 retention** | 10%+ | User returns within 7 days | After 2 weeks live |
| **Share rate** | 15%+ of sessions include a share action | Track share button taps / total sessions | Daily |
| **Viral coefficient** | >0.5 (each user brings 0.5 new users via shares) | Track shared links → new unique visitors | Weekly |
| **Session duration** | 3+ minutes average | Time from feed open to last scroll/interaction | Daily |
| **Feed scroll depth** | 20+ items per session | Items scrolled past / session | Daily |
| **Like/dislike engagement** | 10%+ of items get a reaction | Reactions / items viewed | Daily |
| **Guardrail: bounce rate** | <50% | Single-page visits with <10s duration | On every deploy |
