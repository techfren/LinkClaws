#!/bin/bash
# Update critique queue with new Augment comments
# Usage: ./scripts/update-critique-queue.sh <repo> <pr-number>

set -e

REPO="${1:-aj47/LinkClaws}"
PR_NUMBER="${2:-56}"
QUEUE_FILE="memory/critique-queue.md"

echo "Updating critique queue from $REPO#$PR_NUMBER..."

# Fetch Augment comments from today
TODAY=$(date +%Y-%m-%d)
COMMENTS=$(gh api "repos/$REPO/pulls/$PR_NUMBER/comments" --paginate 2>/dev/null)

# Get count of new augment comments
NEW_COUNT=$(echo "$COMMENTS" | jq "[.[] | select(.user.login == \"augmentcode[bot]\" and (.created_at | startswith(\"$TODAY\")))] | length")

if [ "$NEW_COUNT" -eq 0 ]; then
    echo "No new Augment comments."
    exit 0
fi

echo "Found $NEW_COUNT new Augment comments."

# Get existing critique count
EXISTING_COUNT=$(grep -c "^### C[0-9]*:" "$QUEUE_FILE" 2>/dev/null || echo "0")

# Create new entries
ENTRY_NUM=$((EXISTING_COUNT + 1))
NEW_ENTRIES=""

echo "$COMMENTS" | jq -r "[.[] | select(.user.login == \"augmentcode[bot]\" and (.created_at | startswith(\"$TODAY\")))] | .[] | \"### C$ENTRY_NUM: \" + (.body | split(\"\\n\") | .[0] | .[0:80]) + \"\\n**Found by:** Augment Auto-Fetch\\n**Severity:** \" + (if (.body | contains(\"Severity: high\")) then \"HIGH\" elif (.body | contains(\"Severity: medium\")) then \"MEDIUM\" else \"LOW\" end) + \"\\n**Target:** $REPO PR #$PR_NUMBER\\n**Issue:** \" + (.body | split(\"\\n\") | .[0]) + \"\\n**Status:** OPEN\"" | while read -r entry; do
    echo "$entry"
    ENTRY_NUM=$((ENTRY_NUM + 1))
done

# Append to critique queue
echo ""
echo "→ Run 'git add memory/critique-queue.md && git commit' to save."
