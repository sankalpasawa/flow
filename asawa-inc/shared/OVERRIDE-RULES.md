# Asawa Inc. — Override Rules

## The Hierarchy

```
ASAWA (Abstract Base)
  │
  │  LOCKED — no child can override
  │  • Approved provider list
  │  • Security policies (keys in env vars, no client-side AI)
  │  • Audit requirements
  │  • Cost policies (free tier first)
  │  • External system registration requirement
  │
  ├── SUTRA (Process Layer)
  │     │
  │     │  ADOPTABLE — companies opt in, can customize
  │     │  • Default model per use case
  │     │  • Default provider preferences  
  │     │  • Integration templates
  │     │  • Quality gates
  │     │  • A/B test framework
  │     │
  │     ├── COMPANY (Instance)
  │     │     │
  │     │     │  OVERRIDABLE — within Asawa bounds
  │     │     │  • Model selection (from approved list)
  │     │     │  • API keys (their own)
  │     │     │  • Prompts and system messages
  │     │     │  • Feature-specific config
  │     │     │  • Rate limits
  │     │     │  • Provider preference (from approved list)
  │     │     │
  │     │     └── FEATURE (Leaf)
  │     │           • Prompt text
  │     │           • Temperature, max tokens
  │     │           • Output format
  │     │           • Streaming vs blocking
  │     │
  │     └── COMPANY (Instance) ...
  │
  └── SHARED (Infrastructure)
        • Provider registry (AI-PROVIDERS.md)
        • System registry (EXTERNAL-SYSTEMS.md)
        • Code templates (templates/)
        • This file (OVERRIDE-RULES.md)
```

## Override Resolution Order

When a company's code needs a value (e.g., "which model to use?"), resolution follows this chain:

```
1. Feature config      →  "joke generation uses gemini-2.0-flash"
2. Company OS config   →  "Maze defaults to Google Gemini"
3. Sutra defaults      →  "content generation defaults to gemini-2.0-flash"
4. Asawa policies      →  "must be from approved provider list"
```

First defined value wins. If Feature config says `gemini-2.0-flash`, that's what's used.
If Feature config is empty, Company OS config is checked. And so on.

## What Each Layer Can Do

### Asawa (CEO only)

| Action | Allowed | Example |
|--------|---------|---------|
| Add provider to approved list | Yes | "Add Mistral to approved providers" |
| Remove provider from approved list | Yes | "Remove X due to security concern" |
| Change security policy | Yes | "Require encryption at rest for all AI calls" |
| Override a company's model choice | No | Companies choose within bounds |
| Set a company's API keys | No | Companies manage their own keys |

### Sutra (Operating System)

| Action | Allowed | Example |
|--------|---------|---------|
| Set default model for use case | Yes | "Default joke generation to Gemini Flash" |
| Change default when better option exists | Yes | "Switch default from X to Y" |
| Add integration template | Yes | "Add template for streaming AI in Next.js" |
| Override Asawa security policy | No | Cannot weaken security |
| Force a company to use specific model | No | Defaults, not mandates |

### Company

| Action | Allowed | Example |
|--------|---------|---------|
| Choose model from approved list | Yes | "Use Claude for our AI feature" |
| Set own API keys | Yes | Company-specific keys only |
| Write custom prompts | Yes | Full control over prompts |
| Use unapproved provider | No | Must request approval first |
| Store keys in code | No | Violates security policy |
| Skip cost tracking | No | Must report in METRICS.md |
| Override Sutra process defaults | Yes | "We prefer DIRECT mode for all features" |

## Enforcement Mechanisms

| Level | Mechanism | Strength |
|-------|-----------|----------|
| **Asawa policies** | Git review + SESSION-ISOLATION.md + this doc | Hard (process) |
| **Sutra defaults** | OPERATING-SYSTEM template generation | Soft (defaults, not mandates) |
| **Company config** | Company's own OS file | Self-enforced |
| **Code patterns** | templates/ai-provider.ts | Soft (template, not enforced) |

## Examples

### Valid override
```
Asawa: "Google Gemini is approved"
Sutra default: "Use gemini-2.0-flash for content generation"
Maze override: "Use gemini-2.0-flash-lite for faster joke generation"
→ ALLOWED (approved provider, valid model, has reason)
```

### Invalid override
```
Asawa: "No API keys in code"
Company: "We'll hardcode the key for convenience"
→ BLOCKED (violates Asawa security policy)
```

### Valid new provider request
```
Company: "We need Fireworks AI for fast inference"
→ Submit request → Asawa evaluates → If approved, added to registry
→ All companies can now use it
```
