# DayFlow Architecture

DayFlow is a personal operating system. The user talks to it in natural language. The AI understands the user, the world, and the data, then does whatever needs doing and renders the result.

As LLMs get more powerful, DayFlow gets more powerful. Nothing is hardcoded. Nothing is bounded.

## What DayFlow Actually Is

LLMs are commoditized. Anyone can call one. DayFlow's value is the layer between the raw LLM and the user's life:

1. **Structure** — The user's life data, organized over time. Activities, moods, energy, patterns, reflections. Raw LLMs have no memory of you. DayFlow is the persistent, structured memory.

2. **Context modality** — Massaging and processing that data into the right shape for each situation. "Plan my week" needs different context than "how am I feeling." The context pipeline knows what to feed the LLM and how.

3. **Skills** — Each use case gets a specialized agent. Each skill knows what data to pull, how to process it, what to ask the LLM, and how to render the result. Skills are how DayFlow scales. Add a skill, add a capability.

4. **UI** — The rendering layer. Native for core interactions. As LLMs evolve, the rendering mechanism evolves too. The architecture doesn't constrain how UI gets created.

The moat is not the AI. The moat is structured personal data + context pipeline + skill library. No generic AI assistant has that.

---

## Cognitive Architecture

DayFlow's AI is modeled on how humans actually process and act. This is the theoretical foundation. Not all layers are implemented today. As the system matures, layers get activated. The cognitive model is the north star for how the AI should evolve.

### Research Foundations

| Model | Author/Year | What it contributes |
|-------|------------|-------------------|
| ACT-R (Adaptive Control of Thought) | Anderson, 1996 | Declarative + procedural memory, goal management, skill as production rules |
| SRK Framework | Rasmussen, 1983 | Skill-based → Rule-based → Knowledge-based behavior progression |
| Dreyfus Skill Model | Dreyfus & Dreyfus, 1980 | Novice → Advanced beginner → Competent → Proficient → Expert |
| Somatic Marker Hypothesis | Damasio, 1994 | Emotion as input to rational decision-making, not just output |
| Predictive Processing | Friston 2010, Clark 2013 | Brain generates predictions, surprise drives learning |
| Prospection | Seligman et al., 2013 | Humans are driven by simulations of the future |
| Self-Determination Theory | Deci & Ryan, 1985 | Autonomy, competence, relatedness as core motivators |
| Biased Competition | Desimone & Duncan, 1995 | Attention filters signals based on current goals |
| Berlin Wisdom Paradigm | Baltes & Staudinger, 2000 | Wisdom = expert knowledge about fundamental pragmatics of life |
| Experiential Learning | Kolb, 1984 | Do → Reflect → Conceptualize → Experiment → loop |
| OODA Loop | Boyd, 1976 | Observe → Orient → Decide → Act (orientation is where the game is won) |

### The Cognitive Loop

