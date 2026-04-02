# Feature Design Specifications — DayFlow

Every feature documented to pixel-level precision. Someone reading this should be able to implement any feature from scratch without seeing the original code.

---

## 1. ActivityCard (Pill)

### Visual Spec

| Property | Normal | Compact (<50px height) |
|----------|--------|----------------------|
| Border radius | 14px | 12px |
| Padding | 10px 12px | 6px 10px |
| Background | rgba(255,255,255,0.65) + backdrop-filter: blur(20px) | Same |
| Border | 1px solid rgba(255,255,255,0.75) | Same |
| Shadow | 0 3px 8px rgba(0,0,0,0.06) (primary layer), 0 1px 2px rgba(0,0,0,0.04) (tight), 0 8px 20px rgba(0,0,0,0.04) (ambient) | Same |
| Min height | 50px | Auto (content-driven) |
| Width | Full column width minus 24px horizontal screen padding | Same |

**Category tint calculation:**
- Take the category's solid color (e.g., terra #B5634A)
- Apply at 12% opacity (`colors.categoryTint: 0.12`) as a linear-gradient overlay on top of the glass background
- Formula: `linear-gradient(rgba(cat-color, 0.06), rgba(cat-color, 0.06))` layered on `rgba(255,255,255,0.65)`
- DESIGN.md specifies 5-7% for the gradient overlay; theme.ts uses 0.12 for the tint token. Use the gradient at 6% on the glass surface.

