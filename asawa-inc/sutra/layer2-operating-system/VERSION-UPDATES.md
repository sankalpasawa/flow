# Sutra — Version Update Protocol

## How New Learnings Reach Existing Companies

When the founder gives feedback or when a new company's onboarding reveals gaps, Sutra evolves. But existing companies (like DayFlow) are pinned to a version. This protocol manages the flow.

## The Flow

```
FEEDBACK arrives (from founder, from client, from onboarding)
  ↓
SUTRA SESSION evaluates: is this a real gap or a preference?
  ↓
If gap → add to Sutra's source files (layer2/layer3/layer4)
  ↓
Accumulate until 5+ changes → publish new version (v1.1, v1.2, etc.)
  ↓
For each existing client:
  ↓
Write update notice to {company}/feedback-from-sutra/version-{N}.md
  ↓
Next time that company's session starts → OS loads the notice
  ↓
Company decides: upgrade, skip, or partial adopt
```

## When Does Sutra Run?

Sutra runs as its own session. Separate from any company.

| Trigger | What Sutra Does |
|---------|----------------|
| Founder gives feedback ("add landing pages by default") | Adds to onboarding checklist, updates CLIENT-ONBOARDING.md |
| New company onboarded, reveals a gap | Fills the gap in Sutra's modules, bumps version |
| Weekly (or when founder requests) | Reviews all feedback-to-sutra/ across clients, batches into version |
| Founder says "validate new protocols against DayFlow" | Sutra writes update notice to DayFlow's folder |

## What Gets Versioned

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| New checklist item | Patch (v1.0 → v1.0.1) | "Add landing page by default" |
| New product type template | Minor (v1.0 → v1.1) | "Content platform architecture patterns" |
| Process restructure | Major (v1.0 → v2.0) | "Rewrote onboarding from 5 to 8 phases" |

## Validation Against Existing Companies

When Sutra adds a new protocol, it should be validated against existing clients:

1. Sutra writes `{company}/feedback-from-sutra/pending-{date}-{topic}.md`
2. Content: what changed, why, what the company should consider
3. Next time the company session runs, it reads the pending file
4. Company agent evaluates: relevant? helpful? adopt or skip?
5. Company writes response to `feedback-to-sutra/response-{date}-{topic}.md`
6. Sutra reads the response in next Sutra session

This is the two-way feedback loop. Sutra pushes updates. Companies push back if the update doesn't fit.

## Founder Feedback Protocol

When the founder says something like "every company should have a landing page":

1. This session (holding/Sutra context) updates the relevant Sutra doc immediately
2. Adds a validation task: "validate against DayFlow next time DayFlow session runs"
3. If the feedback changes the onboarding process, update CLIENT-ONBOARDING.md
4. If the feedback changes how companies operate, update the relevant module
5. If the feedback is company-specific, route it to that company's folder only
