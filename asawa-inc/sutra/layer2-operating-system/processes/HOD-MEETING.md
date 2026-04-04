# Sutra — HOD Meeting Framework

## What This Is

A structured quarterly + weekly meeting protocol for all Sutra client companies. Uses Sutra's own operating model (SENSE → SHAPE → DECIDE → SPECIFY → EXECUTE → LEARN) as the backbone, not external frameworks like V2MOM or OKRs.

## Meeting Types

| Type | Frequency | Duration | Purpose |
|------|-----------|----------|---------|
| **HOD Quarterly Kickoff** | Start of quarter | 30 min | Set direction, allocate across departments |
| **HOD Weekly Sync** | Monday | 10 min | Status, blockers, routing |
| **Department Deep Dive** | As needed | 15 min | One department presents, others react |

## HOD Quarterly Kickoff — The Protocol

### Phase 1: SENSE (each department reports signals)

Every department answers THREE questions:
1. **What signals are you seeing?** (Pull: user feedback, Push: founder vision, Pain: bugs/incidents)
2. **What's your health score?** (Green / Yellow / Red + one-line reason)
3. **What's your #1 blocker?**

Output: Signal Map — a visual grid of all departments and their health.

```
SIGNAL MAP — {Company} — {Date}

                 GREEN          YELLOW          RED
Product          [●]
Design                          [●]
Engineering      [●]
Content                                         [●]
Growth                          [●]
Data                                            [●]
Quality                         [●]
Security         [●]
Finance          [●]
Legal                                           [●]
Ops              [●]

BLOCKERS:
→ Legal blocks Growth (no privacy policy)
→ Data blocks Product (no analytics)
→ Content blocks Growth (not diverse enough)
```

### Phase 2: SHAPE (turn signals into initiatives)

Group signals into **initiatives** (max 5 per quarter). Each initiative:
- Has an **owner department** (who drives it)
- Has **contributing departments** (who supports)
- Maps to the **core bet** (how does this help the company's hypothesis?)

```
INITIATIVE MAP — {Company} — Q{N} {Year}

INITIATIVE 1: {name}
├── Owner: {department}
├── Contributors: {departments}
├── Bet connection: {how this validates/invalidates the core bet}
├── Sutra phase: SENSE|SHAPE|DECIDE|SPECIFY|EXECUTE|LEARN
└── Status: NOT STARTED | IN PROGRESS | BLOCKED | DONE

INITIATIVE 2: {name}
├── ...
```

### Phase 3: DECIDE (CEO makes calls)

The CEO decides on each initiative using Sutra's decision matrix:

| | Data-Rich | Data-Poor |
|---|-----------|-----------|
| **Reversible** | Experiment (ship behind flag) | Founder decides fast |
| **Irreversible** | Meritocratic debate | Founder taste |

Decisions are recorded in the meeting doc.

### Phase 4: SPECIFY (departments create their sprint)

Each department writes their top 3 deliverables for the quarter, with:
- What they'll deliver
- When (week number)
- What they need from other departments
- How it maps to an initiative

### Phase 5: EXECUTE (track weekly)

Weekly HOD syncs track progress against the quarterly sprint. Format:

```
WEEKLY SYNC — {Company} — Week {N}

{Department}: {status emoji} {one-line update}
  └── Blocker: {if any}
```

Status emojis: ✅ on track, ⚠️ at risk, ❌ blocked, 🚀 ahead of plan

### Phase 6: LEARN (quarterly retro)

End-of-quarter review:
- Which initiatives shipped? Which didn't? Why?
- Which department was healthiest? Which struggled?
- What should Sutra change for next quarter?
- Feedback to `feedback-to-sutra/`

---

## Agent Mapping

Each department has a head agent. In a Sutra-powered session:

| Department | Agent | Incentive | Checks |
|------------|-------|-----------|--------|
| Product (CPO) | What to build, what to kill | Right things built | User value |
| Design (CDO) | Visual quality, consistency | Beautiful + usable | Pixel QA |
| Engineering (CTO) | Architecture, performance | Clean + fast | Type-check, perf |
| Content (CCO) | Quality, freshness, diversity | Users laugh | Engagement data |
| Growth (CGO) | Distribution, virality | Users acquired | Funnel metrics |
| Data (CDaO) | Measurement, insights | Decisions data-driven | Dashboard coverage |
| Quality (CQO) | Testing, regression | Zero breaks | Test coverage |
| Security (CISO) | Keys, RLS, compliance | No incidents | Audit pass |
| Finance (CFO) | Costs, unit economics | $0 until proven | Spend tracking |
| Legal (CLO) | Privacy, attribution, ToS | Compliant | Policy coverage |
| Ops (COO) | Deploys, uptime, automation | Runs itself | Uptime % |

---

## Cross-Department Routing

When one department's work creates a signal for another:

```
{Source Dept} ──[signal type]──→ {Target Dept}

Examples:
Engineering ──[new feature shipped]──→ Quality (QA needed)
Quality ──[bug found]──→ Engineering (fix needed)
Content ──[new category added]──→ Design (UI update needed)
Growth ──[user feedback]──→ Product (feature request)
Legal ──[policy ready]──→ Growth (unblocked to launch)
Data ──[metric below target]──→ Product (intervention needed)
```

---

## Visual Output

Every HOD meeting produces TWO artifacts:
1. **Signal Map** (health grid + blockers)
2. **Initiative Map** (what's being worked on + status)

Both are written to `{company}/meetings/{date}-{type}.md` and committed.
