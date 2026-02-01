#!/bin/bash
# Auto-commit all memory files every 15 minutes
# Prevents data loss, creates audit trail

cd /home/ubuntu/clawd

# Check if there are changes
if git diff --quiet && git diff --cached --quiet; then
    echo "No changes to commit"
    exit 0
fi

# Generate commit message with timestamp and summary
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')
CHANGES=$(git diff --name-only | wc -l)

git add -A
git commit -m "auto: Continuous update ${TIMESTAMP}

- ${CHANGES} files changed
- Research, experiments, analysis updates
- Proactive monitoring data" --quiet

echo "Auto-committed ${CHANGES} files at ${TIMESTAMP}"
