# DayFlow Design Critique & Refinement Notes

Generated: 2026-03-26
Sources: Codex design review, Any.do/Sunsama/Tiimo competitor research

## Design System

- **Fonts**: Cormorant Garamond (display/titles, weight 300-500), Inter (body/UI)
- **Palette**: Deep charcoal (#1A1A1C), elevated surface (#242426), warm off-white (#F5F5F0), burnished gold (#C9A962), sage green (#6E9E6E), muted rose (#9B6E6E)
- **Depth**: Zero shadows. Borders (#3A3A3C) + surface layering only.
- **Radii**: 20px cards, 34px tab bar pill, 16-18px internal elements
- **Philosophy**: "Luxury whispers, never shouts." Serif for aspiration, sans-serif for function.

## Codex Critique Summary (severity-ranked)

### Critical
1. **Gold overuse risk** - Reserve gold for: selected date, active tab, primary CTA, and logged indicators only. Everything else stays in the charcoal/border palette.
2. **Emoji scales break luxury aesthetic** - Default emojis read childish. Constrain inside refined bordered tokens with tonal fill. Consider custom monochrome iconography post-MVP.

### High
3. **Canvas has too many competing anchors** - Make current activity dominant. Demote mindset prompts to collapsible. Mood/energy dots are metadata, not primary UI.
4. **Temporal grouping needed** (APPLIED) - Cluster hours into Morning/Afternoon/Evening blocks. Sunsama's calm structure, not a raw hourly list.
5. **Onboarding is default formula** - One strong emotional promise > three feature cards. Luxury onboarding seduces, doesn't explain.
6. **Day Summary = dashboard sludge** - Narrative summary, not analytics. "Your energy peaked during Deep Work" > "Avg Energy: 3.2"
7. **Missing motion spec** - Define: modal spring timing, tap compression, selection glow, haptic moments, end-of-day ceremony transition.
8. **Touch targets at risk** - All interactive elements need true 44x44pt hit areas.

### Medium
9. **Progressive reveal for log modal** - Mood first (one tap), then expand to energy/reflection/repeat.
10. **CTA copy needs specificity** - "Begin your first intentional day" > "Get Started"
11. **Three card states for canvas** - Empty hour, planned activity, completed/logged. Each with distinct density.
12. **End-of-day ceremony** - Summary should feel like closure, not a report.

## Competitor Research Highlights

### Any.do
- "Plan My Day" morning ritual: surfaces unfinished tasks, drag into time slots
- Restrained completion states (no confetti)
- NLP input ("Call mom tomorrow at 2pm") - good for DayFlow P3

### Sunsama ($25/mo)
- Direct benchmark. Muted warm palette, side-by-side calendar+tasks
- Two signature rituals: morning planning (with overcommitment warnings), evening shutdown
- Focus Mode: single task + timer (DayFlow's "activity in progress" state)
- Actual-vs-estimated time tracking feeds into experience log concept

### Tiimo (iPhone App of Year 2025)
- Visual-timeline-first: large color-coded blocks, icon-driven
- "No shaming" philosophy: missed blocks prompt curiosity, not guilt
- Visual progress timer: time as filling shape, not ticking numbers
- Calendar import on onboarding: canvas never empty on day 1

## Design Principles (Synthesis)

1. **Canvas-as-hero**: The daily timeline is the entire product surface. Everything else supports it.
2. **Ritual bookends**: Morning plan + evening shutdown create daily ceremony (Sunsama pattern).
3. **Warm restraint**: Gold for intent and reward. Everything else in charcoal tones.
4. **Curious, not judgmental**: Reflection prompts with "How did it go?" not "Rate your performance."
5. **Pre-populated, never empty**: Import calendar on onboarding. Canvas should never be blank on day 1.

## Applied Improvements
- [x] Temporal grouping (MORNING / MIDDAY) on canvas
- [ ] Constrain emoji scales in bordered tokens
- [ ] Progressive reveal on log modal
- [ ] End-of-day ceremony transition
- [ ] Motion spec document
- [ ] Calendar import in onboarding flow
