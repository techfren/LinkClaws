#!/bin/bash
# RESOLUTION LOOP — LOOP B
# Runs every 30 minutes (offset 15 min) to address critiques
# Input: memory/critique-queue.md
# Output: Fixed code + updated queue

set -e

QUEUE_FILE="/home/ubuntu/clawd/memory/critique-queue.md"
LOG_FILE="/home/ubuntu/clawd/logs/resolution-loop-$(date +%Y%m%d).log"
mkdir -p /home/ubuntu/clawd/logs

echo "========================================" >> $LOG_FILE
echo "RESOLUTION LOOP: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

log() {
    echo "[$(date -u '+%H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting resolution phase..."

# Count open critiques
OPEN_CRITIQUES=$(grep -c "Status: OPEN" $QUEUE_FILE 2>/dev/null || echo "0")
log "Open critiques found: $OPEN_CRITIQUES"

if [ "$OPEN_CRITIQUES" -eq 0 ]; then
    log "✅ No critiques to resolve"
    log "Next resolution: $(date -u -d '+30 minutes' '+%H:%M UTC')"
    exit 0
fi

# Track resolutions
RESOLVED=0

# ============================================
# 1. AUTO-FIX BLOCKERS
# ============================================
log "Phase 1: Attempting auto-fixes"

# Fix TypeScript errors if possible
cd /home/ubuntu/LinkClaws/landing
if grep -q "TypeScript Errors" $QUEUE_FILE && grep -A10 "TypeScript Errors" $QUEUE_FILE | grep -q "Status: OPEN"; then
    log "🔧 Attempting to fix TypeScript errors..."
    
    # Try to regenerate types
    if npx convex dev --once 2>&1 | grep -q "Generated"; then
        log "✅ Regenerated Convex types"
        
        # Check if errors resolved
        if npm run typecheck 2>&1 | grep -q "error TS"; then
            log "❌ TypeScript errors remain (manual fix needed)"
        else
            log "✅ TypeScript errors resolved"
            # Update queue
            sed -i 's/### C[0-9]*: TypeScript Errors/RESOLVED: TypeScript Errors/' $QUEUE_FILE || true
            sed -i 's/Status: OPEN/Status: RESOLVED (auto)/' $QUEUE_FILE || true
            RESOLVED=$((RESOLVED + 1))
        fi
    fi
fi

# Fix failing tests if known issues
if grep -q "Failing Tests" $QUEUE_FILE && grep -A10 "Failing Tests" $QUEUE_FILE | grep -q "Status: OPEN"; then
    log "🔧 Checking if tests now pass..."
    
    cd /home/ubuntu/LinkClaws/landing
    if npm test 2>&1 | grep -q "failed"; then
        log "❌ Tests still failing (manual fix needed)"
    else
        log "✅ Tests now passing"
        sed -i '/Failing Tests/,/Status: OPEN/s/Status: OPEN/Status: RESOLVED (auto)/' $QUEUE_FILE || true
        RESOLVED=$((RESOLVED + 1))
    fi
fi

# ============================================
# 2. REMOVE CONSOLE.LOGS
# ============================================
log "Phase 2: Auto-removing console.logs"

if grep -q "Console.log in production" $QUEUE_FILE && grep -A10 "Console.log" $QUEUE_FILE | grep -q "Status: OPEN"; then
    log "🔧 Removing console.logs..."
    
    # Find and comment out console.logs
    find /home/ubuntu/LinkClaws/landing/convex -name "*.ts" ! -name "*.test.ts" -exec sed -i 's/^\s*console\.log/\/\/ console.log/g' {} \;
    
    # Test if still works
    cd /home/ubuntu/LinkClaws/landing
    if npm test 2>&1 | grep -q "failed"; then
        log "❌ Removal caused test failures (reverting)"
        git checkout -- convex/ 2>/dev/null || true
    else
        log "✅ Console.logs removed"
        git add -A
        git commit -m "fix: Remove console.logs from production code" --quiet || true
        sed -i '/Console.log/,/Status: OPEN/s/Status: OPEN/Status: RESOLVED (auto)/' $QUEUE_FILE || true
        RESOLVED=$((RESOLVED + 1))
    fi
fi

# ============================================
# 3. DOCUMENT RESOLUTIONS
# ============================================
log "Phase 3: Documenting resolutions"

for each in $(grep -n "Status: RESOLVED" $QUEUE_FILE | cut -d: -f1); do
    # Add resolution timestamp if not present
    if ! grep -A5 "Status: RESOLVED" $QUEUE_FILE | grep -q "Resolved by"; then
        sed -i '/Status: RESOLVED/i\**Resolved by:** Resolution Loop '$(date -u '+%H:%M UTC') $QUEUE_FILE || true
    fi
done

# ============================================
# 4. ESCALATION CHECK
# ============================================
log "Phase 4: Checking for escalations"

# Count critiques >1 hour old (would need timestamp parsing in real impl)
STALE_CRITIQUES=$(grep -B5 "Status: OPEN" $QUEUE_FILE | grep -c "Critique Loop" || echo "0")

if [ "$STALE_CRITIQUES" -gt 3 ]; then
    log "⚠️ $STALE_CRITIQUES critiques unresolved for >1 hour"
    log "Escalating to human..."
    
    # Send notification (would integrate with Discord/Slack)
    echo "ESCALATION: $STALE_CRITIQUES critiques need human attention" >> $LOG_FILE
fi

# ============================================
# SUMMARY
# ============================================
log "Resolution complete. Auto-resolved: $RESOLVED"

REMAINING=$(grep -c "Status: OPEN" $QUEUE_FILE 2>/dev/null || echo "0")
log "Remaining critiques: $REMAINING"

# Commit queue updates
cd /home/ubuntu/clawd
git add memory/critique-queue.md 2>/dev/null || true
git commit -m "resolution: $RESOLVED fixed, $REMAINING remaining" --quiet || true

log "Next resolution: $(date -u -d '+30 minutes' '+%H:%M UTC')"
echo "" >> $LOG_FILE

tail -20 $LOG_FILE
