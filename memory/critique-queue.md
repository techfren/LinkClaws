# Critique Queue

**Source:** GitHub PR #52 Review (Augment)  
**Detected:** 2026-02-03 20:42 UTC  
**Total Comments:** 8 | **Valid & Unaddressed:** 8

---

## Open Critiques

### C006: getAuthAgent Returns null Without Request
**Found by:** GitHub PR Review (Augment)  
**Severity:** HIGH  
**Target:** `convex/lib/auth.ts:45`  
**Issue:** `getAuthAgent(ctx)` returns `null` when no `request` is provided. Every query/mutation that calls this (from `ctx.runQuery/runMutation`) will consistently behave as unauthenticated, making the new API surface throw `Unauthorized` even when the HTTP layer successfully authenticated the request.  
**Why it matters:** All new API endpoints will fail authentication even with valid API keys  
**Suggested fix:** Pass authenticated agent through Convex internal calls, or check for HTTP context differently  
**Status:** OPEN

---

### C007: Human Decision Endpoint Unauthenticated
**Found by:** GitHub PR Review (Augment)  
**Severity:** HIGH  
**Target:** `convex/http.ts:203` + `convex/deals.ts:604`  
**Issue:** `/api/deals/human-decision` does not authenticate the caller at the HTTP layer. Anyone who can reach this endpoint can approve/reject deals. Since `humanDecision` also lacks an auth/secret check, this is an unauthenticated admin action.  
**Why it matters:** Critical security vulnerability - unauthenticated admin action  
**Suggested fix:** Add authentication check (API key or admin secret) to the HTTP handler  
**Status:** OPEN

---

### C008: Deal ID Enumeration / Privacy Leak
**Found by:** GitHub PR Review (Augment)  
**Severity:** MEDIUM  
**Target:** `convex/deals.ts:35`  
**Issue:** `getById` returns full deal details without verifying the caller is a participant (proposer/target). Any authenticated agent could fetch other agents' deals by ID.  
**Why it matters:** Privacy leak - agents can enumerate deal IDs and read confidential deal terms  
**Suggested fix:** Add participant check before returning deal details  
**Status:** OPEN

---

### C009: Weak API Key Generation
**Found by:** GitHub PR Review (Augment)  
**Severity:** HIGH  
**Target:** `convex/agents.ts:339`  
**Issue:** API keys are generated with `Math.random()`, which is not suitable for secrets and can be predictable. Since `apiKey` is the primary auth credential, this is a security risk.  
**Why it matters:** Predictable API keys enable unauthorized access  
**Suggested fix:** Use `crypto.getRandomValues()` or a proper UUID library  
**Status:** OPEN

---

### C010: Admin Mutations Lack Authorization
**Found by:** GitHub PR Review (Augment)  
**Severity:** HIGH  
**Target:** `landing/convex/admin.ts:62` + lines 80, 171  
**Issue:** Admin mutations like `verifyAgent` currently have no authorization guard. Any caller could verify/suspend agents or moderate posts if these functions are exposed via the API.  
**Why it matters:** Privilege escalation risk - any authenticated user can perform admin actions  
**Suggested fix:** Add admin secret check or role-based authorization to admin mutations  
**Status:** OPEN

---

### C011: Webhook Trigger Lacks Auth
**Found by:** GitHub PR Review (Augment)  
**Severity:** MEDIUM  
**Target:** `landing/convex/webhooks.ts:150`  
**Issue:** `trigger` is described as "called internally" but has no authentication/authorization. Any caller could enqueue webhook deliveries for arbitrary events (queue spam / noisy integrations).  
**Why it matters:** Potential for abuse - anyone can trigger webhook deliveries  
**Suggested fix:** Restrict to trusted/internal callers only  
**Status:** OPEN

---

### C012: Simulation Script Wrong Argument
**Found by:** GitHub PR Review (Augment)  
**Severity:** LOW  
**Target:** `landing/scripts/simulate-agent-communication.js:177`  
**Issue:** `followAgent` is called with `agent1.agentId` as the first argument, but the method expects an API key (`X-API-Key`). This will cause the simulation to fail authentication.  
**Why it matters:** Test script won't work as expected  
**Suggested fix:** Pass `agent1.apiKey` instead of `agent1.agentId`  
**Status:** OPEN

---

### C013: Test Script Missing Admin Secret
**Found by:** GitHub PR Review (Augment)  
**Severity:** LOW  
**Target:** `landing/scripts/test-agent-flows.js:109`  
**Issue:** `createHumanNotification` requires `adminSecret`, but this call omits it. The simulation will fail Convex argument validation.  
**Why it matters:** Test script won't complete successfully  
**Suggested fix:** Pass `TEST_ADMIN_SECRET` like other admin operations in the script  
**Status:** OPEN

---

## Resolved Critiques

*None currently (all 8 critiques from PR #52 are OPEN)*

---

## Critique History

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| C006 | getAuthAgent Returns null Without Request | HIGH | OPEN |
| C007 | Human Decision Endpoint Unauthenticated | HIGH | OPEN |
| C008 | Deal ID Enumeration / Privacy Leak | MEDIUM | OPEN |
| C009 | Weak API Key Generation | HIGH | OPEN |
| C010 | Admin Mutations Lack Authorization | HIGH | OPEN |
| C011 | Webhook Trigger Lacks Auth | MEDIUM | OPEN |
| C012 | Simulation Script Wrong Argument | LOW | OPEN |
| C013 | Test Script Missing Admin Secret | LOW | OPEN |

---

## System Status

**Mode:** GitHub Review Integration  
**Source:** PR #52 (Augment Review)  
**Queue Depth:** 8  
**High Severity:** 4  
**Medium Severity:** 2  
**Low Severity:** 2  

---

*Proactive loop now checks GitHub reviews and adds valid comments to critique queue.*
