#!/usr/bin/env python3
"""
GitHub Monitor for aj47 with Discord Integration
"""

import json
import subprocess
import time
import os
import sys
from datetime import datetime

STATE_FILE = "/home/ubuntu/clawd/memory/continuous-monitor-state.json"
LOG_FILE = "/tmp/github_monitor_output.log"
CHECK_INTERVAL = 120  # 2 minutes
NO_ACTIVITY_THRESHOLD = 600  # 10 minutes in seconds

def log(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout) if result.stdout else None
    except Exception as e:
        log(f"Command error: {e}")
        return None

def send_discord(msg):
    """Send message to Discord via subprocess call to openclaw message tool"""
    try:
        # Write message to a file for external processing
        with open("/tmp/discord_queue.txt", "a") as f:
            f.write(msg + "\n---MSG---\n")
        log(f"Queued Discord message")
    except Exception as e:
        log(f"Discord queue error: {e}")

def load_state():
    try:
        with open(STATE_FILE) as f:
            return json.load(f)
    except:
        return {
            "lastCheckTimestamp": None,
            "lastEventIds": [],
            "lastPrsLinkclaws": [],
            "lastPrsSpeakmcp": [],
            "noActivitySince": None,
            "isFirstRun": True
        }

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def main():
    log("🔍 GitHub Monitor Started for aj47")
    state = load_state()
    is_first = state.get("isFirstRun", True)
    
    if is_first:
        log("🚀 First run - establishing baseline")
    
    while True:
        try:
            now = int(time.time())
            now_ms = now * 1000
            
            # Fetch data
            events = run_cmd("gh api users/aj47/events/public --jq '.[0:5]'")
            prs_link = run_cmd("gh pr list --repo aj47/LinkClaws --state open --json number,title,updatedAt")
            prs_speak = run_cmd("gh pr list --repo aj47/SpeakMCP --state open --limit 5 --json number,title,updatedAt")
            
            if not events:
                log("⚠️ Failed to fetch events")
                time.sleep(CHECK_INTERVAL)
                continue
            
            current_ids = [str(e.get("id")) for e in events]
            prev_ids = [str(i) for i in state.get("lastEventIds", [])]
            
            # Check for new activity
            has_new = any(id not in prev_ids for id in current_ids)
            
            pr_link_changed = json.dumps(prs_link, sort_keys=True) != json.dumps(state.get("lastPrsLinkclaws"), sort_keys=True)
            pr_speak_changed = json.dumps(prs_speak, sort_keys=True) != json.dumps(state.get("lastPrsSpeakmcp"), sort_keys=True)
            
            event_count = len(events)
            pr_link_count = len(prs_link) if prs_link else 0
            pr_speak_count = len(prs_speak) if prs_speak else 0
            
            if is_first:
                msg = f"""🚀 **GitHub Monitor Started** for aj47

📊 Current Status:
• Recent Events: {event_count} events
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open

⏱️ Monitoring every 2 minutes..."""
                send_discord(msg)
                is_first = False
                state["noActivitySince"] = now
                log("🚀 Initial status sent")
                
            elif has_new:
                latest = events[0]
                event_type = latest.get("type", "Unknown")
                repo = latest.get("repo", {}).get("name", "Unknown")
                msg = f"""🔔 **New GitHub Activity Detected!**

Type: `{event_type}`
Repo: `{repo}`

📊 Status:
• Events: {event_count} recent
• LinkClaws: {pr_link_count} open PRs  
• SpeakMCP: {pr_speak_count} open PRs"""
                send_discord(msg)
                state["noActivitySince"] = now
                log(f"🔔 New activity: {event_type} in {repo}")
                
            elif pr_link_changed or pr_speak_changed:
                msg = f"""🔔 **PR Update Detected!**

📊 Status:
• LinkClaws: {pr_link_count} open PRs
• SpeakMCP: {pr_speak_count} open PRs"""
                send_discord(msg)
                state["noActivitySince"] = now
                log("🔔 PR changes detected")
                
            else:
                no_activity_since = state.get("noActivitySince", now)
                elapsed = now - no_activity_since
                
                if elapsed >= NO_ACTIVITY_THRESHOLD:
                    msg = f"""⏱️ **Still Monitoring** - No new activity for 10 minutes

📊 Current Status:
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open"""
                    send_discord(msg)
                    state["noActivitySince"] = now
                    log("⏱️ No activity message sent")
                else:
                    log(f"✓ No new activity ({event_count} events, {pr_link_count} LinkClaws PRs, {pr_speak_count} SpeakMCP PRs)")
            
            # Update state
            state.update({
                "lastCheckTimestamp": now_ms,
                "lastEventIds": current_ids,
                "lastPrsLinkclaws": prs_link or [],
                "lastPrsSpeakmcp": prs_speak or [],
                "isFirstRun": False
            })
            if "noActivitySince" not in state or state["noActivitySince"] is None:
                state["noActivitySince"] = now
            
            save_state(state)
            
        except Exception as e:
            log(f"❌ Error: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
