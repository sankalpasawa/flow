#!/bin/bash
# Asawa Inc. — Start Claude Code with full permissions
# Run: ./start.sh [company]
#
# Examples:
#   ./start.sh          → CEO of Asawa (holding company)
#   ./start.sh sutra    → CEO of Sutra
#   ./start.sh dayflow  → CEO of DayFlow
#   ./start.sh hehe     → CEO of Hehe (or any company name)

cd "$(dirname "$0")"

COMPANY="${1:-holding}"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         ASAWA INC.                   ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

if [ "$COMPANY" = "holding" ]; then
  echo "  Role: CEO of Asawa (full authority)"
  echo "  Context: holding + sutra"
elif [ "$COMPANY" = "sutra" ]; then
  echo "  Role: CEO of Sutra"
  echo "  Context: sutra (processes client feedback)"
else
  echo "  Role: CEO of $COMPANY"
  echo "  Context: $COMPANY only"
  echo "  Note: Feedback to Sutra = PENDING (requires CEO of Sutra approval)"
fi

echo ""
echo "  Starting Claude Code..."
echo ""

claude --dangerously-skip-permissions
