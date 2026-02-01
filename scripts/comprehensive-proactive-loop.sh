#!/bin/bash
# COMPREHENSIVE PROACTIVE LOOP
# Self-improving automation system
# Run continuously or via cron every 5 minutes

set -e

LOG_FILE="/home/ubuntu/clawd/logs/proactive-loop-$(date +%Y%m%d).log"
mkdir -p /home/ubuntu/clawd/logs

echo "========================================" >> $LOG_FILE
echo "PROACTIVE LOOP: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

# Function to log with timestamp
log() {
    echo "[$(date -u '+%H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting comprehensive proactive cycle..."

# ============================================
# 1. GITHUB MONITOR (with auto-analysis)
# ============================================
log "Phase 1: GitHub Monitor"

# Check for new activity
NEW_COMMITS=$(cd /home/ubuntu/LinkClaws 2>/dev/null && git log --oneline --since="10 minutes ago" --all 2>/dev/null | wc -l)

if [ "$NEW_COMMITS" -gt 0 ]; then
    log "🚨 NEW ACTIVITY DETECTED: $NEW_COMMITS commits"
    
    # Auto-analyze new changes
    cd /home/ubuntu/LinkClaws
    CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | head -5)
    log "Changed files: $CHANGED_FILES"
    
    # Run tests if code changed
    if echo "$CHANGED_FILES" | grep -q "\.ts$"; then
        log "TypeScript changes detected - running tests..."
        cd landing && npm test 2>&1 | tail -10 >> $LOG_FILE || true
    fi
else
    log "No new GitHub activity"
fi

# ============================================
# 2. EXPERIMENT UPDATES
# ============================================
log "Phase 2: Experiment Updates"

# Update PR velocity tracker
gh pr list --repo aj47/LinkClaws --state open --json number,title,createdAt,updatedAt 2>/dev/null | \
    jq -r '.[] | "PR #\(.number): open since \(.createdAt)"' | \
    while read line; do
        log "Tracking: $line"
    done

# ============================================
# 3. DASHBOARD GENERATION
# ============================================
log "Phase 3: Dashboard Generation"

if [ -x /home/ubuntu/clawd/scripts/generate-linkclaws-dashboard.sh ]; then
    /home/ubuntu/clawd/scripts/generate-linkclaws-dashboard.sh >> $LOG_FILE 2>&1
    log "Dashboard updated"
fi

# ============================================
# 4. AUTO-COMMIT
# ============================================
log "Phase 4: Auto-Commit"

cd /home/ubuntu/clawd
if [ -x /home/ubuntu/clawd/scripts/auto-commit.sh ]; then
    /home/ubuntu/clawd/scripts/auto-commit.sh >> $LOG_FILE 2>&1
else
    # Fallback auto-commit
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add -A
        git commit -m "auto: $(date -u '+%H:%M UTC') update" --quiet
        log "Auto-committed changes"
    fi
fi

# ============================================
# 5. SELF-IMPROVEMENT CHECK
# ============================================
log "Phase 5: Self-Improvement"

# Check if scripts need updating
SCRIPT_COUNT=$(ls /home/ubuntu/clawd/scripts/*.sh 2>/dev/null | wc -l)
log "System has $SCRIPT_COUNT automation scripts"

# Check log size, rotate if needed
LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt 1048576 ]; then  # 1MB
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log "Log rotated (size > 1MB)"
fi

# ============================================
# SUMMARY
# ============================================
log "Cycle complete. Next: $(date -u -d '+5 minutes' '+%H:%M UTC')"
echo "" >> $LOG_FILE

# Output to stdout for Discord bot
 tail -20 $LOG_FILE
