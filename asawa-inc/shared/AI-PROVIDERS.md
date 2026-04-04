# Asawa Inc. — AI Provider Registry

## Authority

This file is owned by **Asawa (holding company)**. Changes require CEO approval.
Companies can select from approved providers but cannot add new ones unilaterally.

---

## Approved Providers

| Provider | AI SDK Package | Auth Env Var | Free Tier | Status |
|----------|---------------|--------------|-----------|--------|
| **Google Gemini** | `@ai-sdk/google` | `GOOGLE_GENERATIVE_AI_API_KEY` | 15 RPM, 1M tokens/day | Active |
| **Anthropic Claude** | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` | None (paid only) | Active |
| **DeepSeek** | `@ai-sdk/deepseek` | `DEEPSEEK_API_KEY` | Effectively free ($0.27/M input) | Active |
| **Groq** | `@ai-sdk/groq` | `GROQ_API_KEY` | 30 RPM, rate-limited | Active |
| **OpenAI** | `@ai-sdk/openai` | `OPENAI_API_KEY` | None (paid only) | Active |
| **Mistral** | `@ai-sdk/mistral` | `MISTRAL_API_KEY` | Free tier available | Approved, not used yet |

### Not Approved
| Provider | Reason |
|----------|--------|
| Random/unknown providers | Security risk — no vetting |
| Self-hosted models | Ops overhead not justified at current scale |
| Providers without AI SDK support | Breaks the abstraction layer |

---

## Default Model Selection (Sutra Defaults)

Companies inherit these defaults. They can override the model, but should have a reason.

| Use Case | Default Provider | Default Model | Why |
|----------|-----------------|---------------|-----|
| **Content generation** (jokes, copy, creative) | Google Gemini | `gemini-2.0-flash` | Free, fast, good quality |
| **Complex reasoning** (analysis, planning) | Anthropic | `claude-sonnet-4-5` | Best reasoning quality |
| **Structured output** (JSON, data extraction) | Google Gemini | `gemini-2.0-flash` | Free, reliable JSON output |
| **Code generation** | Anthropic | `claude-sonnet-4-5` | Best code quality |
| **Embeddings** | OpenAI | `text-embedding-3-small` | Industry standard, cheap |
| **Fast/cheap batch** | DeepSeek | `deepseek-chat` | Lowest cost at scale |
| **Ultra-low latency** | Groq | `llama-3.3-70b-versatile` | Fastest inference |

---

## Security Policies (LOCKED — no overrides)

1. **No API keys in code.** All keys in environment variables. No exceptions.
2. **No client-side AI calls.** All AI calls go through server-side API routes. The browser never sees provider API keys.
3. **No key sharing between companies.** Each company has its own API keys, even if using the same provider.
4. **Key rotation.** If a key is exposed (in logs, commits, etc.), rotate immediately.
5. **Env var naming.** Follow the provider's convention (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`, not `GOOGLE_KEY`).

---

## Cost Policies (LOCKED — no overrides)

1. **Free tier first.** Every company starts on free tiers. Paid models only when free is insufficient.
2. **Cost tracking.** Every company's `METRICS.md` tracks AI provider costs monthly.
3. **Budget alerts.** Set up billing alerts before enabling paid models.
4. **Model downgrade path.** Every use case must have a free fallback model defined.

| Use Case | Primary (may cost) | Free Fallback |
|----------|-------------------|---------------|
| Content generation | Claude Haiku | Gemini 2.0 Flash |
| Complex reasoning | Claude Sonnet | Gemini 2.0 Flash |
| Structured output | Claude Haiku | Gemini 2.0 Flash |
| Batch processing | DeepSeek V3 | Gemini 2.0 Flash |

---

## Company Overrides

Each company documents their AI provider choices in their `OPERATING-SYSTEM-V*.md` under a `## AI Configuration` section.

### Override format
```yaml
ai_config:
  provider: "google"              # from approved list
  model: "gemini-2.0-flash"       # specific model
  use_case: "joke generation"     # what it's used for
  override_reason: "free tier"    # why this over default
  fallback_model: "gemini-2.0-flash"  # free fallback
  env_var: "GOOGLE_GENERATIVE_AI_API_KEY"
```

### Current company configurations

| Company | Use Case | Provider | Model | Override Reason |
|---------|----------|----------|-------|-----------------|
| **DayFlow** | Command layer | Anthropic | Claude Haiku | Already integrated |
| **PPR** | Research summaries | Anthropic | Claude Sonnet | Complex reasoning needed |
| **Maze** | Joke generation | Google | Gemini 2.0 Flash | Free tier, good for creative |

---

## Adding a New Provider

**Process** (requires CEO of Asawa approval):

1. **Evaluate**: Does the provider have an AI SDK package? Is it maintained?
2. **Security check**: Does it meet the security policies above?
3. **Cost analysis**: What's the free tier? What's the paid cost?
4. **Add to registry**: Update this file's Approved Providers table
5. **Update templates**: Add the provider to `templates/ai-provider.ts`
6. **Notify companies**: Companies see the new option in their next session

---

## Audit Trail

Every AI provider addition or removal is tracked in git history of this file.
Every company's AI usage is tracked in their `METRICS.md`.
