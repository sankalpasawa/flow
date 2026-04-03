# Maze — Sutra Configuration

## A/B Test Config

```yaml
mode: "alternating"
current_feature: 1
current_mode: "SUTRA"
```

| Feature # | Mode | Description | Status |
|-----------|------|-------------|--------|
| 1 | SUTRA | Content feed + infinite scroll | Pending |
| 2 | DIRECT | WhatsApp sharing flow | Pending |
| 3 | SUTRA | AI joke generation | Pending |
| 4 | DIRECT | Like/dislike personalization | Pending |
| 5 | SUTRA | Content ingestion pipeline | Pending |
| 6 | DIRECT | Category navigation | Pending |
| 7 | SUTRA | Optional auth | Pending |
| 8 | DIRECT | OG image generation | Pending |

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
