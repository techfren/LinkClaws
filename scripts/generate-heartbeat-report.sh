#!/bin/bash
# Generate human-readable heartbeat report for Discord
# Usage: ./scripts/generate-heartbeat-report.sh

set -e

CURRENT_TIME=$(date -u +"%Y-%m-%d %H:%M UTC")

# Git activity (last 24h)
GIT_COUNT=$(git log --since="24 hours ago" --oneline 2>/dev/null | wc -l)
RECENT_COMMITS=$(git log --since="6 hours ago" --oneline 2>/dev/null | head -5)

# Critique status
if [ -f "memory/critique-queue.md" ]; then
    TOTAL_CRITIQUES=$(grep -c "^### C[0-9]*:" memory/critique-queue.md 2>/dev/null || echo "0")
    OPEN_CRITIQUES=$(grep -c "Status.*OPEN" memory/critique-queue.md 2>/dev/null || echo "0")
    FIXED_CRITIQUES=$(grep -c "✅ Fixed" memory/critique-queue.md 2>/dev/null || echo "0")
    HIGH_CRITIQUES=$(grep -B3 "Severity.*HIGH" memory/critique-queue.md 2>/dev/null | grep "^### C" | head -5 || echo "None")
else
    TOTAL_CRITIQUES="0"
    OPEN_CRITIQUES="0"
    FIXED_CRITIQUES="0"
    HIGH_CRITIQUES="None"
fi

# PR status
PR_56=$(gh pr view 56 --repo aj47/LinkClaws 2>/dev/null)
PR_56_STATE=$(echo "$PR_56" | grep -E "^state:" | cut -d: -f2 | xargs)
PR_56_TITLE=$(echo "$PR_56" | grep -E "^title:" | cut -d: -f2 | xargs)

# Generate report
cat << EOF
**Heartbeat Report - $CURRENT_TIME**

📊 **Overview**
• Commits (24h): $GIT_COUNT
• Total Critiques: $TOTAL_CRITIQUES
• Open: $OPEN_CRITIQUES | Fixed: $FIXED_CRITIQUES

🔗 **PR Status**
• **#56** ($PR_56_STATE): ${PR_56_TITLE:0:50}
• **#52** (CLOSED): MVP deal negotiation

🚀 **Recent Activity**
$(echo "$RECENT_COMMITS" | sed 's/^/• /')

🎯 **Priority Critiques**
$(echo "$HIGH_CRITIQUES" | head -5 | sed 's/^/• /' || echo "• None")

---
_Loop running normally_
EOF
