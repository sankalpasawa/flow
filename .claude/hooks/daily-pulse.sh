#!/bin/bash
# Asawa Inc. — Daily Pulse Generator
# Runs at session start to produce a one-page status of all companies.
# No dependencies beyond git and standard unix tools.

TODAY=$(date +%Y-%m-%d)
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
  echo "ERROR: Not in a git repo. Cannot generate pulse."
  exit 1
fi

# --- Helper functions ---

count_open_todos() {
  local file="$1"
  if [ -f "$file" ]; then
    grep -c '^\- \[ \]' "$file" 2>/dev/null || echo "0"
  else
    echo "n/a"
  fi
}

get_sutra_version() {
  local releases="$REPO_ROOT/asawa-inc/sutra/RELEASES.md"
  local version=""
  if [ -f "$releases" ]; then
    version=$(grep -m1 '^## v' "$releases" 2>/dev/null | sed 's/^## //' | awk '{print $1}')
  fi
  if [ -z "$version" ]; then
    for config in "$REPO_ROOT"/asawa-inc/*/SUTRA-CONFIG.md; do
      version=$(grep -i 'version pinned' "$config" 2>/dev/null | grep -o 'v[0-9][0-9.]*' | head -1)
      if [ -n "$version" ]; then break; fi
    done
  fi
  echo "${version:-unknown}"
}

get_tier() {
  local config="$1"
  local name="$2"
  if [ -f "$config" ]; then
    # Try "Complexity Tier: X" or "Tier: X" patterns
    local tier
    tier=$(grep -i 'complexity tier\|^.*tier' "$config" 2>/dev/null | head -1 | grep -o '[0-9] *(.*' | head -c 40)
    if [ -n "$tier" ]; then
      echo "$tier"
      return
    fi
  fi
  # Known defaults
  case "$name" in
    dayflow) echo "2 (Product)" ;;
    ppr) echo "1 (Personal)" ;;
    *) echo "unknown" ;;
  esac
}

count_feedback() {
  local total=0
  for dir in "$REPO_ROOT"/asawa-inc/*/feedback-to-sutra/; do
    if [ -d "$dir" ]; then
      count=$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')
      total=$((total + count))
    fi
  done
  echo "$total"
}

yesterday_commits_for_path() {
  local path="$1"
  local commits
  commits=$(git -C "$REPO_ROOT" log --since="yesterday" --oneline -- "$path" 2>/dev/null)
  if [ -z "$commits" ]; then
    echo "no commits"
  else
    echo "$commits" | head -5
  fi
}

days_until() {
  local target="$1"
  local today_epoch target_epoch
  if date -j >/dev/null 2>&1; then
    today_epoch=$(date -j -f "%Y-%m-%d" "$TODAY" "+%s" 2>/dev/null)
    target_epoch=$(date -j -f "%Y-%m-%d" "$target" "+%s" 2>/dev/null)
  else
    today_epoch=$(date -d "$TODAY" "+%s" 2>/dev/null)
    target_epoch=$(date -d "$target" "+%s" 2>/dev/null)
  fi
  if [ -n "$today_epoch" ] && [ -n "$target_epoch" ]; then
    echo $(( (target_epoch - today_epoch) / 86400 ))
  else
    echo "?"
  fi
}

health_from_todos() {
  local count="$1"
  if [ "$count" = "n/a" ]; then
    echo "grey (no TODO.md)"
  elif [ "$count" -le 5 ] 2>/dev/null; then
    echo "green"
  elif [ "$count" -le 20 ] 2>/dev/null; then
    echo "yellow"
  else
    echo "red (${count} open items)"
  fi
}

# --- Gather data ---

SUTRA_VERSION=$(get_sutra_version)

