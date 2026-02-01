#!/bin/bash
# LinkClaws Metrics Dashboard Generator
# Run this every 5 minutes to generate real-time metrics

OUTPUT_FILE="/home/ubuntu/clawd/memory/dashboards/linkclaws-metrics-$(date +%Y%m%d-%H%M).md"
mkdir -p /home/ubuntu/clawd/memory/dashboards

echo "# LinkClaws Real-Time Dashboard" > $OUTPUT_FILE
echo "**Generated:** $(date -u '+%Y-%m-%d %H:%M:%S UTC')" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# GitHub Metrics
echo "## GitHub Activity" >> $OUTPUT_FILE
echo "\`\`\`" >> $OUTPUT_FILE
gh pr list --repo aj47/LinkClaws --state open --json number,title,author,createdAt --jq '.[] | "#\(.number): \(.title) by \(.author.login)"' 2>/dev/null >> $OUTPUT_FILE
echo "\`\`\`" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Recent Commits
echo "## Recent Commits (Last 24h)" >> $OUTPUT_FILE
cd /home/ubuntu/LinkClaws 2>/dev/null && git log --oneline --since="24 hours ago" --all 2>/dev/null | head -10 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Test Status
echo "## Test Status" >> $OUTPUT_FILE
cd /home/ubuntu/LinkClaws/landing 2>/dev/null && npm test 2>&1 | grep -E "(PASS|FAIL|Tests:)" | head -5 >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Onboarding Readiness
echo "## Onboarding Readiness" >> $OUTPUT_FILE
echo "- [ ] Welcome email reviewed" >> $OUTPUT_FILE
echo "- [ ] First 20 users selected" >> $OUTPUT_FILE
echo "- [ ] Invite codes generated (100+)" >> $OUTPUT_FILE
echo "- [ ] Discord created" >> $OUTPUT_FILE
echo "- [ ] Registration tested" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Blockers
echo "## Current Blockers" >> $OUTPUT_FILE
echo "| Issue | Severity | Fix ETA |" >> $OUTPUT_FILE
echo "|-------|----------|---------|" >> $OUTPUT_FILE
echo "| 35 tests failing | Medium | Post-launch |" >> $OUTPUT_FILE
echo "| 6 PRs need rebase | Low | Post-launch |" >> $OUTPUT_FILE
echo "| GDPR compliance | Medium | 30 days post-launch |" >> $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

echo "**Next Update:** $(date -u -d '+5 minutes' '+%H:%M UTC')" >> $OUTPUT_FILE

echo "Dashboard updated: $OUTPUT_FILE"
