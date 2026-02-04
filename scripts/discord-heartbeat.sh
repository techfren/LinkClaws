#!/bin/bash
# Send human-readable heartbeat to Discord
# Usage: ./scripts/discord-heartbeat.sh [channel_id]

set -e

CHANNEL_ID="${1:-1468656637311975549}"  # Productive loop channel

# Generate report to temp file
REPORT=$(./scripts/generate-heartbeat-report.sh)

# Escape special characters for JSON
REPORT_ESCAPED=$(echo "$REPORT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# Send to Discord
cd /home/ubuntu/clawd
message action="send" target="$CHANNEL_ID" message="$REPORT_ESCAPED"

echo "✓ Heartbeat sent to Discord"
