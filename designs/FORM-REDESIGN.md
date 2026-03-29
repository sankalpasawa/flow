# Activity Form Redesign — Any.do Inspired

Research date: 2026-03-29
Sources: Any.do docs, Codex design analysis, Tiimo/Things 3/Sunsama comparison

## Core Principle
Capture first, edit second. Title is the hero. Defer metadata.

## Current Form (7 visible decision groups)
```
ACTIVITY → SCHEDULING → DATE → TIME → DURATION → CATEGORY → More
```

## Proposed Form (3 visible groups)
```
[ What needs to happen?                    ]      ← 22px, borderless

[ Today ][ Tomorrow ][ This Week ][ Someday ][ Pick ]  ← timing presets

Today · 6:00 PM · 30m                    >   ← summary row (hidden if Someday)
Category · 🧠 Deep Work                  >   ← single row picker

Add notes                                 +   ← expandable
Add subtasks                              +
Repeat                                    >

                  [ Create ]
```

## Key Changes
| Element | Before | After |
|---------|--------|-------|
| Scheduled/Someday | Binary chip toggle | Someday is one timing preset |
| Date + Time + Duration | 3 sections, 15+ chips | One summary row |
| Category | Horizontal chip scroll | Single row with chevron |
| Duration | 8 bordered chips visible | Inside schedule row |
| Title | 15px bordered input | 22px borderless hero |

## Timeline Merge (Codex suggestion)
Replace TaskSection with "Anytime" band inside the canvas scroll:
- Untimed tasks render as compact cards (36px) above 6 AM line
- Same visual language as timed activities
- "Add task..." input at bottom of band
- Delete TaskSection as separate module

## Chip Replacement Rules
- Binary toggles → Segmented controls
- Values with drill-down → Setting rows (label + value + chevron)
- Quick presets (duration, weekdays) → Borderless pills (no border, filled bg)
- Category → Single row picker, not horizontal scroll

## Style Values
- Title: fontSize 22, lineHeight 28, fontWeight 600, borderWidth 0, bg transparent
- Timing presets: height 34, paddingH 12, borderRadius 17, no border
- Summary rows: height 48, paddingH 14, borderRadius 14, borderWidth 1
- Row label: fontSize 15, fontWeight 500
- CTA: height 52, borderRadius 26, fontSize 16, fontWeight 700

## Status: RESEARCH ONLY — not yet implemented
