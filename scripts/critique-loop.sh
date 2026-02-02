#!/bin/bash
# CRITIQUE LOOP — LOOP A
# Runs every 30 minutes to inspect and critique all work
# Output: memory/critique-queue.md

set -e

QUEUE_FILE="/home/ubuntu/clawd/memory/critique-queue.md"
LOG_FILE="/home/ubuntu/clawd/logs/critique-loop-$(date +%Y%m%d).log"
mkdir -p /home/ubuntu/clawd/logs

echo "========================================" >> $LOG_FILE
echo "CRITIQUE LOOP: $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

log() {
    echo "[$(date -u '+%H:%M:%S')] $1" >> $LOG_FILE
}

log "Starting critique inspection..."

# Track findings
FINDINGS=0

# ============================================
# 1. CODE QUALITY CHECKS
# ============================================
log "Phase 1: Code Quality"

# Check for TypeScript errors
cd /home/ubuntu/LinkClaws/landing
if npm run typecheck 2>&1 | grep -q "error TS"; then
    log "❌ TypeScript errors found"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): TypeScript Errors" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** BLOCKER" >> $QUEUE_FILE
    echo "**Target:** TypeScript codebase" >> $QUEUE_FILE
    echo "**Issue:** Type errors preventing build" >> $QUEUE_FILE
    echo "**Suggested fix:** Run 'npm run typecheck' and fix all errors" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
else
    log "✅ No TypeScript errors"
fi

# Check test coverage
cd /home/ubuntu/LinkClaws/landing
TEST_OUTPUT=$(npm test 2>&1)
FAILED_TESTS=$(echo "$TEST_OUTPUT" | grep -c "FAIL" || echo "0")

if [ "$FAILED_TESTS" -gt 0 ]; then
    log "❌ $FAILED_TESTS test(s) failing"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): Failing Tests" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** BLOCKER" >> $QUEUE_FILE
    echo "**Target:** Test suite" >> $QUEUE_FILE
    echo "**Issue:** $FAILED_TESTS test(s) failing" >> $QUEUE_FILE
    echo "**Suggested fix:** Run 'npm test' and fix failures" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
else
    log "✅ All tests passing"
fi

# ============================================
# 2. CODE SMELL DETECTION
# ============================================
log "Phase 2: Code Smells"

# Check for console.logs in production code
CONSOLE_LOGS=$(find /home/ubuntu/LinkClaws/landing/convex -name "*.ts" ! -name "*.test.ts" -exec grep -l "console.log" {} \; | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    log "⚠️ $CONSOLE_LOGS file(s) with console.log"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): Console.log in production code" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** NIT" >> $QUEUE_FILE
    echo "**Target:** Convex functions" >> $QUEUE_FILE
    echo "**Issue:** $CONSOLE_LOGS file(s) contain console.log" >> $QUEUE_FILE
    echo "**Suggested fix:** Remove console.logs or use proper logging" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
fi

# Check for TODO comments
TODO_COUNT=$(find /home/ubuntu/LinkClaws/landing/convex -name "*.ts" -exec grep -c "TODO\|FIXME\|XXX" {} + | awk -F: '{sum+=$2} END {print sum}')
if [ "$TODO_COUNT" -gt 5 ]; then
    log "⚠️ $TODO_COUNT TODO/FIXME comments"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): Excessive TODO comments" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** WARNING" >> $QUEUE_FILE
    echo "**Target:** Codebase" >> $QUEUE_FILE
    echo "**Issue:** $TODO_COUNT unresolved TODOs" >> $QUEUE_FILE
    echo "**Suggested fix:** Address or remove TODOs" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
fi

# ============================================
# 3. DOCUMENTATION CHECKS
# ============================================
log "Phase 3: Documentation"

# Check for files without JSDoc
# (Simplified - would need proper parsing for real check)
FILES_WITHOUT_DOCS=$(find /home/ubuntu/LinkClaws/landing/convex -name "*.ts" ! -name "*.test.ts" -exec sh -c 'head -5 "$1" | grep -q "^\s*\/\*\*" || echo "$1"' _ {} \; | wc -l)
if [ "$FILES_WITHOUT_DOCS" -gt 10 ]; then
    log "⚠️ Many files lack documentation"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): Missing Documentation" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** WARNING" >> $QUEUE_FILE
    echo "**Target:** Convex modules" >> $QUEUE_FILE
    echo "**Issue:** $FILES_WITHOUT_DOCS files lack JSDoc" >> $QUEUE_FILE
    echo "**Suggested fix:** Add documentation to public APIs" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
fi

# ============================================
# 4. SECURITY CHECKS
# ============================================
log "Phase 4: Security"

# Check for hardcoded secrets (basic check)
HARDCODED_SECRETS=$(grep -r "password\|secret\|key\|token" /home/ubuntu/LinkClaws/landing/convex/*.ts 2>/dev/null | grep -v "process.env" | grep -v "test" | wc -l)
if [ "$HARDCODED_SECRETS" -gt 0 ]; then
    log "⚠️ Potential hardcoded secrets"
    echo "" >> $QUEUE_FILE
    echo "### C$(date +%s): Potential Hardcoded Secrets" >> $QUEUE_FILE
    echo "**Found by:** Critique Loop $(date -u '+%H:%M UTC')" >> $QUEUE_FILE
    echo "**Severity:** WARNING" >> $QUEUE_FILE
    echo "**Target:** Source code" >> $QUEUE_FILE
    echo "**Issue:** Found potential hardcoded values" >> $QUEUE_FILE
    echo "**Suggested fix:** Use environment variables" >> $QUEUE_FILE
    echo "**Status:** OPEN" >> $QUEUE_FILE
    FINDINGS=$((FINDINGS + 1))
fi

# ============================================
# SUMMARY
# ============================================
log "Critique complete. Findings: $FINDINGS"

# Update queue file header
if [ "$FINDINGS" -gt 0 ]; then
    echo "" >> $QUEUE_FILE
    echo "---" >> $QUEUE_FILE
    echo "*Updated: $(date -u '+%Y-%m-%d %H:%M UTC')*" >> $QUEUE_FILE
fi

# Commit if new critiques added
if [ "$FINDINGS" -gt 0 ]; then
    cd /home/ubuntu/clawd
    git add memory/critique-queue.md
    git commit -m "critique: $FINDINGS new issue(s) found" --quiet || true
    log "Committed $FINDINGS new critique(s)"
fi

log "Next critique: $(date -u -d '+30 minutes' '+%H:%M UTC')"
echo "" >> $LOG_FILE

tail -20 $LOG_FILE
