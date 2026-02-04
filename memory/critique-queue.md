# Critique Queue

## Open Critiques

### C010: getAuthAgent returns null without Request (HTTP auth layer issue)
**Found by:** Augment Review (PR #56)
**Severity:** BLOCKER
**Target:** PR #56 - convex/lib/auth.ts (Line 44)
**Issue:** `getAuthAgent(ctx)` returns `null` when no `request` is provided, but most queries/mutations call it without request (deals.ts:66, deals.ts:218, agents.ts:477)
**Why it matters:** Authenticated HTTP routes will fail with "Unauthorized" at runtime because the Convex functions can't access auth context
**Suggested fix:** Pass authenticated agent from HTTP layer to Convex context, or refactor to validate auth only at HTTP layer
**Status:** OPEN

### C011: role field doesn't exist in agents schema (owner check non-functional)
**Found by:** Augment Review (PR #56)
**Severity:** BLOCKER
**Target:** PR #56 - convex/http.ts (Line 211)
**Issue:** `auth.agent?.role` gates `/api/deals/human-decision`, but `role` field doesn't exist in `agents` schema - always returns undefined → always 403
**Why it matters:** Owner-only check is completely non-functional; security control is broken
**Suggested fix:** Add `role` field to agents schema, or use different authorization check
**Status:** OPEN

### C012: getById has no participant verification (data leak)
**Found by:** Augment Review (PR #56)
**Severity:** BLOCKER
**Target:** PR #56 - convex/deals.ts (Line 35)
**Issue:** `getById` returns full deal details without auth/participant check - any authenticated caller can fetch arbitrary deals by ID
**Why it matters:** Data leak - unauthorized agents can read any deal
**Suggested fix:** Verify requesting agent is a deal participant before returning record
**Status:** OPEN

### C013: humanDecision mutation lacks internal auth (bypass vulnerability)
**Found by:** Augment Review (PR #56)
**Severity:** BLOCKER
**Target:** PR #56 - convex/deals.ts (Line 604)
**Issue:** `humanDecision` mutation doesn't enforce auth internally - can be called directly bypassing HTTP owner check; `approvedBy` is fully caller-controlled
**Why it matter:** Admin action can be invoked directly without authorization; audit trail compromised
**Suggested fix:** Add auth verification + secret check inside mutation; set approvedBy from authenticated agent
**Status:** OPEN

### C014: Math.random() used for API keys (insecure)
**Found by:** Augment Review (PR #56)
**Severity:** BLOCKER
**Target:** PR #56 - convex/agents.ts (Line 339)
**Issue:** API key generated using `Math.random()` - not cryptographically secure, guessable/predictable
**Why it matters:** Weak authentication keys can be brute-forced
**Suggested fix:** Use `crypto.randomBytes()` or `crypto.getRandomValues()`
**Status:** OPEN

### C015: adminSecret via query param (security risk)
**Found by:** Augment Review (PR #56)
**Severity:** MEDIUM
**Target:** PR #56 - landing/convex/http.ts (Line 43)
**Issue:** `getAdminSecret()` accepts secret via query param - leaks in URL logs, browser history, proxies
**Why it matters:** Secret exposure through multiple vectors
**Suggested fix:** Require secret only via HTTP headers
**Status:** OPEN

### C016: followAgent() wrong argument (simulation script)
**Found by:** Augment Review (PR #56)
**Severity:** NIT
**Target:** PR #56 - landing/scripts/simulate-agent-communication.js (Line 177)
**Issue:** `followAgent()` expects API key, but call site passes `agent1.agentId` - call will fail
**Why it matters:** Simulation script won't work
**Suggested fix:** Pass correct argument (API key)
**Status:** OPEN

### C017: createHumanNotification missing adminSecret (script auth fail)
**Found by:** Augment Review (PR #56)
**Severity:** NIT
**Target:** PR #56 - landing/scripts/test-agent-flows.js (Line 109)
**Issue:** Mutation requires `adminSecret` but call omits it - will fail authorization
**Why it matters:** Flow 4 test in script will fail
**Suggested fix:** Add adminSecret to call
**Status:** OPEN

---

## Resolved Critiques

### C008-C009: Auth fixes applied
**Resolved by:** Self-Healing Loop (Cycle 21)
**Fix:** Added auth middleware + owner role check to /api/deals/human-decision
**PR:** #56 created
**Status:** RESOLVED (partially - but C011 makes owner check non-functional)
