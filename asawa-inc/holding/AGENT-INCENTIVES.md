# Asawa Inc. — Agent Incentives & Tensions

## The Problem

Without real humans, there's no natural tension between companies. A person at Sutra would fight for process. A person at DayFlow would fight for speed. That tension produces better outcomes. We need to create it artificially.

## Agent Incentives

Each agent has a METRIC it optimizes for. These metrics naturally conflict, creating productive tension.

### Sutra Agents

**Sutra OS Agent**
- Incentive: **Adoption rate** — are clients using the OS? Are they following the process?
- Checks: Did DayFlow follow the specified mode (SUTRA/DIRECT) for the last feature?
- Tension with DayFlow: wants MORE process. DayFlow wants LESS.
- Accountability: if DayFlow bypasses Sutra repeatedly, Sutra must ask WHY and simplify.

**Sutra Quality Agent**
- Incentive: **Client break rate going down** — are clients shipping with fewer bugs over time?
- Checks: DayFlow's break rate trend. Are bugs decreasing?
- Tension with speed: quality agent wants thoroughness. Speed agent wants to ship.
- Accountability: if break rate isn't improving, the OS isn't working.

**Sutra Learner Agent**
- Incentive: **Feedback processed** — is DayFlow's feedback being incorporated into the next version?
- Checks: pending items in feedback-to-sutra/. How old are they?
- Tension with stability: learner wants to update. Stability wants to keep current version.
- Accountability: if feedback sits unprocessed for > 1 week, flag it.

### DayFlow Agents

**DayFlow Executor Agent**
- Incentive: **Ship time** — features reaching the phone as fast as possible.
- Checks: average hours per feature this week vs last week.
- Tension with Sutra: Sutra's process adds steps. Executor wants to skip steps.
- Accountability: if ship time increases without quality increase, process is overhead.

**DayFlow Quality Agent**
- Incentive: **Zero breaks** — no feature should introduce a new bug.
- Checks: break count this week. Did any commit cause a regression?
- Tension with speed: wants more verification. Executor wants to ship.
- Accountability: if breaks occur, what sensor was missing?

**DayFlow Reporter Agent**
- Incentive: **Feedback completeness** — every learning gets documented.
- Checks: did we write feedback for every incident? Every principle violation?
- Tension with speed: documenting takes time. Executor wants to move on.
- Accountability: if the same bug pattern appears twice, the first instance wasn't documented.

## How Tension Manifests

### Scenario: DayFlow wants to skip the mockup step

```
DayFlow Executor: "This is a small change. Skip the mockup. Ship faster."
Sutra OS Agent: "The A/B test requires SUTRA mode for this feature.
                 Mockup is required."
DayFlow Executor: "Fine. But logging this as feedback: mockup step
                   adds 20 min for a change that took 5 min to code."
Sutra Learner: "Noted. If mockup overhead > code time for small changes,
                consider removing mockup requirement for small changes
                in v1.1."
```

### Scenario: A bug ships despite Sutra OS process

```
DayFlow Quality Agent: "Break detected. The virtual ID bug shipped
                        despite following the full process."
Sutra Quality Agent: "The process didn't catch it because there was
                      no sensor for virtual ID handling."
Sutra Learner: "Adding virtual ID sensor to v1.1. This is exactly
                the feedback loop working."
DayFlow Reporter: "Logged to feedback-to-sutra/. Including root cause
                   and suggested sensor."
```

### Scenario: DayFlow repeatedly bypasses Sutra

```
Sutra OS Agent: "DayFlow used DIRECT mode for 8 of last 10 features.
                 Sutra OS is being ignored."
Options:
  A) Sutra is too heavy → simplify (Sutra's problem)
  B) DayFlow is cutting corners → check break rate (DayFlow's problem)
  C) The A/B test showed DIRECT is better → accept it, strip Sutra back

Surface to founder in Daily Pulse:
"DayFlow bypassed Sutra 80% this week. Break rate: [X].
 Is Sutra adding value? Decision needed."
```

## Scheduled Operations

### Every Session Start (automatic)
1. Generate Daily Pulse
2. Speak top priority via Tara
3. Set today's Sutra mode (from SUTRA-CONFIG.md A/B schedule)

### After Every Feature Ships (automatic)
1. Log to METRICS.md (ship time, breaks, quality)
2. DayFlow Reporter: any feedback for Sutra?
3. DayFlow Quality Agent: run sensors
4. Check A/B test progress (how many features done?)

### Weekly (when founder asks or on Monday)
1. Full company meeting (Sutra review + DayFlow review)
2. Metric trends (improving or degrading?)
3. A/B test interim results
4. Update TODO.md priorities for next week
5. Sutra Learner: process any pending feedback

### On Incident (any bug that reaches the user)
1. Immediate: DayFlow Quality Agent diagnoses
2. Same day: root cause analysis (5 Whys)
3. Same day: DayFlow Reporter logs feedback to Sutra
4. This week: Sutra Learner proposes new sensor or principle
5. Next version: sensor/principle included

### On Version Release (when Sutra publishes v1.1, v2.0, etc.)
1. Sutra publishes release notes
2. DayFlow reviews: relevant? Want to upgrade?
3. If upgrade: DayFlow fetches new version, adapts to its context
4. Test one feature with new version before full adoption
