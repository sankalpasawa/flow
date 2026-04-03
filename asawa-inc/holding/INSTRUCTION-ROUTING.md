# Asawa Inc. — Instruction Routing

## The Rule

When the CEO gives an instruction, it must be routed to the right enforcement mechanism. Not everything goes in a markdown file. The language determines the destination.

## Routing Table

| CEO says | Means | Goes to | Enforcement |
|----------|-------|---------|-------------|
| "Don't do X" / "Never do X" / "Block X" | Hard prohibition | Hook (shell script in `.claude/hooks/`) | HARD — physically blocked |
| "Always do X" / "Must do X" / "Every time X" | Hard requirement | Hook (shell script) | HARD — verified by code |
| "Before doing X, check Y" | Pre-condition | PreToolUse hook | HARD — runs before tool executes |
| "After doing X, do Y" | Post-condition | PostToolUse hook | HARD — runs after tool executes |
| "X should do Y" / "Try to X" / "Prefer X" | Soft guidance | Command .md file or OS doc | SOFT — LLM follows when it can |
| "Consider X" / "Think about X" | Advisory | OS doc or CLAUDE.md | SOFT — informs judgment |
| "When X happens, do Y" | Conditional rule | Hook if mechanical, .md if judgment | Depends on whether code can detect X |

## How to Decide: Hook or Markdown?

Ask two questions:

**1. Can a shell script detect this?**
- "Don't edit files in sutra/" → YES (check file path) → Hook
- "Don't make business decisions for the founder" → NO (requires judgment) → Markdown

**2. Should it be physically impossible to violate, or just discouraged?**
- "Never edit other companies' files" → Physically impossible → Hook
- "Prefer short commit messages" → Discouraged → Markdown

```
Can code detect it?
  YES → Should violation be blocked?
    YES → HOOK (PreToolUse or PostToolUse)
    NO  → MARKDOWN (log violation but allow)
  NO  → MARKDOWN (requires LLM judgment, can't be coded)
```

## Current Hooks

| Hook | File | What it enforces |
|------|------|-----------------|
| File boundary | `.claude/hooks/enforce-boundaries.sh` | Blocks Edit/Write to wrong company directories based on active role |

## Instructions That Should Be Hooks But Aren't Yet

These are currently in markdown files but should be hooks based on the routing table:

| Instruction | Currently in | Should be | Why |
|-------------|-------------|-----------|-----|
| "Commit after every phase" | sutra-onboard.md | PostToolUse hook on Write | Code can detect Write to asawa-inc/{company}/ and auto-commit |
| "Create company folder at Phase 1" | sutra-onboard.md | Could be a hook but timing is tricky | First question triggers it — hard to detect in hook |
| "Update STATUS.md after each phase" | sutra-onboard.md | PostToolUse hook on Write | After any Write to asawa-inc/{company}/, update STATUS.md |
| "Write onboarding-signals.md" | sutra-onboard.md | STAYS markdown | Requires LLM judgment to detect signals |
| "Don't skip phases" | sutra-onboard.md | STAYS markdown | Requires understanding of phase sequence |

## For the CEO

When you give an instruction, you don't need to say "make this a hook." Just say it naturally. The system routes it:

- "Don't let company sessions edit Sutra files" → I hear "don't" + "edit" + detectable path → Hook
- "Companies should give feedback weekly" → I hear "should" + judgment needed → Markdown
- "Always commit after writing OS files" → I hear "always" + detectable action → Hook
- "Think about the founder's experience" → I hear "think about" + pure judgment → Markdown
