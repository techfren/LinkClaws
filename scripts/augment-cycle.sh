#!/bin/bash
# Full workflow: Trigger Augment review → Fetch new comments → Update critique queue
# Usage: ./scripts/augment-cycle.sh <repo> <pr-number>

set -e

REPO="${1:-aj47/LinkClaws}"
PR_NUMBER="${2:-56}"
QUEUE_FILE="memory/critique-queue.md"

echo "=== Augment Review Cycle ==="
echo "Repo: $REPO | PR: $PR_NUMBER"
echo ""

# Step 1: Trigger review
echo "1. Triggering Augment review..."
gh pr comment "$PR_NUMBER" --repo "$REPO" --body "augment review" 2>/dev/null
echo "✓ Review triggered"

# Step 2: Wait for Augment to respond
echo ""
echo "2. Waiting for Augment to respond (5s)..."
sleep 5

# Step 3: Fetch new comments
echo ""
echo "3. Fetching new Augment comments..."
TODAY=$(date +%Y-%m-%d)
COMMENTS=$(gh api "repos/$REPO/pulls/$PR_NUMBER/comments" --paginate 2>/dev/null)
NEW_COMMENTS=$(echo "$COMMENTS" | jq "[.[] | select(.user.login == \"augmentcode[bot]\" and (.created_at | startswith(\"$TODAY\")))]")

NEW_COUNT=$(echo "$NEW_COMMENTS" | jq 'length')

if [ "$NEW_COUNT" -eq 0 ]; then
    echo "   No new comments found."
    exit 0
fi

echo "   Found $NEW_COUNT new comments."

# Step 4: Get existing critiques (extract first lines)
echo ""
echo "4. Checking for duplicates..."
EXISTING_FIRST_LINES=$(grep -E "^### C[0-9]+:" "$QUEUE_FILE" 2>/dev/null | sed 's/### C[0-9]*: //')
EXISTING_COUNT=$(grep -c "^### C[0-9]*:" "$QUEUE_FILE" 2>/dev/null || echo "0")

# Step 5: Append only new entries
ENTRY_NUM=$((EXISTING_COUNT + 1))
ADDED=0
SKIPPED=0

echo "$NEW_COMMENTS" | jq -r ".[] | .body" | while read -r body; do
    FIRST_LINE=$(echo "$body" | head -1)
    
    # Check if this exact comment exists
    if echo "$EXISTING_FIRST_LINES" | grep -qF "$FIRST_LINE"; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # Get severity
    SEVERITY="MEDIUM"
    if echo "$body" | grep -qi "severity: high"; then
        SEVERITY="HIGH"
    elif echo "$body" | grep -qi "severity: low"; then
        SEVERITY="LOW"
    fi
    
    # Append entry
    cat >> "$QUEUE_FILE" << EOF

### C${ENTRY_NUM}: ${FIRST_LINE}
**Found by:** Augment Auto-Fetch ($(date +%Y-%m-%d))
**Severity:** ${SEVERITY}
**Target:** ${REPO} PR #${PR_NUMBER}
**Issue:** ${FIRST_LINE}
**Status:** OPEN
EOF
    
    ADDED=$((ADDED + 1))
    ENTRY_NUM=$((ENTRY_NUM + 1))
done

echo "   Added: $ADDED | Skipped: $SKIPPED"

# Step 6: Update HEARTBEAT.md
echo ""
echo "5. Updating HEARTBEAT.md..."
TOTAL=$(grep -c "^### C[0-9]*:" "$QUEUE_FILE" 2>/dev/null || echo "$ENTRY_NUM")
sed -i "s/- \*\*Critiques Open:\*\* [0-9]*/- **Critiques Open:** $TOTAL/" HEARTBEAT.md 2>/dev/null || true
echo "✓ Total critiques: $TOTAL"

# Summary
echo ""
echo "=== Cycle Complete ==="
echo "Run 'git add memory/critique-queue.md HEARTBEAT.md && git commit' to save."
