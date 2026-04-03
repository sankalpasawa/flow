# Submodule Migration Plan

**Status**: DRAFT - Awaiting founder review before execution  
**Author**: CEO of Asawa (AI session)  
**Date**: 2026-04-04  
**Risk level**: HIGH (restructures the entire repo, affects all workflows)

---

## 1. Repo Creation Plan

### Naming Convention

All repos under the `sankalpasawa` GitHub account. Prefix with `asawa-` for holding-level repos, company name alone for product repos.

| New GitHub Repo | Visibility | Purpose |
|-----------------|-----------|---------|
| `asawa-holding` | Private | Meta repo. CEO of Asawa clones this with `--recursive`. Contains holding docs, `.claude/` config, and submodule pointers. |
| `sutra` | Private | Sutra OS source: layers 1-4, package, research, feedback, website. Sutra IP lives here exclusively. |
| `dayflow` | Private | DayFlow product: app code (`mobile/`), OS files, data, designs, supabase config, org structure. Everything a CEO of DayFlow needs. |
| `ppr` | Private | PPR product: app code (`ppr-app/`), OS files. Everything a CEO of PPR needs. |
| `maze` | Private | Maze: OS files only (no code yet). Onboarding-in-progress. |

### Future companies

Each new company onboarded via Sutra gets its own repo. The `/sutra-onboard` command creates the repo as part of Phase 7 (DEPLOY).

---

## 2. File Mapping

### `asawa-holding` (meta repo, NOT a submodule)

These files live directly in the meta repo (not inside any submodule):

```
asawa-holding/
├── .claude/                          ← from flow/.claude/ (hooks, settings, commands, active-role)
├── .gitmodules                       ← NEW: submodule definitions
├── holding/                          ← from flow/asawa-inc/holding/
│   ├── TODO.md
│   ├── SYSTEM-MAP.md
│   ├── SESSION-ISOLATION.md
│   ├── DAILY-PULSE.md
│   ├── GETTING-STARTED.md
│   ├── INSTRUCTION-ROUTING.md
│   ├── ORG-ROADMAP.md
│   ├── AGENT-INCENTIVES.md
│   ├── feedback-to-sutra/
│   ├── reviews/
│   ├── website/
│   └── SUBMODULE-MIGRATION-PLAN.md   ← this file
├── designs/                          ← from flow/designs/ (shared across portfolio)
├── org/                              ← from flow/org/ (shared agent structure for all companies)
├── start.sh                          ← from flow/start.sh (updated for new structure)
├── CLAUDE.md                         ← NEW: holding-level session instructions (see section 7)
├── sutra/                            ← SUBMODULE → sankalpasawa/sutra
├── dayflow/                          ← SUBMODULE → sankalpasawa/dayflow
├── ppr/                              ← SUBMODULE → sankalpasawa/ppr
└── maze/                             ← SUBMODULE → sankalpasawa/maze
```

### `sutra` repo

```
sutra/
├── CLAUDE.md                         ← NEW: Sutra-specific session instructions
├── feedback/                         ← from flow/asawa-inc/sutra/feedback/
├── layer1-abstraction/               ← from flow/asawa-inc/sutra/layer1-abstraction/
├── layer2-operating-system/          ← from flow/asawa-inc/sutra/layer2-operating-system/
├── layer3-modules/                   ← from flow/asawa-inc/sutra/layer3-modules/
├── layer4-department-skills/         ← from flow/asawa-inc/sutra/layer4-department-skills/
├── package/                          ← from flow/asawa-inc/sutra/package/
├── research/                         ← from flow/asawa-inc/sutra/research/
├── website/                          ← from flow/asawa-inc/sutra/website/
├── RELEASES.md                       ← from flow/asawa-inc/sutra/RELEASES.md
├── START-HERE.md                     ← from flow/asawa-inc/sutra/START-HERE.md
└── VISION.md                         ← from flow/asawa-inc/sutra/VISION.md
```

### `dayflow` repo

DayFlow is the most complex migration because its code and OS files currently live in different directories.

