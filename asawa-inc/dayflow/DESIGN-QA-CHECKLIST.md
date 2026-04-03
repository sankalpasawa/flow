# DayFlow Design QA Checklist

Run this checklist every session. Every item must pass. No exceptions.

## Known Recurring Issues (from past sessions)

These bugs have come back before. Check them FIRST.

- [ ] **10 PM / 11 PM hour labels cut off** — hourRow must have real height (not `height: 0`). Labels must render fully without clipping. Check all hours 10 AM, 11 AM, 12 PM, 10 PM, 11 PM specifically.
- [ ] **Bottom task bar gap** — "All done" empty state must be same height as normal collapsed state (44px). No gap between bar and tab bar.
- [ ] **Pills intersecting** — overlapping activities must have a gap (4px minimum) between columns. Check 2-way and 3-way overlaps.
- [ ] **Mindset text clipping** — `overflow: hidden` must NOT be on pill containers. Mindset italic text must show fully.
- [ ] **Swipe conflict (pill vs page)** — pill swipe threshold (15px) must be lower than page swipe (80px). Test: swipe a pill right to complete.
- [ ] **Watermarks not showing** — filter uses `!a.start_time || a.start_time === ''`. Empty string is truthy. Both cases must be handled.
- [ ] **Long-press opening activity instead of drag** — tap gesture must not have onPress in longPress handler.
- [ ] **Screen resetting to day start** — `hasAutoScrolled` ref must persist across re-renders.
- [ ] **useNativeDriver mismatch** — all animations in a `parallel()` group must use the same `useNativeDriver` value.
- [ ] **Foreign key seed error** — non-blocking but should be checked. App must still load data.

---

## Theme Tokens (theme.ts)

Every value must match DESIGN.md exactly.

### Colors
- [ ] `colors.bg` = `#F5F0E8`
- [ ] `colors.text` = `#1A1714`
- [ ] `colors.text2` = `#4A4540`
- [ ] `colors.muted` = `#8C857D`
- [ ] `colors.border` = `#E0D9CE`
- [ ] `colors.primary` = `#2D5A3E`
- [ ] `colors.accent` = `#C4795B`
- [ ] `colors.glass.bg` = `rgba(255,255,255,0.65)`
- [ ] `colors.glass.border` = `rgba(255,255,255,0.75)`
- [ ] `colors.glass.blur` = `20`
- [ ] `colors.glass.sheet` = `rgba(255,255,255,0.85)`
- [ ] `colors.watermark.text` = `#8B4A30`
- [ ] `colors.watermark.bg` = `rgba(181,99,74,0.12)`
- [ ] `colors.categoryTint` = `0.06`

### Typography Scale
- [ ] display: 32px / 700
- [ ] heading: 22px / 700
- [ ] title (pill names): 14px / 700
- [ ] body: 13px / 500
- [ ] small: 11px / 500
- [ ] caption (hour labels): 10px / 600 / Geist Mono (Menlo on iOS)
- [ ] micro (watermark): 9px / 600
- [ ] mindset: 9.5px / 400 italic / 0.6 opacity / lineHeight 13

### Sizes
- [ ] FAB: 52px / 16px radius
- [ ] Tab bar: 82px height
- [ ] Date chip: 48x60px / 16px radius
- [ ] Header buttons: 36x36px / 12px radius
- [ ] Pill radius: 14px normal / 12px compact
- [ ] Pill padding: 10px 12px normal / 6px 10px compact
- [ ] Drag handle: 36x4px
- [ ] Now indicator dot: 10px
- [ ] Bottom task bar collapsed: 44px
- [ ] Touch target minimum: 44px

### Motion
- [ ] Spring: damping 15 / stiffness 200
- [ ] Press feedback: scale 0.97 (pills) / 0.88 (tabs)
- [ ] Fast: 150ms / Normal: 250ms / Slow: 400ms

### Shadows
- [ ] Pill: shadowColor #000, offset 0/3, opacity 0.06, radius 8, elevation 3

