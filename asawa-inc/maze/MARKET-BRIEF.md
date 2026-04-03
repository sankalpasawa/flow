# Maze — Market Brief

## Competitors

```yaml
competitors:
  - name: "9GAG"
    what_they_do: "User-generated meme/humor feed. 200M+ monthly visits. Web + iOS + Android."
    strengths: "Massive content library, strong brand recognition, established community, category-based browsing"
    weaknesses: "Toxic comments, political extremism in comments, heavy ads, content theft from Reddit/TikTok, recycled memes, shadow banning, NFT/scam promotions. Trustpilot rating is terrible."
    business_model: "Advertising, 9GAG Pro subscription (ad-free)"

  - name: "Reddit (r/jokes, r/memes, r/dadjokes)"
    what_they_do: "Subreddits are the internet's largest joke/meme repositories. User-submitted, community-voted."
    strengths: "Infinite content, community curation via votes, niche humor subreddits, free"
    weaknesses: "Not mobile-optimized for quick consumption. Cluttered UI. You have to find the right subreddits. Comments often funnier than posts. Not designed as a 'laugh feed' — it's a discussion platform."
    business_model: "Advertising, Reddit Premium"

  - name: "MemeChat (India)"
    what_they_do: "Indian meme creation + sharing platform. Series A funded (Mumbai, 2019). Revenue ₹13.1Cr."
    strengths: "India-focused, meme creation tools, community of Indian meme creators"
    weaknesses: "Creator-focused (making memes), not consumer-focused (consuming humor). Small scale vs global players."
    business_model: "Brand partnerships, creator economy"

  - name: "ShareChat (India)"
    what_they_do: "Indian social media app. 160M+ users. 15 languages. User-generated content including memes."
    strengths: "Massive Indian user base, vernacular language support, video + image + text"
    weaknesses: "Not humor-specific — it's a general social network. Humor is mixed with news, devotional content, political content. No curation for 'just funny stuff.'"
    business_model: "Advertising"

  - name: "Instagram Meme Pages"
    what_they_do: "Hundreds of meme pages (e.g., @sarcasm_only, @theindianmemes). Consumed via Explore/Reels."
    strengths: "Already where users are. High production value. Huge reach."
    weaknesses: "Algorithm-driven — you can't just get jokes. Mixed with lifestyle, ads, shopping. No text jokes (image-only format). Can't share cleanly via WhatsApp (link previews are broken)."
    business_model: "Sponsorships, brand deals"

  - name: "Humor API / JokeAPI / icanhazdadjoke"
    what_they_do: "Free APIs serving random jokes. JokeAPI: categories (programming, dark, pun). HumorAPI: 50K jokes + 290K memes."
    strengths: "Free, well-structured, category-based, no auth required for basic use"
    weaknesses: "APIs, not consumer products. No feed, no personalization, no sharing. Raw infrastructure."
    business_model: "Freemium API tiers"

  - name: "AI Joke Generators (LaughGen, Punchlines.ai, Trickle)"
    what_they_do: "AI-powered joke generation tools. Input a topic, get jokes back."
    strengths: "Infinite content generation, topic-specific humor, some offer style control"
    weaknesses: "Single-use tools, not feeds. No community. No curation. AI humor quality varies wildly — most generated jokes aren't actually funny."
    business_model: "Freemium, ads"
```

## Market Gap

**Nobody has built a clean, dedicated humor FEED optimized for mobile WhatsApp sharing in India.**

The gap sits at the intersection of:
1. **Content aggregation** (Reddit has content but terrible mobile UX for casual consumption)
2. **AI generation** (tools exist but aren't integrated into a feed experience)
3. **WhatsApp virality** (no humor platform is designed for WhatsApp-first sharing with proper OG previews)
4. **Personalization** (9GAG/Reddit don't learn your humor preferences; Instagram's algorithm is opaque)
5. **India-specific** (ShareChat is general, MemeChat is for creators, no one owns "humor consumer in India")

## Market Size

```yaml
market_size:
  global_meme_industry: "$6.1B (2025), growing at 21.6% CAGR"
  meme_generator_tools: "$1.42B (2024), projected $5.33B by 2033"
  india_context: "600M+ smartphone users. WhatsApp is the dominant messaging platform. Humor sharing is a daily cultural activity."
  back_of_napkin: "If 0.1% of India's WhatsApp users (500M) use Maze monthly = 500K MAU. At $0.50 CPM on ads, that's $3K/month. At 1% = 5M MAU = $30K/month. Virality could 10x this."
```

## Technical Landscape

```yaml
content_sources:
  joke_apis:
    - "JokeAPI (sv443) — free, no auth, categories: programming/general/dark/pun/spooky, multi-language"
    - "icanhazdadjoke — free, no auth, dad jokes only, search endpoint"
    - "API Ninjas Jokes — 100 free, 20K+ premium"
    - "HumorAPI — 50K jokes + 290K memes, freemium"
    - "Official Joke API — 150+ jokes, free, GitHub hosted"
  meme_sources:
    - "Reddit API (r/memes, r/IndianDankMemes, r/dadjokes) — requires OAuth, rate-limited"
    - "Meme API (D3vd/Meme_Api) — free, scrapes Reddit, JSON endpoint"
    - "Imgflip API — meme templates + generation"
  ai_generation:
    - "Any LLM (Claude, GPT, Gemini) can generate jokes given a topic + style"
    - "Fine-tuning on joke datasets improves quality significantly"
    - "Key challenge: AI humor quality. Need a rating/filter layer."
  whatsapp_sharing:
    - "Web Share API (native browser) for share sheet"
    - "wa.me/?text= deep link for direct WhatsApp sharing"
    - "OG meta tags (og:title, og:description, og:image) required for WhatsApp link previews"
    - "WhatsApp crawler does NOT execute JavaScript — must be server-rendered"
```

## Key Insight

**The winning formula is: curated content (Reddit + APIs) + AI generation + WhatsApp-native sharing + simple like/dislike personalization.** No one has combined all four into a single, clean mobile web experience for the Indian audience. The closest things are either too broad (ShareChat), too toxic (9GAG), too creator-focused (MemeChat), or not optimized for the WhatsApp sharing loop (all of them).
