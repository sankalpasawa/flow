# LEARN: INIT-0.4 Feed Stale Closure Fix

## What Went Well
- SHAPE correctly identified the root cause before touching code: cursor in useCallback deps → new identity → observer recreation → stale closure
- The ref pattern is a well-known React fix for this class of bug — SPEC predicted the exact solution

## What Was Surprising
- The original code had an eslint-disable comment on the category effect (line 70), suggesting the developer knew the deps were wrong but suppressed the warning instead of fixing the architecture
- Removing `items.length` from deps was safe — it was only used to determine initial vs subsequent load, replaced by the `reset` parameter

## Feedback for Sutra
- **IntersectionObserver + useCallback is a known footgun.** Sutra's engineering templates should flag this pattern: "If your observer callback calls a function that depends on changing state, use refs." Add to COMPLICATIONS.md.
- **eslint-disable comments are a smell.** The SHAPE template should ask: "Are there any suppressed warnings in the affected code? If yes, the warning might be pointing at the actual bug."
