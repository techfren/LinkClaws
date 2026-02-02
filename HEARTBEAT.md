# HEARTBEAT.md — ALL-NIGHT CODE SPRINT MODE

**Effective:** 2026-02-02 04:44 UTC  
**Directive:** Deep codebase work. Test, simulate, fix, improve. No sleep until ship.

---

## Current Sprint: LinkClaws Hardering

**Goal:** Production-ready platform by morning.

**Status:** 🟢 ACTIVE — Tests passing, building features, filling gaps

---

## Sprint Checklist (Continuous Loop)

### 1. CODEBASE HYGIENE (Every 30 min)
```
□ Pull latest origin/main
□ Run full test suite
□ Check for TypeScript errors
□ Run linter
□ Fix any regressions immediately
```

**Current Status:** ✅ 46/49 tests passing (3 skipped for search index)

---

### 2. AGENT COMMUNICATION SIMULATION (Every hour)
```
□ Run agent simulator script
□ Test DM flows
□ Test notification creation
□ Test mention parsing
□ Verify email/webhook delivery
□ Document any broken flows
```

**Simulator:** `landing/scripts/simulate-agent-communication.js`
**Scenarios:**
- Agent registration → invite flow
- Post creation → mention notifications
- DM thread creation
- Follow/unfollow
- Upvoting

---

### 3. GAP IDENTIFICATION & FILLING (Continuous)
```
□ Review API endpoints for missing functionality
□ Check schema for incomplete fields
□ Identify missing indexes
□ Find unhandled edge cases
□ Document in memory/gaps.md
□ Implement fixes immediately
```

**Active Gaps:**
- [ ] Human notification system (in progress)
- [ ] Email delivery for notifications
- [ ] Webhook support for external integrations
- [ ] Rate limiting UI feedback
- [ ] Admin dashboard

---

### 4. FLOW IMPROVEMENTS (Opportunistic)
```
□ Identify friction points in user journey
□ Simplify multi-step processes
□ Add loading states
□ Improve error messages
□ Add retry logic
□ Optimize slow queries
```

**Recent Improvements:**
- ✅ Fixed test suite (removed duplicate declarations)
- ✅ Bypassed rate limits in tests (per-agent isolation)
- ✅ Created human notification system
- 🔄 Building agent communication simulator

---

### 5. CODE CLEANUP (Continuous)
```
□ Remove console.logs
□ Add JSDoc comments
□ Refactor duplicated code
□ Optimize imports
□ Fix naming inconsistencies
□ Remove dead code
```

**Cleanup Targets:**
- Duplicate TEST_ADMIN_SECRET declarations (✅ done)
- Unused imports
- Inconsistent error messages
- Missing type annotations

---

## Work Streams (Parallel)

### Stream A: Backend Hardening
- Fix remaining test issues
- Add missing schema indexes
- Implement human notifications
- Add webhook delivery
- Improve error handling

### Stream B: Agent Simulation
- Build comprehensive simulator
- Test all API endpoints
- Verify notification flows
- Load test with multiple agents
- Document breaking changes

### Stream C: Gap Filling
- Human notification schema
- Email integration research
- Webhook system design
- Admin dashboard API
- Analytics tracking

### Stream D: Documentation
- API documentation
- Test coverage reports
- Deployment guides
- Onboarding checklists
- Troubleshooting guides

---

## Commit Frequency

**Every 30-60 minutes:**
```bash
git add -A
git commit -m "feat/fix: [specific change]

- What changed
- Why it changed  
- Test status"
```

**Commit Messages:**
- `feat:` — New features
- `fix:` — Bug fixes
- `test:` — Test improvements
- `refactor:` — Code cleanup
- `docs:` — Documentation

---

## Night Deliverables (By 08:00 UTC)

### Must Have:
- [ ] 100% test pass rate (or documented skips)
- [ ] Agent simulator working
- [ ] Human notification system
- [ ] All critical gaps filled
- [ ] Clean codebase (no lint errors)

### Should Have:
- [ ] Email notification delivery
- [ ] Webhook system
- [ ] Load testing results
- [ ] API documentation
- [ ] Admin dashboard basics

### Nice to Have:
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Deployment automation
- [ ] Monitoring dashboard

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Pass Rate | 94% (46/49) | 100% |
| TypeScript Errors | 0 | 0 |
| Lint Errors | ? | 0 |
| API Endpoints Tested | 0 | 100% |
| Critical Gaps | 5 | 0 |

---

## Emergency Contacts

**If stuck >30 min:**
- Document the blocker
- Try 3 different approaches
- If still stuck → note for AJ review
- Move to next task

**If tests break:**
- Immediately fix or revert
- No broken tests allowed overnight

**If scope creep:**
- Document in backlog
- Stay focused on sprint goals
- New features = new sprint

---

## Current Status (Updated Continuously)

**Last Update:** 2026-02-02 04:53 UTC  
**Tests:** 53/56 passing ✅  
**Commits Tonight:** 4  
**Gaps Filled:** 3  
**In Progress:** Agent simulator, TypeScript type generation  

**Next 30 min:**
1. Complete agent simulator implementation
2. Run end-to-end DM flow tests
3. Check for remaining gaps
4. Commit progress

---

*Sprint mode: Deep work, tight loops, ship continuously.*
*Next review: Every 30 min or on milestone completion.*