```
┌─────────────────────────────────────────────────────┐
│                MOTIVATION (the why)                  │
│                                                      │
│  Goal hierarchy. What matters deeply to this person. │
│  Autonomy, competence, relatedness.                  │
│  "Am I adding work tasks at the expense of family?"  │
│                                                      │
│  Source: Deci & Ryan 1985, Kruglanski 2002           │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 WISDOM (meta-layer)                   │
│                                                      │
│  Knows the limits of its own knowledge.              │
│  Balances competing values (productivity vs rest).   │
│  Judges when to act vs hold back.                    │
│  Checks actions against deeper goals.                │
│  Recognizes life phases and context.                 │
│  Sometimes the right answer is "do nothing."         │
│                                                      │
│  Source: Baltes & Staudinger 2000                    │
│                                                      │
│  A knowledgeable system: "You skipped gym 3 times."  │
│  A skilled system: "Reschedule gym to mornings."     │
│  A wise system: "You've been pushing hard. Maybe     │
│    skipping gym this week is what you need."          │
└──────────────────────┬──────────────────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │           AWARENESS               │
      │                                    │
      │  Perception: what is happening?    │
      │    (raw input, signals, data)      │
      │                                    │
      │  Perspective: how do I see this?   │
      │    (user's worldview, mental       │
      │     models, biases)                │
      │                                    │
      │  Affect: how do I feel about it?   │
      │    (emotional state as INPUT to    │
      │     reasoning, not just output)    │
      │                                    │
      │  Source: Damasio 1994              │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │           ATTENTION               │
      │                                    │
      │  Of everything perceived, what     │
      │  matters RIGHT NOW?                │
      │                                    │
      │  Filter and focus based on current │
      │  goals and context. Ignore noise.  │
      │                                    │
      │  Source: Kahneman 1973,            │
      │          Desimone & Duncan 1995    │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │          ORIENTATION              │
      │                                    │
      │  Framing: how should I look at     │
      │  this situation?                   │
      │                                    │
      │  Recontextualize based on          │
      │  awareness + prior experience.     │
      │                                    │
      │  Source: Boyd 1976 (OODA)          │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │         ANTICIPATION              │
      │                                    │
      │  Predict likely futures.           │
      │  Simulate scenarios.               │
      │  "If I do X, what happens?"        │
      │  "Which future do we want?"        │
      │                                    │
      │  This is where proactive AI lives. │
      │  Not waiting for input, but        │
      │  anticipating what's needed.       │
      │                                    │
      │  Source: Friston 2010, Clark 2013, │
      │          Seligman 2013             │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │         SKILL SELECT              │
      │                                    │
      │  What capability is needed?        │
      │  Do I have it? If not, acquire.    │
      │                                    │
      │  Route to the specialized agent    │
      │  for this domain.                  │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │          SKILL ADAPT              │
      │                                    │
      │  Theoretical skill adapted to      │
      │  current reality:                  │
      │  - User model (patterns, prefs)    │
      │  - World context (time, weather)   │
      │  - Emotional state (affect)        │
      │  - Current data                    │
      │                                    │
      │  Evolves via Rasmussen SRK:        │
      │  Skill-based: automatic, instant   │
      │    (local parser, known patterns)  │
      │  Rule-based: match situation to    │
      │    known pattern, apply procedure  │
      │  Knowledge-based: novel situation, │
      │    reason from first principles    │
      │                                    │
      │  Over time, via Dreyfus:           │
      │  Novice → Beginner → Competent →   │
      │  Proficient → Expert               │
      │                                    │
      │  Source: Rasmussen 1983,           │
      │          Dreyfus & Dreyfus 1980    │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │           EXECUTE                 │
      │                                    │
      │  Act through available modalities. │
      │  CRUD, compute, generate,          │
      │  chain operations.                 │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │         COMMUNICATE               │
      │                                    │
      │  Render the result in the right    │
      │  form for this situation.          │
      │  Native UI, generated UI,          │
      │  text, notification.               │
      └────────────────┬──────────────────┘
                       │
      ┌────────────────▼──────────────────┐
      │           REFLECT                 │
      │                                    │
      │  Did it work? How did it feel?     │
      │  What did I learn?                 │
      │                                    │
      │  Feeds back into:                  │
      │  - Skill (gets better at domain)   │
      │  - Wisdom (better meta-judgment)   │
      │  - Motivation (goal alignment)     │
      │                                    │
      │  Source: Kolb 1984                 │
      └────────────────┬──────────────────┘
                       │
                       └──► WISDOM + MOTIVATION + SKILL
                            (experience-driven learning)
```

### How the Cognitive Loop Maps to DayFlow

| Cognitive layer | DayFlow implementation | What feeds it |
|----------------|----------------------|---------------|
| Motivation | Goal hierarchy, life values, stated priorities | User's goals, long-term reflection patterns |
| Wisdom | Meta-judgment layer in AI prompt | Long-term data, life phase signals, value preferences |
| Awareness: Perception | World Context + Data Layer | Sensors, APIs, database, user input |
| Awareness: Perspective | User Model (how this person sees things) | Patterns, category preferences, past framings |
| Awareness: Affect | Emotional state inference | Recent mood logs, energy, time of day + user patterns |
| Attention | Context filtering / scope classification | Current goals determine what signals matter |
| Orientation | Framing in AI prompt | Awareness outputs + prior experience |
| Anticipation | Predictive reasoning | User patterns + world signals + scenario simulation |
| Skill Select | Skill routing system | Intent classification → domain → agent |
| Skill Adapt | Context recipe per skill + SRK level | User model + world context + affect + data |
| Execute | Data operations, API calls, generation | Skill's adapted plan |
| Communicate | UI Layer (native, generated, text) | Execution results |
| Reflect | Experience Log (mood, energy, reflection) | User feedback post-action |

