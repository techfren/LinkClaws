#!/bin/bash
# Trigger Augment review on a PR after fixes are applied

set -e

REPO="${1:-aj47/LinkClaws}"
PR_NUMBER="${2:-56}"

echo "Triggering Augment review on $REPO#$PR_NUMBER..."

# Comment on PR to trigger Augment re-review
gh pr comment "$PR_NUMBER" --repo "$REPO" --body "augment review" 2>/dev/null || {
    echo "Failed to comment on PR. Trying via API..."
    gh api "repos/$REPO/issues/$PR_NUMBER/comments" \
        --method POST \
        --field body="augment review" \
        --silent || echo "Failed to trigger review"
}

echo "✓ Augment review triggered on $REPO#$PR_NUMBER"
