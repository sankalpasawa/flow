# SHAPE: INIT-0.4 Feed Stale Closure Fix

## Root Cause

`fetchFeed` is a `useCallback` with `cursor` in its dependency array. Every time cursor changes (after every fetch), `fetchFeed` gets a new identity. The IntersectionObserver effect depends on `fetchFeed`, so it recreates the observer after every page load. Meanwhile, the old observer callback may still fire with the old cursor.

## Fix Design

Use a ref for cursor instead of depending on it in useCallback. This way:
- `fetchFeed` has a stable identity (only changes on category change)
- The observer callback always reads the CURRENT cursor from the ref
- No stale closure possible

```
BEFORE: cursor is state → fetchFeed depends on it → observer depends on fetchFeed → observer recreates
AFTER:  cursor is ref → fetchFeed reads ref → fetchFeed is stable → observer is stable
```

Also use a ref for `loadingMore` to prevent the observer from firing multiple fetches simultaneously.

## Edge Cases
- Category change: must reset cursor ref to null AND clear items
- Race condition: user scrolls while fetch is in flight → loadingRef prevents double-fetch
- Empty feed: hasMore=false stops observer, no stale closure issue

## Not In Scope
- Deduplication at the UI level (the fix prevents duplicates at the source)
- Feed caching
