#!/bin/bash
# Parse monitor output and send Discord messages

LOG_FILE="/tmp/monitor_output.txt"
LAST_POS_FILE="/tmp/last_log_pos.txt"

echo "Starting Discord message parser..."

# Initialize position
if [[ ! -f "$LAST_POS_FILE" ]]; then
    echo "0" > "$LAST_POS_FILE"
fi

while true; do
    if [[ -f "$LOG_FILE" ]]; then
        LAST_POS=$(cat "$LAST_POS_FILE")
        CURRENT_SIZE=$(stat -c%s "$LOG_FILE" 2>/dev/null || echo "0")
        
        if [[ $CURRENT_SIZE -gt $LAST_POS ]]; then
            # Extract new content
            NEW_CONTENT=$(tail -c +$((LAST_POS + 1)) "$LOG_FILE" 2>/dev/null)
            
            # Check for Discord message markers
            if echo "$NEW_CONTENT" | grep -q "DISCORD_MSG_START"; then
                # Extract message between markers
                MSG=$(echo "$NEW_CONTENT" | sed -n '/DISCORD_MSG_START/,/DISCORD_MSG_END/p' | grep -v "DISCORD_MSG_")
                if [[ -n "$MSG" ]]; then
                    echo "===NEW_DISCORD_MESSAGE==="
                    echo "$MSG"
                    echo "===MESSAGE_END==="
                fi
            fi
            
            echo "$CURRENT_SIZE" > "$LAST_POS_FILE"
        fi
    fi
    
    sleep 5
done
