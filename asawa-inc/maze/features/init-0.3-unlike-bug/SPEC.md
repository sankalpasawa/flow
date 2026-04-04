# SPEC: INIT-0.3 Unlike Bug Fix

## Files to Modify

| File | Change |
|------|--------|
| `maze-app/src/components/joke-card.tsx` | Send API call when toggling off (unreact) |
| `maze-app/src/app/api/react/route.ts` | Handle "unreact" action — delete interaction + decrement count |
| Supabase (via MCP SQL) | Add `decrement_content_score` RPC function |

## Detailed Changes

### joke-card.tsx — handleReaction()
Current: `if (newReaction)` skips API when null
Fix: when `newReaction` is null, send `action: "unreact"` with the PREVIOUS reaction type so server knows what to decrement

### api/react/route.ts
Add handling for `action === "unreact"`:
1. Receive `unreact_type` ("like" or "dislike") in the request body
2. Delete the interaction row matching session + content + unreact_type
3. Call `decrement_content_score` RPC to subtract 1 from the appropriate count
4. Update session preferences (subtract from category weight)

### Supabase RPC
```sql
create or replace function decrement_content_score(cid uuid, col text)
returns void as $$
begin
  execute format(
    'update content set %I = greatest(%I - 1, 0), 
     score = (like_count + 1.0) / greatest(like_count + dislike_count + 1.0, 1.0) * 10 
     where id = $1', col, col
  ) using cid;
end;
$$ language plpgsql security definer;
```
Note: `greatest(..., 0)` prevents negative counts.

## Acceptance Criteria

1. Like → unlike: displayed count decrements, server count decrements
2. Dislike → undislike: same behavior
3. Like → dislike: old like removed + decremented, new dislike added + incremented
4. Unlike when never liked: no error, no-op
5. Count never goes below 0
6. Type-check passes