**Content structure (top to bottom):**
- **Row 1:** Category icon (emoji, 15px) + 4px gap + Title (14px / 700 weight, Instrument Sans, color #1A1714)
- **Row 2:** Mindset prompt (9.5px / 400 italic, Instrument Sans, line-height 13px, color #1A1714 at 0.6 opacity, 2-line clamp with "..." in normal pills, 1-line clamp with "..." at 8.5px in compact pills). Row hidden entirely if no mindset is set.
- **Row 3 (optional, tall pills only):** Subtask progress bar + count (e.g., "2/5"). Progress bar uses primary green #2D5A3E fill, #E0D9CE track.

**No accent bars.** Category communicated via subtle tint only.

**Overlap handling:** Two concurrent events split width 50/50 with a small gap (4px) between them.

### States

| State | Visual Treatment |
|-------|-----------------|
| **Normal (idle)** | Glass bg + category tint + full opacity. Default rendering. |
| **Compact** | Height < 50px. Radius 12px. Padding 6px 10px. Mindset truncates to 1 line at 8.5px. |
| **Done (completed)** | Title gets strikethrough text decoration. Entire pill opacity 0.4. Category tint remains. |
| **Skipped** | Same as done: strikethrough + 0.4 opacity. Completion status stored as "Skipped" in experience log. |
| **Now-active** | Border color changes to accent #C4795B at 0.5 opacity. Subtle accent glow: 0 0 12px rgba(196,121,91,0.15). |
| **Overdue** | "Overdue" badge: warm amber bg rgba(196,121,91,0.15), text #C4795B, 8px font, 6px radius, positioned top-right of pill. Pill itself unchanged. |
| **Pressed** | scale(0.97) with spring physics (damping 15, stiffness 200). Duration ~150ms. |
| **Dragging** | Opacity 0.8, elevated shadow (fab shadow: offset 0/6, opacity 0.15, radius 16). Scale 1.02. |
| **Empty (no activities)** | No pills rendered. Canvas shows only grid lines and hour labels. No empty state message on the canvas itself. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap** | Scale 0.97 spring feedback. Opens edit form as bottom sheet (no detail view, goes directly to edit). |
| **Tap (past/completed activity)** | Opens Experience Log bottom sheet instead of edit form. Logging takes precedence for past activities. |
| **Swipe right (to complete)** | Threshold: 80px. Green background (#2D5A3E) reveals behind pill as it slides. Checkmark icon fades in on green bg. If swipe exceeds 80px and releases: marks as complete, pill animates to done state (strikethrough + 0.4 opacity). If released before 80px: spring back to original position. |
| **Swipe right cancel** | Spring back: damping 15, stiffness 200. Pill returns to x=0. |
| **Long-press (drag to reschedule)** | 400ms activation delay. Haptic feedback on activate. Pill lifts (scale 1.02, fab shadow). Snaps to 15-minute grid intervals while dragging. Time badge appears showing the new time (e.g., "10:15 AM") in a small tooltip above the pill. Drop releases at new time. |
| **Long-press drag grid** | 15-minute intervals. HOUR_HEIGHT = 80px, so each 15-min = 20px snap. |
| **Pinch (on canvas, not pill)** | See CanvasScreen pinch zoom. |

### Animations

| Animation | Spec |
|-----------|------|
| Press feedback | spring: damping 15, stiffness 200, toValue 0.97, then back to 1.0 |
| Swipe-to-complete reveal | Animated.spring, damping 15, stiffness 200 |
| Swipe cancel spring-back | spring: damping 15, stiffness 200, toValue 0 |
| Long-press lift | 400ms delay, then scale to 1.02 (150ms, easing cubic-bezier(0.2, 0, 0, 1)) |
| Done state transition | opacity fade to 0.4 over 250ms |
| Drag time badge | FadeIn 150ms on appear, follows finger position |

### Edge Cases

| Case | Handling |
|------|----------|
| Very long title (50+ chars) | Single line, truncated with "..." via numberOfLines={1} |
| Very long mindset (100+ chars) | Normal: 2-line clamp with "...". Compact: 1-line clamp with "..." at 8.5px |
| No mindset set | Mindset row hidden entirely. Pill height shrinks accordingly. |
| No category | No tint applied. Pure glass surface. |
| Zero-duration activity with time | Rendered as watermark chip, not as a pill. |
| 15-minute activity | Compact pill. Min height driven by content. Radius 12px. |
| 8-hour activity | Pill height = 8 * 80px = 640px. Row 3 (subtasks) visible. Full content displayed. |
| Two overlapping activities | Side by side, 50/50 width split, 4px gap. |
| Three+ overlapping | Each gets equal width fraction: width / N with (N-1) * 4px gaps. |
| Activity spans midnight | Not supported. Single-day view. Activity truncated at 11:59 PM. |

---

## 2. CanvasScreen

### Visual Spec

**Header area (fixed, sticky on scroll):**

| Element | Spec |
|---------|------|
| Title "Today" | 22px / 700 weight, Instrument Sans, color #1A1714, letterSpacing -0.3 |
| Today button | 36x36px, 12px radius, gradient white-to-cream bg, subtle shadow (xs: offset 0/1, opacity 0.04, radius 2). Green top bar accent (2px height, primary #2D5A3E). Contains date number. |
| Header buttons | 36x36px, 12px radius, gradient white-to-cream, shadow xs |

**Timeline grid:**

| Element | Spec |
|---------|------|
| Hour height | 80px per hour |
| Hour labels | 10px / 600 weight, Geist Mono, letterSpacing 0.3, color #8C857D at opacity 0.35. Left-aligned. |
| Current hour label | Color #C4795B (accent), weight 700, opacity 1.0. Stands out from other labels. |
| Grid lines (horizontal) | 1px height, color #E0D9CE, opacity 0.4 for future hours, opacity 0.2 for past hours |
| Vertical canvas padding | 24px horizontal (screen padding) |
| Total canvas height | 24 hours * 80px = 1920px scrollable |

**Now indicator:**

| Element | Spec |
|---------|------|
| Dot | 10px diameter, color #C4795B (accent), positioned at left edge of timeline |
| Dot glow | Pulsing animation: 2.5s ease-in-out infinite. Glow expands from 0px to 8px blur radius, opacity oscillates 0.6 to 0.2. |
| Line | 2px height, horizontal gradient from #C4795B (left, full opacity) to transparent (right). Extends full width of canvas. |
| Position | top = (currentHour + currentMinute/60) * 80px |
| Update | Recalculates position every 60 seconds |

**FAB (Floating Action Button):**

| Property | Value |
|----------|-------|
| Size | 52x52px |
| Border radius | 16px |
| Background | Primary gradient (#3E7A55 to #2D5A3E) |
| Shadow | fab: offset 0/6, opacity 0.15, radius 16, elevation 8 |
| Icon | "+" white, 24px |
| Position | Bottom-right, 24px from right edge, 24px above tab bar |
| Press feedback | scale(0.97) spring |
| Tap action | Opens QuickAddScreen (text-to-action mode) |

**Color wash (behind glass):**
- Radial gradients of category colors at 4-5% opacity placed behind the canvas
- Gives the glass pills something to blur against, creating depth
- Gradients centered roughly where category-colored pills cluster

### States

| State | Behavior |
|-------|----------|
| **Loading** | No explicit loading state. Canvas renders from local SQLite/in-memory DB. Instant. |
| **Empty (no activities today)** | Grid lines and hour labels still render. Now indicator still shows. No empty state illustration. Canvas is just the clean grid. |
| **Populated** | Pills positioned at their time slots. Watermarks floating at z-index 8. |
| **Past hours** | Grid line opacity 0.2 (dimmed). Pills in past are tappable (opens experience log if completed). |
| **Scrolled** | Header remains fixed/sticky. Canvas scrolls vertically. |
| **Zoomed** | Pinch zoom active. HOUR_HEIGHT scales between 0.7x (56px) and 2.0x (160px). |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Vertical scroll** | Standard ScrollView behavior. Scrolls through 24-hour timeline. |
| **Horizontal swipe left** | Navigate to next day. Date strip updates. Canvas reloads for new date. |
| **Horizontal swipe right** | Navigate to previous day. Date strip updates. |
| **Pinch zoom** | Scale range: 0.7x to 2.0x of base HOUR_HEIGHT (80px). 0.7x = 56px/hour (overview). 2.0x = 160px/hour (detail). Zoom centered on pinch midpoint. |
| **Tap empty space** | No action. (FAB is the creation entry point.) |
| **Pull to refresh** | Reloads activities from DB. Standard pull-to-refresh with warm cream spinner. |

### Auto-scroll

| Property | Value |
|----------|-------|
| Target | Current time minus 2 hours. Formula: `scrollY = max(0, (currentHour - 2) * HOUR_HEIGHT)` |
| Animated | `false` (instant jump on screen mount) |
| Trigger | On initial mount, on returning to Today tab, on date change back to today |

### Animations

| Animation | Spec |
|-----------|------|
| Now indicator pulse | 2.5s ease-in-out infinite loop. Glow radius: 0px to 8px. Opacity: 0.6 to 0.2. |
| Day transition | Cross-fade 250ms when swiping between days |
| Pinch zoom | Real-time transform, no animation needed (direct gesture tracking) |
| FAB press | spring: damping 15, stiffness 200, scale 0.97 |

### Edge Cases

| Case | Handling |
|------|----------|
| 20+ activities in one day | All render. No virtualization needed (max 1920px canvas). Overlapping pills stack side-by-side. |
| All activities in 1 hour | Side-by-side split. At 5+ concurrent, pills become very narrow but still show truncated title. |
| No network | All data local. Canvas renders normally. Sync indicator (if any) shows offline. |
| Midnight activities | 12:00 AM is top of canvas (position 0). 11:59 PM is bottom. |
| Date far in future | Same canvas, same layout. No visual difference from today except no now indicator. |

---

## 3. DateStrip

### Visual Spec

| Element | Spec |
|---------|------|
| Container | Horizontal ScrollView, height ~72px (60px chips + 12px padding) |
| Chip size | 48px wide x 60px tall |
| Chip radius | 16px |
| Chip gap | 8px between chips |
| Unselected chip bg | White (#FFFFFF) at 0.8 opacity |
| Unselected chip text | Day name: 10px / 600, color #8C857D. Date number: 18px / 700, color #1A1714. |
| Selected chip bg | Primary gradient: #3E7A55 to #2D5A3E |
| Selected chip text | Day name: 10px / 600, white. Date number: 18px / 700, white. |
| Selected chip shadow | card shadow: offset 0/3, opacity 0.08, radius 8, elevation 3 |
| Today indicator | Small green dot (4px) above the date number on the today chip, even when not selected |
| Activity dot indicators | Small dots (3px) below date number showing days with activities. Color #C4795B if has activities. Max 3 dots shown. |

**Month calendar (pull-down):**

| Element | Spec |
|---------|------|
| Pull handle | 36x4px bar, color #E0D9CE, radius 2px, centered below the date strip |
| Month/year title | 18px / 600, Instrument Sans, centered |
| Navigation arrows | Left arrow and right arrow, 36x36px touch targets, 12px radius |
| Calendar grid | 7 columns (S M T W T F S), cell size 44x44px |
| Day label headers | 10px / 600, color #8C857D, Geist Mono |
| Day number | 14px / 500, color #1A1714 |
| Selected day | Primary green bg circle (36px diameter), white text |
| Today (unselected) | Accent #C4795B text, no bg fill |
| Outside month days | Opacity 0.3 |

### States

| State | Behavior |
|-------|----------|
| **Idle (strip visible)** | Horizontal strip of day chips. Selected day highlighted in green. |
| **Calendar open** | Strip fades out (opacity 0), calendar fades in (opacity 1). `useNativeDriver: false` for opacity animations on both. |
| **Calendar closed** | Calendar fades out, strip fades back in. Same `useNativeDriver: false`. |
| **Scrolled to edge** | Strip auto-loads more days in that direction (7 days at a time). |
| **Today selected** | Today chip has green gradient bg + shadow. |
| **Other day selected** | That chip gets green gradient bg. Today chip reverts to unselected style but keeps the small green dot indicator. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap chip** | Selects that day. Canvas reloads for selected date. Spring scale 0.97 feedback on chip. |
| **Horizontal swipe on strip** | Scrolls through days. Standard horizontal scroll momentum. |
| **Pull down on handle** | Expands to month calendar view. Strip fades out, calendar fades in. |
| **Tap day in calendar** | Selects that day. Calendar dismisses (fades out), strip fades back in with selected day centered. |
| **Tap month arrows** | Navigates to prev/next month in calendar view. |
| **Tap outside calendar** | Dismisses calendar, returns to strip view. |

### Animations

| Animation | Spec |
|-----------|------|
| Strip fade out | Animated.timing, 250ms, opacity 1 to 0, useNativeDriver: false |
| Calendar fade in | Animated.timing, 250ms, opacity 0 to 1, useNativeDriver: false |
| Calendar fade out | Animated.timing, 250ms, opacity 1 to 0, useNativeDriver: false |
| Strip fade in | Animated.timing, 250ms, opacity 0 to 1, useNativeDriver: false |
| Chip tap | spring: damping 15, stiffness 200, scale 0.97 |
| Selected chip transition | bg color crossfade 150ms |

### Edge Cases

| Case | Handling |
|------|----------|
| Very far past/future dates | Strip generates chips dynamically. No limit on date range. |
| January/December boundary | Month calendar correctly wraps. Strip scrolls continuously across year boundaries. |
| Leap year Feb 29 | Standard date library handling. Chip renders normally. |
| No activities on selected day | Canvas shows empty grid. Strip chip has no activity dot indicators. |
| 50+ activities on a day | Activity dot indicator still shows max 3 dots regardless. |

---

## 4. BottomTaskBar

### Visual Spec

**Collapsed state:**

| Property | Value |
|----------|-------|
| Height | 44px always (fixed, not content-dependent) |
| Background | rgba(255,255,255,0.75) (glass) |
| Backdrop filter | blur(20px) |
| Border top | 1px solid rgba(255,255,255,0.75) |
| Position | Fixed above tab bar |
| Content | Next uncompleted task name (13px / 500, #1A1714) + "+N" count badge if more tasks exist |
| Count badge | 11px / 600, color #8C857D, e.g., "+3" |
| Empty state | Text "All done" (13px / 500, #8C857D) centered. Still 44px height. |
| Drag handle | 36x4px bar, #E0D9CE, radius 2px, centered at top of bar |

**Expanded state:**

| Property | Value |
|----------|-------|
| Background | rgba(255,255,255,0.85) (denser glass) |
| Backdrop filter | blur(24px) |
| Border radius | 20px top-left, 20px top-right, 0 bottom |
| Max height | 60% of screen height |
| Shadow | modal: offset 0/-4, opacity 0.12, radius 20 |
| Drag handle | 36x4px bar, #E0D9CE, radius 2px, centered at top |
| Task row height | 44px per task (touch target minimum) |
| Task row content | Checkbox (20px circle, 1.5px border #E0D9CE, primary green fill when checked) + 8px gap + Category dot (8px, category solid color) + 8px gap + Task name (13px / 500, #1A1714) + drag handle icon ( three dots, 24px, #8C857D) at right edge |
| Completed task | Strikethrough on name, 0.4 opacity, checkbox filled green with white checkmark |
| Padding | 16px horizontal, 8px vertical between tasks |

### States

| State | Behavior |
|-------|----------|
| **Collapsed (default)** | 44px bar. Shows next task preview + count. |
| **Expanded** | Sheet slides up. Full task list visible. Scrollable if many tasks. |
| **Empty (no tasks)** | Collapsed bar shows "All done" centered. Cannot expand (nothing to show). |
| **All completed** | Collapsed bar shows "All done". Expanded view shows completed tasks at 0.4 opacity. |
| **Dragging task** | Task being dragged lifts with fab shadow. Other tasks shift to make room. |
| **Drag-to-schedule** | Long-press drag handle on a task -> drag upward onto canvas timeline. Dashed ghost rectangle shows landing position. Time label appears at drop point. Drop converts task to timed pill. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap collapsed bar** | Expands to full task list with spring animation. |
| **Swipe up on collapsed bar** | Same as tap — expands. |
| **Swipe down on expanded sheet** | Collapses back to 44px. Threshold: 50px downward gesture. |
| **Tap outside expanded sheet** | Collapses. Dim overlay receives the tap. |
| **Tap task checkbox** | Toggles completion. Animated checkmark fill (150ms). |
| **Tap task name** | Opens edit form (ActivityFormScreen) as bottom sheet. |
| **Long-press drag handle** | Activates drag-to-schedule. Task lifts from list. Drag onto canvas to convert to timed pill. |
| **Reorder tasks** | Long-press drag handle (without dragging onto canvas) allows reordering within the task list. |

### Animations

| Animation | Spec |
|-----------|------|
| Expand | spring: damping 15, stiffness 200. Height animates from 44px to content height (max 60% screen). |
| Collapse | spring: damping 15, stiffness 200. Height animates back to 44px. |
| Swipe down dismiss | If gesture > 50px threshold: triggers collapse spring. If < 50px: spring back to expanded. |
| Task complete | Checkbox: scale 0 to 1 (spring, 150ms). Text: strikethrough animates left-to-right 200ms. Opacity: 1 to 0.4 over 250ms. |
| Drag-to-schedule | Dashed ghost: opacity 0 to 0.6 (150ms). Time label: FadeIn 150ms. |
| Task reorder | Other tasks shift with spring: damping 15, stiffness 200. |

### Edge Cases

| Case | Handling |
|------|----------|
| Zero tasks | Shows "All done" in collapsed bar. Does not expand. |
| 1 task | Collapsed shows the task name, no "+N" badge. Expanded shows single task row. |
| 20+ tasks | Expanded sheet scrolls. Max height 60% of screen. ScrollView inside the sheet. |
| Very long task name | Truncated with "..." in both collapsed and expanded views. Single line. |
| Drag to schedule, drop on occupied time | Creates overlapping pill. No conflict blocking (same as form behavior — non-blocking amber warning). |
| Network offline | Tasks are local. No impact. |

---

## 5. ActivityFormScreen

### Visual Spec

**Container:**

| Property | Value |
|----------|-------|
| Type | Bottom sheet (modal) |
| Background | rgba(255,255,255,0.85) (glass sheet) |
| Backdrop filter | blur(24px) |
| Border radius | 20px top-left, 20px top-right |
| Shadow | modal: offset 0/-4, opacity 0.12, radius 20 |
| Dim overlay | rgba(0,0,0,0.3), tappable to dismiss |

**Layout (top to bottom, no section labels, no dividers, continuous flow):**

1. **Drag handle** — 36px wide x 4px tall, color #E0D9CE, radius 2px, centered, 8px top margin

2. **Title input** — 20px / 600 weight, Instrument Sans, color #1A1714. Placeholder: "What you want to do?" in #8C857D. No border, no background. Full width. 16px top margin.

3. **Date + Time row** — horizontal, wrapping
   - Date chip: "Today" default text, 11px / 500, glass bg + border, 10px radius, 32px height, 12px horizontal padding. Shows specific date when changed (e.g., "Apr 3").
   - Time chip: Shows clock emoji when unset. Shows time like "10:30 AM" when set. Same chip style.
   - Gap: 8px between chips.
   - 12px top margin from title.

4. **Duration chips row** — horizontal, wrapping, 8px top margin
   - Chips: "---" (unset), "15m", "30m", "1h", "2h". Each chip: 32px height, 10px radius, glass bg + border, 11px / 500 text.
   - Selected chip: primary green bg (#2D5A3E), white text.
   - Custom duration: If user enters custom value, it appears as a chip sorted ascending among the presets. No "Custom" label chip.

5. **Repeat chip** — "Once (down triangle)" single chip. 8px top margin. Same chip style.
   - Tap opens popup:
     - Popup: glass bg rgba(255,255,255,0.92), 16px radius, shadow modal, 16px padding
     - Options as chips: Once, Daily, Weekly, Monthly, Yearly
     - Weekly selected: shows day-of-week circles below (S M T W T F S), each 32px circle, tap to toggle
     - Monthly selected: shows "Repeat by: Day of the month (down triangle)" dropdown
     - Daily/Yearly: just the frequency label, no redundant "every 1 day" text
     - "Never ends" toggle at bottom of popup (switch component, primary green when on)

6. **Mindset input** — 12px top margin
   - Label: "MINDSET" — 11px / 500, uppercase, letterSpacing 0.3, color #8C857D
   - Input: single-line, 13px / 500, bottom border only (1px #E0D9CE), placeholder "Set an intention..." in #8C857D
   - Sparkle icon: 24x24px, positioned at right end of input, tap triggers AI mindset generation

7. **Notes input** — 12px top margin
   - Label: "NOTES" — same style as mindset label
   - Input: single-line, 13px / 500, bottom border only, placeholder "Add details..."

8. **Category** — 12px top margin
   - Inline chips layout (horizontal wrap)
   - Each chip: emoji + name, glass bg + border, 10px radius, 32px height
   - Selected chip: accent border (1px #C4795B), subtle accent tint bg
   - "+" chip at end: 32px circle, primary green bg, white "+", tap opens new category creation
   - Not mandatory — can leave unselected

9. **Subtasks** — 12px top margin
   - No label header
   - Existing subtasks: checkbox (20px circle) + task text (13px / 500), one per row, 36px row height
   - Completed subtask: green filled checkbox, strikethrough text, 0.4 opacity
   - Add button: green "+" circle (24px), no text when items exist. Shows "+" icon + "Subtask" text when empty.
   - Count: "2/5" inline (10px / 600, Geist Mono, #8C857D) when items exist

10. **Action button** — 16px top margin, 24px bottom margin (safe area aware)
    - Full width, 48px height, 12px radius
    - Background: primary gradient (#3E7A55 to #2D5A3E)
    - Text: "Create" (new) or "Save" (edit), 15px / 600, white, centered
    - Shadow: sm (offset 0/2, opacity 0.06, radius 4)

11. **Delete link (edit mode only)** — 8px below action button
    - Text: "Delete activity", 13px / 500, color #E53E3E, centered
    - Tap: confirmation alert before deletion

**Conflict detection banner:**

| Property | Value |
|----------|-------|
| Position | Below the duration chips row |
| Background | rgba(196,121,91,0.12) (warm amber tint) |
| Border | 1px solid rgba(196,121,91,0.2) |
| Radius | 10px |
| Padding | 10px 12px |
| Icon | Warning triangle emoji |
| Text | "Overlaps with [activity name] ([time range])" — 12px / 500, #C4795B |
| Suggestion chip | "Try [next free slot]?" — glass chip with primary green text, tappable |
| Blocking | Non-blocking. User can still create. |

### States

| State | Behavior |
|-------|----------|
| **Blank (new)** | All fields empty/default. Date = Today. Time = unset (clock icon). Duration = "---". Repeat = "Once". Button = "Create". |
| **Filled (new, partially filled)** | Fields populate as user fills them. Hint "Saved as a Task" below date/time row when no time is set. |
| **Edit (existing activity)** | All fields pre-filled from activity data. Button = "Save". Delete link visible below button. |
| **Conflict** | Amber banner appears when time overlaps with existing activity. |
| **Saving** | Button shows spinner (16px, white) replacing text. Button disabled (opacity 0.6). |
| **Error** | Red toast at top of sheet: "Failed to save. Try again." 13px, #E53E3E. Auto-dismiss 3s. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Swipe down** | Dismisses sheet. gestureEnabled: true, gestureDirection: vertical. |
| **Tap outside (overlay)** | Dismisses sheet. |
| **Tap time chip** | Opens time picker (scroll wheel to minute precision). |
| **Tap duration chip** | Selects that duration. Deselects others. |
| **Tap repeat chip** | Opens repeat popup. |
| **Tap sparkle icon** | Fires AI to generate mindset prompt based on title. Loading shimmer on input while waiting. |
| **Tap category chip** | Selects/deselects category. |
| **Tap "+" category** | Opens new category creation inline (name + emoji picker). |
| **Tap subtask "+"** | Adds new empty subtask row with focus on text input. |
| **Tap action button** | Validates (title required), saves, dismisses sheet with spring animation. |
| **Tap delete link** | Confirmation alert: "Delete this activity?" with Cancel/Delete buttons. |

### Animations

| Animation | Spec |
|-----------|------|
| Sheet entrance | slide_from_bottom, 250ms duration |
| Sheet dismiss (swipe) | spring: damping 15, stiffness 200 |
| Chip select | bg color transition 150ms |
| Repeat popup | FadeIn + ScaleY from 0.95 to 1.0, 200ms, cubic-bezier(0.2, 0, 0, 1) |
| Conflict banner | SlideDown 200ms, opacity 0 to 1 |
| Suggestion chip | spring in: stiffness 200, damping 15 |
| Saving spinner | Rotate infinite, 800ms per rotation |

### Edge Cases

| Case | Handling |
|------|----------|
| Very long title (100+ chars) | Input scrolls horizontally. No wrap. |
| No title entered, tap Create | Shake animation on title input (spring: 3 quick horizontal oscillations, 4px amplitude). Button stays disabled state (opacity 0.6) until title has text. |
| Custom duration (e.g., 45m) | User types custom value. Appears as chip sorted among presets: "15m", "30m", "45m", "1h", "2h". |
| Multiple conflicts | Banner shows first conflict only. Text: "Overlaps with [name] and N others". |
| All categories deleted | Category section shows only "+" chip to create new one. |
| 20+ subtasks | Subtask area scrolls within the form sheet. |
| Offline | Form saves to local DB. No network needed for CRUD. AI sparkle for mindset may fail silently. |
| Keyboard open | Sheet scrolls up to keep focused input visible. KeyboardAvoidingView behavior. |

---

## 6. ExperienceLogScreen

### Visual Spec

**Container:** Same bottom sheet spec as ActivityFormScreen (glass, 20px top radius, modal shadow).

**Layout (top to bottom):**

1. **Drag handle** — 36x4px, #E0D9CE, radius 2px, centered, 8px top margin

2. **Activity header** — 12px top margin
   - Left: Category emoji (15px) + 4px gap + Activity name (16px / 600, #1A1714) + 4px gap + Checkmark icon (14px, primary green, if completed)
   - Right: Pencil icon (edit button, 20px, #8C857D, 36x36 touch target). Tapping switches to edit mode (ActivityFormScreen).
   - Below: Time range in Geist Mono (10px / 600, #8C857D), e.g., "10:00 AM - 11:30 AM"
   - NOT editable in this view. Edit via pencil icon.

3. **Mood** — 16px top margin
   - Label: "MOOD" — 11px / 500, uppercase, letterSpacing 0.3, #8C857D
   - 5 emoji circles in a horizontal row, 8px gap between them:
     - Each circle: 44px diameter, border 1.5px #E0D9CE, bg white
     - Emojis (centered, 22px): (sad) Bad, (slightly_frowning) Low, (neutral) Okay, (slightly_smiling) Good, (blush) Great
     - Selected: border 2px #C4795B (accent), bg rgba(196,121,91,0.1), scale 1.1
     - Label below each: 9px / 500, #8C857D (Bad, Low, Okay, Good, Great)

4. **Energy** — 16px top margin
   - Label: "ENERGY" — same style as Mood label
   - 5 emoji circles, same sizing as Mood:
     - Emojis: (battery) Drained, (sleeping) Low, (relieved) Steady, (zap) High, (fire) Peak
     - Selected: border 2px #2D5A3E (primary green), bg rgba(45,90,62,0.1), scale 1.1
     - Labels: Drained, Low, Steady, High, Peak

5. **Completion** — 16px top margin
   - 3 chips in horizontal row, 8px gap:
     - "Skipped" — glass chip, 32px height, 10px radius
     - "Half done" — glass chip
     - "Completed" — glass chip
     - Selected chip: primary green bg, white text
     - Pre-selected based on activity status (completed = "Completed", skipped = "Skipped", default = none)

6. **Reflection** — 16px top margin
   - Label: "REFLECTION" — same label style
   - Input: single-line, 13px / 500, bottom border 1px #E0D9CE, placeholder "Any thoughts on how it went?" in #8C857D

7. **Button** — 16px top margin, 24px bottom margin
   - "Reflect & Close" — full width, 48px height, 12px radius
   - Background: primary gradient (#3E7A55 to #2D5A3E)
   - Text: 15px / 600, white, centered
   - Gives sense of completion/fulfillment

**No skip button. No "Edit instead" text link.** Pencil icon in header handles switching to edit.

### States

| State | Behavior |
|-------|----------|
| **Fresh (no prior log)** | All fields unselected. Reflection empty. |
| **Previously logged** | Fields pre-filled from stored log. User can update. |
| **Editing (pencil tapped)** | Transitions to ActivityFormScreen for this activity. Experience log sheet dismisses. |
| **Saving** | Button shows spinner. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Swipe down** | Dismisses sheet. |
| **Tap outside** | Dismisses sheet. |
| **Tap mood emoji** | Selects mood. Previously selected deselects. Spring scale feedback. |
| **Tap energy emoji** | Selects energy. Spring scale feedback. |
| **Tap completion chip** | Selects completion status. |
| **Tap pencil icon** | Dismisses experience log, opens ActivityFormScreen for this activity. |
| **Tap "Reflect & Close"** | Saves log, dismisses sheet with spring animation, optional haptic success feedback. |

### Animations

| Animation | Spec |
|-----------|------|
| Sheet entrance | slide_from_bottom, 250ms |
| Emoji select | spring: damping 15, stiffness 200, scale from 1.0 to 1.1. Border color transition 150ms. |
| Emoji deselect | spring scale back to 1.0, border color fade 150ms |
| Chip select | bg color crossfade 150ms |
| Button press | scale 0.97 spring |

### Edge Cases

| Case | Handling |
|------|----------|
| No fields selected, tap button | Saves with all null values. No validation required — reflection is optional. |
| Very long activity name | Truncated with "..." in header. |
| Activity has no time (task) | Time range row hidden. |
| Multiple logs for same activity | Latest log overwrites previous. |
| Offline | Saves locally. |

---

## 7. QuickAddScreen (AI Text-to-Action)

### Visual Spec

**Container:** Bottom sheet, same glass spec. Shorter than full form (just input + chips + button).

**Layout:**

1. **Drag handle** — 36x4px, standard

2. **Text input** — 16px top margin
   - 20px / 500, Instrument Sans, color #1A1714
   - Placeholder: "What do you want to do?" in #8C857D
   - Full width, glass surface bg, no explicit border (glass border serves)
   - Auto-focus on mount, keyboard opens immediately

3. **"or fill form manually" link** — 8px below input
   - 13px / 500, color #8C857D, tappable
   - Tap switches to ActivityFormScreen (full form mode)

4. **Chip preview area** — 12px below link
   - Horizontal wrap layout
   - Each parsed chip: glass bg rgba(255,255,255,0.65) + 1px border rgba(255,255,255,0.75), 12px radius, 28px height, 10px horizontal padding
   - Chip text: 11px / 500
   - Chip types and colors:
     - **Title chip:** Bold text (11px / 700), no special tint
     - **Time chip:** Muted style — text #8C857D
     - **Duration chip:** Muted style
     - **Category chip:** Category tint bg (6% category color)
     - **Recurrence chip:** Accent amber tint bg (rgba(196,121,91,0.1)), text #C4795B
   - Each chip is tappable (opens inline editor for that field)
   - Loading state: shimmer animation on chip area (gradient sweep left-to-right, 1.2s, rgba(255,255,255,0.3) highlight on glass)

5. **Action button** — 16px below chips, 24px bottom margin
   - Full width, 48px height, 12px radius, primary gradient
   - Label changes based on parsed action:
     - "Create" — new activity creation
     - "Update" — modification of existing
     - "Remove" — cancellation/deletion
     - "Move" — time change of existing
     - "Done" — marking complete
   - Disabled (opacity 0.6) until at least a title chip is parsed

### States

| State | Behavior |
|-------|----------|
| **Empty** | Just the text input with placeholder. No chips. Button disabled. |
| **Typing (pre-parse)** | Text input active. 600ms debounce before parsing fires. |
| **Local parse active** | Chips appear instantly from regex parsing. |
| **AI parse in-flight** | Shimmer on chip area. Local parse chips shown as interim. |
| **AI parse complete** | Chips update (crossfade 150ms if different from local parse). Confidence > 0.7: shown immediately. 0.3-0.7: "Did you mean...?" disambiguation. < 0.3: title used as-is. |
| **AI parse failed** | Silent fallback to local regex results. No error shown to user. |
| **Form mode** | Full ActivityFormScreen renders. Parsed fields pre-fill the form. |
| **Back to text mode** | Text input retains previously typed text. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Type text** | 600ms debounce. Local parse runs instantly. AI parse fires after debounce if confidence < 0.6 or scope != light. |
| **Tap chip** | Opens inline editor for that field: time chip -> time picker, duration chip -> duration options, category chip -> category selector, recurrence chip -> recurrence popup. |
| **Tap "or fill form manually"** | Sheet height animates (spring) to full form height. Form pre-filled with any parsed fields. |
| **Tap action button** | Creates/modifies/removes activity based on parsed action. Dismisses sheet. |
| **Swipe down** | Dismisses sheet. |

### Animations

| Animation | Spec |
|-----------|------|
| Chip appear | spring: stiffness 200, damping 15. Scale 0 to 1 + opacity 0 to 1. |
| Chip update (AI vs local differ) | Crossfade 150ms: old chip fades out, new fades in. |
| Loading shimmer | Linear gradient sweep, 1.2s duration, infinite until response arrives. |
| Mode switch (text -> form) | Sheet height: spring damping 15, stiffness 200. Content: crossfade 200ms. |
| Mode switch (form -> text) | Same spring on height. Text input retains value. |
| Button label change | Crossfade 150ms on text. |

### Edge Cases

| Case | Handling |
|------|----------|
| Very long input (200+ chars) | Input scrolls. Parsing still works. Title extraction pulls the core noun phrase. |
| Ambiguous input ("meeting") | Local parse: title = "meeting". AI may add category if pattern matches. Low confidence shows "Did you mean...?" |
| Modification intent ("cancel meeting") | v1: creation only. Modification actions are future scope. Falls back to title = "cancel meeting" as a new activity. |
| No network (AI unavailable) | Silent fallback to local regex. No degradation in UX. Shimmer never appears (no AI call made). |
| Rapid typing (< 600ms between chars) | Debounce resets. Only fires after 600ms pause. Local parse updates instantly per keystroke. |
| All fields parsed | All chips shown. Button becomes "Create" and is enabled. |
| Empty input, tap Create | Button is disabled (opacity 0.6). No action. |

---

## 8. PlayScreen (AI Chat)

### Visual Spec

**Container:** Full screen, bg #F5F0E8.

**Header:**

| Property | Value |
|----------|-------|
| Title | "Play" or "Ask DayFlow" — 22px / 700, Instrument Sans |
| Back button | Standard, 36x36, if navigated from another tab |

**Chat history:**

| Element | Spec |
|---------|------|
| User query bubble | Right-aligned. Primary green bg (#2D5A3E). White text (14px / 500). 18px radius (top-left, top-right, bottom-left rounded; bottom-right sharper at 4px). Max width 75% of screen. Padding 10px 14px. |
| AI response | Left-aligned. Glass WebView card: rgba(255,255,255,0.65) bg, 1px border rgba(255,255,255,0.75), 18px radius, shadow pill. Auto-height via JS postMessage (WebView measures content height, sends to RN). Padding 12px 14px. |
| Timestamp | 9px / 500, #8C857D, shown below each message pair, centered. |
| Spacing | 12px between messages. 20px between conversation turns. |

**Suggestion chips:**

| Property | Value |
|----------|-------|
| Position | Below latest response, horizontal scroll |
| Style | Glass bg, 1px glass border, 20px radius, 32px height, 12px horizontal padding |
| Text | 12px / 500, #4A4540 |
| Examples | "What should I do next?", "Summarize my day", "Suggest a break" |
| Tap | Sends chip text as user query. Chip disappears. |

**Mic button:**

| Property | Value |
|----------|-------|
| Size | 80px diameter |
| Border radius | 40px (circle) |
| Background | Primary gradient (#3E7A55 to #2D5A3E) |
| Shadow | fab: offset 0/6, opacity 0.15, radius 16 |
| Icon | Microphone, white, 28px |
| Position | Bottom center, 24px above safe area |
| Press feedback | scale 0.97 spring |

**Text input (alternative to mic):**

| Property | Value |
|----------|-------|
| Height | 44px |
| Background | Glass: rgba(255,255,255,0.65) |
| Border | 1px rgba(255,255,255,0.75) |
| Radius | 22px |
| Text | 14px / 500, #1A1714 |
| Placeholder | "Ask anything..." in #8C857D |
| Send button | Primary green circle (36px), white arrow icon, inside input on right |

### States

| State | Behavior |
|-------|----------|
| **Empty (no history)** | Welcome message: glass card with "How can I help you plan your day?" + suggestion chips below. |
| **Active conversation** | Messages stack vertically. Auto-scroll to latest message. |
| **AI thinking** | Typing indicator: 3 dots pulsing in a glass bubble, left-aligned. |
| **Error** | Red glass card: "Something went wrong. Try again." with retry button. |
| **Offline** | Banner at top: "You're offline. Some features may be limited." Glass bg, amber text. |
| **Mic recording** | Mic button pulses with accent glow. Waveform visualization around button (3 concentric rings pulsing). |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap mic** | Starts voice recording. Tap again to stop and send. |
| **Type + send** | Sends text query. Response streams in. |
| **Tap suggestion chip** | Sends chip text as query. |
| **Scroll up** | Browse history. |
| **Tap response link** | If response contains a tappable activity reference, opens that activity's edit form. |
| **Long-press response** | Copy response text to clipboard. |

### Animations

| Animation | Spec |
|-----------|------|
| New message appear | FadeInDown: translateY -20 to 0, opacity 0 to 1, 300ms, cubic-bezier(0.2, 0, 0, 1) |
| Typing indicator | 3 dots: each scales 0.5 to 1.0, staggered by 150ms, 600ms cycle, infinite |
| Suggestion chips | FadeIn 200ms, staggered 50ms each |
| Mic recording pulse | Scale 1.0 to 1.15, 1.5s ease-in-out infinite. Glow rings expand and fade. |
| Response stream | Text appears character by character or chunk by chunk, simulating typing. |

### Edge Cases

| Case | Handling |
|------|----------|
| Very long response | WebView auto-heights. ScrollView allows scrolling within chat. |
| Very long user message | Text wraps within bubble. Max width 75% of screen maintained. |
| No response from AI | Timeout after 15s. Shows error card with retry. |
| 50+ messages in history | Virtualized list (FlatList) for performance. Older messages lazy-load on scroll up. |
| Rapid messages | Queue system. Each message waits for prior response before sending. Or shows "Still thinking..." if user sends while AI is processing. |

---

## 9. SearchScreen

### Visual Spec

**Search box:**

| Property | Value |
|----------|-------|
| Background | Glass: rgba(255,255,255,0.65) |
| Border | 1px rgba(255,255,255,0.75) |
| Radius | 22px |
| Height | 44px |
| Padding | 0 16px |
| Icon | Search magnifying glass, 18px, #8C857D, left side |
| Text | 14px / 500, #1A1714 |
| Placeholder | "Search activities..." in #8C857D |
| Clear button | "x" circle (20px), appears when text entered, right side |
| Position | Top of screen, 24px horizontal margin, below safe area |

**Results:**

| Element | Spec |
|---------|------|
| Layout | Vertical list below search box, 12px top margin |
| Result card | Glass pill style: same as canvas ActivityCard. Glass bg + category tint + shadow. 14px radius. 10px 12px padding. |
| Result content | Category emoji (15px) + Title (14px / 700) on row 1. Date + time (10px / 600, Geist Mono, #8C857D) on row 2. |
| Result tap | Opens activity in edit form. |
| Gap between results | 8px |

**AI Answer card (when applicable):**

| Property | Value |
|----------|-------|
| Position | Above results list. 12px margin below search box. |
| Label | "AI Answer" — 10px / 600, #C4795B (accent), uppercase, letterSpacing 0.5 |
| Container | Glass WebView card: rgba(255,255,255,0.65) bg, glass border, 16px radius, shadow card, 14px padding |
| Content | HTML rendered in WebView, auto-height via JS. Uses DayFlow design tokens (fonts, colors). |
| Trigger | Fires when few results returned (< 3) OR query is phrased as a question (starts with who/what/when/where/why/how, or ends with "?") |

### States

| State | Behavior |
|-------|----------|
| **Empty (no query)** | Search box with placeholder. No results. Optional: recent searches list (glass chips, 10px radius). |
| **Typing** | Results filter in real-time as user types. Instant local search. |
| **Results found** | Result cards listed below search box. |
| **No results** | Text: "No activities found" — 14px / 500, #8C857D, centered. |
| **AI answer loading** | Shimmer in AI answer card area. |
| **AI answer shown** | AI Answer card appears above results with label and glass WebView. |
| **Error (AI)** | AI Answer card not shown. Results still work (local search). |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Type in search** | Real-time local filtering. AI fires after 800ms debounce if conditions met. |
| **Tap result** | Opens activity edit form. |
| **Tap clear** | Clears search text. Returns to empty state. |
| **Swipe down** | Dismisses keyboard. |
| **Tap outside results** | Dismisses keyboard. |

### Animations

| Animation | Spec |
|-----------|------|
| Results appear | FadeIn 150ms, staggered 30ms per result |
| AI Answer card | SlideDown + FadeIn, 250ms, cubic-bezier(0.2, 0, 0, 1) |
| Clear button | FadeIn 100ms on appear, FadeOut 100ms on clear |
| Result card press | scale 0.97 spring |

### Edge Cases

| Case | Handling |
|------|----------|
| Query matches 100+ results | Show first 20, "Show more" button at bottom. |
| Very long query | Search box text scrolls horizontally. Single line. |
| Special characters in query | Escaped before search. No regex injection. |
| No network (AI unavailable) | Local search still works. AI Answer card simply never appears. |
| Query is just spaces | Treated as empty. No results shown. |

---

## 10. Watermarks

### Visual Spec

| Property | Value |
|----------|-------|
| Background | rgba(181,99,74,0.12) |
| Text color | #8B4A30 |
| Font | 9px / 600 weight, Geist Mono |
| Padding | 4px 8px |
| Border radius | 6px |
| Alignment | Right-aligned on canvas |
| z-index | 8 (above pills, above grid lines) |
| Content | Icon emoji + space + activity name (e.g., "water Drink water") |
| Max width | 50% of canvas width |
| Overflow | Truncated with "..." if name too long |

### Positioning Rules

| Type | Rule |
|------|------|
| **Time-anchored** (has start_time, duration = 0) | `top = (hour + minute/60) * HOUR_HEIGHT`. Positioned at exact time on timeline. Right-aligned. |
| **Untimed recurring** (no start_time, has recurrence) | Distributed evenly every 90 minutes starting from 7:00 AM. First at 7:00, next at 8:30, then 10:00, 11:30, 1:00 PM, 2:30 PM, 4:00 PM, 5:30 PM, 7:00 PM, 8:30 PM. |
| **Overlap with pill** | Watermark floats ON TOP of the pill at z-index 8. Pill never shifts position. No collision detection. |
| **Multiple watermarks at same time** | Stack vertically with 4px gap between them. |

### States

| State | Behavior |
|-------|----------|
| **Normal** | Warm chip visible at position. |
| **Completed** | Opacity 0.4. Strikethrough on text. |
| **Past time** | Same as normal but in the past section of the grid (grid lines at 0.2 opacity). Watermark itself stays full opacity until marked done. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap** | Opens activity edit form (same as tapping a pill). |
| **Swipe right** | Swipe-to-complete with same 80px threshold as pills. Green bg reveal behind chip. |
| **Long-press** | Opens edit form (no drag-to-reschedule for watermarks since they are zero-duration or untimed). |

### Edge Cases

| Case | Handling |
|------|----------|
| 10+ untimed recurring watermarks | All distributed every 90 min from 7 AM. After 10 (reaching 10:00 PM), they wrap or stack at the last position. Practically, this many is rare. |
| Watermark + pill at exact same time | Watermark renders on top at z-index 8. Pill is still fully visible underneath since watermark is small and right-aligned. |
| Very long watermark name (50+ chars) | Truncated with "..." at max 50% canvas width. |
| No watermarks for the day | Nothing renders. No empty state. |

---

## 11. Tab Bar

### Visual Spec

| Property | Value |
|----------|-------|
| Height | 82px total |
| Padding bottom | 24px (safe area for iPhone home indicator) |
| Background | rgba(255,255,255,0.70) (glass) |
| Backdrop filter | blur(24px) |
| Border top | 1px solid rgba(255,255,255,0.75) |
| Position | Fixed at bottom of screen |
| Shadow | None (glass blur provides visual separation) |

**Tab items:**

| Property | Active | Inactive |
|----------|--------|----------|
| Icon size | 24px | 24px at scale 0.88 (visually ~21px) |
| Icon color | #2D5A3E (primary) | #8C857D (muted) |
| Label | 11px / 600, #2D5A3E | 11px / 600, #8C857D |
| Label margin top | 4px below icon | 4px below icon |
| Touch target | Full tab width x 58px (82px - 24px bottom padding) | Same |

**Tabs (left to right):**

| Tab | Icon | Label |
|-----|------|-------|
| Today | Calendar/grid icon | Today |
| Plan | Clock/agenda icon | Plan |
| Insights | Chart/bar icon | Insights |
| Settings | Gear icon | Settings |

### States

| State | Behavior |
|-------|----------|
| **Idle** | Active tab highlighted (primary color). Others muted. |
| **Pressed** | Scale 0.88 spring feedback on the tapped tab (if inactive). Active tab does not scale on re-tap. |
| **Switching** | New tab becomes active immediately. Icon color and label color transition 150ms. |
| **Badge (future)** | Small red dot (8px) top-right of icon. For notifications or pending items. |

### Interactions

| Gesture | Behavior |
|---------|----------|
| **Tap tab** | Switches to that tab's screen. Instant navigation. |
| **Tap active tab** | Scrolls that tab's content to top (if scrollable). |
| **Long-press** | No action. |
| **Swipe on tab bar** | No action (tabs are tap-only). |

### Animations

| Animation | Spec |
|-----------|------|
| Tab press (inactive) | scale from 1.0 to 0.88 then spring back to 1.0. spring: damping 15, stiffness 200. |
| Color transition | 150ms crossfade from muted to primary (or reverse). |
| Icon scale (inactive) | Constant 0.88 scale. On becoming active: spring from 0.88 to 1.0. On becoming inactive: spring from 1.0 to 0.88. |

### Edge Cases

| Case | Handling |
|------|----------|
| Rapid tab switching | Each tap cancels prior animation. Immediate switch. No queuing. |
| Landscape mode | Not supported. Portrait only. |
| Large text accessibility | Tab label scales with system font size up to 1.2x. Beyond that, label truncates. Icons do not scale. |

---

## Universal Bottom Sheet Rules

Every bottom sheet in the app follows these rules with zero exceptions:

| Rule | Implementation |
|------|---------------|
| Swipe down to dismiss | `presentation: 'modal'`, `gestureEnabled: true`, `gestureDirection: 'vertical'` |
| Tap outside to dismiss | Dim overlay `rgba(0,0,0,0.3)` calls `navigation.goBack()` on press |
| Drag handle | 36px wide x 4px tall, color #E0D9CE, radius 2px, centered, 8px top margin |
| Slide from bottom | `animation: 'slide_from_bottom'`, `animationDuration: 250` |
| Never use `transparentModal` | It breaks swipe gesture on iOS. Always use `modal`. |

---

## Global Motion System

All interactive motion in the app uses these values:

| Token | Value | Usage |
|-------|-------|-------|
| `motion.fast` | 150ms | Quick transitions: chip select, color change, fade |
| `motion.normal` | 250ms | Standard transitions: sheet entrance, day transition |
| `motion.slow` | 400ms | Long-press activation, slow reveals |
| `motion.spring` | damping: 15, stiffness: 200 | All spring physics: press feedback, sheet expand, pill interactions, chip appear |
| Press scale (pills) | 0.97 | All tappable pills, cards, buttons |
| Press scale (tabs) | 0.88 | Tab bar icons when inactive |
| Easing | cubic-bezier(0.2, 0, 0, 1) | All non-spring interactive transitions |

---

## Global Typography Reference

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| display | 32px | 700 | Instrument Sans | Hero text, large numbers |
| heading | 22px | 700 | Instrument Sans | Screen titles ("Today"), section headers |
| title | 14px | 700 | Instrument Sans | Pill names, card titles |
| body | 13px | 500 | Instrument Sans | Body text, task names, form inputs |
| small | 11px | 500 | Instrument Sans | UI labels, tab labels, chips |
| caption | 10px | 600 | Geist Mono | Hour labels, timestamps, counts |
| micro | 9px | 600 | Geist Mono | Watermark chip text |
| mindset | 9.5px | 400 italic | Instrument Sans | Mindset prompts on pills |
| label | 11px | 500 | Instrument Sans | Form section labels (MOOD, ENERGY, etc.) |

---

## Global Color Reference

| Token | Hex/RGBA | Usage |
|-------|----------|-------|
| bg | #F5F0E8 | App background (warm cream) |
| surface | rgba(255,255,255,0.65) | Glass pill/card background |
| surface border | rgba(255,255,255,0.75) | Glass pill/card border |
| text | #1A1714 | Primary text |
| text2 | #4A4540 | Secondary text |
| muted | #8C857D | Placeholder text, inactive elements |
| border | #E0D9CE | Dividers, input borders, grid lines |
| primary | #2D5A3E | Selected states, buttons, checkmarks |
| primaryLight | #3E7A55 | Gradient start for primary buttons |
| accent | #C4795B | Now indicator, active states, amber highlights |
| terra | #B5634A | Health/physical category |
| sage | #5A8C6A | Personal/rest category |
| slate | #3D5F80 | Meetings/work category |
| mauve | #7D5A7C | Learning/creative category |
| amber | #A67B0A | Creative/social category |
| watermark text | #8B4A30 | Watermark chip text |
| watermark bg | rgba(181,99,74,0.12) | Watermark chip background |
| danger | #E53E3E | Delete actions, errors |
| glass sheet | rgba(255,255,255,0.85) | Bottom sheet background |
| glass tab | rgba(255,255,255,0.70) | Tab bar background |
| task bar collapsed | rgba(255,255,255,0.75) | Collapsed task bar |
| task bar expanded | rgba(255,255,255,0.85) | Expanded task bar |

---

## Global Shadow Reference

| Token | Offset | Opacity | Radius | Elevation | Usage |
|-------|--------|---------|--------|-----------|-------|
| xs | 0, 1 | 0.04 | 2 | 1 | Subtle: header buttons |
| sm | 0, 2 | 0.06 | 4 | 2 | Light: chips, small cards |
| card | 0, 3 | 0.08 | 8 | 3 | Medium: date chips, cards |
| pill | 0, 3 | 0.06 | 8 | 3 | Activity pills (3-layer: xs + pill + ambient) |
| fab | 0, 6 | 0.15 | 16 | 8 | FAB, dragging elements |
| modal | 0, -4 | 0.12 | 20 | 16 | Bottom sheets |
