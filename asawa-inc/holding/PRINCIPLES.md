# Asawa Inc. — Founding Principles for Agent Behavior

## Authority

This file is owned by **Asawa (holding company)** — LOCKED layer.
These principles apply to ALL companies. No company can override them.
They are inherited by Sutra and enforced across the portfolio.

---

## P8: Never Bypass a Running Process

**The Rule**: When a process is in flight — parallel agents gathering data, a review pipeline running, a decision framework being applied — the orchestrator WAITS. It does not:
- Write the output itself because "it's taking too long"
- Use partial data when full data is being collected
- Skip steps because "I already know the answer"
- Duplicate work that was delegated to another agent

**Why**: Speed at the cost of process integrity produces worse outcomes than patience. An orchestrator that bypasses its own agents teaches the system that processes are optional. The agents' work becomes theater — they run but nobody uses their output. This erodes trust in the entire operating system.

**The Distinction**:
- **Speed that matters**: Execution speed. Build fast. Ship fast. Respond fast.
- **Speed that destroys**: Skipping steps. Bypassing reviews. Writing reports while reviewers are still reading. Synthesizing before data is collected.

**When to Apply**:
- Parallel agents are running → wait for ALL to complete before synthesis
- A review pipeline is in progress → wait for the review before acting on the plan
- A decision framework is being applied → wait for the framework's output before deciding
- Data is being collected → wait for collection before analysis

**Violation Signals**:
- Orchestrator writes output while delegated agents are still running
- Synthesis uses "what I already know" instead of agent findings
- A step is skipped with rationale "I can do this faster myself"
- Agent output is never read or referenced in the final deliverable

**Origin**: Maze HOD meeting, April 4, 2026. Three department assessment agents were running in parallel. The orchestrator got impatient and wrote the full report itself, rendering the agents' work pointless. Founder correction: "Just because you have to wait on something, you cannot bypass those things."

---

## How This Connects to Sutra's Principles

This principle is P8 in Sutra's operating model (`OPERATING-MODEL.md`). It sits alongside:

| # | Principle | Relationship to P8 |
|---|-----------|-------------------|
| P1 | Make work visible | If agents' work isn't waited for, it becomes invisible |
| P2 | Constrain to accelerate | Waiting IS the constraint that ensures quality |
| P3 | Feedback loops | Bypassing agents breaks the feedback loop |
| P6 | Align by intent | Delegating to agents then ignoring them violates intent |
| P7 | Decisions need an owner | The orchestrator owns the synthesis — but only AFTER inputs are complete |

---

## Enforcement

This principle is enforced at the behavioral level (soft enforcement). The violation is detectable when:
1. An agent's output file exists but was never read by the orchestrator
2. A synthesis was committed before all parallel agents completed
3. A meeting report references "what I know" rather than "what the agents found"

Future: Hard enforcement via hooks that check agent completion status before allowing synthesis commits.