```
dayflow/
├── CLAUDE.md                         ← Merged from flow/CLAUDE.md (DayFlow-specific parts only)
├── mobile/                           ← from flow/mobile/ (the Expo app)
├── os/                               ← from flow/asawa-inc/dayflow/ (renamed for clarity)
│   ├── SUTRA-CONFIG.md
│   ├── SUTRA-VERSION.md
│   ├── OPERATING-SYSTEM-V2.md
│   ├── METRICS.md
│   ├── FEATURE-SPECS.md
│   ├── DESIGN-QA-CHECKLIST.md
│   ├── PRODUCT-KNOWLEDGE-SYSTEM.md
│   ├── SECURITY-INFRA.md
│   ├── TEST-PLAN.md
│   ├── TESTING-FRAMEWORK.md
│   ├── adapted-principles/
│   ├── feedback-from-sutra/
│   └── feedback-to-sutra/
├── org/                              ← REMOVED: moved to asawa-holding (shared across portfolio)
├── designs/                          ← REMOVED: moved to asawa-holding (shared across portfolio)
├── data/                             ← from flow/data/ (seed data)
├── supabase/                         ← from flow/supabase/ (edge functions, migrations)
├── .planning/                        ← from flow/.planning/ (GSD state for DayFlow)
├── .gstack/                          ← from flow/.gstack/ (gstack runtime state)
├── .claude/                          ← NEW: DayFlow-specific hooks and settings
├── ARCHITECTURE.md                   ← from flow/ARCHITECTURE.md
├── DESIGN.md                         ← from flow/DESIGN.md
├── DESIGN-QA-CHECKLIST.md            ← from flow/DESIGN-QA-CHECKLIST.md
├── FEATURE-SPECS.md                  ← from flow/FEATURE-SPECS.md
├── PLAN.md                           ← from flow/PLAN.md
├── TODO.md                           ← from flow/TODO.md
├── PRODUCT-KNOWLEDGE-SYSTEM.md       ← from flow/PRODUCT-KNOWLEDGE-SYSTEM.md
├── SECURITY-INFRA.md                 ← from flow/SECURITY-INFRA.md
├── TEST-PLAN.md                      ← from flow/TEST-PLAN.md
├── TESTING-FRAMEWORK.md              ← from flow/TESTING-FRAMEWORK.md
└── OPERATING-MODEL.md                ← from flow/OPERATING-MODEL.md
```

**Decision point**: Some top-level files (ARCHITECTURE.md, DESIGN.md, PLAN.md, etc.) are DayFlow-specific even though they sit at root. They all go to the `dayflow` repo. The `ORG-ROADMAP.md` at root is ambiguous -- it likely goes to `dayflow` since it was generated during DayFlow work.

**Alternative**: Instead of renaming `asawa-inc/dayflow/` to `os/`, keep the flat structure and merge the OS files directly into the DayFlow repo root. This avoids a sub-directory nobody will remember.

### `ppr` repo

```
ppr/
├── CLAUDE.md                         ← from flow/ppr-app/CLAUDE.md (already exists, expand it)
├── src/                              ← from flow/ppr-app/src/
├── public/                           ← from flow/ppr-app/public/
├── package.json                      ← from flow/ppr-app/package.json
├── (other ppr-app files)             ← everything else from flow/ppr-app/
├── os/                               ← from flow/asawa-inc/ppr/ (OS files)
│   ├── OPERATING-SYSTEM-V1.md
│   ├── SUTRA-CONFIG.md
│   ├── SUTRA-VERSION.md
│   ├── METRICS.md
│   ├── PRODUCT-BRIEF.md
│   ├── TODO.md
│   ├── feedback-from-sutra/
│   └── feedback-to-sutra/
├── AGENTS.md                         ← from flow/ppr-app/AGENTS.md
└── .claude/                          ← NEW: PPR-specific hooks and settings
```

### `maze` repo

```
maze/
├── CLAUDE.md                         ← NEW: Maze-specific session instructions
├── os/                               ← from flow/asawa-inc/maze/
│   ├── INTAKE.md
│   ├── MARKET-BRIEF.md
│   ├── PRODUCT-BRIEF.md
│   ├── STATUS.md
│   ├── onboarding-signals.md
│   └── feedback-to-sutra/
└── .claude/                          ← NEW: Maze-specific hooks and settings
```

### Files that DON'T move (deleted or consolidated)

