#!/usr/bin/env python3
"""
Continuous Discord Sender - Polls for new messages and outputs them
"""

import time
import os

PENDING_FILE = "/tmp/discord_pending.txt"
LAST_SENT_FILE = "/tmp/last_sent_hash.txt"

def get_last_hash():
    try:
        with open(LAST_SENT_FILE) as f:
            return f.read().strip()
    except:
        return ""

def set_last_hash(h):
    with open(LAST_SENT_FILE, "w") as f:
        f.write(h)

def main():
    print("Discord sender started")
    last_hash = get_last_hash()
    
    while True:
        try:
            if os.path.exists(PENDING_FILE):
                with open(PENDING_FILE) as f:
                    msg = f.read()
                
                if msg:
                    msg_hash = str(hash(msg))
                    if msg_hash != last_hash:
                        print("===SEND_DISCORD===")
                        print(msg)
                        print("===END===")
                        last_hash = msg_hash
                        set_last_hash(msg_hash)
        except Exception as e:
            print(f"Error: {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    main()
