# DayFlow — Operating Metrics

## What We Measure

| Metric | What it means | How to track | Target |
|--------|--------------|-------------|--------|
| **Ship time** | Hours from "I want X" to "X is on phone" | Log per feature in this file | < 1 hour for small, < 1 day for medium |
| **Break rate** | Times a fix/feature created a new bug | Count per feature | 0-1 per feature |
| **Decision speed** | Minutes from "should we?" to "yes/no" | Observe | < 5 min for P1, < 1 day for strategic |

## Log

| Date | Feature | Ship Time | Breaks | Decision Speed | Sutra Feedback |
|------|---------|-----------|--------|---------------|----------------|
| Apr 3 | Morning water bug | 3 hours | 3 | Immediate | Virtual ID flow map was missing |
| Apr 3 | Duration picker scroll | 30 min | 0 | 5 min | Mockup before code worked well |
| Apr 3 | Play screen chat | 45 min | 0 | Immediate | Local fallback pattern is good |
| Apr 3 | Design QA (3 pass) | 2 hours | 0 | N/A | Grep sensors caught 60+ violations |
| Apr 3 | Search LLM | 20 min | 0 | Immediate | Edge function reuse pattern works |
| Apr 3 | Category tint 6→12% | 5 min | 0 | 10 min (mockup) | Show options, don't describe |

## Trends to Watch
- If ship time increases → structure is adding overhead, simplify
- If break rate increases → knowledge system has gaps, add flow map entries
- If decision speed decreases → too many options, need clearer principles
