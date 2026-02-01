#!/bin/bash

STATE_FILE="/home/ubuntu/clawd/memory/continuous-monitor-state.json"
DISCORD_CHANNEL="1467582634715517153"
NO_ACTIVITY_THRESHOLD=600000  # 10 minutes in milliseconds

send_discord() {
    local msg="$1"
    curl -s -X POST "https://discord.com/api/v10/channels/${DISCORD_CHANNEL}/messages" \
        -H "Authorization: Bot ${DISCORD_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"content\": \"${msg}\"}" > /dev/null 2>&1
}

get_events() {
    gh api users/aj47/events/public --jq '.[0:5] | map({id, type, repo: .repo.name, created_at})' 2>/dev/null
}

get_prs_linkclaws() {
    gh pr list --repo aj47/LinkClaws --state open --json number,title,updatedAt 2>/dev/null
}

get_prs_speakmcp() {
    gh pr list --repo aj47/SpeakMCP --state open --limit 5 --json number,title,updatedAt 2>/dev/null
}

compare_events() {
    local new_events="$1"
    local old_ids="$2"
    local new_ids=$(echo "$new_events" | jq -r '.[].id')
    local has_new=false
    
    for id in $new_ids; do
        if [[ "$old_ids" != *"$id"* ]]; then
            has_new=true
            break
        fi
    done
    
    echo "$has_new"
}

compare_prs() {
    local new_prs="$1"
    local old_prs="$2"
    [[ "$new_prs" != "$old_prs" ]] && echo "true" || echo "false"
}

# Load state
if [[ -f "$STATE_FILE" ]]; then
    STATE=$(cat "$STATE_FILE")
    IS_FIRST_RUN=$(echo "$STATE" | jq -r '.isFirstRun // false')
    LAST_EVENT_IDS=$(echo "$STATE" | jq -r '.lastEventIds // [] | @json')
    LAST_PRS_LINKCLAWS=$(echo "$STATE" | jq -r '.lastPrsLinkclaws // "[]"')
    LAST_PRS_SPEAKMCP=$(echo "$STATE" | jq -r '.lastPrsSpeakmcp // "[]"')
    NO_ACTIVITY_SINCE=$(echo "$STATE" | jq -r '.noActivitySince // "null"')
else
    IS_FIRST_RUN="true"
    LAST_EVENT_IDS="[]"
    LAST_PRS_LINKCLAWS="[]"
    LAST_PRS_SPEAKMCP="[]"
    NO_ACTIVITY_SINCE="null"
fi

echo "🔍 GitHub Monitor Started for aj47"
echo "📊 First run: $IS_FIRST_RUN"

# Main loop
while true; do
    NOW=$(date +%s%3N)
    
    # Fetch data
    EVENTS=$(get_events)
    PRS_LINKCLAWS=$(get_prs_linkclaws)
    PRS_SPEAKMCP=$(get_prs_speakmcp)
    
    # Check for new activity
    HAS_NEW_EVENTS=$(compare_events "$EVENTS" "$LAST_EVENT_IDS")
    HAS_NEW_PRS_LINK=$(compare_prs "$PRS_LINKCLAWS" "$LAST_PRS_LINKCLAWS")
    HAS_NEW_PRS_SPEAK=$(compare_prs "$PRS_SPEAKMCP" "$LAST_PRS_SPEAKMCP")
    
    ACTIVITY_DETECTED=false
    ACTIVITY_MSG=""
    
    if [[ "$IS_FIRST_RUN" == "true" ]]; then
        ACTIVITY_MSG="🚀 **GitHub Monitor Started** for aj47\n\n📊 Current Status:\n"
        IS_FIRST_RUN="false"
        ACTIVITY_DETECTED=true
    elif [[ "$HAS_NEW_EVENTS" == "true" ]]; then
        NEW_EVENT=$(echo "$EVENTS" | jq -r '.[0]')
        EVENT_TYPE=$(echo "$NEW_EVENT" | jq -r '.type')
        REPO=$(echo "$NEW_EVENT" | jq -r '.repo')
        ACTIVITY_MSG="🔔 **New GitHub Activity!**\nType: ${EVENT_TYPE}\nRepo: ${REPO}"
        ACTIVITY_DETECTED=true
    elif [[ "$HAS_NEW_PRS_LINK" == "true" ]] || [[ "$HAS_NEW_PRS_SPEAK" == "true" ]]; then
        ACTIVITY_MSG="🔔 **PR Update Detected!**\n"
        ACTIVITY_DETECTED=true
    fi
    
    # Build status message
    EVENT_COUNT=$(echo "$EVENTS" | jq 'length')
    PR_LINK_COUNT=$(echo "$PRS_LINKCLAWS" | jq 'length')
    PR_SPEAK_COUNT=$(echo "$PRS_SPEAKMCP" | jq 'length')
    
    STATUS_MSG="📊 **aj47 GitHub Status** (${EVENT_COUNT} recent events)\n"
    STATUS_MSG+="• LinkClaws PRs: ${PR_LINK_COUNT} open\n"
    STATUS_MSG+="• SpeakMCP PRs: ${PR_SPEAK_COUNT} open\n"
    
    if [[ "$ACTIVITY_DETECTED" == "true" ]]; then
        if [[ -n "$ACTIVITY_MSG" ]]; then
            echo -e "$ACTIVITY_MSG"
            echo -e "$STATUS_MSG"
        fi
        NO_ACTIVITY_SINCE="null"
    else
        # Check if 10 min of no activity
        if [[ "$NO_ACTIVITY_SINCE" == "null" ]]; then
            NO_ACTIVITY_SINCE="$NOW"
        fi
        
        ELAPSED=$((NOW - NO_ACTIVITY_SINCE))
        if [[ $ELAPSED -ge $NO_ACTIVITY_THRESHOLD ]]; then
            echo "⏱️ Still monitoring, no new activity for 10 minutes"
            echo -e "$STATUS_MSG"
            NO_ACTIVITY_SINCE="$NOW"
        fi
    fi
    
    # Save state
    NEW_EVENT_IDS=$(echo "$EVENTS" | jq '[.[].id]')
    cat > "$STATE_FILE" << EOF
{
  "lastCheckTimestamp": $NOW,
  "lastEventIds": $NEW_EVENT_IDS,
  "lastPrsLinkclaws": $PRS_LINKCLAWS,
  "lastPrsSpeakmcp": $PRS_SPEAKMCP,
  "lastUpdateSent": $NOW,
  "noActivitySince": $NO_ACTIVITY_SINCE,
  "isFirstRun": false
}
EOF
    
    # Update tracking vars
    LAST_EVENT_IDS="$NEW_EVENT_IDS"
    LAST_PRS_LINKCLAWS="$PRS_LINKCLAWS"
    LAST_PRS_SPEAKMCP="$PRS_SPEAKMCP"
    
    # Wait 2 minutes
    sleep 120
done
