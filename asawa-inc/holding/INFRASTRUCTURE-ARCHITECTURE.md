# Asawa Inc. — Shared Infrastructure Architecture

## The Problem

Each company (DayFlow, PPR, Maze) independently configures its own AI providers, external APIs, and infrastructure connections. This creates:
- **Duplication**: Same provider setup code in every app
- **Drift**: Company A uses one model, Company B uses another, with no shared rationale
- **Fragility**: API key management scattered across projects
- **Opacity**: No single view of what external systems the portfolio depends on

## The Inheritance Model

```
┌─────────────────────────────────────────────────┐
│  ASAWA (Base — LOCKED, nobody overrides)        │
│                                                 │
│  • Provider registry (which providers exist)    │
│  • Security policies (key management rules)     │
│  • Cost policies (budget constraints)           │
│  • Audit requirements (what gets logged)        │
│  • Approved provider list                       │
└──────────────────────┬──────────────────────────┘
                       │ inherits
┌──────────────────────▼──────────────────────────┐
│  SUTRA (Process — ADOPTABLE, companies opt in)  │
│                                                 │
│  • Default model selection per use case         │
│  • Default provider preferences                 │
│  • Integration templates (code patterns)        │
│  • Onboarding checklist for new providers       │
│  • Quality gates (model output validation)      │
└──────────────────────┬──────────────────────────┘
                       │ inherits + can override ↓
┌──────────────────────▼──────────────────────────┐
│  COMPANY (Instance — OVERRIDABLE within bounds) │
│                                                 │
│  • Which model to use for their use case        │
│  • Provider-specific API keys                   │
│  • Custom prompts and system messages           │
│  • Feature-specific model selection             │
│  • Rate limit configuration                     │
└─────────────────────────────────────────────────┘
```

## Override Rules

| Layer | Can Override | Cannot Override | Enforced By |
|-------|-------------|-----------------|-------------|
| **Asawa (Base)** | Nothing — this IS the base | — | Git: changes require CEO approval |
| **Sutra (Process)** | Default models, templates, preferences | Approved provider list, security policies, audit rules | Sutra version pinning |
| **Company** | Model selection, API keys, prompts, rate limits | Security policies, approved providers, audit requirements | Company OS file + shared config validation |

### What each layer controls

**Asawa (LOCKED)**
- The list of approved AI providers (e.g., Google, Anthropic, DeepSeek, Groq)
- Security rules: no API keys in code, all keys in env vars, no client-side AI calls without proxy
- Cost rules: free tier first, paid only with explicit approval
- Audit: every AI call must be traceable to a company and use case

**Sutra (ADOPTABLE)**
- Default model per use case: "for joke generation, use Gemini Flash; for complex reasoning, use Claude"
- Integration templates: "here's the code pattern for streaming AI in Next.js"
- Quality gates: "AI-generated content must be rated before entering a public feed"

**Company (OVERRIDABLE)**
- "Maze uses Gemini Flash for joke generation" — valid override
- "Maze uses GPT-4 for joke generation" — valid, if GPT-4 is on the approved list
- "Maze uses RandomNewAI.com" — BLOCKED, not on approved list
- "Maze stores API key in localStorage" — BLOCKED, violates security policy

## Design Principles Applied

### 1. Dependency Inversion (the code pattern)

Companies depend on **abstractions** (provider interface), not **implementations** (specific SDK).

```
Company code → ProviderConfig → Actual provider SDK
                    ↑
              Shared layer defines the interface
              Company config selects the implementation
```

### 2. Open/Closed Principle

The shared layer is **open for extension** (add new providers) but **closed for modification** (existing provider contracts don't change). Adding DeepSeek doesn't break Gemini.

### 3. Single Responsibility

- `AI-PROVIDERS.md` owns provider configuration
- `EXTERNAL-SYSTEMS.md` owns external API configuration
- Company code owns business logic and prompts
- Nobody else touches these boundaries

### 4. Liskov Substitution

Any approved provider can be swapped for any other approved provider without breaking the company's code. The interface guarantees this:
- `streamText()` works the same whether it's Gemini, Claude, or DeepSeek
- The AI SDK's provider abstraction already enforces this at the code level

## File Structure

```
asawa-inc/holding/
├── INFRASTRUCTURE-ARCHITECTURE.md  # This file — the design
├── AI-PROVIDERS.md                 # Provider registry + policies
├── EXTERNAL-SYSTEMS.md             # External API registry
├── OVERRIDE-RULES.md               # What companies can/cannot change
└── templates/
    └── ai-provider.ts              # Code template for AI integration
```

## How It Flows

### Adding a new AI provider (to the portfolio)
1. Evaluate: Does it meet security policies? → Add to `AI-PROVIDERS.md` approved list
2. Configure: Add default model selection to Sutra defaults
3. Template: Update `templates/ai-provider.ts` with the new provider option
4. Notify: Companies see new provider in their next session

### Company wants to use AI
1. Read `AI-PROVIDERS.md` → pick from approved providers
2. Copy `templates/ai-provider.ts` → adapt to their use case
3. Set API keys in their Vercel/deployment env vars
4. Override model selection in their company config if needed

### Company wants to change provider
1. Check: Is the new provider on the approved list? → Yes: swap. No: request addition.
2. Update: Change the model string in their provider config
3. No other code changes needed (AI SDK handles the abstraction)
