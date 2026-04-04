#!/bin/bash
# Asawa Enforcement Framework — Process Gate
# Blocks source code edits without a SHAPE.md in the current feature directory.
# Implements Principle 1: Natural language is intent, not override.
#
# Type: Hard Gate (exit 2 = block)
# Fires: PreToolUse on Edit/Write
# See: asawa-inc/holding/ENFORCEMENT-FRAMEWORK.md §4

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0  # Not in a git repo, allow
fi

ENFORCEMENT_DIR="$REPO_ROOT/.enforcement"
AUDIT_LOG="$ENFORCEMENT_DIR/audit.log"
FEATURES_DIR="$REPO_ROOT/.planning/features/current"
FILE_PATH="$TOOL_INPUT_file_path"

# Helper: log to audit trail
log_decision() {
  local action="$1" reason="$2"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "$ts | process-gate | $action | $FILE_PATH | $reason" >> "$AUDIT_LOG" 2>/dev/null
}

# No file path → not a file edit, allow
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if file is source code (only gate source directories)
case "$FILE_PATH" in
  */src/*|*/app/*|*/lib/*|*/components/*|*/pages/*|*/features/*|*/store/*|*/hooks/*)
    ;; # Source code — continue to checks
  *)
    exit 0  # Not source code — allow freely
    ;;
esac

# No current feature directory → not in a feature flow, allow
if [ ! -d "$FEATURES_DIR" ]; then
  exit 0
fi

# Check for override file
OVERRIDE_FILE="$ENFORCEMENT_DIR/override-process-gate"
if [ -f "$OVERRIDE_FILE" ]; then
  log_decision "OVERRIDE" "Override file exists: $(cat "$OVERRIDE_FILE" 2>/dev/null | head -1)"
  exit 0
fi

# Check for SHAPE.md
if [ ! -f "$FEATURES_DIR/SHAPE.md" ]; then
  log_decision "BLOCK" "No SHAPE.md in $FEATURES_DIR"
  echo "BLOCKED by process-gate: Feature shaping required before code changes."
  echo ""
  echo "You're editing source code while a feature is in progress, but no SHAPE.md exists."
  echo "Per Principle 1: natural language is intent, not override. Follow the process:"
  echo ""
  echo "  1. Create .planning/features/current/SHAPE.md with:"
  echo "     - What: one-paragraph description"
  echo "     - Why: who benefits and how"
  echo "     - P1 scope: the minimum that tests the idea"
  echo "     - Edge cases: what could go wrong"
  echo ""
  echo "  Or ask the human: 'bypass process-gate' to override (logged, expires 1hr)"
  exit 2
fi

# SHAPE.md exists — allow
log_decision "ALLOW" "SHAPE.md exists"
exit 0
