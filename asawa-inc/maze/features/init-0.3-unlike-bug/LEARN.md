# LEARN: INIT-0.3 Unlike Bug Fix

## What Went Well
- SHAPE phase identified the two separate bugs clearly (client guard + no decrement)
- SPEC predicted the need for a new RPC before code was written
- The `greatest(..., 0)` guard was designed in SPEC, not discovered during testing
- Custom header (`x-unreact-type`) keeps the API contract simple — one endpoint, action field routes behavior

## What Was Surprising
- The optimistic count display (`item.like_count + (reaction === "like" ? 1 : 0)`) was accidentally correct for the unlike case — showing base count when reaction is null is the right behavior since the server decrements the actual count
- This means the original code's COUNT DISPLAY was fine — it was only the API call that was missing

## Feedback for Sutra
- **Every increment should have a decrement.** When designing a counting/scoring system, the SHAPE template should ask: "Can this be undone? If yes, where's the undo path?" This would have caught the bug at design time.
- **Toggle patterns need explicit off-state handling.** The SPEC template should ask: "What happens when the user reverses this action?"

## Debt
- No rate limiting on unreact (could be spammed to decrement scores)
- Optimistic count is not reconciled with server after API response
