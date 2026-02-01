#!/usr/bin/env python3
"""
Continuous GitHub Monitor for aj47
Polls GitHub activity every 2 minutes and sends Discord updates.
"""

import json
import subprocess
import time
import os
from datetime import datetime

STATE_FILE = "/home/ubuntu/clawd/memory/continuous-monitor-state.json"
DISCORD_CHANNEL = "1467582634715517153"
NO_ACTIVITY_THRESHOLD_MS = 10 * 60 * 1000  # 10 minutes
CHECK_INTERVAL = 120  # 2 minutes

def run_command(cmd):
    """Run a shell command and return output."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        return json.loads(result.stdout) if result.stdout else None
    except Exception as e:
        print(f"Error running command: {e}")
        return None

def load_state():
    """Load monitor state from file."""
    try:
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "lastCheckTimestamp": None,
            "lastEventIds": [],
            "lastPrsLinkclaws": [],
            "lastPrsSpeakmcp": [],
            "noActivitySince": None,
            "isFirstRun": True
        }

def save_state(state):
    """Save monitor state to file."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_events():
    """Fetch recent GitHub events for aj47."""
    return run_command("gh api users/aj47/events/public --jq '.[0:5] | map({id, type, repo: .repo.name, created_at})'")

def get_prs_linkclaws():
    """Fetch open PRs from LinkClaws repo."""
    return run_command("gh pr list --repo aj47/LinkClaws --state open --json number,title,updatedAt")

def get_prs_speakmcp():
    """Fetch open PRs from SpeakMCP repo."""
    return run_command("gh pr list --repo aj47/SpeakMCP --state open --limit 5 --json number,title,updatedAt")

def format_timestamp(ts_ms):
    """Format millisecond timestamp to readable string."""
    if ts_ms:
        return datetime.fromtimestamp(ts_ms / 1000).strftime("%H:%M:%S")
    return "N/A"

def check_new_activity(current_events, previous_ids):
    """Check if there are new events."""
    if not current_events or not previous_ids:
        return False
    current_ids = {str(e.get('id')) for e in current_events}
    previous_set = set(str(i) for i in previous_ids)
    return bool(current_ids - previous_set)

def check_pr_changes(current, previous):
    """Check if PR lists have changed."""
    if not previous:
        return False
    return json.dumps(current, sort_keys=True) != json.dumps(previous, sort_keys=True)

def main():
    print("🔍 GitHub Monitor Starting for aj47...")
    print(f"⏱️  Checking every {CHECK_INTERVAL} seconds")
    
    state = load_state()
    is_first_run = state.get('isFirstRun', True)
    
    if is_first_run:
        print("🚀 First run - establishing baseline...")
    
    last_no_activity_sent = 0
    
    while True:
        try:
            now = int(time.time() * 1000)
            
            # Fetch current data
            events = get_events()
            prs_linkclaws = get_prs_linkclaws()
            prs_speakmcp = get_prs_speakmcp()
            
            if not events:
                print(f"⚠️ Failed to fetch events at {format_timestamp(now)}")
                time.sleep(CHECK_INTERVAL)
                continue
            
            # Get current event IDs
            current_event_ids = [e.get('id') for e in events]
            
            # Check for activity
            has_new_events = check_new_activity(events, state.get('lastEventIds', []))
            has_pr_changes = (check_pr_changes(prs_linkclaws, state.get('lastPrsLinkclaws')) or
                            check_pr_changes(prs_speakmcp, state.get('lastPrsSpeakmcp')))
            
            activity_detected = has_new_events or has_pr_changes
            
            # Build status message
            event_count = len(events)
            pr_link_count = len(prs_linkclaws) if prs_linkclaws else 0
            pr_speak_count = len(prs_speakmcp) if prs_speakmcp else 0
            
            if is_first_run:
                print(f"""
🚀 **GitHub Monitor Started** for aj47
📊 Current Status:
• Recent Events: {event_count} events
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open
⏱️ Monitoring every 2 minutes...""")
                is_first_run = False
                state['noActivitySince'] = now
                
            elif activity_detected:
                latest = events[0] if events else {}
                event_type = latest.get('type', 'Unknown')
                repo = latest.get('repo', 'Unknown')
                
                print(f"""
🔔 **New GitHub Activity Detected!**
Type: {event_type}
Repo: {repo}
Time: {format_timestamp(now)}

📊 Status:
• Events: {event_count} recent
• LinkClaws: {pr_link_count} open PRs
• SpeakMCP: {pr_speak_count} open PRs""")
                state['noActivitySince'] = now
                
            else:
                # Check for no activity threshold
                no_activity_since = state.get('noActivitySince', now)
                elapsed = now - no_activity_since
                
                if elapsed >= NO_ACTIVITY_THRESHOLD_MS:
                    print(f"""
⏱️ **Still Monitoring** - No new activity for 10 minutes
Last check: {format_timestamp(now)}

📊 Current Status:
• LinkClaws PRs: {pr_link_count} open
• SpeakMCP PRs: {pr_speak_count} open""")
                    state['noActivitySince'] = now
                else:
                    print(f"✓ No new activity (checked at {format_timestamp(now)})")
            
            # Update state
            state.update({
                'lastCheckTimestamp': now,
                'lastEventIds': current_event_ids,
                'lastPrsLinkclaws': prs_linkclaws or [],
                'lastPrsSpeakmcp': prs_speakmcp or [],
                'lastUpdateSent': now,
                'isFirstRun': False
            })
            
            if not activity_detected and state.get('noActivitySince') is None:
                state['noActivitySince'] = no_activity_since
            
            save_state(state)
            
        except Exception as e:
            print(f"❌ Error in monitor loop: {e}")
        
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()
