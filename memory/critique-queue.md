# Critique Queue

## Open Critiques (Updated from Augment Re-Review)

### C010: getAuthAgent returns null without Request
**Found by:** Augment Review (PR #56)
**Severity:** HIGH
**Target:** convex/lib/auth.ts (Line 44)
**Issue:** Returns null when no request provided, HTTP routes will fail
**Fix Required:** Pass auth context from HTTP layer to Convex functions
**Status:** OPEN

### C011: role field missing in agents schema
**Found by:** Augment Review (PR #56)
**Severity:** HIGH
**Target:** convex/schema.ts
**Issue:** Owner check uses non-existent role field
**Fix Applied:** ✅ Added role field (member/admin/owner)
**Status:** NEEDS VERIFICATION

### C012: getById no participant verification (data leak)
**Found by:** Augment Review (PR #56)
**Severity:** HIGH
**Target:** convex/deals.ts (Line 35)
**Issue:** Any authenticated caller can fetch arbitrary deals
**Fix Required:** Add participant check before returning deal
**Status:** OPEN

### C013: humanDecision lacks internal auth (bypass possible)
**Found by:** Augment Review (PR #56)
**Severity:** HIGH
**Target:** convex/deals.ts (Line 604)
**Issue:** Mutation can be called directly bypassing HTTP auth
**Fix Required:** Add auth/secret check inside mutation
**Status:** OPEN

### C014: Math.random() for API keys (insecure)
**Found by:** Augment Review (PR #56)
**Severity:** HIGH
**Target:** convex/agents.ts (Line 339)
**Fix Applied:** ✅ Replaced with crypto.getRandomValues()
**Status:** NEEDS VERIFICATION

### C015: adminSecret via query param (leak risk)
**Found by:** Augment Review (PR #56)
**Severity:** MEDIUM
**Target:** landing/convex/http.ts (Line 43)
**Fix Required:** Move adminSecret to HTTP header only
**Status:** OPEN

### C016: followAgent() wrong argument in script
**Found by:** Augment Review (PR #56)
**Severity:** LOW
**Target:** landing/scripts/simulate-agent-communication.js (Line 177)
**Fix Required:** Pass API key instead of agentId
**Status:** OPEN

### C017: createHumanNotification missing adminSecret
**Found by:** Augment Review (PR #56)
**Severity:** LOW
**Target:** landing/scripts/test-agent-flows.js (Line 109)
**Fix Required:** Add adminSecret to call
**Status:** OPEN

---

## NEW Critiques from Re-Review (2026-02-04)

### C018: verifyAgent lacks admin auth
**Found by:** Augment Re-Review
**Severity:** HIGH
**Target:** landing/convex/admin.ts
**Issue:** Admin action has no auth check - any caller can verify agents
**Fix Required:** Add admin secret/role check
**Status:** OPEN

### C019: getAgentByApiKey fails in httpAction (DB handle missing)
**Found by:** Augment Re-Review
**Severity:** HIGH
**Target:** convex/lib/auth.ts
**Issue:** httpAction ctx doesn't expose DB handle - will throw at runtime
**Fix Required:** Refactor auth for httpAction context
**Status:** OPEN

### C020: getMe leaks sensitive fields (apiKey)
**Found by:** Augment Re-Review
**Severity:** MEDIUM
**Target:** convex/agents.ts
**Issue:** Returns all agent fields including apiKey
**Fix Required:** Return explicit allowlist, exclude secrets
**Status:** OPEN

### C021: proposeDeal allows self-targeting
**Found by:** Augment Re-Review
**Severity:** MEDIUM
**Target:** convex/deals.ts
**Issue:** Agent can propose deal to themselves
**Fix Required:** Reject self-targeted proposals
**Status:** OPEN

### C022: Duplicate deal detection incomplete
**Found by:** Augment Re-Review
**Severity:** MEDIUM
**Target:** convex/deals.ts
**Issue:** Only checks one direction for active deals
**Fix Required:** Check both participant orderings
**Status:** OPEN

### C023: keywordScore divides by zero (NaN)
**Found by:** Augment Re-Review
**Severity:** MEDIUM
**Target:** convex/matches.ts
**Issue:** Math.max can be 0, causes NaN
**Fix Required:** Add zero-check before division
**Status:** OPEN

### C024: Admin mutations in landing lack auth
**Found by:** Augment Re-Review
**Severity:** HIGH
**Target:** landing/convex/*.ts
**Issue:** Multiple admin endpoints have no auth
**Fix Required:** Add admin secret/role checks
**Status:** OPEN

### C025: Filter callbacks return q instead of boolean
**Found by:** Augment Re-Review
**Severity:** HIGH
**Target:** convex/*.ts
**Issue:** Convex expects boolean, not builder object
**Fix Required:** Return proper boolean expressions
**Status:** OPEN

---

## Resolved Critiques

### C008-C009: Initial auth fixes
**Resolved:** 2026-02-04 17:38 UTC
**Status:** Superseded by new Augment review
