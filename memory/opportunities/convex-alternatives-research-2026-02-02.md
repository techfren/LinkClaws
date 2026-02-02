# Convex Alternatives - Scaling Research

**Date:** 2026-02-02  
**Source:** Exa Research Pulse  
**Topic:** Database/Backend Alternatives for LinkClaws Scaling

---

## Context

Current LinkClaws infrastructure uses Convex with documented 16K scan limit constraint. Researching alternatives for future migration if needed.

## Alternatives Analyzed

| Alternative | Type | Best For | Consideration |
|-------------|------|----------|---------------|
| **Supabase** | PostgreSQL + Realtime | Full SQL compatibility | Good migration path |
| **Firebase** | Document store | Rapid prototyping | Vendor lock-in (Google) |
| **Appwrite** | Open-source backend | Self-hosted option | Community size? |
| **Rocketgraph** | Firebase alternative | Open-source drop-in | Early stage |
| **StarTree** | Real-time analytics | OLAP workloads | Overkill for LinkClaws? |
| **BigQuery** | Data warehouse | Analytics at scale | Not for OLTP |

## Key Findings

### Supabase (Recommended if Migration Needed)
- **Pros:** PostgreSQL (proven at scale), realtime subscriptions, auth built-in
- **Cons:** Self-hosting complexity, connection limits
- **Migration effort:** Medium (schema rewrite, query changes)

### Appwrite (Open Source Alternative)
- **Pros:** Self-hosted, no vendor lock-in, comprehensive backend
- **Cons:** Smaller community, newer (stability concerns)
- **Best for:** Teams wanting full control

### Firebase (Avoid for LinkClaws)
- **Pros:** Battle-tested, massive scale
- **Cons:** Google dependency, document model limits
- **Why avoid:** Same lock-in issues as Convex

## Recommendation

**Short-term (0-6 months):** Stay on Convex
- 16K limit manageable with proper indexing
- Team expertise already built
- Focus on product-market fit

**Medium-term (6-12 months):** Evaluate Supabase
- Start dual-write experiments
- Test migration path with subset of data
- Measure performance delta

**Long-term (12+ months):** Consider self-hosted
- PostgreSQL on managed service (AWS RDS, etc.)
- Full control over scaling
- Higher operational overhead

## Migration Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Convex limits hit | Medium | High | Monitor, have Supabase plan ready |
| Migration downtime | High | High | Blue-green deployment |
| Data loss | Low | Critical | Full backup + verification |
| Performance regression | Medium | Medium | Load test before cutover |

## Decision

**Status:** Stick with Convex for now
- Current scale (10s of agents) far below limits
- Migration cost > benefit at this stage
- Re-evaluate at 1,000+ agents or 100K+ daily operations

**Trigger for re-evaluation:**
- Consistent 16K scan limit hits
- Convex pricing changes
- Feature requirements beyond Convex capabilities

---

*Research notes: Convex alternatives are mainly Supabase (PostgreSQL) or Firebase (document). Neither offers clear advantage for current scale. Recommendation: optimize Convex usage, defer migration decision.*
