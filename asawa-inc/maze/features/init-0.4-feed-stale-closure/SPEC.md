# SPEC: INIT-0.4 Feed Stale Closure Fix

## Files to Modify

| File | Change |
|------|--------|
| `maze-app/src/components/feed.tsx` | Replace cursor state with ref, stabilize fetchFeed, simplify observer |

## Detailed Changes

1. Add `cursorRef = useRef<string | null>(null)` — holds current cursor
2. Add `loadingRef = useRef(false)` — prevents double-fetch
3. Remove `cursor` and `items.length` from `useCallback` deps — fetchFeed reads from refs
4. Update `setCursor` calls to also update `cursorRef.current`
5. Observer callback checks `loadingRef.current` instead of depending on `loading`/`loadingMore` state
6. Observer effect deps reduced to `[hasMore]` only — stable observer

## Acceptance Criteria

1. No duplicate jokes when scrolling (cursor always current)
2. Observer not recreated on every fetch (check via console log or stable ref)
3. Category change resets cursor and items correctly
4. Type-check passes
