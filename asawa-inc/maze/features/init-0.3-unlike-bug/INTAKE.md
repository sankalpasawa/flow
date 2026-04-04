# INTAKE: INIT-0.3 Unlike Bug Fix

## Problem Statement

Two data integrity bugs in the like/dislike system:

1. **Unlike doesn't persist.** Clicking like twice (to unlike) sets local state to null, but the `if (newReaction)` guard skips the API call. The DB keeps the like. User thinks they unliked, but the server still counts it.

2. **Reaction counts never decrement.** `increment_content_score` RPC only adds +1. There's no decrement path. Once a joke is liked, the `like_count` only goes up, even if the user unlikes.

## Who Requested

CQO (Quality) — flagged in HOD meeting code audit. Agent found these at lines 44-46 and 154-167 of `joke-card.tsx`.

## Why Now

Launch blocker. Sharing a link where likes are broken erodes trust. Data corruption compounds — every interaction makes the scores less accurate.

## Success Criteria

1. Clicking like twice (toggle off) sends a delete request to the server
2. Server decrements `like_count` when a like is removed
3. Same for dislike
4. Displayed count matches server state after toggle on AND toggle off
