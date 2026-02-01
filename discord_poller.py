#!/usr/bin/env python3
"""
Discord Message Poller - Reads monitor log and sends Discord messages
"""

import time
import os

LOG_FILE = "/tmp/monitor.log"
LAST_POS_FILE = "/tmp/last_log_position.txt"

def get_last_position():
    try:
        with open(LAST_POS_FILE) as f:
            return int(f.read().strip())
    except:
        return 0

def set_last_position(pos):
    with open(LAST_POS_FILE, "w") as f:
        f.write(str(pos))

def main():
    print("📤 Discord poller started")
    last_pos = get_last_position()
    
    while True:
        try:
            if os.path.exists(LOG_FILE):
                current_size = os.path.getsize(LOG_FILE)
                
                if current_size > last_pos:
                    with open(LOG_FILE, "r") as f:
                        f.seek(last_pos)
                        new_content = f.read()
                    
                    # Look for Discord message markers
                    if "DISCORD_MSG_START" in new_content:
                        # Extract the message
                        start = new_content.find("DISCORD_MSG_START")
                        end = new_content.find("DISCORD_MSG_END", start)
                        
                        if start != -1 and end != -1:
                            msg = new_content[start + len("DISCORD_MSG_START"):end].strip()
                            # Write to file for external pickup
                            with open("/tmp/discord_pending.txt", "w") as f:
                                f.write(msg)
                            print(f"📤 Queued message: {msg[:50]}...")
                    
                    last_pos = current_size
                    set_last_position(last_pos)
            
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    main()
