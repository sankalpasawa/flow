# Decision: Company-First Operating Model, Not LLM-First

**Date**: 2026-04-03
**Decided by**: Founder (Sankalp)
**Status**: DECIDED

## Context
We built an operating model (OPERATING-MODEL.md) that was designed partly around LLM limitations — context windows, pattern matching, no persistent memory. The model included "LLM Compatibility" as a first-class section.

The founder challenged this: the operating model should be designed for how an idealistic company actually operates. Every checkpoint, every information flow, every decision framework should be designed as if you had 50 brilliant humans. THEN we adapt for LLMs.

## Decision
The operating model v2 will be designed company-first:

1. **Design the ideal**: How does the best version of this company operate? What are the checkpoints, the handoffs, the reviews, the decision frameworks? Design this WITHOUT considering LLM limitations.

2. **Map to roles**: Which roles execute each part of the model? A product manager, a designer, an engineer, a data analyst, a security reviewer, a QA lead, etc.

3. **Replace with agents**: For each role, determine if an LLM agent can fulfill it. What context does it need? What tools? What model?

4. **Adapt where necessary**: Only where an LLM genuinely CANNOT do something a human can (taste, emotional judgment, novel creativity, interpersonal dynamics), keep it as a human responsibility.

## Trade-offs
**What we gain**: An operating model that is genuinely good for building a company, not just convenient for the tool we're using. If LLMs improve, the model doesn't need to change — only the agent configuration does.

**What we lose**: Some immediate LLM-friendliness. The model may include steps that are hard for current LLMs. That's fine — we either solve the LLM limitation or the founder does that step manually.

## Impact
- OPERATING-MODEL.md needs a v2 rewrite
- The functional principles (PRINCIPLES-BY-FUNCTION.md) become the foundation
- The 70 problem types must all be covered
- LLM adaptation becomes a separate layer, not baked into the core model
