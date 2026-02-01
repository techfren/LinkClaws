#!/bin/bash
# Continuous Discord message sender
# Polls /tmp/discord_to_send.txt and outputs new messages

LAST_FILE="/tmp/last_discord_hash.txt"
MSG_FILE="/tmp/discord_to_send.txt"

echo "Starting Discord message watcher..."

while true; do
    if [[ -f "$MSG_FILE" ]]; then
        CURRENT=$(cat "$MSG_FILE")
        CURRENT_HASH=$(echo "$CURRENT" | md5sum | awk '{print $1}')
        
        if [[ -f "$LAST_FILE" ]]; then
            LAST_HASH=$(cat "$LAST_FILE")
        else
            LAST_HASH=""
        fi
        
        if [[ "$CURRENT_HASH" != "$LAST_HASH" ]]; then
            echo "$CURRENT_HASH" > "$LAST_FILE"
            echo "===DISCORD_MSG==="
            echo "$CURRENT"
            echo "===END_MSG==="
        fi
    fi
    sleep 10
done
