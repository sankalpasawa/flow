#!/bin/bash
# Sutra Session Feedback Reminder
# Runs PostToolUse on Bash — checks if the command was a git push
# and reminds about feedback-to-sutra if none written today.

# Only act on git push commands
COMMAND="$TOOL_INPUT_command"
if ! echo "$COMMAND" | grep -q "git push"; then
  exit 0
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

ROLE_FILE="$REPO_ROOT/.claude/active-role"
TODAY=$(date +%Y-%m-%d)

# Determine company from active role
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
    # Not a company role — skip
    exit 0
    ;;
esac

if [ -z "$COMPANY" ]; then
  exit 0
fi

# Check if any feedback was written today
FEEDBACK_DIR="$REPO_ROOT/asawa-inc/$COMPANY/feedback-to-sutra"
HAS_TODAY_FEEDBACK=false

if [ -d "$FEEDBACK_DIR" ]; then
  # Check for files with today's date in the filename
  if ls "$FEEDBACK_DIR"/$TODAY-* 1>/dev/null 2>&1; then
    HAS_TODAY_FEEDBACK=true
  fi
fi

if [ "$HAS_TODAY_FEEDBACK" = false ]; then
  echo ""
  echo "[Sutra] Session reminder: Any learnings from this session?"
  echo "  Write to: asawa-inc/$COMPANY/feedback-to-sutra/$TODAY-{topic}.md"
  echo "  (Sutra improves from your feedback)"
  echo ""
fi

# Always soft — never block a push over missing feedback
exit 0
