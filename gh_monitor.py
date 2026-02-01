#!/usr/bin/env python3
import json
import subprocess
import time
import os
import sys

STATE_FILE = "/home/ubuntu/clawd/memory/continuous-monitor-state.json"
STATUS_FILE = "/tmp/monitor_status.json"
LOG_FILE = "/tmp/monitor.log"
CHECK_INTERVAL = 120
NO_ACTIVITY_THRESHOLD = 600

def log(msg):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

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
        return {"lastEventIds": [], "noActivitySince": None, "isFirstRun": True}

def save_state(s):
    with open(STATE_FILE, "w") as f:
        json.dump(s, f)

def save_status(s):
    with open(STATUS_FILE, "w") as f:
        json.dump(s, f)

def main():
    log("🔍 Monitor started for aj47")
    state = load_state()
    is_first = state.get("isFirstRun", True)
    
    while True:
        try:
            now = int(time.time())
            
            events = run_cmd("gh api users/aj47/events/public --jq '.[0:5]'")
            prs_link = run_cmd("gh pr list --repo aj47/LinkClaws --state open --json number,title,updatedAt")
            prs_speak = run_cmd("gh pr list --repo aj47/SpeakMCP --state open --limit 5 --json number,title,updatedAt")
            
            if not events:
                log("⚠️ Fetch failed")
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
            
            status = {
                "timestamp": now,
                "event_count": event_count,
                "pr_link_count": pr_link_count,
                "pr_speak_count": pr_speak_count,
                "has_new_activity": False,
                "discord_msg": None
            }
            
            if is_first:
                status["discord_msg"] = f"🚀 **GitHub Monitor Started** for aj47\n\n📊 Current Status:\n• Recent Events: {event_count} events\n• LinkClaws PRs: {pr_link_count} open\n• SpeakMCP PRs: {pr_speak_count} open\n\n⏱️ Monitoring every 2 minutes..."
                is_first = False
                state["noActivitySince"] = now
                log("🚀 First run message queued")
                
            elif has_new:
                latest = events[0]
                event_type = latest.get("type", "Unknown")
                repo = latest.get("repo", {}).get("name", "Unknown")
                status["has_new_activity"] = True
                status["discord_msg"] = f"🔔 **New GitHub Activity!**\n\nType: `{event_type}`\nRepo: `{repo}`\n\n📊 Status:\n• Events: {event_count} recent\n• LinkClaws: {pr_link_count} open PRs\n• SpeakMCP: {pr_speak_count} open PRs"
                state["noActivitySince"] = now
                log(f"🔔 New activity: {event_type}")
                
            elif pr_link_changed or pr_speak_changed:
                status["has_new_activity"] = True
                status["discord_msg"] = f"🔔 **PR Update Detected!**\n\n📊 Status:\n• LinkClaws: {pr_link_count} open PRs\n• SpeakMCP: {pr_speak_count} open PRs"
                state["noActivitySince"] = now
                log("🔔 PR changes")
                
            else:
                no_act = state.get("noActivitySince", now)
                elapsed = now - no_act
                if elapsed >= NO_ACTIVITY_THRESHOLD:
                    status["discord_msg"] = f"⏱️ **Still Monitoring** - No new activity for 10 minutes\n\n📊 Current Status:\n• LinkClaws PRs: {pr_link_count} open\n• SpeakMCP PRs: {pr_speak_count} open"
                    state["noActivitySince"] = now
                    log("⏱️ No activity message")
                else:
                    log(f"✓ No new activity ({event_count} events)")
            
            state.update({
                "lastCheckTimestamp": now * 1000,
                "lastEventIds": current_ids,
                "lastPrsLinkclaws": prs_link or [],
                "lastPrsSpeakmcp": prs_speak or [],
                "isFirstRun": False
            })
            if "noActivitySince" not in state or state["noActivitySince"] is None:
                state["noActivitySince"] = now
            
            save_state(state)
            save_status(status)
            
        except Exception as e:
            log(f"❌ Error: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