---

## Component-Level Checks

### ActivityCard (pill)

- [ ] Glass background uses `glassTintBackground()` at 0.65 base opacity
- [ ] Category tint at 6% opacity (`categoryTint: 0.06`)
- [ ] Border: 1px `colors.glass.border`
- [ ] Border radius: 14px (normal), 12px (compact < 50px height)
- [ ] Title: 14px / 700 / `colors.text`
- [ ] Title compact: 12px
- [ ] Category icon: 15px
- [ ] Mindset: 9.5px / italic / 0.6 opacity / `colors.text2`
- [ ] Mindset compact: 8.5px
- [ ] Mindset always visible when set (no overflow clipping)
- [ ] Shadow: offset 0/3, opacity 0.06, radius 8
- [ ] "Now" card: accent glow shadow `colors.accent`
- [ ] Done card: 0.4 opacity, strikethrough title
- [ ] Swipe-to-complete: threshold 80px, accent green background
- [ ] Tap feedback: scale 0.97
- [ ] Long-press: scale 1.03, activates drag after 400ms
- [ ] Subtask progress bar: 3px height, primary color fill
- [ ] No accent bars. Category via tint ONLY.

### CanvasScreen

- [ ] Background: `colors.bg`
- [ ] Header: "Today" title using `type.h1` (32px/700)
- [ ] Today button: 36x36px, 12px radius, green top bar accent
- [ ] Search button: 36x36px, 12px radius
- [ ] Hour labels: 10px / 600 / monospace (Menlo) / 0.35 opacity / `colors.muted`
- [ ] Hour label for current hour: `colors.accent` / 700 / opacity 1
- [ ] Hour lines: 1px / `colors.border` / 0.2 opacity
- [ ] Past hour lines: 0.1 opacity
- [ ] Now indicator dot: 10px / `colors.accent` / pulsing glow shadow
- [ ] Now line: 2px / `colors.accent` / 0.8 opacity
- [ ] Watermark chips: right-aligned / z-index 8 / micro font (9px)
- [ ] FAB: 52x52px / 16px radius / primary green / fab shadow
- [ ] FAB position: bottom 88, right 20
- [ ] Activity blocks: left = HOUR_LABEL_WIDTH, right margin 12
- [ ] Overlapping pills: column layout with 4px gap
- [ ] Completed/skipped activities: 0.5 opacity
- [ ] List view title: 14px / 700
- [ ] List view mindset: 9.5px / italic / 0.6 opacity
- [ ] List view circles: 24px, three states (empty/half/full)
- [ ] Auto-scroll to current time on load
- [ ] Pinch-to-zoom: 0.7x to 2.0x scale

### DateStrip

- [ ] Chip: 48x60px / 16px radius
- [ ] Selected chip: primary green background / shadow
- [ ] Today chip (unselected): primaryBg background
- [ ] Day name: micro type / muted
- [ ] Day number: 19px / 600
- [ ] Selected text: white
- [ ] Pull handle: 36x4px / border color / toggles calendar
- [ ] Calendar open: strip fades out, calendar fades in (no both visible)
- [ ] Calendar: month label 15px/600, nav arrows 36x36, day cells 14.28% width
- [ ] Calendar selected: primary bg / 18px radius / white text / 700
- [ ] Calendar today (unselected): primary color / 700
- [ ] Calendar muted (other month): 0.4 opacity
- [ ] "Go to Today" button when not on today
- [ ] Animation: useNativeDriver consistent (all false for height animation)

### BottomTaskBar