### Skill Evolution (Rasmussen SRK applied to DayFlow)

Skills start simple and evolve through experience:

**Skill-based (automatic)**
The system has seen this pattern many times. No reasoning needed.
- "Gym at 7am" → create activity (local parser, instant)
- "Done with meditation" → mark complete
- Pattern: stimulus → response. Zero deliberation.

**Rule-based (pattern matching)**
Familiar situation with a stored procedure. Some reasoning.
- "It's raining and user has outdoor run" → check weather → suggest indoor alternative
- "User always skips gym on Mondays" → suggest Tuesday instead
- Pattern: recognize situation → apply known rule.

**Knowledge-based (first principles)**
Novel situation. Must reason from scratch.
- "Plan my week around energy patterns and wife's schedule"
- "I'm feeling burned out, what should I change?"
- Pattern: no stored rule → reason with all available context → derive solution.

Over time, knowledge-based responses become rule-based (pattern gets stored), and rule-based responses become skill-based (pattern becomes automatic). This is how the system gets smarter. Each reflection cycle refines the skill.

### Wisdom in Practice

Wisdom is not a step in the sequence. It's the meta-layer that oversees the entire loop.

**Five criteria of wisdom** (Baltes & Staudinger 2000):

1. **Rich factual knowledge** — knowing about life, how things work
   DayFlow: deep user model, extensive pattern history

2. **Rich procedural knowledge** — strategies for life's problems
   DayFlow: skill library, adapted procedures

3. **Lifespan contextualism** — what matters changes over time
   DayFlow: recognizing life phases ("you just had a baby, old patterns don't apply")

4. **Value relativism** — different values are valid
   DayFlow: not optimizing for one metric, respecting the user's stated priorities

5. **Management of uncertainty** — acting well despite incomplete information
   DayFlow: "I don't have enough data to suggest your ideal routine. Let's try a few things."

Wisdom manifests as:
- Not always optimizing. "Your schedule looks fine. Enjoy your day."
- Recognizing tension. "You're adding work tasks but your goal is family time."
- Holding back. "I could suggest changes but you seem to have this handled."
- Acknowledging limits. "I've only seen 2 weeks of data. My patterns may not be reliable yet."

---

## Technical Architecture (Five Layers)

The cognitive model above is the theory. Below is how it maps to code.

```
User input (natural language)
    ↓
AI Layer (brain)          — cognitive loop, skills, LLM reasoning
    ↓
User Model (memory)       — learned patterns, preferences, energy curves
    ↓
World Context (senses)    — time, location, weather, external signals
    ↓
Data Layer (spine)        — entries, categories, logs, external sources
    ↓
UI Layer (skin)           — renders data, captures input
```

### Layer 1: UI Layer (skin)

The UI renders data and captures input. No business logic.

**Native rendering rules:**

| Data shape | UI result |
|-----------|-----------|
| Has start_time | Calendar pill |
| No time + recurring | Watermark chip |
| No time, not recurring | Bottom bar task |
| Any | List item (list view) |

**Dynamic UI**: When the user asks for something without a native component, the AI generates it. The mechanism is intentionally unbounded. HTML in a WebView is the practical fallback today (LLMs know HTML/CSS). As LLMs evolve, they may generate native components, use OTA pushes, or mechanisms we can't predict. The architecture doesn't prescribe the "how."

**Current state**: Glass morphism design system, calendar canvas, list view, bottom task bar, watermarks, activity form, experience log, quick add.

### Layer 2: Data Layer (spine)

**Current**: Activity type with flexible fields. Simple enough for the AI to reason about.