| File | Disposition |
|------|-------------|
| `flow/.gitkeep` | Delete |
| `flow/.DS_Store` | Delete (gitignore) |
| `flow/TODOS.md` | Consolidate into `dayflow/TODO.md` (duplicate) |
| `flow/asawa-inc/` directory | Fully decomposed into separate repos |
| `flow/.claude/commands/sutra-onboard.md` | Moves to `asawa-holding/.claude/commands/` (only meaningful from holding) |
| `flow/.claude/commands/asawa.md` | Moves to `asawa-holding/.claude/commands/` |
| `flow/.claude/commands/sutra.md` | Moves to `asawa-holding/.claude/commands/` |
| `flow/.claude/commands/dayflow.md` | Could stay in holding OR move to dayflow. See section 7. |
| `flow/.claude/commands/company.md` | Moves to `asawa-holding/.claude/commands/` |

---

## 3. History Preservation

### Recommendation: Start fresh, archive the monorepo

**Rationale**: The `flow` repo is young (weeks old). The commit history is mostly AI-generated scaffolding. Preserving history via `git filter-branch` or `git subtree split` adds complexity and risk for minimal value.

**Plan**:
1. Tag the current `flow` repo HEAD as `pre-submodule-migration`
2. Rename `flow` repo on GitHub to `flow-archive` (or make it private/archive it)
3. Create each new repo fresh with an initial commit containing the migrated files
4. The archive preserves full history if anyone ever needs it

**If history preservation is required** (founder decides this is important):
- Use `git subtree split` for each path:
  ```bash
  # Example for sutra
  git subtree split --prefix=asawa-inc/sutra -b sutra-split
  # Push sutra-split branch to new sutra repo
  ```
- This works cleanly for `asawa-inc/sutra/`, `asawa-inc/holding/`, `asawa-inc/ppr/`, `asawa-inc/maze/`
- It does NOT work cleanly for `dayflow` because DayFlow files span multiple top-level directories (`mobile/`, `designs/`, `data/`, `org/`, `supabase/`, plus root-level .md files)
- DayFlow would require `git filter-repo` with multiple path inclusions, which is messier

**Verdict**: Ask the founder. If the answer is "I don't care about old history," go fresh. If "I want it," use `git filter-repo` for DayFlow and `git subtree split` for the others.

---

## 4. Hooks Migration

### Current hooks (in `flow/.claude/hooks/`)

| Hook | Trigger | Purpose | Post-migration status |
|------|---------|---------|----------------------|
| `daily-pulse.sh` | SessionStart | Generates cross-company status | **STAYS in `asawa-holding`** only. Not needed in individual repos (they only see their own company). |
| `enforce-boundaries.sh` | PreToolUse (Edit/Write) | Blocks file edits outside active role scope | **LARGELY UNNECESSARY**. Physical repo separation does most of this work. See below. |
| `process-compliance.sh` | PostToolUse (Bash) | Tier-based commit compliance (metrics log) | **MOVES to each company repo** with simplified paths (no `asawa-inc/{company}/` prefix). |
| `session-feedback-check.sh` | PostToolUse (Bash) | Reminds about feedback-to-sutra on git push | **MOVES to each company repo** with simplified paths. |

### What `enforce-boundaries.sh` becomes

With physical repo separation, most boundary enforcement is automatic:

| Current rule | Post-migration |
|-------------|----------------|
| CEO of DayFlow cannot read Sutra source | **AUTOMATIC**: Sutra files are in a different repo. Physically impossible unless they clone it. |
| CEO of DayFlow cannot edit holding files | **AUTOMATIC**: Holding files are in `asawa-holding`, not in `dayflow`. |
| CEO of DayFlow cannot edit other companies | **AUTOMATIC**: Other companies are separate repos. |
| CEO of Sutra cannot edit client files (except feedback-from-sutra) | **STILL NEEDED** if Sutra is a submodule inside `asawa-holding`. When CEO of Asawa clones recursively, all repos are on disk. The hook prevents lateral edits. |
| CEO of Asawa can edit everything | **AUTOMATIC** in `asawa-holding` with recursive clone. |

**New hook for `asawa-holding`**: A simplified boundary hook that only matters when the active role is NOT `asawa`. When role is `sutra`, block edits outside `sutra/`. When role is `company-{name}`, block edits outside `{name}/`. CEO of Asawa has no restrictions.

**Company repos get NO boundary hook**: They are standalone. There is nothing outside their scope to protect.

### New `settings.json` per repo

Each repo gets its own `.claude/settings.json`:

