# INTAKE: INIT-0.4 Feed Stale Closure Fix

## Problem Statement

`fetchFeed` is defined with `useCallback` depending on `[category, cursor, items.length]`. The IntersectionObserver callback captures `fetchFeed` and can fire with a stale `cursor` value, potentially re-fetching the same page and appending duplicate jokes to the feed.

The observer effect (line 74) depends on `[hasMore, loading, loadingMore, fetchFeed]`. Since `fetchFeed` changes on every cursor update, the observer is torn down and recreated frequently — unnecessary overhead.

## Who Requested

CTO (Engineering) + CQO (Quality) — flagged in HOD meeting code audit.

## Why Now

Launch blocker. Duplicate jokes in the feed is a visible UX bug that undermines trust.

## Success Criteria

1. Scrolling never produces duplicate jokes in the feed
2. IntersectionObserver is not recreated on every fetch
3. Cursor state is always current when the observer fires
4. Type-check passes
