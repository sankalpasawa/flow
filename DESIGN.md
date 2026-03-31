# Design System — DayFlow

## Design Philosophy

This section captures how and why every design decision in DayFlow was made. Someone reading this should be able to recreate the entire visual system from scratch.

### The Metaphor

"Calm morning at a clean desk."

The app should feel like opening a personal journal in warm morning light. Not a SaaS dashboard. Not a clinical tool. A personal space. Every decision filters through this image: a warm desk surface, a few notebooks with faintly colored covers, a good pen, morning light coming in from the side.

### Principles

**1. Warmth over clinical**
Every color stays in the warm spectrum. No cold blues, no pure whites, no clinical grays. The background is cream (#F5F0E8), not white. Category colors are earth tones. Even the "now" indicator uses warm amber, not red. The user described wanting to feel "calm control" — grounded, not anxious. Warm colors create that feeling. Cold colors create urgency.

**2. Glass, not boxes**
UI elements use frosted glass (backdrop-filter blur + semi-transparent white + white border) instead of solid cards with hard borders. This creates depth through layering rather than containment. Inspired by the Family crypto wallet app. Glass surfaces feel modern and layered without being heavy. Borders feel like prison cells for content. Depth comes from blur and shadow, not from drawing rectangles around everything.

**3. Color as signal, not fill**
Categories are communicated through subtle tints (5-7% opacity overlaid on glass), not solid background fills or accent bars. The solid bar treatment was tried and explicitly rejected as "too much design." When every pill is a different bold color, they compete for attention. When color is a whisper, the content (title + mindset) takes focus. Color should help you orient, not dominate.

**4. Mindset is the soul**
Every activity pill shows the mindset/intention text, even in compact pills (truncated with "..."). This is not optional metadata. It is the reason the app exists — DayFlow consolidates planning + intention-setting + reflection into one place. From the original intention doc: "Don't rely on motivation, go for structure and system." The mindset prompt IS the structure. If you remove it, you have just another calendar app.

**5. One concept: Activity**
Everything the user creates is an Activity. Time is optional. Repeat is optional. The system decides how to render it: timed becomes a pill, untimed + repeat becomes a watermark, untimed + no repeat becomes a task. Three separate concepts (events, habits, tasks) creates cognitive load. One concept with optional fields is simpler to understand and simpler to code.

**6. Simple rendering, no collision detection**
Watermark chips float on top of pills at z-index 8. Pills never shift position for watermarks. Both use the same positioning formula: top = time * HOUR_HEIGHT. Collision detection creates complex code and fragile layouts. Floating on top is visually fine and architecturally simple. If it looks okay, don't engineer around a problem that doesn't exist.

**7. Show, don't intellectualize**
Design decisions were made by building visual mockups and comparing options side by side, not by describing approaches in text. When unsure, build 3-4 variants and pick. Visual decisions need visual evaluation. Text descriptions of visual treatments always miss something. If you're debating two approaches, build both and look at them.

**8. Spring physics everywhere**
Every interactive element has press feedback (scale 0.97), every sheet animates with spring physics (damping 15, stiffness 200). Nothing snaps. Everything flows. This comes from the Family app benchmark. Micro-interactions communicate quality and make the app feel alive. A button that springs back feels fundamentally different from one that just toggles.

### Decision Framework

When making any new design decision, follow this sequence:

1. Start with the simplest version
2. If it's too simple, add one thing
3. If adding something creates complexity in the code architecture, find a simpler visual solution
4. Always ask: "Does this feel like a calm morning at a clean desk?"

### Color Philosophy

Each color in the palette maps to something on the metaphorical desk:

- **Background (#F5F0E8)** = the desk surface. Warm, neutral, the foundation everything sits on.
- **Glass pills** = notebooks on the desk. Each category gives them a different faint tint, like different colored covers seen through frosted glass.
- **Primary green (#2D5A3E)** = the pen you pick up. Intentional, not loud. You reach for it deliberately.
- **Amber accent (#C4795B)** = morning light hitting the desk. The now indicator, active states. It draws your eye naturally without demanding attention.
- **Watermark warm brown (#8B4A30)** = a pencil note in the margin. Visible but not shouting. Present but not competing.

## Product Context
- **What this is:** Personal time-blocking + task management app with mindset prompts and experience logging
- **Who it's for:** Structured achievers (28-42, knowledge workers) who already plan and reflect, just in separate tools
- **Space/industry:** Personal productivity (Amie, Structured, Sunsama, Any.do, Google Calendar)
- **Project type:** Mobile-first app (Expo/React Native, web + iOS)

## Aesthetic Direction
- **Direction:** Warm Organic + Glass Morphism
- **Mood:** "Calm morning at a clean desk." Not a SaaS dashboard. A personal space that feels like opening a well-organized journal in morning light. Inspired by Family (crypto wallet) app: micro-interactions, clean surfaces, spring physics.
- **Decoration level:** Intentional. Glass surfaces with subtle depth, warm color washes behind glass so it has something to blur against. Not flat, not skeuomorphic.
- **Reference sites:** Family.co (interaction quality), Amie (joyfulness), Notion Calendar (speed + cleanliness)

## Typography
- **Display/Hero:** Instrument Sans 700 — clean, modern, bold. Used for "Today" heading, date numbers.
- **Body:** Instrument Sans 500/600 — pill titles, task names, UI labels.
- **Data/Timestamps:** Geist Mono — tabular figures, durations, counts. Used for hour labels, progress counts.
- **Mindset prompts:** Instrument Sans 400 italic — 9.5px, 2-line clamp, 0.6 opacity.
- **Loading:** Google Fonts via @import
- **Scale:**
  - display: 32px / 700
  - heading: 22px / 700
  - title: 14px / 700 (pill names)
  - body: 13px / 500
  - small: 11px / 500
  - caption: 10px / 600 (Geist Mono)
  - micro: 9px / 600 (watermark chips)

## Color
- **Approach:** Restrained. Warm earth tones. Color is a signal, not a fill.
- **Background:** #F5F0E8 (warm cream)
- **Surface:** rgba(255,255,255,0.65) with backdrop-filter blur (glass)
- **Surface border:** rgba(255,255,255,0.75) (1px, glass edge)
- **Text:** #1A1714 (dark warm brown)
- **Text secondary:** #4A4540
- **Muted:** #8C857D
- **Border:** #E0D9CE
- **Primary:** #2D5A3E (forest green — FAB, selected states, checkmarks)
- **Accent:** #C4795B (warm amber — now indicator, active states)
- **Category colors (solid):** terra #B5634A, sage #5A8C6A, slate #3D5F80, mauve #7D5A7C, amber #A67B0A
- **Category pill tints:** Category color at 5-7% opacity layered on glass. No solid fills. No accent bars.
- **Watermark:** text #8B4A30, background rgba(181,99,74,0.12) — dark warm chip
- **Dark mode (future):** Warm graphite #1C1917 bg, #E7DDD0 text. Not cold blue-black.

## Glass Morphism Spec
- **Pill background:** rgba(255,255,255,0.65) + backdrop-filter: blur(20px)
- **Pill border:** 1px solid rgba(255,255,255,0.75)
- **Pill shadow:** 0 1px 2px rgba(0,0,0,0.04), 0 3px 8px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.04)
- **Category tint:** linear-gradient(rgba(cat-color, 0.06), rgba(cat-color, 0.06)) layered on top of glass
- **Tab bar:** rgba(255,255,255,0.7) + backdrop-filter: blur(24px)
- **Task sheet:** rgba(255,255,255,0.85) + backdrop-filter: blur(24px) + border-radius: 20px 20px 0 0
- **Color wash behind canvas:** Radial gradients of category colors at 4-5% opacity so glass has something to blur against

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Outer padding:** 20-24px horizontal
- **Hour height:** 80px per hour on canvas
- **Pill padding:** 10px 12px (normal), 6px 10px (compact)
- **Pill radius:** 14px (normal), 12px (compact)

## Layout
- **Approach:** Grid-disciplined (timeline demands it)
- **Fixed header:** Status bar + "Today" title + header buttons + date strip + pull handle. Sticky on scroll.
- **Canvas:** Full vertical scroll, 24-hour timeline
- **Bottom task bar:** 44px, persistent above tab bar
- **Tab bar:** 82px, glass treatment
- **FAB:** 52px, 16px radius, gradient green, bottom-right

## Components

### Event Pills (Glass Cards)
- **Content structure (consistent):**
  - Row 1: Category icon (emoji, 15px) + Title (14px, 700)
  - Row 2: Mindset prompt (9.5px, italic, 2-line clamp with "...")
  - Row 3 (optional, tall pills only): Subtask progress bar + count
- **No accent bars.** Category communicated via subtle tint only.
- **Mindset always shown.** If a mindset exists, it is always visible, even in compact pills. In compact pills, mindset truncates to single line with "..." (8.5px). If no mindset is set, don't show the row.
- **States:** Default (glass), Completed (strikethrough + 0.4 opacity), Compact (shorter pills, 12px radius, single-line mindset)
- **Overlap:** Two concurrent events split width 50/50 with small gap

### Watermark Chips (Rhythms)
- **What they are:** Recurring untimed activities (drink water, stand up, stretch)
- **Visual:** Small chip, right-aligned, z-index above pills
- **Color:** Dark warm text (#8B4A30) + warm tinted bg (rgba(181,99,74,0.12))
- **Content:** Icon + name (e.g., "💧 Drink water")
- **Positioning rule:** `top = time * HOUR_HEIGHT`. Always at exact time. Right-aligned. Pill never moves.
- **When overlapping a pill:** Chip floats on top of the pill, right side. No collision detection. No shifting.

### Bottom Task Bar
- **Collapsed (default):** Single row showing next uncompleted task + "+N" count badge
- **Expanded:** Glass sheet slides up from bottom with drag handle. Full task list with checkboxes, category dots, drag handles (⋮)
- **Drag to schedule:** Long-press task drag handle → drag onto timeline → dashed ghost shows landing position → time label appears → drop converts task to timed pill

### Now Indicator
- **Amber dot:** 10px, pulsing glow animation (2.5s ease-in-out)
- **Line:** Gradient fade from accent to transparent, extending right

### Date Strip
- **Chips:** 48x60px, 16px radius
- **Selected:** Green gradient (#3E7A55 → #2D5A3E) + shadow
- **Pull handle:** 36x4px bar below strip, pulls down for month calendar

### Header Buttons
- **Style:** 36x36px, 12px radius, gradient white-to-cream, subtle shadow
- **Today button:** Date number + green top bar accent

### Activity Form (Create / Edit / Log)
The activity form is a bottom sheet. Ultra-compact. No section labels, no dividers between fields. Flows continuously.

**Layout (top to bottom):**
1. Drag handle (36x4px)
2. Title — 20px, 600 weight, placeholder "What you want to do?"
3. Date + Time + Duration — ALL ON ONE ROW (wraps if needed)
   - Date chip: "Today" default, or specific date when set
   - Time chip: 🕐 clock icon when unset. Shows time like "10:30 AM" when set.
   - Duration chips: "—" (unset), "15m", "30m", "1h", "2h". Small chips. No "None" text, no "Custom" chip.
   - When time unset: hint "Saved as a Task" below the row
4. Repeat — SINGLE chip: "Once ▾". Tap opens a small popup with frequency options.
   - Popup contains: Once, Daily, Weekly, Monthly, Yearly chips
   - Weekly: adds day-of-week circles (S M T W T F S)
   - Monthly: adds "Repeat by: Day of the month ▾"
   - Daily/Yearly: just the frequency, no "Repeat every 1 day" (that's redundant)
   - "Never ends" toggle at bottom of popup
5. Mindset — Title "MINDSET" (11px, uppercase, muted). Single-line input below. Placeholder "Set an intention...". Sparkle icon (24x24) at right end for AI generate.
6. Notes — Title "NOTES" (same style). Single-line input. Placeholder "Add details..."
7. Category — Dropdown row: emoji + name + chevron when set, "Category ▾" when unset. Opens a glass popup with all categories (dot + emoji + name) + "+ Add category" at bottom. Checkmark on selected.
8. Subtasks — NO label. Checkbox rows if they exist. Green "+" circle only (24px, no text). Count "2/5" inline when items exist.
9. Action button — "Create" or "Save". Full width green gradient. Edit screen adds "Delete activity" red text link below.

**Three states:** Blank, Filled, Edit. See `designs/activity-forms.html`.

**Conflict handling:** When a time overlaps an existing activity, show a warm amber banner below the duration row: "⚠️ Overlaps with [activity name] ([time range])". Below: "Try [next free slot]?" as a tappable green chip. Non-blocking — user can still create.

**Design reference:** `designs/activity-forms.html`

### Experience Log (Post-Activity)
Bottom sheet that opens when tapping a completed or past activity pill. Logging takes precedence over editing for past activities.

**Layout:**
1. Drag handle
2. Activity header: icon + name + checkmark + time range (Geist Mono). NOT editable. Pencil icon (edit button) on the right to switch to edit mode.
3. Mood — Title "MOOD". 5 emoji circles: 😞 Bad, 😕 Low, 😐 Okay, 🙂 Good, 😊 Great. Selected fills with accent color highlight.
4. Energy — Title "ENERGY". 5 emoji circles: 🪫 Drained, 😴 Low, 😌 Steady, ⚡ High, 🔥 Peak. Selected fills with primary green highlight.
5. Completion — 3 chips: "Skipped", "Half done", "Completed". Pre-selected based on activity status.
6. Reflection — Title "REFLECTION". Single-line input, placeholder "Any thoughts on how it went?"
7. Button: "Reflect & Close" — full width green gradient. Gives a sense of completion/fulfillment.
8. No skip button. No "Edit instead" text link — pencil icon in header handles that.

**Design reference:** `designs/experience-log.html`

## Data Model Simplification
- **Everything is an Activity.** One concept.
- **Has time → pill on canvas**
- **No time, no repeat → task in bottom bar**
- **No time, has repeat → watermark chip**
- **Required change:** Make `start_time` nullable (string | null)
- **`is_scheduled` becomes derived:** `start_time !== null`
- **Creation flow:** Title → time (optional) → repeat (optional) → category → mindset → done

## Motion
- **Approach:** Intentional. Family-app quality.
- **Spring physics:** damping: 15, stiffness: 200 (on press, sheet expand, pill interactions)
- **Press feedback:** scale(0.97) on pills, scale(0.88) on tabs
- **Duration:** 150ms fast, 250ms normal, 400ms slow
- **Easing:** cubic-bezier(0.2, 0, 0, 1) for all interactive transitions

## Design Artifacts
All saved in `designs/` folder:
- **design-reference.html** — Master reference: colors, type, all components, rules, embedded mockup
- **today-screen-mockup.html** — Final full-day mockup (Sankalp's Monday, all pills with mindset)
- **task-interaction-states.html** — Collapsed → Expanded → Drag-to-schedule
- **watermark-scenarios.html** — Same-start, mid-pill, free-space, end-of-pill
- **activity-forms.html** — Create (blank), Create (filled), Edit screens with repeat logic + conflict warning
- **experience-log.html** — Post-activity logging bottom sheet (mood/energy/completion/reflection)
- **category-selection.html** — Category selection variant explorations (inline chips chosen)
- **conflict-detection.html** — Conflict detection variant explorations (smart suggestion chosen)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | Glass morphism for pills | Family app inspired. Clean surfaces, depth via shadows not borders. |
| 2026-03-31 | Removed solid accent bars | Too much visual noise. Category communicated via subtle tint instead. |
| 2026-03-31 | Instrument Sans only (no Fraunces serif) | Serif was too stylistic for dates. Clean sans everywhere, modern feel. |
| 2026-03-31 | Watermark as dark warm chip, right-aligned | Visible on warm bg. No collision detection needed. Simple rendering. |
| 2026-03-31 | Bottom task bar with sheet expand | Tasks don't compete with timeline. Drag-to-schedule converts task to pill. |
| 2026-03-31 | Everything is an Activity | One concept. Time optional, repeat optional. Simplest mental model. |
| 2026-03-31 | Mindset prompts: 2-line italic with "..." | Visible but not overwhelming. Shows the intention without dominating. |
| 2026-03-31 | Mindset always shown in all pill sizes | If mindset exists, always display it. Compact pills use 1-line truncation with "...". The mindset is the product's soul. |
| 2026-03-31 | Warm cream bg (#F5F0E8) kept | Distinctive in the space. Nobody else owns warm earth tones for productivity. |
| 2026-03-31 | Activity form field order locked | Title → Date/Time/Duration (one row) → Repeat → Mindset → Notes → Category → Subtasks → Action. |
| 2026-03-31 | Repeat as single chip + popup | "Once ▾" chip. Tap opens popup. Weekly shows day circles. Monthly shows "Repeat by" dropdown. Daily = just the label, no "Repeat every 1 day". |
| 2026-03-31 | Duration dash for unset | "—" instead of "None". Clearer visual. No "Custom" chip. |
| 2026-03-31 | Clock icon for unset time | 🕐 instead of "No time" text. Tap to set time. |
| 2026-03-31 | Category as dropdown, not dots | Dots were not readable enough. Now shows emoji + name + chevron. |
| 2026-03-31 | Mindset + Notes as single-line inputs | Not text boxes. Bottom border only. Compact. AI sparkle icon inline at right end of mindset. |
| 2026-03-31 | No section labels or dividers | Form flows continuously. Labels removed. Subtasks has no header. |
| 2026-03-31 | Placeholder: "What you want to do?" | Future-tense feels more intentional than present-tense. |
| 2026-03-31 | Category as inline chips (not dropdown) | Chips always visible. Emoji + name. Not mandatory — can leave unselected. "+" to add new. |
| 2026-03-31 | Duration on separate line from date/time | Keeps date+time row clean. Duration chips on their own row below. |
| 2026-03-31 | Conflict: smart suggestion pattern | Amber warning + "Try [time]?" chip. Non-blocking. Calendar view deferred to future scope. |
| 2026-03-31 | Experience log: bottom sheet | Mood (5 emojis), Energy (5 emojis), Completion (3 chips), Reflection (1-line input). Button: "Reflect & Close". Pencil icon for edit. No skip button. |
| 2026-03-31 | Energy uses emoji icons not numbers | 🪫 Drained, 😴 Low, 😌 Steady, ⚡ High, 🔥 Peak. More expressive than 1-5 numbers. |
| 2026-03-31 | Subtask empty state: "+" circle + "Subtask" text | When no subtasks, show plus icon with label. When items exist, just the plus icon. |
