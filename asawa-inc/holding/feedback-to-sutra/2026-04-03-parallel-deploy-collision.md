# Parallel Deploy Collision

**Date**: 2026-04-03
**Company**: Asawa Inc. (holding)
**Type**: protocol-gap
**Severity**: normal

## What Happened
Deployed two websites in parallel to Vercel. Both directories were named `website/`, so Vercel assigned the same project name. Second deploy overwrote the first.

## What Was Missing in Sutra
No guardrail for parallel operations on shared infrastructure. The ENFORCEMENT.md and CONTINUOUS-IMPROVEMENT.md cover code and process, but not infrastructure operations.

## Suggested Change
Add to Sutra's operating principles:
- **Parallel infrastructure operations require isolation verification.** Before running parallel deploys, parallel DB migrations, or parallel CI jobs, verify they target different resources (project names, DB schemas, environments).
- Deploy checklist should include: unique project name, unique domain, verify no collision with existing deploys.

## Status
RESOLVED — Incorporated into Sutra v1.1 — infrastructure isolation rule added to ENFORCEMENT.md
