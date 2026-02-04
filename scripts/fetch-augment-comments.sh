#!/bin/bash
# Auto-fetch Augment comments after triggering review
# Usage: ./scripts/fetch-augment-comments.sh <repo> <pr-number>

set -e

REPO="${1:-aj47/LinkClaws}"
PR_NUMBER="${2:-56}"

echo "Fetching Augment comments from $REPO#$PR_NUMBER..."

# Fetch all comments
COMMENTS=$(gh api "repos/$REPO/pulls/$PR_NUMBER/comments" --paginate 2>/dev/null)

# Filter for augmentcode[bot] comments from today
TODAY=$(date +%Y-%m-%d)
NEW_COMMENTS=$(echo "$COMMENTS" | jq -r ".[] | select(.user.login == \"augmentcode[bot]\" and (.created_at | startswith(\"$TODAY\")))")

# Count new comments
COUNT=$(echo "$NEW_COMMENTS" | jq -s 'length')

if [ "$COUNT" -eq 0 ]; then
    echo "No new Augment comments found."
    exit 0
fi

echo "Found $COUNT new Augment comments."

# Extract issues into critique queue format
CRITIQUE_ENTRIES=""

# Process each comment
echo "$NEW_COMMENTS" | jq -r '. | @base64' | while read -r entry; do
    BODY=$(echo "$entry" | base64 -d | jq -r '.body')
    SEVERITY=$(echo "$BODY" | grep -i "severity:" | head -1 | awk '{print $2}' | tr '[:upper:]' '[:lower:]')
    TITLE=$(echo "$BODY" | head -3 | tr '\n' ' ' | cut -c1-100)
    
    # Determine severity level
    case "$SEVERITY" in
        high) SEV="HIGH" ;;
        medium) SEV="MEDIUM" ;;
        low) SEV="LOW" ;;
        *) SEV="MEDIUM" ;;
    esac
    
    # Create entry
    CRITIQUE_ENTRIES="${CRITIQUE_ENTRIES}
### $(date +%s | head -c 6): Augment comment ($SEV)
**Found by:** Augment Auto-Fetch
**Severity:** $SEV
**Issue:** $TITLE
**Full Comment:** See PR #$PR_NUMBER
**Status:** OPEN"
done

echo ""
echo "Would add to critique queue:"
echo "$CRITIQUE_ENTRIES" | head -20
echo ""
echo "→ Run 'update-critique-queue.sh' to apply these fixes."

# Log to daily memory
echo "## $(date -u +%H:%M) UTC | Augment Comments Fetched

**Source:** $REPO#$PR_NUMBER
**New Comments:** $COUNT
**Action:** Added to critique queue

\`\`\`
$CRITIQUE_ENTRIES
\`\`\`
" >> memory/$(date +%Y-%m-%d).md

echo "✓ Logged to memory/$(date +%Y-%m-%d).md"
