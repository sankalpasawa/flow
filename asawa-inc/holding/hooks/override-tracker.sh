#!/bin/bash
# Asawa Enforcement Framework — Override Tracker
# Logs active overrides and cleans up expired ones.
# Implements the Override Protocol from ENFORCEMENT-FRAMEWORK.md §3.
#
# Type: Audit (exit 0 always — silent logging)
# Fires: PostToolUse on Edit/Write
# See: asawa-inc/holding/ENFORCEMENT-FRAMEWORK.md §3

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

ENFORCEMENT_DIR="$REPO_ROOT/.enforcement"
AUDIT_LOG="$ENFORCEMENT_DIR/audit.log"

# No enforcement directory → nothing to track
if [ ! -d "$ENFORCEMENT_DIR" ]; then
  exit 0
fi

NOW=$(date +%s)
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Process all override files and research-done marker
for FILE in "$ENFORCEMENT_DIR"/override-* "$ENFORCEMENT_DIR"/research-done; do
  [ -f "$FILE" ] || continue

  BASENAME="$(basename "$FILE")"

  # Get file modification time (macOS + Linux compatible)
  MOD_TIME=$(stat -f %m "$FILE" 2>/dev/null || stat -c %Y "$FILE" 2>/dev/null || echo 0)
  AGE=$(( NOW - MOD_TIME ))

  if [ "$AGE" -gt 3600 ]; then
    # Expired — clean up
    echo "$TS | override-tracker | EXPIRED | $BASENAME | age=${AGE}s, removed" >> "$AUDIT_LOG" 2>/dev/null
    rm -f "$FILE"
  else
    # Still active — log that it exists
    echo "$TS | override-tracker | ACTIVE | $BASENAME | age=${AGE}s" >> "$AUDIT_LOG" 2>/dev/null
  fi
done

# Pure audit — never blocks
exit 0
