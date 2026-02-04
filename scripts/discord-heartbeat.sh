#!/bin/bash
# Send human-readable heartbeat to Discord
# Usage: ./scripts/discord-heartbeat.sh [channel_id]
# Output: JSON payload for message tool (to be called from main session)

set -e

CHANNEL_ID="${1:-1468656637311975549}"

# Generate report
REPORT=$(./scripts/generate-heartbeat-report.sh)

# Escape for JSON (basic escaping)
REPORT_ESCAPED=$(echo "$REPORT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# Output JSON payload (pipe to message tool)
echo "{\"action\":\"send\",\"target\":\"$CHANNEL_ID\",\"message\":\"$REPORT_ESCAPED\"}"
