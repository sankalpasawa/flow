# Maze — Sutra Configuration

## A/B Test Config

```yaml
mode: "alternating"
current_feature: 1
current_mode: "SUTRA"
```

### Pre-Feature Initialization (INIT-0)

| Item | Mode | Description | Status | Audit |
|------|------|-------------|--------|-------|
| INIT-0.1 | SUTRA | Privacy policy | SHIPPED | 17P/8~/12F — artifacts retroactively created |
| INIT-0.2 | SUTRA | RLS rewrite | SHIPPED | 14P/9~/16F — artifacts retroactively created |
| INIT-0.3 | — | Unlike bug fix | Pending | — |
| INIT-0.4 | — | Feed stale closure fix | Pending | — |

### Feature A/B Test

| Feature # | Mode | Description | Status |
|-----------|------|-------------|--------|
| 1 | SUTRA | Content feed + infinite scroll | Shipped (pre-onboarding, not audited) |
| 2 | DIRECT | WhatsApp sharing flow | Shipped (pre-onboarding, not audited) |
| 3 | SUTRA | AI joke generation | Shipped (needs API key) |
| 4 | DIRECT | Like/dislike personalization | Shipped |
| 5 | SUTRA | Content ingestion pipeline | Shipped |
| 6 | DIRECT | Category navigation | Shipped |
| 7 | SUTRA | Optional auth | NOT STARTED — next up |
| 8 | DIRECT | OG image generation | Shipped |

## SUTRA Mode Pipeline

```
/office-hours → refine the feature idea
/autoplan → CEO + design + eng review
[BUILD]
/qa → test + fix
/ship → deploy
/canary → post-deploy health
```

## DIRECT Mode Pipeline

```
[BUILD]
/review → code review
/ship → deploy
```

## Session Settings

```yaml
founder_involvement: "hands-on"
auto_commit: true
auto_push: true
design_approach: "design-in-code"
test_on_mobile: true
check_whatsapp_sharing: true
```
