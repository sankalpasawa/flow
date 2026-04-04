#!/bin/bash
# Asawa Enforcement Framework — Self-Assessment Reminder
# Soft warning when editing foundational documents without research.
# Implements Principle 3: Self-assessment before foundational work.
#
# Type: Soft Gate (exit 0 always — warns but never blocks)
# Fires: PreToolUse on Edit/Write
# See: asawa-inc/holding/ENFORCEMENT-FRAMEWORK.md §6

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

ENFORCEMENT_DIR="$REPO_ROOT/.enforcement"
AUDIT_LOG="$ENFORCEMENT_DIR/audit.log"
FILE_PATH="$TOOL_INPUT_file_path"

# Helper: log to audit trail
log_decision() {
  local action="$1" reason="$2"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "$ts | self-assessment | $action | $FILE_PATH | $reason" >> "$AUDIT_LOG" 2>/dev/null
}

# No file path → allow
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if file matches foundational patterns
BASENAME="$(basename "$FILE_PATH")"
IS_FOUNDATIONAL=false

case "$BASENAME" in
  *DESIGN*|*ARCHITECTURE*|*FRAMEWORK*|*PROCESS*|*INTERACTION*|*ENFORCEMENT*|*CHARTER*|*OPERATING*|*SYSTEM-MAP*)
    IS_FOUNDATIONAL=true
    ;;
esac

# Also check: new .md file in asawa-inc/
if [ "$IS_FOUNDATIONAL" = false ]; then
  case "$FILE_PATH" in
    *asawa-inc/*.md)
      # Check if file is new (doesn't exist yet)
      if [ ! -f "$REPO_ROOT/$FILE_PATH" ] && [ ! -f "$FILE_PATH" ]; then
        IS_FOUNDATIONAL=true
      fi
      ;;
  esac
fi

# Not foundational → allow silently
if [ "$IS_FOUNDATIONAL" = false ]; then
  exit 0
fi

# Check for override
OVERRIDE_FILE="$ENFORCEMENT_DIR/override-self-assessment"
if [ -f "$OVERRIDE_FILE" ]; then
  log_decision "OVERRIDE" "Override file exists"
  exit 0
fi

# Check for research-done marker (valid if <1 hour old)
RESEARCH_MARKER="$ENFORCEMENT_DIR/research-done"
if [ -f "$RESEARCH_MARKER" ]; then
  MOD_TIME=$(stat -f %m "$RESEARCH_MARKER" 2>/dev/null || stat -c %Y "$RESEARCH_MARKER" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  AGE=$(( NOW - MOD_TIME ))
  if [ "$AGE" -lt 3600 ]; then
    log_decision "ALLOW" "Research marker exists, age ${AGE}s"
    exit 0
  fi
fi

# No research marker — show soft warning
log_decision "WARN" "Foundational file edit, no research marker"
echo "SELF-ASSESSMENT (Principle 3): You're editing a foundational document."
echo ""
echo "Before modifying this file, have you:"
echo "  - Researched existing approaches? (WebSearch, docs, reference implementations)"
echo "  - Read related docs in asawa-inc/sutra/?"
echo "  - Considered how this change affects all companies downstream?"
echo ""
echo "If yes: create .enforcement/research-done to acknowledge."
echo "If this is a minor update: proceed (this is a soft warning, not a block)."

# Soft gate — always allow
exit 0
