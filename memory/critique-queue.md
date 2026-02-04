# Critique Queue

## Open Critiques

### C008: Auth bypass in getAuthAgent when no request provided
**Found by:** GitHub Review Monitor (Cycle 17)
**Severity:** BLOCKER
**Target:** aj47/LinkClaws PR #52 - convex/lib/auth.ts (Line 45)
**Issue:** `getAuthAgent(ctx)` returns `null` when no `request` is provided, causing authenticated HTTP requests to fail and throw `Unauthorized` errors
**Why it matters:** Breaks authentication flow for all Convex queries/mutations that rely on `getAuthAgent(ctx)`
**Reproduction:** From PR #52 review comment: "every query/mutation that calls `getAuthAgent(ctx)` (e.g. from `ctx.runQuery/runMutation`) will consistently behave as unauthenticated"
**Suggested fix:** Pass authenticated user from HTTP context to Convex context, or add auth check in humanDecision handler
**Action Required:** Checkout PR #52 branch to investigate and fix
**Status:** OPEN

### C009: Unauthenticated admin action in /api/deals/human-decision
**Found by:** GitHub Review Monitor (Cycle 17)
**Severity:** BLOCKER
**Target:** aj47/LinkClaws PR #52 - convex/http.ts + convex/deals.ts (Line 604)
**Issue:** `/api/deals/human-decision` endpoint lacks HTTP authentication, allowing anyone to approve/reject deals; `humanDecision` mutation also lacks auth/secret check
**Why it matters:** Security vulnerability - unauthorized users can execute admin actions (approve/reject deals)
**Reproduction:** From PR #52 review comment: "anyone who can reach this endpoint can approve/reject deals"
**Suggested fix:** Add authentication check at HTTP layer AND add secret/owner verification in the `humanDecision` mutation
**Action Required:** Checkout PR #52 branch to investigate and fix
**Status:** OPEN

### C010-C012: Additional Augment suggestions pending review
**Found by:** GitHub Review Monitor (Cycle 17)
**Severity:** WARNING
**Target:** PR #52 (Deal Negotiation MVP)
**Issue:** Augment reported 8 total suggestions; 6 more need categorization
**Why it matters:** May include additional security or functionality issues
**Suggested fix:** Review remaining 6 comments to categorize severity
**Status:** OPEN - Needs review

---

## Recently Resolved

*None in this cycle*
