#!/usr/bin/env python3
"""
Discord sender - polls monitor status and sends messages to Discord
"""

import json
import time
import os

STATUS_FILE = "/tmp/monitor_status.json"
LAST_SENT_FILE = "/tmp/last_discord_msg.txt"
CHECK_INTERVAL = 15  # Check every 15 seconds

def get_last_sent():
    try:
        with open(LAST_SENT_FILE) as f:
            return f.read().strip()
    except:
        return ""

def set_last_sent(msg):
    with open(LAST_SENT_FILE, "w") as f:
        f.write(msg[:100])  # Store first 100 chars as fingerprint

def main():
    print("📤 Discord sender started")
    last_sent = get_last_sent()
    
    while True:
        try:
            with open(STATUS_FILE) as f:
                status = json.load(f)
            
            msg = status.get("discord_msg")
            if msg:
                # Check if this is a new message
                msg_fingerprint = msg[:100]
                if msg_fingerprint != last_sent:
                    # Write to queue file for external processing
                    with open("/tmp/discord_to_send.txt", "w") as f:
                        f.write(msg)
                    print(f"📤 Queued: {msg[:50]}...")
                    last_sent = msg_fingerprint
                    set_last_sent(msg)
            
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
