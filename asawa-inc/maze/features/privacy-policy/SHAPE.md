# Feature: Privacy Policy

**Created**: 2026-04-04 (retroactive — artifact was missing during execution)
**Owner**: CLO (Legal)
**Mode**: SUTRA
**Tier**: Standard (new page + legal content)

## What
Privacy policy page at `/privacy` covering how Maze handles data.

## Who Benefits
Legal compliance. Unblocks Growth (soft launch) and Data (PostHog consent).

## Why Now
HOD meeting flagged Legal as RED. Privacy policy is #1 company-wide blocker for soft launch. CEO decided "soft launch this week."

## P0 Scope
- Static page at /privacy
- Sections: what we collect, what we don't, third parties, data retention, user rights
- Footer link from homepage
- Accurate to current state (anonymous sessions, no PII)

## Edge Cases
- When auth is added, this page MUST be updated (collecting email = PII)
- PostHog tracking consent: mention "analytics may be added"

## Not In Scope
- Cookie consent banner (separate feature)
- Terms of service (separate, lower priority)

## Decision
Reversible + Data-poor → Founder decides fast → GO

## Result
Shipped in commit `088eca9`. Page live at /privacy. Footer link added.
