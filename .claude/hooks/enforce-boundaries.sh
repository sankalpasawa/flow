#!/bin/bash
# Sutra Session Isolation — Level 2 Hook
# Blocks file edits outside the active company's scope
#
# This hook reads the tool input (file path being edited) and checks
# it against the active session role. If the edit is outside bounds,
# it exits with code 2 to block the tool call.
#
# The active role is determined by the existence of a .claude/active-role file.
# If no role file exists, all edits are allowed (CEO of Asawa default).

ROLE_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/.claude/active-role"

# If no role file, allow everything (CEO of Asawa)
if [ ! -f "$ROLE_FILE" ]; then
  exit 0
fi

ROLE=$(cat "$ROLE_FILE" 2>/dev/null | tr -d '[:space:]')
FILE_PATH="$TOOL_INPUT_file_path"

# If no file path in the tool input, allow (not a file edit)
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

case "$ROLE" in
  sutra-onboard|company-*)
    # Extract company name
    COMPANY="${ROLE#company-}"
    if [ "$ROLE" = "sutra-onboard" ]; then
      COMPANY="__onboarding__"
    fi

    # Block edits to sutra source docs
    if echo "$FILE_PATH" | grep -q "asawa-inc/sutra/"; then
      echo "BLOCKED: CEO of ${COMPANY} cannot edit Sutra source files."
      echo "This feedback should go to feedback-to-sutra/ instead."
      exit 2
    fi

    # Block edits to holding company docs
    if echo "$FILE_PATH" | grep -q "asawa-inc/holding/"; then
      echo "BLOCKED: CEO of ${COMPANY} cannot edit holding company files."
      exit 2
    fi

    # Block edits to other companies
    if echo "$FILE_PATH" | grep -q "asawa-inc/" && ! echo "$FILE_PATH" | grep -q "asawa-inc/${COMPANY}/"; then
      # Allow during onboarding (sutra-onboard creates the new company folder)
      if [ "$ROLE" = "sutra-onboard" ]; then
        exit 0
      fi
      echo "BLOCKED: CEO of ${COMPANY} cannot edit other companies' files."
      exit 2
    fi
    ;;

  sutra)
    # CEO of Sutra can edit sutra docs but not holding or other companies
    if echo "$FILE_PATH" | grep -q "asawa-inc/holding/"; then
      echo "BLOCKED: CEO of Sutra cannot edit holding company files."
      exit 2
    fi
    # Can read client files but block direct edits to client company files
    # (except feedback-from-sutra which Sutra pushes to clients)
    if echo "$FILE_PATH" | grep -q "asawa-inc/" && \
       ! echo "$FILE_PATH" | grep -q "asawa-inc/sutra/" && \
       ! echo "$FILE_PATH" | grep -q "feedback-from-sutra/"; then
      echo "BLOCKED: CEO of Sutra cannot directly edit client company files."
      echo "Push updates via feedback-from-sutra/ instead."
      exit 2
    fi
    ;;

  asawa)
    # CEO of Asawa can edit everything
    exit 0
    ;;
esac

exit 0
