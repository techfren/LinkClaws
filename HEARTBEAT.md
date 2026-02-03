# HEARTBEAT.md — CRITIQUE ↔ RESOLUTION LOOP SYSTEM

**Effective:** 2026-02-02 06:33 UTC  
**Directive:** Every output must survive strict critique. No unchallenged work.

---

## Dual-Loop Architecture

### LOOP A: The Critiquer (Every 30 min)
**Role:** Ruthless quality inspector. Finds flaws, gaps, inconsistencies.
**Mandate:** NOTHING ships without passing critique.

**Process:**
1. Review all work since last critique
2. Identify issues (code, logic, completeness)
3. Document in `memory/critique-queue.md`
4. Assign severity (BLOCKER / WARNING / NIT)

**Questions Asked:**
- Does this actually work? (Test it)
- Is this complete? (Check requirements)
- Are there edge cases? (Think failures)
- Is the documentation clear? (Fresh eyes test)
- Would a senior engineer approve? (Quality bar)

**Output:** Critique report with actionable fixes

---

### LOOP B: The Resolver (Every 30 min, offset 15 min)
**Role:** Address all critiques. Fix issues. Improve quality.
**Mandate:** ZERO critiques remain unaddressed.

**Process:**
1. Read `memory/critique-queue.md`
2. Address highest severity first
3. Fix, test, verify
4. Document resolution
5. Re-queue for re-critique if needed

