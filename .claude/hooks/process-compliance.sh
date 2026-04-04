#!/bin/bash
# Sutra Process Compliance Hook
# Runs PostToolUse on Bash — checks if the command was a git commit
# and enforces tier-appropriate compliance reminders/blocks.
#
# Tier 1 (Personal): Soft reminder every 3rd commit
# Tier 2 (Product):  Warning if shipping log missing
# Tier 3 (Company):  Block commit if shipping log missing

# Only act on git commit commands
COMMAND="$TOOL_INPUT_command"
if ! echo "$COMMAND" | grep -q "git commit"; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

ROLE_FILE="$HOME/.claude/active-role"
STATE_FILE="$REPO_ROOT/.claude/compliance-state.json"
TODAY=$(date +%Y-%m-%d)

# ── Determine company from active role ──
if [ ! -f "$ROLE_FILE" ]; then
  exit 0
fi

ROLE=$(cat "$ROLE_FILE" 2>/dev/null | tr -d '[:space:]')
COMPANY=""

case "$ROLE" in
  company-*)
    COMPANY="${ROLE#company-}"
    ;;
  dayflow)
    COMPANY="dayflow"
    ;;
  *)
    # Not a company role (sutra, asawa, etc.) — skip compliance
    exit 0
    ;;
esac

if [ -z "$COMPANY" ]; then
  exit 0
fi

# ── Determine complexity tier from SUTRA-CONFIG.md ──
CONFIG_FILE="$REPO_ROOT/asawa-inc/$COMPANY/SUTRA-CONFIG.md"
TIER=0

if [ -f "$CONFIG_FILE" ]; then
  # Extract tier number from "Complexity Tier: N" line
  TIER_LINE=$(grep -i "complexity tier" "$CONFIG_FILE" 2>/dev/null | head -1)
  if echo "$TIER_LINE" | grep -q "1"; then
    TIER=1
  elif echo "$TIER_LINE" | grep -q "2"; then
    TIER=2
  elif echo "$TIER_LINE" | grep -q "3"; then
    TIER=3
  fi
fi

if [ "$TIER" -eq 0 ]; then
  # No tier found — skip
  exit 0
fi

# ── Read/update compliance state ──
COMMITS_SINCE=0
LAST_CHECK=""

if [ -f "$STATE_FILE" ]; then
  # Parse JSON manually (no jq dependency)
  STORED_COMPANY=$(sed -n 's/.*"company"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE")
  STORED_COMMITS=$(sed -n 's/.*"commits_since_check"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' "$STATE_FILE")
  STORED_DATE=$(sed -n 's/.*"last_check"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$STATE_FILE")

  if [ "$STORED_COMPANY" = "$COMPANY" ]; then
    COMMITS_SINCE=${STORED_COMMITS:-0}
    LAST_CHECK=${STORED_DATE:-""}
  fi
fi

COMMITS_SINCE=$((COMMITS_SINCE + 1))

# ── Tier-specific enforcement ──

case "$TIER" in
  1)
    # Tier 1: Soft reminder every 3rd commit
    if [ "$COMMITS_SINCE" -ge 3 ]; then
      echo ""
      echo "[Sutra] Tier 1 compliance reminder ($COMMITS_SINCE commits since last check):"
      echo "  - Have you updated TODO.md?"
      echo "  - Any feedback for Sutra? Write to asawa-inc/$COMPANY/feedback-to-sutra/"
      echo ""
      # Reset counter
      COMMITS_SINCE=0
    fi
    # Write state
    cat > "$STATE_FILE" << JSONEOF
{"company": "$COMPANY", "commits_since_check": $COMMITS_SINCE, "last_check": "$TODAY"}
JSONEOF
    exit 0
    ;;

  2)
    # Tier 2: Warning if no shipping log entry for today
    METRICS_FILE="$REPO_ROOT/asawa-inc/$COMPANY/METRICS.md"
    HAS_TODAY_LOG=false

    if [ -f "$METRICS_FILE" ] && grep -q "$TODAY" "$METRICS_FILE" 2>/dev/null; then
      HAS_TODAY_LOG=true
    fi

    if [ "$HAS_TODAY_LOG" = false ]; then
      echo ""
      echo "[Sutra] WARNING: Tier 2 requires shipping log entry. Update METRICS.md before next deploy."
      echo "  File: asawa-inc/$COMPANY/METRICS.md"
      echo ""
    fi
    # Write state
    cat > "$STATE_FILE" << JSONEOF
{"company": "$COMPANY", "commits_since_check": $COMMITS_SINCE, "last_check": "$TODAY"}
JSONEOF
    exit 0
    ;;

  3)
    # Tier 3: Block commit if no shipping log entry for today
    METRICS_FILE="$REPO_ROOT/asawa-inc/$COMPANY/METRICS.md"
    HAS_TODAY_LOG=false

    if [ -f "$METRICS_FILE" ] && grep -q "$TODAY" "$METRICS_FILE" 2>/dev/null; then
      HAS_TODAY_LOG=true
    fi

    if [ "$HAS_TODAY_LOG" = false ]; then
      echo ""
      echo "[Sutra] BLOCKED: Tier 3 requires shipping log entry before every commit."
      echo "  Update: asawa-inc/$COMPANY/METRICS.md"
      echo "  Add an entry with today's date ($TODAY) before committing."
      echo ""
      # Write state even though blocked
      cat > "$STATE_FILE" << JSONEOF
{"company": "$COMPANY", "commits_since_check": $COMMITS_SINCE, "last_check": "$TODAY"}
JSONEOF
      exit 2
    fi
    # Write state
    cat > "$STATE_FILE" << JSONEOF
{"company": "$COMPANY", "commits_since_check": $COMMITS_SINCE, "last_check": "$TODAY"}
JSONEOF
    exit 0
    ;;
esac

exit 0