**`asawa-holding/.claude/settings.json`**:
- SessionStart: `daily-pulse.sh` (cross-company status)
- PreToolUse (Edit/Write): simplified `enforce-boundaries.sh` (only relevant for multi-repo clones)
- PostToolUse (Bash): no compliance hooks (holding doesn't have a tier)

**`dayflow/.claude/settings.json`**:
- SessionStart: none (or DayFlow-specific startup)
- PreToolUse: none (no boundary to enforce within own repo)
- PostToolUse (Bash): `process-compliance.sh` (tier-based), `session-feedback-check.sh` (feedback reminder)

**`ppr/.claude/settings.json`**: Same pattern as DayFlow.

**`sutra/.claude/settings.json`**:
- SessionStart: Sutra-specific context loading
- PreToolUse: none
- PostToolUse: none (Sutra doesn't have compliance tiers)

---

## 5. Sutra Delivery Model (Post-Migration)

### How onboarding works today

1. Founder runs `/sutra-onboard` from the `flow` repo
2. Sutra reads its templates from `asawa-inc/sutra/`
3. Sutra creates `asawa-inc/{company}/` with OS files
4. Everything is in one repo -- delivery is just file creation

### How onboarding works after migration

**Option A: Onboarding runs from `asawa-holding` (recommended for now)**

1. Founder runs `/sutra-onboard` from `asawa-holding` (CEO of Asawa or Sutra session)
2. Sutra reads templates from `sutra/` submodule (requires recursive clone)
3. Sutra creates a new GitHub repo via `gh repo create sankalpasawa/{company} --private`
4. Sutra generates OS files locally in a temp directory
5. Sutra pushes generated files to the new repo
6. Sutra adds it as a submodule: `git submodule add https://github.com/sankalpasawa/{company}.git`
7. Sutra commits the `.gitmodules` update to `asawa-holding`

**Key change**: The `/sutra-onboard` command needs to call `gh repo create` and `git submodule add` instead of `mkdir -p asawa-inc/{company}`.

**Option B: Sutra as MCP server (future, per TODO.md)**

Sutra runs as a remote service. The founder doesn't need the Sutra repo at all. The MCP server generates OS files and pushes them to the company's repo via GitHub API.

### What the founder (CEO of {Company}) sees

They clone their own repo: `git clone https://github.com/sankalpasawa/{company}.git`

They get:
- Their OS files
- Their code (if any)
- Their `.claude/` config
- Their CLAUDE.md with session instructions

They NEVER see:
- Sutra source
- Other companies
- Holding company docs

---

## 6. Feedback Flow (Cross-Repo)

### Current flow (single repo)

```
dayflow/feedback-to-sutra/{date}-{topic}.md   ← CEO of DayFlow writes
sutra/feedback/dayflow/{date}-response.md      ← CEO of Sutra responds
dayflow/feedback-from-sutra/{date}-update.md   ← Sutra pushes update
```

All in one repo. Simple file operations.

### Post-migration flow

Feedback directories stay in each company repo. The mechanism for cross-repo communication changes.

**Approach: Script-based pull/push from `asawa-holding`**

Since CEO of Asawa has the recursive clone, they can see all submodules:

```bash
# CEO of Sutra reviews feedback (from asawa-holding)
cat dayflow/os/feedback-to-sutra/*.md
cat ppr/os/feedback-to-sutra/*.md

# CEO of Sutra responds (writes to the company's repo via submodule)
echo "response" > dayflow/os/feedback-from-sutra/2026-04-05-response.md
cd dayflow && git add . && git commit -m "sutra: feedback response" && git push && cd ..
git add dayflow  # update submodule pointer
git commit -m "holding: update dayflow submodule pointer"
```

**Simplified with a helper script** (`asawa-holding/scripts/sync-feedback.sh`):

```bash
#!/bin/bash
# Pull latest from all company repos, check for new feedback-to-sutra entries
for company in dayflow ppr maze; do
  cd "$company" && git pull origin main && cd ..
  NEW=$(find "$company/os/feedback-to-sutra" -newer .last-feedback-check 2>/dev/null)
  if [ -n "$NEW" ]; then
    echo "New feedback from $company:"
    echo "$NEW"
  fi
done
touch .last-feedback-check
```

**Key insight**: Feedback flow only happens from `asawa-holding` (CEO of Asawa or CEO of Sutra with access). A CEO of DayFlow working in their standalone repo writes to `feedback-to-sutra/` and pushes. The next time CEO of Sutra runs from `asawa-holding`, they pull and see it.

---

## 7. CLAUDE.md Per Repo

Each repo needs its own CLAUDE.md tailored to that repo's scope.

### `asawa-holding/CLAUDE.md`

```
- Identity: CEO of Asawa Inc.
- Scope: Full authority across all companies
- Context loading: holding/TODO.md, holding/SYSTEM-MAP.md
- Available commands: /asawa, /sutra, /company, /sutra-onboard
- Submodule awareness: knows how to update submodule pointers after changes
- Cross-company visibility: feedback review, portfolio health, Sutra updates
- Does NOT contain: DayFlow app code instructions, build commands, design system
```

### `sutra/CLAUDE.md`

```
- Identity: CEO of Sutra
- Scope: Sutra protocols, onboarding process, skill catalog, versioning
- Context loading: START-HERE.md, layer2-operating-system/, RELEASES.md
- Key rule: Never expose Sutra internals to clients. OS output only.
- Feedback: Read from client repos (if cloned as part of holding)
- Does NOT contain: Any client company code or data
```

### `dayflow/CLAUDE.md`

```
- Identity: CEO of DayFlow
- Scope: DayFlow app code, OS, designs, data, org
- Context loading: TODO.md, ARCHITECTURE.md, DESIGN.md, PLAN.md
- Build: cd mobile && npm install && npx expo start
- Platform: iPhone via Expo Go only
- Design system: theme.ts, DESIGN.md
- OS files: os/ directory
- Feedback: Write to os/feedback-to-sutra/. Read from os/feedback-from-sutra/.
- All current DayFlow-specific content from flow/CLAUDE.md moves here
- Does NOT contain: Sutra source, holding docs, other companies
```

### `ppr/CLAUDE.md`

```
- Already exists at ppr-app/CLAUDE.md
- Expand with: OS file locations (os/), feedback flow, build commands
- Remove: Any references to asawa-inc/ paths
- Does NOT contain: Sutra source, DayFlow code, holding docs
```

### `maze/CLAUDE.md`

```
- Identity: CEO of Maze
- Scope: Maze company (onboarding in progress)
- Status: Intake complete, needs ARCHITECT phase
- OS files: os/ directory
- Does NOT contain: Code (none yet)
```

### What happens to the current monorepo CLAUDE.md

The current `flow/CLAUDE.md` is enormous (30KB) and mixes:
- DayFlow app instructions (majority)
- Holding company instructions
- PPR tech stack
- General conventions

**Decomposition**:
1. DayFlow-specific content (build, architecture, design principles, key files, dev mode, web DB gotchas, code quality rules) → `dayflow/CLAUDE.md`
2. PPR tech stack section → `ppr/CLAUDE.md` (already partially there)
3. Holding-level content (agent orchestration, context loading table, skill routing, GSD workflow, living documentation rule) → `asawa-holding/CLAUDE.md`
4. Sutra delivery model references → remove (handled by submodule separation)

---

## 8. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking DayFlow development mid-sprint** | Can't develop the app during migration | Tag `pre-migration`, do the migration in one session, verify `npx expo start` works from new repo before deleting old |
| **Losing uncommitted work** | Work loss | `git stash` everything, verify clean status before starting |
| **`.claude/` hooks reference old paths** | Hooks fail silently, enforcement breaks | Test every hook after migration. Search-and-replace `asawa-inc/{company}/` → `os/` in all hook scripts |
| **CLAUDE.md references wrong file paths** | Sessions load wrong context, dev confusion | After migration, grep all CLAUDE.md files for `asawa-inc/` — every match is a bug |
| **Submodule pointer drift** | asawa-holding points to old commit, changes in submodule not reflected | Document the `cd submodule && git pull && cd .. && git add submodule && git commit` workflow clearly |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **GSD `.planning/` state breaks** | Can't resume GSD workflows | GSD state is ephemeral. If it breaks, just re-init with `/gsd:new-project` |
| **`start.sh` breaks** | Can't start role sessions easily | Rewrite `start.sh` for new paths. Test all roles. |
| **Sutra onboarding creates repos in wrong place** | New companies not properly isolated | Test onboarding flow end-to-end after migration |
| **designs/ attribution ambiguous** | Some designs are DayFlow-specific, some are Sutra/portfolio | RESOLVED: All go to holding (shared). Companies reference designs from the meta repo. |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **GitHub repo naming conflicts** | Can't create repos | Check `gh repo list` before creating. Use unambiguous names. |
| **Submodule SSH vs HTTPS** | Clone fails for some auth setups | Use HTTPS URLs consistently. Document. |

### Rollback Plan

1. All new repos can be deleted: `gh repo delete sankalpasawa/{repo} --yes`
2. The original `flow` repo (tagged `pre-migration`) is the rollback target
3. If migration fails midway: delete new repos, continue working in `flow`
4. Total rollback time: < 5 minutes

---

## 9. Step-by-Step Execution Order

### Phase 0: Pre-flight (5 min)

- [ ] 0.1. Verify `flow` repo has clean git status (`git status` shows nothing)
- [ ] 0.2. Push all branches: `git push origin --all`
- [ ] 0.3. Tag current state: `git tag pre-submodule-migration`
- [ ] 0.4. Push tag: `git push origin pre-submodule-migration`
- [ ] 0.5. Verify GitHub CLI works: `gh auth status`
- [ ] 0.6. Decide: fresh start or preserve history? (founder decision)

**CHECKPOINT**: All code is backed up and tagged. Safe to proceed.

### Phase 1: Create empty repos on GitHub (2 min)

- [ ] 1.1. `gh repo create sankalpasawa/asawa-holding --private --description "Asawa Inc. holding company meta repo"`
- [ ] 1.2. `gh repo create sankalpasawa/sutra --private --description "Sutra operating system"`
- [ ] 1.3. `gh repo create sankalpasawa/dayflow --private --description "DayFlow — AI-native daily planner"`
- [ ] 1.4. `gh repo create sankalpasawa/ppr --private --description "PPR — Personal Wedding Command Center"`
- [ ] 1.5. `gh repo create sankalpasawa/maze --private --description "Maze — onboarding in progress"`

**CHECKPOINT**: All repos exist on GitHub. No content yet.

### Phase 2: Populate Sutra repo (10 min)

- [ ] 2.1. Clone empty sutra repo: `git clone https://github.com/sankalpasawa/sutra.git /tmp/sutra-migration`
- [ ] 2.2. Copy files from `flow/asawa-inc/sutra/` to `/tmp/sutra-migration/`
- [ ] 2.3. Create `sutra/CLAUDE.md` with Sutra-specific instructions
- [ ] 2.4. Create `sutra/.claude/settings.json` (minimal, no boundary hooks)
- [ ] 2.5. Commit and push: `git add . && git commit -m "initial: migrate from flow monorepo" && git push`

**CHECKPOINT**: `sutra` repo has all Sutra content. Verify file count matches source.

### Phase 3: Populate DayFlow repo (15 min)

- [ ] 3.1. Clone empty dayflow repo: `git clone https://github.com/sankalpasawa/dayflow.git /tmp/dayflow-migration`
- [ ] 3.2. Copy `flow/mobile/` → `/tmp/dayflow-migration/mobile/`
- [ ] 3.3. Copy `flow/asawa-inc/dayflow/` → `/tmp/dayflow-migration/os/`
- [ ] 3.4. Copy `flow/data/` → `/tmp/dayflow-migration/data/` (EXCEPT `humor-app-market-research.md` → Maze)
- [ ] 3.5. Copy `flow/supabase/` → `/tmp/dayflow-migration/supabase/`
- [ ] 3.6. Copy `flow/.planning/` → `/tmp/dayflow-migration/.planning/`
- [ ] 3.7. Copy `flow/.gstack/` → `/tmp/dayflow-migration/.gstack/`
- [ ] 3.8. Copy root-level DayFlow docs: `ARCHITECTURE.md`, `DESIGN.md`, `DESIGN-QA-CHECKLIST.md`, `FEATURE-SPECS.md`, `OPERATING-MODEL.md`, `ORG-ROADMAP.md`, `PLAN.md`, `PRODUCT-KNOWLEDGE-SYSTEM.md`, `SECURITY-INFRA.md`, `TEST-PLAN.md`, `TESTING-FRAMEWORK.md`, `TODO.md`
- [ ] 3.9. Create `dayflow/CLAUDE.md` from DayFlow-specific sections of `flow/CLAUDE.md`
- [ ] 3.10. Create `dayflow/.claude/settings.json` with compliance + feedback hooks
- [ ] 3.11. Create `dayflow/.claude/hooks/process-compliance.sh` (updated paths: `os/` instead of `asawa-inc/dayflow/`)
- [ ] 3.12. Create `dayflow/.claude/hooks/session-feedback-check.sh` (updated paths)
- [ ] 3.13. Copy `.gitignore` and adapt
- [ ] 3.14. Verify: `cd /tmp/dayflow-migration/mobile && npm install && npx expo start` works
- [ ] 3.15. Commit and push

**CHECKPOINT**: DayFlow repo is self-contained. App builds. All docs present.

### Phase 4: Populate PPR repo (10 min)

- [ ] 4.1. Clone empty ppr repo
- [ ] 4.2. Copy `flow/ppr-app/` contents → `/tmp/ppr-migration/` (root level, not nested)
- [ ] 4.3. Copy `flow/asawa-inc/ppr/` → `/tmp/ppr-migration/os/`
- [ ] 4.4. Expand `ppr/CLAUDE.md` with OS file paths and feedback flow
- [ ] 4.5. Create `ppr/.claude/settings.json` with compliance + feedback hooks
- [ ] 4.6. Create `ppr/.claude/hooks/` (same pattern as DayFlow)
- [ ] 4.7. Commit and push

**CHECKPOINT**: PPR repo is self-contained. `npm install && npm run dev` works.

### Phase 5: Populate Maze repo (5 min)

- [ ] 5.1. Clone empty maze repo
- [ ] 5.2. Copy `flow/asawa-inc/maze/` → `/tmp/maze-migration/os/`
- [ ] 5.3. Create `maze/CLAUDE.md`
- [ ] 5.4. Create minimal `maze/.claude/settings.json`
- [ ] 5.5. Commit and push

**CHECKPOINT**: Maze repo has all OS files.

### Phase 6: Build the meta repo `asawa-holding` (15 min)

- [ ] 6.1. Clone empty holding repo: `git clone https://github.com/sankalpasawa/asawa-holding.git /tmp/holding-migration`
- [ ] 6.2. Copy `flow/asawa-inc/holding/` → `/tmp/holding-migration/holding/`
- [ ] 6.3. Copy `flow/designs/` → `/tmp/holding-migration/designs/`
- [ ] 6.4. Copy `flow/org/` → `/tmp/holding-migration/org/`
- [ ] 6.5. Copy `flow/.claude/` → `/tmp/holding-migration/.claude/`
- [ ] 6.6. Update `.claude/hooks/enforce-boundaries.sh` for new paths (no `asawa-inc/` prefix)
- [ ] 6.7. Update `.claude/hooks/daily-pulse.sh` for new paths (submodule dirs, not `asawa-inc/`)
- [ ] 6.8. Remove compliance + feedback hooks from holding (they belong in company repos)
- [ ] 6.9. Update `.claude/settings.json`: remove PostToolUse compliance/feedback hooks
- [ ] 6.10. Update `.claude/commands/` — update all commands for new paths
- [ ] 6.11. Copy and update `start.sh` for new structure
- [ ] 6.12. Create `asawa-holding/CLAUDE.md` (holding-level instructions)
- [ ] 6.13. Add submodules:
  ```bash
  git submodule add https://github.com/sankalpasawa/sutra.git sutra
  git submodule add https://github.com/sankalpasawa/dayflow.git dayflow
  git submodule add https://github.com/sankalpasawa/ppr.git ppr
  git submodule add https://github.com/sankalpasawa/maze.git maze
  ```
- [ ] 6.14. Commit and push

**CHECKPOINT**: `git clone --recursive https://github.com/sankalpasawa/asawa-holding.git` gives the full portfolio.

### Phase 7: Verification (10 min)

- [ ] 7.1. **Isolation test**: Clone `dayflow` alone. Verify NO Sutra files exist anywhere.
- [ ] 7.2. **Isolation test**: Clone `sutra` alone. Verify NO client code exists.
- [ ] 7.3. **Full clone test**: Clone `asawa-holding --recursive`. Verify all submodules populated.
- [ ] 7.4. **Build test**: From DayFlow clone, run `cd mobile && npm install && npx expo start`
- [ ] 7.5. **Build test**: From PPR clone, run `npm install && npm run dev`
- [ ] 7.6. **Hook test**: Start a session in `dayflow`. Verify no boundary hook errors.
- [ ] 7.7. **Hook test**: Start a session in `asawa-holding` with role `company-dayflow`. Verify boundary hook allows dayflow edits, blocks sutra edits.
- [ ] 7.8. **Command test**: Run `/asawa` from `asawa-holding`. Verify dashboard loads.
- [ ] 7.9. **Feedback test**: Write a feedback file in `dayflow`. Push. Pull from `asawa-holding`. Verify visible.
- [ ] 7.10. **Path test**: Grep all CLAUDE.md files for `asawa-inc/`. Every match is a migration bug. Fix.

**CHECKPOINT**: All tests pass. Migration is complete.

### Phase 8: Cleanup (5 min)

- [ ] 8.1. Archive the `flow` repo on GitHub (Settings → Archive)
- [ ] 8.2. Update local clone: `cd ~/Claude && git clone --recursive https://github.com/sankalpasawa/asawa-holding.git`
- [ ] 8.3. Update any bookmarks, shell aliases, IDE projects to point to new paths
- [ ] 8.4. Delete `/tmp/*-migration` temp directories

**CHECKPOINT**: Old repo archived. New structure is the single source of truth.

---

## 10. What Becomes Unnecessary

### Hooks and enforcement that become redundant

| Current mechanism | Why it exists | Why it's unnecessary post-migration |
|-------------------|---------------|-------------------------------------|
| `enforce-boundaries.sh` blocking Sutra reads | CEO of DayFlow shouldn't see Sutra IP | **Physical separation**: Sutra is a different repo. Can't read what isn't cloned. |
| `enforce-boundaries.sh` blocking cross-company edits | CEO of DayFlow shouldn't edit PPR | **Physical separation**: PPR is a different repo. |
| `enforce-boundaries.sh` blocking holding edits | CEO of DayFlow shouldn't edit holding docs | **Physical separation**: holding is in meta repo. |
| `active-role` file for isolation | Determines which company scope is active | **Mostly unnecessary**: Each repo IS a company. Only needed in `asawa-holding` when CEO wants to restrict scope voluntarily. |
| `SESSION-ISOLATION.md` 5-level protocol | Defines cognitive + file boundary isolation | **Levels 1-3 become automatic**. Level 4-5 (cognitive) are still relevant for `asawa-holding` sessions where everything is visible. |
| Path-based routing in `CLAUDE.md` (the "User says / Load" table) | Context loading depends on detecting which company | **Unnecessary per repo**: Each repo's CLAUDE.md only has that company's context. Only `asawa-holding/CLAUDE.md` needs routing. |
| `start.sh` role switching | Launches Claude with the right role command | **Simplified**: Each repo has its own CLAUDE.md. `start.sh` in holding only needs to handle the cross-company case. Individual repos don't need it at all. |

### Concepts that remain necessary

| Mechanism | Why it still matters |
|-----------|---------------------|
| `daily-pulse.sh` in holding | CEO of Asawa still needs cross-portfolio view |
| `process-compliance.sh` in each company | Tier-based compliance is still valuable within a company |
| `session-feedback-check.sh` in each company | Feedback flow still needs reminders |
| `feedback-to-sutra/` and `feedback-from-sutra/` directories | Cross-repo feedback is the communication protocol |
| `/sutra-onboard` command in holding | Onboarding still creates new companies (now creates repos instead of dirs) |
| Boundary hook in `asawa-holding` ONLY | When CEO clones recursively, lateral isolation between submodules still needs enforcement |

---

## Founder Decisions (Resolved 2026-04-04)

1. **History**: ✅ **Fresh start**. New "Asawa" repo. Tag and archive old `flow` repo.
2. **designs/**: ✅ **Holding** (shared). Sutra will create designs for future companies too. Not DayFlow-specific.
3. **org/**: ✅ **Holding** (shared). Org structure is for the whole portfolio, not just DayFlow. Every company gets the agent structure as it evolves.
4. **OS file placement**: ✅ **Nest under `os/`** subdirectory.
5. **Branch naming**: ✅ **Start on `main`**. Fresh start, clean branch.
6. **data/humor-app-market-research.md**: ✅ **Move to Maze**. It's Maze research in the wrong repo.
7. **GitHub**: ✅ **Personal account** (`sankalpasawa`). No org for now.

---

## Estimated Total Execution Time

| Phase | Time |
|-------|------|
| 0. Pre-flight | 5 min |
| 1. Create repos | 2 min |
| 2. Sutra | 10 min |
| 3. DayFlow | 15 min |
| 4. PPR | 10 min |
| 5. Maze | 5 min |
| 6. Meta repo | 15 min |
| 7. Verification | 10 min |
| 8. Cleanup | 5 min |
| **Total** | **~75 min** |

This can be done in a single Claude session. Phases 2-5 (populating individual repos) can run in parallel if using subagents.
