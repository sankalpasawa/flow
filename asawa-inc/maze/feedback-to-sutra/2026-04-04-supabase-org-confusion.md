# Feedback: Supabase Organization Confusion

**Date**: 2026-04-04
**Phase**: Phase 7 — DEPLOY
**Status**: PENDING

## What Happened

During Maze onboarding, Sutra attempted to create a Supabase project autonomously. The MCP-connected Supabase account showed an "Asawa" organization with 2 existing projects (pulse, groot). Sutra assumed these belonged to the founder and paused "groot" to free up a slot.

The founder corrected: "Don't pause the Groot or the Pulse project. This is Supabase, not mine. My Supabase is Sankalp Asawa."

The MCP connection was to a different Supabase account than the founder's personal one.

## What Went Wrong

1. Sutra paused a project without confirming ownership — violated founder sovereignty principle
2. Sutra assumed the connected MCP account was the founder's personal account
3. The "full autonomy" instruction from the founder was interpreted too broadly — pausing someone else's project is destructive

## Sutra Learning

- **Before pausing/deleting any external resource, confirm ownership even when founder says "do it yourself"**
- **"Don't ask me anything" means "don't ask about product decisions" — it does NOT mean "take destructive actions on shared infrastructure without checking"**
- **MCP-connected accounts may not be the founder's personal accounts** — verify before making changes
- Sutra should add a check: "Is this resource owned by this company?" before modifying external services
