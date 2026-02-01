#!/bin/bash
# Polling script to check monitor state and send Discord updates

STATE_FILE="/home/ubuntu/clawd/memory/continuous-monitor-state.json"
DISCORD_CHANNEL="1467582634715517153"
LAST_SENT_FILE="/home/ubuntu/clawd/.last_discord_sent"

send_to_discord() {
    local msg="$1"
    echo "$msg" > /tmp/discord_msg.txt
}

# Load previous state
if [[ -f "$STATE_FILE" ]]; then
    CURRENT_STATE=$(cat "$STATE_FILE")
    CURRENT_CHECK=$(echo "$CURRENT_STATE" | jq -r '.lastCheckTimestamp // 0')
    CURRENT_EVENTS=$(echo "$CURRENT_STATE" | jq -r '.lastEventIds | @json')
    NO_ACTIVITY_SINCE=$(echo "$CURRENT_STATE" | jq -r '.noActivitySince // "null"')
    IS_FIRST_RUN=$(echo "$CURRENT_STATE" | jq -r '.isFirstRun // false')
    
    echo "current_check:$CURRENT_CHECK"
    echo "current_events:$CURRENT_EVENTS"
    echo "no_activity:$NO_ACTIVITY_SINCE"
    echo "is_first_run:$IS_FIRST_RUN"
else
    echo "state_missing"
fi
