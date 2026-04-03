# Hehe — Operating Metrics

## What We Measure

| Metric | What it means | How to track | Target |
|--------|--------------|-------------|--------|
| **Upvote rate** | % of jokes that get upvoted | votes table query | > 50% |
| **Ship time** | Hours from "start" to "deployed" | Log per feature | < 30 min for small, < 1 hour for medium |
| **Break rate** | Times a feature created a new bug | Count per feature | 0 |
| **Content quality** | AI joke self-rating distribution | Generation logs | Avg > 7/10 |

## Log

| Date | Feature | Ship Time | Breaks | Notes |
|------|---------|-----------|--------|-------|
| | | | | |

## Trends to Watch
- If upvote rate drops below 50% → content quality problem, not code problem
- If ship time increases → process overhead, simplify
- If AI jokes consistently score lower → improve prompts or switch to curation
