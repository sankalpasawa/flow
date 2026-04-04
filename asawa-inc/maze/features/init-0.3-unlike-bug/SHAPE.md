# SHAPE: INIT-0.3 Unlike Bug Fix

## What We're Fixing

Two bugs in the reaction system:

### Bug 1: Unlike doesn't reach the server (joke-card.tsx:46)
```
handleReaction("like")  → reaction = "like", API called ✓
handleReaction("like")  → reaction = null,  API NOT called ✗
                          (guard: if (newReaction) skips null)
```
The toggle-off case is never sent to the server.

### Bug 2: No decrement path (api/react/route.ts:68-77)
The `increment_content_score` RPC only adds +1. When a like is removed, nothing subtracts. The DB function has no decrement capability.

## Fix Design

### Client (joke-card.tsx)
- When `newReaction` is null (toggling off), send a NEW action type: `"unlike"` or `"undislike"`
- OR: send a DELETE request to remove the interaction

Better approach: add an `"unreact"` action that tells the server to remove the reaction. Cleaner than inventing new action types.

### Server (api/react/route.ts)  
- Add `"unreact"` to the allowed actions
- When action is `"unreact"`, delete the interaction and decrement the count
- Need a new RPC or inline SQL for decrementing

### Database
- Add `decrement_content_score` RPC (or modify existing to handle both directions)

## Edge Cases
- Double-tap race condition: user taps like twice fast → two API calls in flight
- Unlike when never liked: should be a no-op, not an error
- Decrement below zero: guard against negative counts

## Not In Scope
- Optimistic UI reconciliation (sync displayed count with server after API response)
- Animation on unlike (visual feedback)
