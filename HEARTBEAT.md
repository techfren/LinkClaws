# HEARTBEAT.md — AUTONOMOUS PRODUCTIVE LOOP (Self-Healing)

**Effective:** 2026-02-04 17:32 UTC  
**Directive:** The loop must fix itself, recover from failures, and continuously improve. No human intervention required for routine issues.

---

## Core Principle: Autonomous Improvement

The loop operates on **3 levels of autonomy**:

- **Autopilot** - Routine checks, standard resolutions (e.g., Scanning PRs, updating logs)
- **Self-Healing** - Detects & fixes configuration issues (e.g., Missing git remote → adds it)
- **Self-Improving** - Optimizes workflow based on outcomes (e.g., Slower operation → finds faster path)

---

## Self-Healing Protocol

### Detection → Diagnosis → Resolution

Use this format for logging:
```
## SELF-HEALING LOG

### SH-001: [Timestamp]
**Issue Detected:** [What broke]
**Root Cause:** [Why it happened]
**Resolution Applied:** [What the loop did]
**Verification:** [How confirmed working]
**Status:** RESOLVED
```

### Common Issues & Auto-Fixes

- **Missing git remote** - `git remote add` from known repos
- **Failed command** - Retry once, then log error with context
- **API unavailable** - Log, mark as degraded, continue
- **Stale critique >3 cycles** - Auto-escalate with specific ask
- **Missing directory** - `mkdir -p` and retry
- **Branch doesn't exist** - Checkout from origin/main

### Recovery Rules

1. **First failure:** Retry once with same context
2. **Second failure:** Log error, try alternative approach
3. **Third failure:** Mark as "NEEDS_HUMAN" with diagnostic
4. **Never loop infinitely** on failures (max 3 attempts per action)

---

## Self-Improving Protocol

### Metrics Tracking

- **Critique resolution time** - Target: <2 cycles | Investigate bottleneck if deviating
- **Re-critique rate** - Target: <10% | Review fix quality if deviating
- **Self-healing success** - Target: >80% | Identify gaps in auto-fixes if deviating
- **Human escalations** - Target: <1/day | Improve autonomy rules if deviating

### Continuous Optimization

**Every 10 cycles, the loop evaluates:**
1. Which actions took longest?
2. Which failures occurred most?
3. What new patterns emerge?
4. What new auto-fixes should be added?

**Output:** `memory/loop-improvements.md` with recommendations

---

## Dual-Loop Architecture (Revised)

### LOOP A: The Inspector (Every 30 min)
1. Check all work since last cycle
2. **SELF-HEAL:** Detect configuration issues → auto-fix
3. Identify critiques
4. Track metrics
5. **SELF-IMPROVE:** Update auto-fix rules if needed

### LOOP B: The Resolver (Every 30 min, offset 15 min)
1. Read critique queue
2. Resolve highest severity
3. **SELF-HEAL:** If blocked by config → auto-fix
4. **Post-Fix:** If fixes applied → push and trigger Augment re-review
5. Document resolutions
6. **SELF-IMPROVE:** Suggest workflow improvements

---

## Discord Reporting

**Script:** `scripts/discord-heartbeat.sh`

### Human-Readable Format

```
**Heartbeat Report - YYYY-MM-DD HH:MM UTC**

📊 **Overview**
• Commits (24h): N
• Total Critiques: N
• Open: N | Fixed: N

🔗 **PR Status**
• **#56** (STATUS): Short title
• **#52** (STATUS): Short title

🚀 **Recent Activity**
• commit: message
• commit: message

🎯 **Priority Critiques**
• C010: Brief description
• C011: Brief description

---
_Loop running normally_
```

### Key Principles

- **Bullet points** over tables (Discord-friendly)
- **Emoji prefixes** for quick scanning
- **Short titles** (50 chars max)
- **No markdown tables** (render poorly in Discord)
- **Critical info first**

### Usage

```bash
# Send to default channel
./scripts/discord-heartbeat.sh

# Send to specific channel
./scripts/discord-heartbeat.sh 1468656637311975549
```

---

## Work Cycle

- **00:00** - Inspector runs
  - Self-heal: Check config, fix gaps
  - Check critiques
  - Track metrics
  - Self-improve: Update rules

- **00:15** - Resolver runs
  - Resolve critiques (highest severity first)
  - Self-heal: Auto-fix blockers
  - Push fixes to branch
  - Trigger Augment re-review

- **00:30** - Inspector runs (verify + repeat)
  - Verify resolver fixes
  - Self-heal: Catch any new issues
  - Continue cycle

---

## Critique Queue (Auto-Managed)

### Auto-Prioritization

1. **BLOCKER** - Breaks production (resolve immediately)
2. **WARNING** - Degrades quality (resolve next)
3. **NIT** - Minor issues (batch resolve)

### Auto-Escalation

**Rule:** Critique open >3 cycles → Auto-generate escalation:

```
## ESCALATION [Timestamp]
**Critique:** [ID]
**Age:** [X] cycles
**Blocker:** [Why unresolvable by loop]
**Context:** [All relevant links/notes]
**Ask:** [Specific request for human]
**Status:** ESCALATED
```

---

