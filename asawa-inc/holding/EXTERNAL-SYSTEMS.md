# Asawa Inc. — External Systems Registry

## Authority

This file is owned by **Asawa (holding company)**. 
Companies can use registered systems freely. Adding new external systems requires registration here first.

---

## Why This Exists

Every external API, database, deployment platform, and third-party service the portfolio depends on is registered here. This provides:
- **Visibility**: One place to see all external dependencies
- **Risk management**: If a provider goes down or changes pricing, we know who's affected
- **Onboarding**: New companies see what's already available
- **Cost tracking**: Aggregate spend across the portfolio

---

## Registered External Systems

### Deployment & Hosting

| System | Purpose | Used By | Auth | Free Tier | Cost |
|--------|---------|---------|------|-----------|------|
| **Vercel** | Web app hosting, CDN, serverless | Maze, PPR | GitHub integration | Hobby (free) | $0 |
| **Expo / TestFlight** | iOS app distribution | DayFlow | Apple Developer | Expo Go free | $99/yr (Apple) |

### Databases

| System | Purpose | Used By | Auth | Free Tier | Cost |
|--------|---------|---------|------|-----------|------|
| **Supabase** | Postgres + Auth + Edge Functions | DayFlow, PPR, Maze | API key + service role | 2 free projects | $0 (free tier) |

### AI Providers

See `AI-PROVIDERS.md` for the full AI provider registry.

### Content APIs (Maze-specific, available to all)

| System | Purpose | Used By | Auth | Free Tier | Rate Limit |
|--------|---------|---------|------|-----------|------------|
| **JokeAPI (sv443)** | Jokes (6 categories) | Maze | None | Unlimited | 60 RPM |
| **icanhazdadjoke** | Dad jokes + search | Maze | None | Unlimited | Reasonable use |
| **Official Joke API** | Random jokes | Maze | None | Unlimited | None |
| **HumorAPI** | Jokes + memes (50K+) | — | API key | Limited | Tier-based |

### Analytics & Monitoring

| System | Purpose | Used By | Auth | Free Tier | Cost |
|--------|---------|---------|------|-----------|------|
| **PostHog** | Product analytics | — (planned) | API key | 1M events/month | $0 |
| **Vercel Analytics** | Web vitals, traffic | Maze, PPR | Built-in | Included | $0 |

### Communication & Sharing

| System | Purpose | Used By | Auth | Free Tier |
|--------|---------|---------|------|-----------|
| **WhatsApp Web Share API** | Content sharing | Maze | None | Free (browser API) |
| **WhatsApp Deep Links** | Fallback sharing | Maze | None | Free (wa.me) |

### Design & Media

| System | Purpose | Used By | Auth | Free Tier |
|--------|---------|---------|------|-----------|
| **fal.ai** | AI image generation | PPR (planned) | API key | Pay per image |
| **next/og** | OG image generation | Maze, PPR | Built-in | Free (Next.js) |

---

## Security Policies (LOCKED)

1. **Register before using.** No external API calls to unregistered systems.
2. **API keys in env vars only.** Never in code, never in client bundles.
3. **Rate limit awareness.** Document rate limits. Implement backoff.
4. **Fallback plan.** Every critical external system must have a fallback documented.
5. **No PII to external systems** without explicit data processing agreement.

---

## Dependency Risk Matrix

| Risk | Systems Affected | Mitigation |
|------|-----------------|------------|
| Supabase downtime | All companies | Local-first design (DayFlow has SQLite) |
| Vercel outage | Maze, PPR | Static export fallback |
| AI provider rate limit | All AI features | Multiple providers, fallback models |
| Content API shutdown | Maze | Multiple content sources, internal DB |
| WhatsApp API change | Maze sharing | Fallback to clipboard copy |

---

## Adding a New External System

1. **Document it here** — name, purpose, auth, costs, rate limits
2. **Security check** — does it meet the security policies?
3. **Assign to company** — which company will use it first?
4. **Add env vars** — document the required environment variables
5. **Commit** — this file's git history is the audit trail

---

## Cross-Company Sharing

When one company discovers a useful external system, it gets registered here so other companies can benefit:

- Maze discovered JokeAPI → registered → available to any future humor product
- PPR will use fal.ai → registered → available to any company needing AI images
- DayFlow uses Supabase → registered → became the default for all companies

This is how the portfolio compounds: each company's infrastructure investment benefits the next.
