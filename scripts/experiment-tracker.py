#!/usr/bin/env python3
"""
Experiment Auto-Tracker
Updates experiments.md with new data from various sources
"""

import json
import re
from datetime import datetime

def update_experiment(experiment_id, new_finding):
    """Append finding to experiment file"""
    file_path = f"/home/ubuntu/clawd/memory/experiments/{experiment_id}.md"
    
    timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
    
    with open(file_path, 'a') as f:
        f.write(f"\n### Update: {timestamp}\n")
        f.write(f"{new_finding}\n")
    
    print(f"Updated {experiment_id} with new finding")

def track_pr_velocity(pr_number, repo, lines, days_open, reviews):
    """Track PR for velocity experiment"""
    finding = f"- PR #{pr_number} ({repo}): {lines} lines, {days_open} days, {reviews} reviews"
    update_experiment("PR-velocity-tracker", finding)

def track_onboarding_metric(stage, count, total):
    """Track onboarding funnel metrics"""
    percentage = (count / total * 100) if total > 0 else 0
    finding = f"- {stage}: {count}/{total} ({percentage:.1f}%)"
    update_experiment("onboarding-funnel-conversion", finding)

if __name__ == "__main__":
    # Example usage - can be called from other scripts
    import sys
    if len(sys.argv) > 2:
        update_experiment(sys.argv[1], sys.argv[2])
