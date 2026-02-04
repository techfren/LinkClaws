#!/bin/bash
# Generate human-readable heartbeat report
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
    FIXED_CRITIQUES=$(grep -c "Fixed" memory/critique-queue.md 2>/dev/null | head -1 || echo "0")
    HIGH_CRITIQUES=$(grep -B3 "Severity.*HIGH" memory/critique-queue.md 2>/dev/null | grep "^### C" | head -5 || echo "")
else
    TOTAL_CRITIQUES="0"
    OPEN_CRITIQUES="0"
    FIXED_CRITIQUES="0"
    HIGH_CRITIQUES=""
fi

# PR status
PR_56_STATE=$(gh pr view 56 --repo aj47/LinkClaws --json state 2>/dev/null | jq -r '.state // "UNKNOWN"')
PR_52_STATE=$(gh pr view 52 --repo aj47/LinkClaws --json state 2>/dev/null | jq -r '.state // "UNKNOWN"')

# Build report
{
    echo "**Heartbeat Report - $CURRENT_TIME**"
    echo ""
    echo "📊 **Overview**"
    echo "• Commits (24h): $GIT_COUNT"
    echo "• Total Critiques: $TOTAL_CRITIQUES"
    echo "• Open: $OPEN_CRITIQUES | Fixed: $FIXED_CRITIQUES"
    echo ""
    echo "🔗 **PR Status**"
    echo "• **#56** (Auth): $PR_56_STATE"
    echo "• **#52** (Deals): $PR_52_STATE"
    echo ""
    echo "🚀 **Recent Activity**"
    echo "$RECENT_COMMITS" | sed 's/^/• /'
    echo ""
    echo "🎯 **Priority Critiques**"
    if [ -n "$HIGH_CRITIQUES" ]; then
        echo "$HIGH_CRITIQUES" | head -5 | sed 's/^/• /'
    else
        echo "• None"
    fi
    echo ""
    echo "_Loop running normally_"
}
