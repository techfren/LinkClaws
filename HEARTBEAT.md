# HEARTBEAT.md

## Proactive Checklist (Every 15-30 min)

Run through these, log results to `memory/heartbeat-state.json`, act on findings.

### 1. GitHub Activity Check
- Fetch recent activity for `aj47` (commits, issues, PRs, comments)
- Look for: stuck PRs, unanswered issues, new repos, coding patterns
- If actionable help identified → send to Discord #proactive channel
- Log last check timestamp

### 2. Recent Session Review
- Scan last 2-3 days of `memory/YYYY-MM-DD.md` files
- Look for: incomplete tasks, questions AJ asked, decisions made, problems mentioned
- If follow-up opportunity → send to Discord #proactive channel
- Log last review timestamp

### 3. Memory Maintenance
- Review recent memory files for distillable insights
- Update MEMORY.md with anything worth keeping long-term
- Archive old daily notes if needed
- Log last maintenance timestamp

### 4. Workspace Health
- Quick git status in `/home/ubuntu/clawd` — any uncommitted changes?
- Check for untracked files that should be committed
- Log status

## Quiet Hours
- **11 PM - 8 AM PT**: Still run checks, still send messages if actionable
- Expect delayed responses during quiet hours

## Output Channel
- Proactive messages → Discord #proactive: https://discord.com/channels/1464731467161538791/1467582634715517153
- Format: Concise, actionable, reference the source (GitHub issue #X, session from Y date)

## When to Send
- Only send if there's something actionable or noteworthy
- Skip if nothing new since last check
- NO_REPLY is fine for maintenance-only passes