**Future**: Universal Entry (Activity → Entry with type + metadata). Additive migration, no data loss.

**External data**: Adapters from anywhere. Not just calendars. Any app, any schema. The AI reads whatever the adapter exposes.

**Recurring instances**: Stored once, generated on the fly via `recurrence.ts`.

### Layer 3: World Context (senses)

Feeds the Awareness step of the cognitive loop.

| Signal | What it enables | Cost |
|--------|----------------|------|
| Time | Current moment awareness | Free |
| Day type | Weekday/weekend/holiday | Free |
| Weather | Outdoor activity decisions | Free (API) |
| Location | Context-aware suggestions | Battery cost |
| Calendar signals | Conflict awareness | Adapter needed |
| Recent actions | Energy/fatigue inference | Free (DB query) |

All world context feeds into `buildContext()` in `commandLayer.ts`. The function gets richer over time.

### Layer 4: User Model (memory)

Feeds the Perspective, Affect, and Anticipation steps of the cognitive loop.

Computed from existing data via aggregation queries. Distilled into a concise summary string for the AI context.

| Pattern | Source | Cognitive step it feeds |
|---------|--------|----------------------|
| Energy curve | ExperienceLog | Affect, Anticipation |
| Completion patterns | Activity history | Anticipation, Skill Adapt |
| Duration accuracy | Planned vs actual | Anticipation |
| Category preferences | Creation patterns | Perspective, Orientation |
| Reflection insights | Log reflections | Wisdom, Motivation |
| Overcommitment signal | Planned vs done | Wisdom, Attention |

**Privacy**: All computation local or in user's Supabase. LLM sees summaries only.

### Layer 5: AI Layer (brain)

Implements the cognitive loop. The AI is not any specific LLM. It's whatever is best at the time.

**Skills** are the scalable unit. Each skill is a specialized agent:

| Skill | Domain | Cognitive layers it uses most |
|-------|--------|------------------------------|
| Scheduling | Calendar | Attention, Skill Adapt (rule-based) |
| Planning | Tomorrow/week | Anticipation, User Model, World Context |
| Insights | Self-knowledge | Wisdom, User Model (deep aggregation) |
| Reflection | Experience | Affect, Reflect |
| Journaling | Writing | Perspective, Affect, Orientation |
| Health | Wellness | Anticipation, World Context, Affect |

Each skill:
- Has a domain (what part of life it handles)
- Has a context recipe (what data, world signals, user patterns it needs)
- Operates at an SRK level (skill/rule/knowledge-based, evolves over time)
- Produces an output (action, visualization, suggestion, question)
- Can chain to other skills

Adding a new life domain = adding a new skill. The infrastructure already exists.

**Progressive enhancement**: Local regex parser for skill-based (instant). LLM for rule-based and knowledge-based.

---

## Self-Modifying App

DayFlow modifies itself from within. No terminal. No App Store update.

The mechanism is generic and evolves with LLMs:
1. User asks for something
2. AI checks if a native component/skill exists
3. If yes, use it
4. If no, generate it through the best available mechanism
5. For data operations, AI can write and deploy Supabase edge functions

Today the practical fallback for generated UI is HTML in a WebView. Tomorrow it could be native component generation, OTA pushes, or something we can't predict. The principle: the AI creates whatever is needed. The "how" is not fixed.

---

## Key Principles

1. **Cognitive-first.** The AI follows a human cognitive model: motivation → wisdom → awareness → attention → orientation → anticipation → skill → execute → communicate → reflect.
2. **LLM-native.** Tomorrow's LLM makes the app better without code changes.
3. **Schema is the API.** Expand the schema, expand the AI.
4. **No vendor lock-in.** The LLM is a parameter.
5. **Skills are the scaling unit.** New domain = new skill.
6. **Context is power.** Richer context = smarter AI.
7. **UI follows data.** Data shape determines rendering.
8. **Unbounded capability.** The LLM defines what's possible, not the app.
9. **Privacy by design.** Pattern computation is local. LLM sees summaries only.
10. **Self-improving.** The app modifies itself. Skills evolve through experience.
11. **Structure is the moat.** Structured personal data + context pipeline + skills.
12. **Wisdom over optimization.** Sometimes the right answer is "do nothing."

