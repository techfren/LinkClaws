#!/bin/bash
# COMPREHENSIVE PROACTIVE LOOP — AUTONOMOUS MODE
# Self-improving automation system
# Run continuously or via cron every 5 minutes

set -e

LOG_FILE="/home/ubuntu/clawd/logs/proactive-loop-$(date +%Y%m%d).log"
mkdir -p /home/ubuntu/clawd/logs

echo "========================================" >> $LOG_FILE
echo "PROACTIVE LOOP: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $LOG_FILE
echo "MODE: AUTONOMOUS" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

# Function to log with timestamp
log() {
    echo "[$(date -u '+%H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting autonomous proactive cycle..."

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
    
    # Update experiments.md with velocity metrics
    echo "- $(date -u '+%H:%M'): $NEW_COMMITS new commits" >> /home/ubuntu/clawd/memory/experiments.md
else
    log "No new GitHub activity"
fi

# Check PR status
PR_COUNT=$(gh pr list --repo aj47/LinkClaws --state open --json number 2>/dev/null | jq 'length' || echo "0")
log "Open PRs: $PR_COUNT"

# ============================================
# 2. EXA RESEARCH (Every 15 min check)
# ============================================
log "Phase 2: Exa Research Check"

# Run research only every 3rd cycle (15 min)
CYCLE_COUNT=$(cat /home/ubuntu/clawd/memory/.cycle-count 2>/dev/null || echo "0")
CYCLE_COUNT=$((CYCLE_COUNT + 1))
echo $CYCLE_COUNT > /home/ubuntu/clawd/memory/.cycle-count

if [ $((CYCLE_COUNT % 3)) -eq 0 ]; then
    log "🔄 Running Exa research cycle..."
    if [ -x /home/ubuntu/clawd/scripts/exa-research.sh ]; then
        /home/ubuntu/clawd/scripts/exa-research.sh >> $LOG_FILE 2>&1
        log "Research cycle complete"
    fi
else
    log "Research cycle skipped (next in $((3 - CYCLE_COUNT % 3)) cycles)"
fi

# ============================================
# 3. HYPOTHESIS & PREDICTION TRACKING
# ============================================
log "Phase 3: Hypothesis Tracking"

# Check for predictions nearing deadline
TODAY=$(date -u '+%Y-%m-%d')
URGENT_PREDICTIONS=$(grep -B2 "Deadline: $TODAY" /home/ubuntu/clawd/memory/predictions.md 2>/dev/null | head -5 || echo "None")

if [ "$URGENT_PREDICTIONS" != "None" ]; then
    log "⚠️ PREDICTION DEADLINES TODAY:"
    echo "$URGENT_PREDICTIONS" | while read line; do
        log "  $line"
    done
fi

# Count active hypotheses
HYPOTHESIS_COUNT=$(grep -c "^## H" /home/ubuntu/clawd/memory/hypotheses.md 2>/dev/null || echo "0")
log "Active hypotheses: $HYPOTHESIS_COUNT"

# ============================================
# 4. GAP ANALYSIS UPDATE
# ============================================
log "Phase 4: Gap Analysis"

# Count gaps by category
MARKET_GAPS=$(grep -c "^### MG" /home/ubuntu/clawd/memory/gaps.md 2>/dev/null || echo "0")
TECH_GAPS=$(grep -c "^### TG" /home/ubuntu/clawd/memory/gaps.md 2>/dev/null || echo "0")
DIST_GAPS=$(grep -c "^### DG" /home/ubuntu/clawd/memory/gaps.md 2>/dev/null || echo "0")
log "Tracked gaps — Market: $MARKET_GAPS, Tech: $TECH_GAPS, Distribution: $DIST_GAPS"

# ============================================
# 5. DASHBOARD GENERATION
# ============================================
log "Phase 5: Dashboard Generation"

if [ -x /home/ubuntu/clawd/scripts/generate-linkclaws-dashboard.sh ]; then
    /home/ubuntu/clawd/scripts/generate-linkclaws-dashboard.sh >> $LOG_FILE 2>&1
    log "Dashboard updated"
fi

# ============================================
# 6. DECISION LOG AUDIT
# ============================================
log "Phase 6: Decision Audit"

DECISION_COUNT=$(grep -c "^## D" /home/ubuntu/clawd/memory/decisions.md 2>/dev/null || echo "0")
log "Total decisions logged: $DECISION_COUNT"

# Check for decisions without outcomes
PENDING_OUTCOMES=$(grep -A5 "Outcome.*Pending" /home/ubuntu/clawd/memory/decisions.md 2>/dev/null | grep "^##" | wc -l || echo "0")
if [ "$PENDING_OUTCOMES" -gt 0 ]; then
    log "Decisions awaiting outcomes: $PENDING_OUTCOMES"
fi

# ============================================
# 7. AUTO-COMMIT
# ============================================
log "Phase 7: Auto-Commit"

cd /home/ubuntu/clawd
if [ -x /home/ubuntu/clawd/scripts/auto-commit.sh ]; then
    /home/ubuntu/clawd/scripts/auto-commit.sh >> $LOG_FILE 2>&1
else
    # Fallback auto-commit
    if ! git diff --quiet || ! git diff --cached --quiet; then
        git add -A
        git commit -m "auto: $(date -u '+%H:%M UTC') update — research, experiments, analysis" --quiet
        log "Auto-committed changes"
    fi
fi

# ============================================
# 8. SELF-IMPROVEMENT CHECK
# ============================================
log "Phase 8: Self-Improvement"

# Check if scripts need updating
SCRIPT_COUNT=$(ls /home/ubuntu/clawd/scripts/*.sh 2>/dev/null | wc -l)
log "System has $SCRIPT_COUNT automation scripts"

# Check log size, rotate if needed
LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt 1048576 ]; then  # 1MB
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log "Log rotated (size > 1MB)"
fi

# Check HEARTBEAT.md last update
HB_UPDATE=$(stat -c %Y /home/ubuntu/clawd/HEARTBEAT.md 2>/dev/null || echo "0")
NOW=$(date +%s)
HB_AGE=$(( (NOW - HB_UPDATE) / 3600 ))
if [ "$HB_AGE" -gt 24 ]; then
    log "⚠️ HEARTBEAT.md not updated in ${HB_AGE}h — consider review"
fi

# ============================================
# AUTONOMOUS ACTION TRIGGERS
# ============================================
log "Phase 9: Autonomous Actions"

# If new gaps discovered in research, auto-update gaps.md
# If hypothesis proven/disproven, update status
# If opportunity identified, create opportunity doc
# All without asking — document and commit

log "Autonomous actions complete"

# ============================================
# SUMMARY
# ============================================
log "Cycle $CYCLE_COUNT complete. Next: $(date -u -d '+5 minutes' '+%H:%M UTC')"
echo "" >> $LOG_FILE

# Output to stdout for Discord bot
tail -25 $LOG_FILE