- [ ] Collapsed height: 44px (ALWAYS, including empty state)
- [ ] Collapsed bg: rgba(255,255,255,0.75) glass
- [ ] Border top: 0.5px / rgba(224,217,206,0.5)
- [ ] Next task title: 13px / 500 / text2
- [ ] Count badge: primaryBg background / primary text / monospace / 10px
- [ ] Checkbox: 16x16 / 5px radius / 1.5px border
- [ ] Empty state: "✓ All done" + "+" circle
- [ ] Expanded sheet: rgba(255,255,255,0.85) glass / 20px top radius
- [ ] Expanded drag handle: 36x4px / border color
- [ ] Task row: 11px padding / hairline bottom border
- [ ] Expanded checkbox: 20x20 / 10px radius
- [ ] Task title: 14px / 500
- [ ] Category dot: 8x8 / 4px radius
- [ ] Spring animation: damping 15, stiffness 200
- [ ] Swipe down to dismiss (50px threshold)

### ActivityFormScreen

- [ ] Bottom sheet with drag handle
- [ ] Sheet bg: `colors.bg`
- [ ] Title input: 20px / 600 / placeholder "What you want to do?"
- [ ] All colors use theme tokens (no hardcoded hex)
- [ ] Chip bg: rgba(255,255,255,0.55)
- [ ] Chip selected: primary green
- [ ] Section title: 11px / 600 / muted / uppercase / 0.6 letter spacing
- [ ] Duration chips: "—", "15m", "30m", "1h", "2h"
- [ ] Repeat: "Once ▾" chip → popup with options
- [ ] Weekly repeat: day-of-week circles
- [ ] Mindset input: single line / sparkle icon for AI
- [ ] Category: inline chips with emoji
- [ ] Subtasks: no header label, green "+" circle
- [ ] Save button: full width / primary green / 12px radius
- [ ] Conflict banner: amber warning with suggestion chip
- [ ] Swipe-to-dismiss: modal presentation with gesture

### ExperienceLogScreen

- [ ] Bottom sheet with drag handle (36x4px)
- [ ] Sheet bg: `colors.bg`
- [ ] Mood circles: 44px / 5 emojis (😞😕😐🙂😊) / accent highlight
- [ ] Energy circles: 44px / 5 emojis (🪫😴😌⚡🔥) / primary green highlight
- [ ] Completion chips: "Skipped", "Half done", "Completed"
- [ ] Reflection input: single line / "Any thoughts on how it went?"
- [ ] Button: "Reflect & Close" (NOT "Done")
- [ ] Pencil edit icon to switch to ActivityForm
- [ ] Activity header: icon + name + time range (not editable)
- [ ] All colors use theme tokens

### QuickAddScreen

- [ ] Bottom sheet with drag handle (36x4px)
- [ ] Text input: 20px / 500 / "What do you want to do?"
- [ ] "or fill form manually" link: 13px / muted
- [ ] Parsed chips: glass bg / glass border / 12px radius
- [ ] Chip text: 13px / 500 / text
- [ ] Bold chip (title): 700 weight
- [ ] Create button: primary green / 12px radius / 52px min height
- [ ] Action message: accent bg (0.08 opacity) / accent text
- [ ] LLM hint: 12px / muted / italic
- [ ] Button label changes: Create / Update / Remove / Move / Done
- [ ] 600ms debounce on text input

### AppNavigator (Tab Bar)

- [ ] Height: 82px / padding bottom 24
- [ ] Background: rgba(255,255,255,0.70) glass
- [ ] Border top: 0.5px / rgba(224,217,206,0.5)
- [ ] Active tint: primary green
- [ ] Inactive tint: muted
- [ ] Label: 11px / 600
- [ ] Icons: correct symbols for each tab
- [ ] Tab press feedback: scale 0.88 on inactive
- [ ] Hidden on keyboard open

### PlayScreen

- [ ] Voice mic button: 80px / 40px radius / primary green / fab shadow
- [ ] Hint text: 13px / muted
- [ ] Suggestion chips: glass bg / glass border / 20px radius
- [ ] Input bar: glass input / 24px radius / send button 40px
- [ ] WebView result: full DayFlow design tokens injected
- [ ] Re-ask bar at bottom when showing results
- [ ] "New" button to reset
- [ ] HTML output uses card/chip/stat/sparkline classes

### Auth Screens (SignIn, SignUp)

