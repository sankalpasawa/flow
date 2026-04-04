# VERIFY: INIT-0.3 Unlike Bug Fix

## Type Check
`npx tsc --noEmit` — PASS (clean, zero errors)

## Changes Made

| Layer | File | Change |
|-------|------|--------|
| DB | Supabase RPC | Added `decrement_content_score` function (greatest(..., 0) prevents negatives) |
| API | `api/react/route.ts` | Added `unreact` action: deletes interaction + decrements count |
| UI | `joke-card.tsx` | Toggle-off now sends `unreact` with `x-unreact-type` header |

## Acceptance Criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Like → unlike sends delete to server | PASS (code sends `action: "unreact"` with `x-unreact-type: "like"`) |
| 2 | Server decrements count on unreact | PASS (calls `decrement_content_score` RPC) |
| 3 | Same for dislike → undislike | PASS (same code path, type from header) |
| 4 | Unlike when never liked = no-op | PASS (delete on non-existent row is no-op in Supabase) |
| 5 | Count never below 0 | PASS (RPC uses `greatest(%I - 1, 0)`) |
| 6 | Type-check passes | PASS |

## Remaining (post-deploy)
- Manual test: like a joke, unlike it, verify count in Supabase DB
- Verify optimistic UI count matches server after page reload