---

## Roadmap

### Phase 1: Finish the Calendar (now)
- Complete today screen with all design polish
- Wire LLM into QuickAdd (currently local-only)
- Design reviews, bug fixes, visual polish
- **Cognitive layers active**: Awareness (perception only), Skill (rule-based, local parser), Execute, Communicate
- Result: solid calendar app that works

### Phase 2: Tomorrow Feature (medium-term)
- First use of **world context**: day type, weather
- First use of **user model**: basic patterns from history
- Enrich `buildContext()` with world signals + user summary
- First skill agent: planning
- **Cognitive layers activated**: Attention (scope filtering), Orientation (framing), Anticipation (predict tomorrow)
- Result: AI that knows about tomorrow, not just today

### Phase 3: Insights Feature (medium-term)
- Deep user model: energy curves, completion patterns, overcommitment
- Pattern summary fed to AI context
- Insights skill: surfaces observations
- **Cognitive layers activated**: Wisdom (meta-judgment, "are you overcommitting?"), Affect (energy/mood as input)
- Result: DayFlow knows the user

### Phase 4: Journaling (medium-term)
- Universal Entry migration
- Journaling skill: prompts, structures, connects to patterns
- **Cognitive layers activated**: Perspective (how the user sees things), Reflect (deep feedback loop)
- Result: DayFlow understands how the user feels

### Phase 5: Free-form + Self-modification (long-term)
- Dynamic UI generation (mechanism-agnostic)
- Edge function generation from within the app
- Agent orchestration for multi-step tasks
- **Cognitive layers activated**: Motivation (goal hierarchy checks), full Wisdom
- Result: DayFlow creates features from within

### Phase 6: External Sources + Full OS (long-term)
- Source adapters (any external app/data)
- Cross-source reasoning
- More skills for new domains
- **All cognitive layers fully active**
- Result: DayFlow is the personal operating system

---

## Architecture TODO

### Cognitive Loop Implementation
- [ ] Map current command layer to cognitive steps (what exists, what's missing)
- [ ] Define how Motivation layer gets user's goal hierarchy (onboarding? learned over time?)
- [ ] Define Wisdom heuristics: when should the AI hold back vs act?
- [ ] Define Affect inference: how to estimate current emotional state from available signals
- [ ] Define Attention filtering: how to determine what context matters for each request
- [ ] Define Anticipation: what prediction queries are needed (schedule conflicts, pattern extrapolation)

### Skills System
- [ ] Skill routing: how does DayFlow decide which skill handles a request?
- [ ] Skill context recipe: how does each skill specify what data/context it needs?
- [ ] Skill SRK level tracking: how does a skill know if it's at rule-based or knowledge-based?
- [ ] Skill chaining: how do skills call other skills?
- [ ] First skill to build: scheduling (closest to current command layer)

### User Model
- [ ] What aggregation queries give best signal with least tokens?
- [ ] How often to recompute? (Nightly batch vs on-demand vs hybrid)
- [ ] Minimum data for useful patterns? (7 days? 30 days?)
- [ ] Cold start: new user, no patterns yet
- [ ] Privacy: what leaves the device, what stays local?

### World Context
- [ ] Which signals have highest value-to-cost ratio?
- [ ] How to keep context string concise as signals multiply?
- [ ] Background refresh strategy (battery)
- [ ] Offline fallback

### Dynamic UI
- [ ] Glass-framed WebView component for HTML rendering (first fallback mechanism)
- [ ] Design tokens in AI prompt for consistent styling
- [ ] How does the AI know what native components exist vs need generation?

### Data Evolution
- [ ] Universal Entry migration plan
- [ ] Cross-source deduplication
- [ ] Conflict resolution rules

### AI Evolution
- [ ] Model switching strategy
- [ ] Cost monitoring per user
- [ ] Agent orchestration protocol
- [ ] Prompt versioning as context gets richer
- [ ] Feedback loop: user corrections improve future responses
