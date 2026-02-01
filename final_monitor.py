#!/usr/bin/env python3
"""
Integrated GitHub Monitor for aj47 with Discord notifications
"""

import json
import subprocess
import time
import os
from datetime import datetime

STATE_FILE = "/home/ubuntu/clawd/memory/continuous-monitor-state.json"
CHECK_INTERVAL = 120  # 2 minutes
NO_ACTIVITY_THRESHOLD = 600  # 10 minutes

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def run_cmd(cmd):
    try:
        return json.loads(subprocess.getoutput(cmd))
    except:
        return None

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
            "isFirstRun": True,
            "lastDiscordMsg": None
        }

def save_state(s):
    with open(STATE_FILE, "w") as f:
        json.dump(s, f, indent=2)

def main():
    log("🔍 GitHub Monitor Started for aj47")
    state = load_state()
    is_first = state.get("isFirstRun", True)
    last_discord_msg = state.get("lastDiscordMsg", "")
    
    while True:
        try:
            now = int(time.time())
            now_ms = now * 1000
            
            # Fetch GitHub data
            events = run_cmd("gh api users/aj47/events/public --jq '.[0:5]'")
            prs_link = run_cmd("gh pr list --repo aj47/LinkClaws --state open --json number,title,updatedAt")
            prs_speak = run_cmd("gh pr list --repo aj47/SpeakMCP --state open --limit 5 --json number,title,updatedAt")
            
            if not events:
                log("⚠️ Failed to fetch events")
                time.sleep(CHECK_INTERVAL)
                continue
            
            current_ids = [str(e['id']) for e in events]
            prev_ids = [str(i) for i in state.get("lastEventIds", [])]
            has_new = any(id not in prev_ids for id in current_ids)
            
            pr_link_changed = json.dumps(prs_link) != json.dumps(state.get("lastPrsLinkclaws"))
            pr_speak_changed = json.dumps(prs_speak) != json.dumps(state.get("lastPrsSpeakmcp"))
            
            event_count = len(events)
            pr_link_count = len(prs_link) if prs_link else 0
            pr_speak_count = len(prs_speak) if prs_speak else 0
            
            discord_msg = None
            
            if is_first:
                discord_msg = f"""🚀 **GitHub Monitor Started** for aj47

📊 Current Status:
• Recent Events: {event_count} events
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open

⏱️ Monitoring every 2 minutes..."""
                is_first = False
                state["noActivitySince"] = now
                log("🚀 First run message")
                
            elif has_new:
                latest = events[0]
                event_type = latest.get('type', 'Unknown')
                repo = latest.get('repo', {}).get('name', 'Unknown')
                discord_msg = f"""🔔 **New GitHub Activity!**

Type: `{event_type}`
Repo: `{repo}`

📊 Status:
• Events: {event_count} recent
• LinkClaws: {pr_link_count} open PRs
• SpeakMCP: {pr_speak_count} open PRs"""
                state["noActivitySince"] = now
                log(f"🔔 New activity: {event_type} in {repo}")
                
            elif pr_link_changed or pr_speak_changed:
                discord_msg = f"""🔔 **PR Update Detected!**

📊 Status:
• LinkClaws: {pr_link_count} open PRs
• SpeakMCP: {pr_speak_count} open PRs"""
                state["noActivitySince"] = now
                log("🔔 PR changes")
                
            else:
                no_act = state.get("noActivitySince", now)
                elapsed = now - no_act
                if elapsed >= NO_ACTIVITY_THRESHOLD:
                    discord_msg = f"""⏱️ **Still Monitoring** - No new activity for 10 minutes

📊 Current Status:
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open"""
                    state["noActivitySince"] = now
                    log("⏱️ No activity message")
                else:
                    log(f"✓ No new activity ({event_count} events)")
            
            # Output Discord message marker for external processing
            if discord_msg and discord_msg != last_discord_msg:
                print(f"DISCORD_MSG_START", flush=True)
                print(discord_msg, flush=True)
                print(f"DISCORD_MSG_END", flush=True)
                last_discord_msg = discord_msg
                state["lastDiscordMsg"] = discord_msg
            
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
