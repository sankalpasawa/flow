# Feature: RLS Policy Rewrite

**Created**: 2026-04-04 (retroactive — artifact was missing during execution)
**Owner**: CISO (Security)
**Support**: CTO (Engineering)
**Mode**: SUTRA
**Tier**: Significant (security change, all tables affected)

## What
Rewrite all Supabase RLS policies from fully open (`using(true)`) to properly scoped access control.

## Who Benefits
All users (data integrity). Company (security). Prerequisite for auth feature.

## Why Now
HOD meeting CISO audit: all tables fully public writable. Anyone with anon key can INSERT/UPDATE/DELETE content, manipulate scores, read any session. `increment_content_score` RPC runs as security definer — score manipulation vector.

## Current State → Target State

| Table | Before | After |
|-------|--------|-------|
| content | ALL: using(true) | SELECT: public. INSERT/UPDATE/DELETE: service-role only |
| sessions | ALL: using(true) | SELECT/INSERT/UPDATE: public (anonymous users need this) |
| interactions | ALL: using(true) | SELECT/INSERT/DELETE: public (reactions) |
| ingestion_log | ALL: using(true) | ALL: service-role only |

## Edge Cases
- Anonymous users have no server-side identity. "Own session" = client-passed session_id. True scoping comes with auth.
- This is the 80/20: prevents score manipulation while keeping anonymous usage working.

## Decision
Irreversible + Data-rich → Meritocratic debate. CEO approved 80/20 approach.

## Surprises
- RLS change exposed 2 upsert bugs in `/api/react`:
  1. Sessions upsert failed (partial unique index incompatible with Supabase JS upsert)
  2. Interactions upsert same issue
- Fixed by replacing upsert with insert + catch 23505

## Result
Shipped in commit `cc4268d`. 12 policies applied via Supabase MCP SQL. Feed + reactions verified working post-deploy.

## Debt Created
- `supabase-migration.sql` is now stale (still has old `using(true)` policies)
- Need to update migration file or create `002-rls-rewrite.sql`
