#!/bin/bash
# Asawa Inc. — Start Claude Code with the right role
#
# Usage:
#   ./start.sh              → CEO of Asawa (holding company)
#   ./start.sh sutra        → CEO of Sutra
#   ./start.sh dayflow      → CEO of DayFlow
#   ./start.sh onboard      → New founder, start onboarding
#   ./start.sh <company>    → CEO of any existing company

cd "$(dirname "$0")"

ROLE="${1:-holding}"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║           ASAWA INC.                 ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

case "$ROLE" in
  holding)
    echo "  Role: CEO of Asawa Inc."
    echo "  Authority: Full (all companies, all docs)"
    echo "  Command: /asawa"
    echo ""
    claude --dangerously-skip-permissions -p "Run /asawa" 2>/dev/null || claude --dangerously-skip-permissions
    ;;
  sutra)
    echo "  Role: CEO of Sutra"
    echo "  Authority: Sutra protocols, client feedback, versions"
    echo "  Command: /sutra"
    echo ""
    claude --dangerously-skip-permissions -p "Run /sutra" 2>/dev/null || claude --dangerously-skip-permissions
    ;;
  onboard)
    echo "  Role: New founder"
    echo "  Service: Sutra onboarding (free tier)"
    echo "  Command: /sutra-onboard"
    echo ""
    claude --dangerously-skip-permissions -p "Run /sutra-onboard" 2>/dev/null || claude --dangerously-skip-permissions
    ;;
  *)
    if [ -d "asawa-inc/$ROLE" ]; then
      echo "  Role: CEO of $ROLE"
      echo "  Authority: $ROLE only"
      echo "  Command: /company $ROLE"
      echo ""
      claude --dangerously-skip-permissions -p "Run /company $ROLE" 2>/dev/null || claude --dangerously-skip-permissions
    else
      echo "  Company '$ROLE' not found."
      echo ""
      echo "  Available:"
      echo "    ./start.sh              → CEO of Asawa"
      echo "    ./start.sh sutra        → CEO of Sutra"
      echo "    ./start.sh dayflow      → CEO of DayFlow"
      echo "    ./start.sh onboard      → New founder (start a company)"
      echo ""
      echo "  Existing companies:"
      ls -d asawa-inc/*/  2>/dev/null | sed 's|asawa-inc/||;s|/||' | grep -v holding | while read co; do
        echo "    ./start.sh $co"
      done
      exit 1
    fi
    ;;
esac
