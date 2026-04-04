# PPR — Sutra Configuration

## Complexity Tier: 1 (Personal)

Solo founder, personal wedding tool, hard deadline (July 5, 2026), 0 external users.
See `asawa-inc/sutra/layer2-operating-system/a-company-architecture/COMPLEXITY-TIERS.md` for tier definitions.

### What's mandatory at Tier 1
- Product brief, tech stack, architecture rules, build order, categories ✅ (done at onboarding)
- TODO.md as source of truth ✅ (done)
- Session isolation ✅ (done)
- Feedback to Sutra after incidents or at end of session
- Self-check compliance every 3rd feature

### What's scaled down
- Metrics: track 2-3 success metrics, no shipping log required
- Process: single-track (need → build → test → ship). No SUTRA/DIRECT mode switching.
- Enforcement hooks: soft (flag, don't block)

### What's skipped
- A/B testing (SUTRA vs DIRECT mode)
- Department-level functions
- Agent incentives
- Daily Pulse / standup protocol

## Process

```
NEED → Is it P0? → YES → Build → Test on phone → Deploy → Share URL
                  → NO  → Add to TODO.md
```

No mode switching. Ship fast. Wedding is the deadline.

## Founder Involvement

Level: **Hands-on** (initially, adaptive later)

- All business/product/strategy decisions require founder approval
- Execution decisions (file structure, code patterns) are Sutra's
- Design taste decisions surface to founder

## Re-classification Trigger

Move to Tier 2 when PPR is offered to other couples (post-wedding). At that point: activate shipping log, weekly metrics, compliance checks, and A/B testing.
