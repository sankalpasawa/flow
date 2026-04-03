# Sutra — Client Onboarding Process

## What This Is

When a new founder comes to Sutra with an idea, this is the exact process that takes them from "I have an idea" to "I have a running company with an operating system."

Sutra is not a template. It's a thinking partner that extracts clarity from chaos, then deploys structure that fits.

## The Five Phases

```
INTAKE → SHAPE → DECIDE → CONFIGURE → DEPLOY
 (10 min)  (15 min)  (5 min)   (10 min)    (5 min)
```

Total: ~45 minutes from raw idea to deployed OS.

---

## Phase 1: INTAKE (extract the raw idea)

Sutra asks 7 questions. The founder answers in plain language. No jargon, no frameworks.

### The 7 Questions

1. **What is this?** (one sentence, no buzzwords)
   → "An app that makes people laugh"

2. **Who is it for?** (specific person, not "everyone")
   → "Anyone having a bad day who needs a quick laugh"

3. **What do they do today?** (the current alternative, even if it's "nothing")
   → "Scroll Reddit, open Twitter, text a funny friend"

4. **Why would they switch?** (what's broken about today's solution)
   → "Reddit is a time sink. Twitter is toxic. Friends aren't always available."

5. **What's the first version?** (smallest thing that tests the core bet)
   → "A feed of curated jokes + AI-generated humor, one-tap sharing"

6. **What's the bet?** (if THIS is true, this works. If not, it doesn't.)
   → "People will open a dedicated humor app daily if the content is good enough"

7. **What's the platform?** (web, iOS, Android, all)
   → "Web first. Fast to ship, no app store wait."

### Output: Intake Card

```
COMPANY: {name}
ONE-LINER: {what it is}
USER: {who}
CURRENT ALT: {what they do today}
SWITCH REASON: {why this is better}
FIRST VERSION: {scope}
CORE BET: {the hypothesis}
PLATFORM: {web/ios/android}
```

---

## Phase 2: SHAPE (turn fuzzy into clear)

Using the intake card, Sutra runs three shaping exercises:

### Exercise A: PR/FAQ Test
Write a 3-sentence press release for this product. If you can't make it compelling, the idea isn't clear enough yet.

```
FOR {user} WHO {problem},
{company name} IS A {what it is}
THAT {key benefit}.
UNLIKE {current alternative},
{company name} {differentiator}.
```

### Exercise B: Feature Carve
List everything the founder imagines. Then ruthlessly cut to P0 only.

| Feature | P0? | Why/Why not |
|---------|-----|-------------|
| ... | YES/NO | ... |

P0 rule: if removing this feature makes the product pointless, it's P0. Otherwise it's not.

### Exercise C: Risk Map
Three biggest risks and what we'd do about each.

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| ... | High/Med/Low | ... |

### Output: Shape Brief

One page. Contains: PR/FAQ, P0 feature list, risk map, and a clear "what does V1 look like" description.

---

## Phase 3: DECIDE (commit or kill)

The founder reviews the Shape Brief and answers one question:

**"Is this worth 1 week of focused work?"**

- YES → proceed to Configure
- NO, needs more shaping → back to Phase 2
- NO, kill it → document why, archive the intake card

This is the gate. No building happens before this decision.

---

## Phase 4: CONFIGURE (generate the OS)

Sutra selects the right module and generates a company-specific operating system.

### Module Selection
```
Is it B2C or B2B? → B2C
What stage? → Pre-launch (0 users)
What platform? → Web
What team size? → 1 (solo founder with AI)
```

Selected module: `b2c-consumer-app/STAGE-1-PRE-LAUNCH`

### OS Generation

Sutra takes the Stage 1 template and customizes it:

1. Replace DayFlow-specific references with the new company's context
2. Set the platform (web vs iOS vs cross-platform)
3. Define the tech stack based on platform and founder's skills
4. Create the product knowledge system (shearing layers, flow maps)
5. Set up metrics tracking (what to measure for THIS product)
6. Define the A/B test config (SUTRA mode on by default for first 5 features)

### Output: Company OS Package

```
{company}/
├── OPERATING-SYSTEM-V1.md    # The full OS, customized
├── SUTRA-VERSION.md          # Pinned to current Sutra release
├── SUTRA-CONFIG.md           # A/B test config, mode settings
├── METRICS.md                # What to measure, empty log
├── TODO.md                   # P0 features from Shape Brief
├── PRODUCT-BRIEF.md          # The Shape Brief output
└── feedback-to-sutra/        # Where learnings go back to Sutra
```

---

## Phase 5: DEPLOY (activate the company)

1. Create the company folder under `asawa-inc/`
2. Write all OS files
3. Register the company in Sutra's client list
4. Generate the first Daily Pulse entry
5. Set today's mode (SUTRA for feature #1)

The company is now live. The founder (or their AI agent) can start building.

---

## After Deployment

The company operates using its OS. Sutra's role shifts to:

- **Monitor**: Are they following the process? (Sutra OS Agent)
- **Measure**: Is the break rate going down? (Sutra Quality Agent)
- **Learn**: Is feedback being processed? (Sutra Learner Agent)
- **Update**: When enough feedback accumulates, publish a new Sutra version

The company can always bypass Sutra (DIRECT mode). The data decides whether Sutra is helping.

---

## Client Registry

| # | Company | Stage | Sutra Version | Mode | Status |
|---|---------|-------|---------------|------|--------|
| 1 | DayFlow | Pre-launch | v1.0 | A/B Test | Active |
| 2 | Hehe | Pre-launch | v1.0 | A/B Test | Active — onboarded 2026-04-02 |