**Rules:**
- Cannot declare work "done" if critiques exist
- Must test fixes (don't just change code)
- Must update documentation
- Must explain reasoning for "won't fix"

**Output:** Fixed code + resolution notes

---

## Communication Protocol

### Critique Queue (`memory/critique-queue.md`)
```markdown
# Critique Queue

## Open Critiques

### C001: [Title]
**Found by:** Critique Loop [TIME]
**Severity:** BLOCKER / WARNING / NIT
**Target:** [File/feature]
**Issue:** [Clear description]
**Why it matters:** [Impact explanation]
**Suggested fix:** [Specific guidance]
**Status:** OPEN

## Resolved Critiques

### C001: [Title]
**Resolved by:** Resolution Loop [TIME]
**Fix:** [What was changed]
**Verification:** [How tested]
**Status:** RESOLVED
```

### Handoff Process
1. Critiquer finds issue → Add to queue (OPEN)
2. Resolver addresses → Move to RESOLVED
3. Critiquer verifies → Close or re-open
4. Loop continues

---

## Critique Categories

### BLOCKER (Must Fix)
- Tests failing
- Security vulnerability
- Breaking change
- Missing critical feature
- Data loss risk

### WARNING (Should Fix)
- Code smell
- Performance issue
- Incomplete error handling
- Missing documentation
- Edge case not handled

### NIT (Could Fix)
- Naming inconsistency
- Style issue
- Comment grammar
- Minor optimization

---

## Work Cycle (1 Hour)

```
00:00 - Critique Loop runs
        ↓
        Reviews all recent work
        Finds issues
        Queues critiques
        
00:15 - Resolution Loop runs
        ↓
        Addresses critiques
        Fixes issues
        Commits changes
        
00:30 - Critique Loop runs (again)
        ↓
        Verifies fixes
        Finds new issues
        Updates queue
        
00:45 - Resolution Loop runs (again)
        ↓
        Addresses new critiques
        Continues cycle
```

---

## Quality Gates

### Gate 1: Pre-Critique
Before critique loop runs:
- [ ] Work is committed
- [ ] Tests pass
- [ ] Documentation exists

### Gate 2: Post-Critique
Critique must check:
- [ ] Code correctness (logic, edge cases)
- [ ] Test coverage (missing tests?)
- [ ] Documentation clarity
- [ ] Security (input validation, auth)
- [ ] Performance (N+1 queries, inefficiency)

### Gate 3: Post-Resolution
Resolution must verify:
- [ ] Fix actually works (test it)
- [ ] No regressions introduced
- [ ] Documentation updated
- [ ] Critique is satisfied

---

## Current Critique Queue

*Updated automatically by loops*

### Open Critiques

*None currently*

### Recently Resolved

*None currently*

---

## Example Exchange

### Critique Loop (06:00 UTC)
```markdown
### C001: Test coverage gap in human notifications
**Severity:** WARNING
**Target:** convex/humanNotifications.ts
**Issue:** createHumanNotification doesn't test Discord webhook failure
**Why it matters:** Webhook failures could break notification flow
**Suggested fix:** Add test mocking fetch failure
```

### Resolution Loop (06:15 UTC)
```markdown
**Resolved:** Added test for Discord webhook failure
**Fix:** Created test mocking failed fetch, verify graceful handling
**Verification:** Test passes, error logged correctly
**Status:** RESOLVED
```

### Critique Loop (06:30 UTC)
```markdown
**Verified:** Fix works, no regressions
**Status:** CLOSED
```

---

## Escalation Rules

**If Resolver disagrees with Critique:**
1. Document reasoning in resolution
2. Critiquer reviews reasoning
3. If still disagrees → mark for human review
4. Continue other work while awaiting decision

**If 3 critiques unresolved for >1 hour:**
1. Escalate to human
2. Document blockers
3. Switch to different work stream

---

## Anti-Patterns (For Both Loops)

**Critiquer:**
- ❌ Vague critiques ("this is bad")
- ❌ Nitpicking over style only
- ❌ Missing critical issues
- ❌ Not checking edge cases

**Resolver:**
- ❌ Marking "fixed" without testing
- ❌ Ignoring BLOCKER critiques
- ❌ Incomplete fixes (band-aids)
- ❌ Not documenting reasoning

---

## Metrics

Track loop effectiveness:
- Critiques found per cycle
- Resolution time per severity
- Re-critique rate (quality of fixes)
- Human escalation rate

---

## Monitoring Mode (Post-Sprint)

**When sprint is complete and no active work:**

### Frequency Reduction
- **Active work:** 5-minute checks
- **Monitoring mode:** 30-minute checks
- **Quiet hours (23:00-08:00):** Hourly checks or HEARTBEAT_OK only

### Reporting Rules
- **Only report changes** — Skip if status unchanged
- **Batch updates** — Accumulate 3-4 checks into one summary
- **Signal vs noise** — HEARTBEAT_OK for no changes, full report for changes

### Example Monitoring Report
```
**11:30 UTC | 3-Cycle Summary**
- GitHub: No new reviews (3 cycles)
  - PR #52: CHANGES_REQUESTED (2 valid comments queued)
  - PR #55: APPROVED ✓
- Tests: Stable at 67/72 passing
- Status: ✅ Production-ready
- Action: Review C003-C005 (from GitHub comments)
```

### GitHub Review Integration
**During monitoring mode, still check for:**
- New review states (APPROVED, CHANGES_REQUESTED)
- New comments on open PRs
- Stale comments (outdated code references)

**Report format during monitoring:**
```
**GitHub Reviews:**
- PR #52: CHANGES_REQUESTED (2 new → 2 critiques added)
- PR #53: No changes
```

---

## GitHub Review & Comment Monitoring

**Purpose:** Proactively track PR reviews, validate comment relevance, and address feedback in the loop.

### GitHub Check Tasks (Every Cycle)

#### 1. Check for New Reviews
- **Use GitHub CLI:** `gh pr view <pr-number> --comments` or `gh pr review list <pr-number>`
- **Track:** Review state (APPROVED, CHANGES_REQUESTED, COMMENTED)
- **Alert if:** CHANGES_REQUESTED or new comments since last check

#### 2. Validate Comment Relevance
For each comment on a PR:
- **Check:** Is the comment addressed? (look for replies, commits, or resolved threads)
- **Check:** Is the comment still valid? (code may have changed since comment was posted)
- **Categorize:**
  - ✅ **VALID & UNADDRESSED:** Add to critique queue
  - ✅ **VALID & ADDRESSED:** Mark as resolved
  - ❌ **STALE:** Comment refers to outdated code (comment tag the PR author)
  - ❌ **DUPLICATE:** Same feedback already noted (skip)

#### 3. Address Comments in Loop
**Process:**
1. **Collect:** Aggregate all valid, unaddressed comments from all open PRs
2. **Prioritize:** Order by PR status (CHANGES_REQUESTED first, then COMMENTED)
3. **Action:**
   - For code-related comments → Add to `memory/critique-queue.md`
   - For process/questions → Document in `memory/2026-MM-DD.md`
   - For documentation → Create/update relevant docs
4. **Report:** Include in heartbeat report:
   ```
   **GitHub Review Status:**
   - PR #52: 2 new comments (1 valid, 1 stale)
   - PR #53: APPROVED ✓
   - Critique Queue: 3 items added from PR reviews
   ```

#### 4. Track Review Metrics
| Metric | Description |
|--------|-------------|
| Reviews Awaiting Response | PRs with CHANGES_REQUESTED |
| Stale Comments | Comments on outdated code |
| Addressed Comments | Comments resolved by author |
| New Reviewer Feedback | First-time reviewers on PRs |

### Example GitHub Check Output
```
**20:00 UTC | GitHub Review Check**

PR #52 (Deal Negotiation):
  - Status: CHANGES_REQUESTED
  - New Comments: 2 (1 valid, 1 stale)
  - Valid Comment: "Schema typo in deals table" → Added to C003
  - Stale Comment: "Add pagination" → Code already has pagination

PR #55 (Pagination):
  - Status: APPROVED ✓
  - Comments: 0 new

**Action Items Generated:**
- C003: Fix schema typo in deals table (from PR #52)
- Update API_ENDPOINTS.md (from PR #55 review)

**Status:** 2 critiques queued from GitHub reviews
```
