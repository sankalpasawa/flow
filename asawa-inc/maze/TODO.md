# Maze — TODO

## P0: Ship These to Test the Bet

Build order follows dependency chain: infrastructure → content → feed → sharing → personalization → AI.

### Infrastructure
- [x] 1. Scaffold Next.js 16 project with Tailwind v4 + shadcn/ui
- [ ] 2. Set up Supabase project + create database tables (run supabase-migration.sql)
- [x] 3. Deploy to Vercel — **https://maze-app-fawn.vercel.app**

### Content Pipeline
- [x] 4. Build content ingestion API route (/api/ingest) — JokeAPI + icanhazdadjoke + Official Joke API
- [ ] 5. Seed database with 500+ jokes (run /api/ingest once DB is connected)
- [ ] 6. Set up Vercel Cron to run ingestion every 6 hours

### Feed
- [x] 7. Build feed API route (/api/feed) — paginated, cursor-based, category filter
- [x] 8. Build feed UI — infinite scroll, joke cards (text + image), category chips
- [x] 9. Build individual joke page (/j/[id]) — for shared links

### Sharing (the viral loop)
- [x] 10. Build OG image generation (/j/[id]/opengraph-image) — next/og ImageResponse
- [x] 11. Add server-rendered OG meta tags on /j/[id] pages
- [x] 12. Add Share button — Web Share API with WhatsApp fallback (wa.me/?text=)
- [ ] 13. Test WhatsApp preview card renders correctly (needs real Supabase)

### Personalization
- [x] 14. Build session management (anonymous UUID in localStorage → sessions table)
- [x] 15. Add Like/Dislike buttons on feed cards
- [x] 16. Build reaction API (/api/react) — log interaction, update content score
- [x] 17. Update feed algorithm to weight categories based on user preferences

### AI Joke Generation
- [ ] 18. Build AI jokes section UI (topic input + generated jokes display)
- [ ] 19. Build AI generation API (/api/generate) — Vercel AI SDK + Claude, streamText
- [ ] 20. Add like/dislike on AI-generated jokes, save good ones to content DB

### Optional Auth
- [ ] 21. Add optional sign-up/sign-in (Supabase Auth — email/password or magic link)
- [ ] 22. Link auth user to existing session (preserve preferences)

### Polish
- [ ] 23. Mobile-responsive layout (test on iPhone, Android Chrome)
- [ ] 24. Privacy policy page
- [ ] 25. Add PostHog analytics (before 100 users)

---

## P1: After the Bet is Validated

- [ ] Deep linking (shared joke → that joke → feed continues from there)
- [ ] Push notifications via PWA (daily joke)
- [ ] User-submitted jokes (with moderation queue)
- [ ] Hindi/regional language joke categories
- [ ] Dark mode / light mode toggle
- [ ] "Joke of the day" feature
- [ ] Category-specific shareable feeds (maze.app/c/dad-jokes)

## P2: Scale

- [ ] Native iOS app (Expo)
- [ ] Native Android app
- [ ] Meme creator tool
- [ ] Creator profiles + following
- [ ] Monetization (native ads between feed items)
- [ ] SEO optimization for joke pages
