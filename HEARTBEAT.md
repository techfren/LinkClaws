# HEARTBEAT.md — PROGRESS-TRACKING MODE

**Effective:** 2026-02-02 06:29 UTC  
**Directive:** Every cycle must produce measurable progress. No spinning.

---

## Anti-Loop System

### Progress Requirements (Every 30 min)

**BEFORE starting work, declare:**
1. What you will accomplish
2. How you'll measure success
3. Time limit (max 30 min)

**AFTER completing work, verify:**
1. Did you achieve the goal? (Yes/No)
2. Is it committed? (Yes/No)
3. Is it documented? (Yes/No)

**If NO progress after 30 min:**
- STOP immediately
- Document blocker
- Switch to different task
- NEVER repeat same failed approach

---

## Progress Log Format

```
[TIME] | GOAL: [what you intended]
[TIME] | RESULT: [what you achieved]
[TIME] | COMMIT: [hash] | [message]
[TIME] | NEXT: [what's next]
```

---

## Work Categories (Rotate Every 2 Hours)

### Hour 1-2: CODE
**Measurable outputs:**
- Tests added/fixed
- Features implemented
- Bugs resolved
- Refactoring completed

**Success criteria:**
- Tests pass
- Code committed
- No TypeScript errors

### Hour 3-4: RESEARCH
**Measurable outputs:**
- Exa searches completed
- Documents created
- Insights documented
- Decisions recorded

**Success criteria:**
- ≥3 searches per cycle
- 1+ document created
- Actionable insights

### Hour 5-6: AUTOMATION
**Measurable outputs:**
- Scripts created
- Workflows automated
- Monitoring improved
- Documentation updated

**Success criteria:**
- Script tested and working
- Time saved documented
- Committed to repo

---

## Sprint Checklist (Each Cycle)

### Must Produce (Pick One+):
- [ ] Working code (tests pass)
- [ ] Research document (≥500 words)
- [ ] Automation script (tested)
- [ ] Bug fix (verified)
- [ ] API endpoint (documented)

### Must Commit:
- [ ] All changes committed
- [ ] Meaningful commit message
- [ ] No WIP commits

### Must Document:
- [ ] Progress logged
- [ ] Decisions recorded
- [ ] Blockers noted

---

## Progress Tracking

### Current Sprint Status

| Cycle | Time | Goal | Result | Commit |
|-------|------|------|--------|--------|
| 1 | 04:00 | Fix tests | 53 passing | a64590b |
| 2 | 04:30 | Human notifications | System built | 9283473 |
| 3 | 05:00 | Webhook system | API done | c371058 |
| 4 | 05:30 | Admin dashboard | 6 endpoints | 92326b4 |
| 5 | 06:00 | Research docs | 7 docs | various |

**Total:** 16 commits, 5 gaps filled

---

## Blocker Protocol

**If stuck for >15 min:**

1. **Document:**
   - What you tried
   - What failed
   - Error messages

2. **Pivot:**
   - Choose different approach
   - Or switch to different task
   - Never retry same failed method

3. **Escalate:**
   - If 3 pivots fail, document for AJ
   - Move to next priority

---

## Anti-Patterns (NEVER DO)

❌ Running same test 10 times expecting different result  
❌ Researching without documenting findings  
❌ Coding without tests  
❌ Working >30 min without commit  
❌ Repeating failed approach  
❌ "Almost done" for >15 min  

---

## PR Creation Checklist

**Every PR must include:**
- [ ] Summary of changes
- [ ] Test results
- [ ] Documentation updates
- [ ] Migration notes (if any)
- [ ] Verification steps

**PR Template:**
```
## Changes
-[ ] Feature A
-[ ] Feature B

## Test Results
- Tests: X/Y passing

## Documentation
- [ ] Updated

## Migration
- None / Steps listed
```

---

## Current Status

**Last Progress:** 06:00 UTC — Sprint complete  
**Next Goal:** Create PR with all changes  
**Measurement:** PR submitted with full documentation  
**Time Limit:** 30 min  

---

*System designed to prevent spinning. Every cycle must ship.*