- [ ] Background: `colors.bg`
- [ ] Logo text: primary color
- [ ] Subtitle: muted color
- [ ] Input: surface background / text color
- [ ] Placeholder: muted color
- [ ] Button: primary green
- [ ] Links: muted + primary bold
- [ ] All colors use theme tokens

### Settings, Plan, Insights, LogForm, LogHistory, ActivityDetail

- [ ] Background: `colors.bg`
- [ ] All text colors use theme tokens
- [ ] All button colors use theme tokens
- [ ] No hardcoded hex values (grep for `#2D4A3E`, `#FAF7F2`, `#1A1A1A`, `#5A5550`)

---

## Cross-Component Checks

### Glass Morphism Consistency
- [ ] Every glass surface: rgba(255,255,255,0.65) + 1px rgba(255,255,255,0.75) border
- [ ] Sheets: rgba(255,255,255,0.85)
- [ ] Tab bar: rgba(255,255,255,0.70)
- [ ] Backdrop blur: 20px (pills), 24px (sheets, tab bar)

### Typography Consistency
- [ ] All pill titles: 14px / 700
- [ ] All mindset text: 9.5px / italic / 0.6 opacity
- [ ] All hour labels: 10px / 600 / monospace
- [ ] All watermarks: 9px / 600
- [ ] All section titles: 11px / 600 / uppercase / muted
- [ ] No font size orphans (values that don't match the type scale)

### Color Token Compliance
- [ ] `grep -r "#2D4A3E" src/` returns zero results
- [ ] `grep -r "#FAF7F2" src/` returns zero results
- [ ] `grep -r "#1A1A1A" src/` returns zero results
- [ ] `grep -r "#5A5550" src/` returns zero results
- [ ] `grep -r "#4B4642" src/` returns zero results
- [ ] `grep -r "#746E69" src/` returns zero results
- [ ] `grep -r "#DED6CA" src/` returns zero results

### Spacing & Alignment
- [ ] All horizontal page padding: 24px (`spacing.screen`)
- [ ] Base grid: 4px increments
- [ ] Touch targets: minimum 44px
- [ ] All drag handles: 36x4px centered
- [ ] All sheet top radii: 24px (`radii.sheet`)

### Animation Consistency
- [ ] All springs: damping 15, stiffness 200
- [ ] All press scales: 0.97 (pills), 0.88 (tabs/buttons)
- [ ] All fast transitions: 150ms
- [ ] All normal transitions: 250ms
- [ ] No `useNativeDriver` mismatches in parallel animation groups

### Rendering Rules (Data → UI)
- [ ] `start_time` set → calendar pill
- [ ] No `start_time` + recurring → watermark chip (right-aligned)
- [ ] No `start_time` + not recurring → bottom bar task
- [ ] Empty string `start_time` treated same as null

---

## QA Procedure

### How to run QA

1. **Grep audit first**: Run the color token compliance greps. Fix any hardcoded values before visual check.

2. **Read every StyleSheet**: Open each component file, read the StyleSheet.create block, compare every value against this checklist.

3. **Check known recurring issues**: Go through the "Known Recurring Issues" section at the top. These are bugs that have come back before.

4. **Component walk-through**: For each component in the checklist, read the code and verify every pixel value.

5. **Cross-component checks**: Verify consistency across all files (same glass values, same typography, same spacing).

6. **Three-pass rule**: Do the full audit three times. First pass catches obvious mismatches. Second pass catches things you normalized on first pass. Third pass confirms zero issues.

7. **After fixing**: Re-read every file you changed to verify the fix didn't break something else.

### When to run QA

- Every session start (before writing new features)
- After any style/theme changes
- After adding new components
- Before every commit that touches UI files
- When user reports a visual issue

### What to do when a new issue is found

1. Fix the issue
2. Add it to the "Known Recurring Issues" section at the top of this file
3. Add a specific check item in the relevant component section
4. Grep the entire codebase for the same pattern (the bug likely exists in multiple files)