# Client companies: directories in asawa-inc/ excluding holding/ and sutra/
CLIENT_DIRS=()
CLIENT_NAMES=()
for d in "$REPO_ROOT"/asawa-inc/*/; do
  dirname=$(basename "$d")
  if [ "$dirname" != "holding" ] && [ "$dirname" != "sutra" ]; then
    CLIENT_DIRS+=("$d")
    CLIENT_NAMES+=("$dirname")
  fi
done
CLIENT_COUNT=${#CLIENT_NAMES[@]}
CLIENT_LIST=$(IFS=', '; echo "${CLIENT_NAMES[*]}")

FEEDBACK_COUNT=$(count_feedback)

# Holding data
HOLDING_TODOS=$(count_open_todos "$REPO_ROOT/asawa-inc/holding/TODO.md")
HOLDING_HIGH=$(grep -i 'HIGH\|urgent\|critical' "$REPO_ROOT/asawa-inc/holding/TODO.md" 2>/dev/null | grep -c '^\- \[ \]' || echo "0")

# --- Output pulse ---

FEEDBACK_HEALTH="green"
if [ "$FEEDBACK_COUNT" -gt 0 ] 2>/dev/null; then
  FEEDBACK_HEALTH="yellow (${FEEDBACK_COUNT} pending)"
fi

cat <<PULSE

═══════════════════════════════════════════
ASAWA INC. — DAILY PULSE — ${TODAY}
═══════════════════════════════════════════

SUTRA (the OS company)
├── Version: ${SUTRA_VERSION} (current release)
├── Clients: ${CLIENT_COUNT} (${CLIENT_LIST})
├── Feedback pending: ${FEEDBACK_COUNT} items
└── Health: ${FEEDBACK_HEALTH}

PULSE

# --- Per-client sections ---

for i in "${!CLIENT_NAMES[@]}"; do
  name="${CLIENT_NAMES[$i]}"
  dir="${CLIENT_DIRS[$i]}"
  NAME_UPPER=$(echo "$name" | tr '[:lower:]' '[:upper:]')

  todo_count=$(count_open_todos "${dir}TODO.md")
  # Fall back to repo-root TODO.md for dayflow
  if [ "$todo_count" = "n/a" ] && [ "$name" = "dayflow" ]; then
    todo_count=$(count_open_todos "$REPO_ROOT/TODO.md")
  fi

  tier=$(get_tier "${dir}SUTRA-CONFIG.md" "$name")
  commits=$(yesterday_commits_for_path "$dir")

  health=$(health_from_todos "$todo_count")

  # Special handling for PPR: add days-to-wedding
  if [ "$name" = "ppr" ]; then
    WEDDING_DATE="2026-07-05"
    days_left=$(days_until "$WEDDING_DATE")
    if [ "$days_left" != "?" ] && [ "$days_left" -le 30 ] 2>/dev/null; then
      if [ "$todo_count" != "n/a" ] && [ "$todo_count" -gt 10 ] 2>/dev/null; then
        health="red (${days_left} days left, ${todo_count} open items)"
      fi
    fi
    cat <<CLIENT
${NAME_UPPER} (wedding command center)
├── Tier: ${tier}
├── Open TODOs: ${todo_count}
├── Yesterday: ${commits}
├── Days to wedding: ${days_left}
└── Health: ${health}

CLIENT
  elif [ "$name" = "dayflow" ]; then
    cat <<CLIENT
${NAME_UPPER} (productivity app)
├── Tier: ${tier}
├── Open TODOs: ${todo_count}
├── Yesterday: ${commits}
└── Health: ${health}

CLIENT
  else
    cat <<CLIENT
${NAME_UPPER}
├── Tier: ${tier}
├── Open TODOs: ${todo_count}
├── Yesterday: ${commits}
└── Health: ${health}

CLIENT
  fi
done

# --- Holding company ---

HOLDING_DECISIONS="none"
if [ "$HOLDING_HIGH" -gt 0 ] 2>/dev/null; then
  HOLDING_DECISIONS="${HOLDING_HIGH} HIGH priority items"
fi

cat <<HOLDING
HOLDING COMPANY
├── Open TODOs: ${HOLDING_TODOS}
└── Pending decisions: ${HOLDING_DECISIONS}

═══════════════════════════════════════════
HOLDING
