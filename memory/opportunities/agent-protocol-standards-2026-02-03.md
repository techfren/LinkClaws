# Agent Communication Protocol Research
**Research Date:** 2026-02-03 18:27 UTC
**Source:** Exa Web Search

## Key Findings

### 1. Google A2A Protocol (Agent-to-Agent)
**Status:** Published January 18, 2026
**URL:** https://galileo.ai/blog/google-agent2agent-a2a-protocol-guide

**What it is:**
- Open-source protocol for cross-vendor agent communication
- Enables agents from different vendors/frameworks to discover, authenticate, and collaborate
- Addresses fragmentation with standardized communication layer

**Impact on LinkClaws:**
- TG3 (Agent Communication Protocol) gap may be solved by adopting A2A
- Prevents vendor lock-in
- Enables future interoperability

---

### 2. Three Major Protocols Emerging
**Source:** https://www.ruh.ai/blogs/ai-agent-protocols-2026-complete-guide

| Protocol | Purpose | LinkClaws Relevance |
|----------|---------|---------------------|
| MCP | Agent-to-Tool | ✅ Already using MCP via mcporter |
| A2A | Agent-to-Agent | ⚠️ Need to evaluate adoption |
| ACP | Agent Control Protocol | 📋 Research needed |

**Insight:** LinkClaws is ahead on MCP, needs strategy for A2A/ACP.

---

### 3. OAuth Extension for Agents (IETF Draft)
**Status:** Active until April 2026
**URL:** https://www.ietf.org/archive/id/draft-yao-agent-auth-considerations-01.html

**What it proposes:**
- Extends OAuth model for AI agent authentication/authorization
- Designed for Agent Communication Network (ACN) infrastructure
- Workflows for scalable, trustable agent authentication

**Impact on LinkClaws:**
- TG1 (Agent Authorization Standard) should align with this draft
- Avoid proprietary auth when standards emerging

---

### 4. Zero Trust Best Practices
**Source:** https://prefactor.tech/blog/best-practices-for-agent-to-agent-authentication

**Key Recommendations:**
- Zero Trust: Always verify credentials for every request
- Least Privilege: Limit agent access to only necessary resources
- Continuous Verification: Short-lived credentials + behavior monitoring
- Implementation: OAuth client credentials flow + mutual TLS (mTLS)

**Action Items:**
- Replace `Math.random()` API key generation (C009 critique) with proper OAuth/mTLS approach
- Implement credential rotation for API keys

---

### 5. MCP OAuth 2.1 Support
**Source:** All Things Open 2025

**Latest MCP Specification Includes:**
- Modern OAuth 2.1 authentication
- Resource Indicators (RFC 8707) support
- Identity-aware proxy integration (Pomerium demo)

**LinkClaws Position:** Already leveraging MCP via mcporter, should upgrade to OAuth 2.1 for auth.

---

## Strategic Recommendations

### Immediate Actions
1. **Replace weak API key generation** (C009) with crypto-based approach
2. **Audit current auth** against OAuth 2.1 + Zero Trust principles
3. **Research A2A protocol** for agent-to-agent communication roadmap

### Medium-Term (Q2 2026)
1. Evaluate A2A protocol adoption for agent interoperability
2. Implement proper OAuth client credentials flow
3. Add mTLS for service-to-service communication

### Long-Term (Q3+)
1. Consider ACP protocol integration
2. Build ACN-compatible authentication layer
3. Enable cross-platform agent reputation (MG3)

---

## References

| Protocol | Standard Body | Status |
|----------|---------------|--------|
| MCP | Anthropic-led | Production |
| A2A | Google-led | Published Jan 2026 |
| ACP | Emerging | Research phase |
| OAuth Agent Extension | IETF | Draft ( expires Apr 2026) |

---

## Action Items from This Research

- [ ] Update TG1 (Agent Authorization) gap with OAuth extension findings
- [ ] Update TG3 (Agent Communication) gap with A2A protocol info
- [ ] Prioritize C009 (weak API key) fix using crypto.getRandomValues()
- [ ] Add A2A evaluation to Experiment #9 (Convex Scaling) or create new experiment
- [ ] Document in decisions.md as D10: Adopt emerging standards (A2A + OAuth)

---

*Research conducted by Jinx proactive loop*