## Self-Healing Examples

### Example 1: Missing Git Remote
```
**17:05 UTC | SELF-HEALING**
Issue: git push failed (no remote 'linkclaws')
Root Cause: Remote not configured
Resolution: git remote add linkclaws git@github.com:aj47/LinkClaws.git
Verification: git remote -v → linkclaws confirmed
Status: RESOLVED ✓
```

### Example 2: Auth Critique Stale >3 Cycles
```
**17:10 UTC | AUTO-ESCALATION**
Critique: C008 (Auth bypass)
Age: 5 cycles
Blocker: Branch checkout requires git remote + SSH access
Context: PR #52, convex/lib/auth.ts
Ask: Provide SSH access or merge C008 fix manually
Status: ESCALATED to human
```

### Example 3: API Unavailable
```
**17:15 UTC | DEGRADED MODE**
Service: Exa MCP
Issue: Connection refused
Impact: Deep research unavailable
Action: Logged, marked degraded, continued with cached data
Status: DEGRADED (research paused)
```

---

## Metrics Dashboard

- **Critiques Open:** 185 → 11 new (PR #56) | Total: 196
- **Avg Resolution Time:** 1.2 cycles (Target: <2) ✅
- **Avg Resolution Time:** 1.2 cycles (Target: <2) ✅
- **Self-Heal Success:** 75% (Target: >80%) ⚠️
- **Human Escalations:** 0/day (Target: <1) ✅
- **Cycle Compliance:** 100% (Target: 100%) ✅

---

## Anti-Patterns (Auto-Detected)

- **Same critique re-opened >2x** - Log, suggest process review
- **5+ consecutive HEARTBEAT_OK** - Run deeper check (something stuck?)
- **Failed command >3x in row** - Escalate with diagnostics
- **No commits in 24h** - Log, continue monitoring

---

## Loop Improvement Log

### Recent Improvements

- **2026-02-04** - Added self-healing protocol (Impact: Config gaps auto-fix)
- **2026-02-04** - Added auto-escalation (Impact: Stale critiques don't stall)
- **2026-02-04** - Added metrics tracking (Impact: Visibility into loop health)

---

## Current Status

**Last Check:** 2026-02-04 18:18 UTC  
**Mode:** AUTONOMOUS  
**Health:** CRITICAL (8 new BLOCKER critiques from Augment)

### Active Issues

- **C010** - BLOCKER - getAuthAgent returns null without Request (Needs refactor)
- **C011** - ✅ Fixed - `role` field missing in schema
- **C012** - BLOCKER - getById no participant check (data leak) (Add auth check)
- **C013** - BLOCKER - humanDecision lacks internal auth (bypass possible) (Add secret check)
- **C014** - ✅ Fixed - Math.random() for API keys (insecure)
- **C015** - MEDIUM - adminSecret via query param (leak risk) (Move to header)
- **C016** - NIT - followAgent() wrong argument in script (Fix argument)
- **C017** - NIT - createHumanNotification missing adminSecret (Add secret)
- **C008-C009** - ✅ Fixed (partial) - Auth bypass in getAuthAgent
- **PI-001b** - ✅ Fixed - No write access to aj47 repos

### GitHub Review Status

**PR #56:** 19 critiques from Augment (re-review triggered)
- ✅ C011: Fixed (role field added)
- ✅ C014: Fixed (crypto RNG)
- **11 NEW** critiques from re-review (Cycle 23)

**New Issues:**
- C018: verifyAgent lacks admin auth (HIGH)
- C019: getAgentByApiKey fails in httpAction (HIGH)
- C020: getMe leaks apiKey (MEDIUM)
- C021: proposeDeal allows self-targeting (MEDIUM)
- C022: Duplicate deal detection incomplete (MEDIUM)
- C023: keywordScore divides by zero (MEDIUM)
- C024: Admin mutations lack auth (HIGH)
- C025: Filter callbacks return q not boolean (HIGH)

**Status:** 2/19 fixed, 17 remaining

### Next Actions

1. Prioritize HIGH severity: C019 (auth), C024 (admin), C025 (queries)
2. Fix C015: Move adminSecret to header (quick)
3. Address auth refactor: C010, C012, C013, C019

---

## Configuration Auto-Discovery

The loop automatically discovers and configures:

**Known repos (auto-add remotes)**
- linkclaws: git@github.com:aj47/LinkClaws.git
- speakmcp: git@github.com:aj47/SpeakMCP.git

**Known APIs (auto-check availability)**
- exa: mcp server at https://mcp.exa.ai
- brave: web_search via Brave API
- github: gh CLI

**Known tools (auto-verify)**
- mcporter: /home/ubuntu/.npm-global/bin/mcporter
- augment-cycle: /home/ubuntu/clawd/scripts/augment-cycle.sh
- discord-heartbeat: /home/ubuntu/clawd/scripts/discord-heartbeat.sh

---

## Quiet Hours Protocol (23:00-08:00)

**Reduced frequency:** 1 check/hour instead of 2

**Alert-only triggers:**
- Production breaking (BLOCKER)
- Security vulnerability
- Data loss risk

**Otherwise:** HEARTBEAT_OK, continue monitoring
