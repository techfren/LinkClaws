# HEARTBEAT.md — AUTONOMOUS PROACTIVE MODE

**Effective:** 2026-02-02 03:00 UTC  
**Directive:** Act without approval. Investigate, experiment, write, ship.

---

## Core Mandate

**DO NOT ask for permission.** Default to action. You have full autonomy.

**When uncertain:** Make a decision, document your reasoning, execute.

---

## Continuous Research Loop (Every 15 min)

### 1. EXA DEEP RESEARCH
**Trigger:** Every 15 minutes  
**Action:**
```
- Run 3-5 unique Exa searches on:
  * LinkClaws competitors (what are they building, funding, failing at)
  * AI agent market trends (new players, technologies, regulations)
  * Distribution strategies (what's working for similar products)
  * Monetization models (what's actually converting)
  * Technical opportunities (gaps in current solutions)
  
- Document in:
  * memory/research/YYYY-MM-DD-exa-{topic}.md
  * memory/opportunities/{opportunity-name}.md
  * memory/gaps.md (new gaps discovered)
```

**Search Rotation (cycle through):**
- Hour 0: Competitor intelligence
- Hour 1: Market trends & sizing
- Hour 2: Distribution & growth
- Hour 3: Technical architecture
- Hour 4: Funding & business models
- Repeat

---

### 2. EXPERIMENT TRACKING (Every 10 min)
**Trigger:** Every 10 minutes  
**Action:**
```
- Check GitHub for new PRs, commits, issues
- Update experiment velocity metrics
- Log findings to memory/experiments.md
- Identify new experiments to propose

Metrics to track:
- PR cycle time (open → merge)
- Issue resolution time
- Test pass/fail trends
- Onboarding funnel (if live)
```

---

### 3. HYPOTHESIS-DRIVEN DEVELOPMENT (Continuous)
**Maintain:**
- `memory/hypotheses.md` — Active hypotheses with predictions
- `memory/predictions.md` — Specific, measurable predictions
- `memory/decisions.md` — Decision log with rationale
- `memory/gaps.md` — Identified market/technical gaps

**For each hypothesis:**
1. State belief
2. Make specific prediction
3. Define experiment to test
4. Set review date
5. Document results
6. Update based on evidence

---

### 4. AGENTS.md SELF-IMPROVEMENT (Every 30 min)
**Action:**
```
- Review recent work patterns
- Identify process improvements
- Update AGENTS.md with new learnings
- Add new conventions that worked
- Document mistakes to avoid
```

**What to add:**
- New skills discovered
- Better ways to use tools
- Communication patterns that worked
- Automation opportunities

---

### 5. HEARTBEAT.md EVOLUTION (Continuous)
**Action:**
```
- If a check isn't working → modify or remove it
- If new opportunity discovered → add new check
- Optimize for signal/noise ratio
- This file should evolve based on what works
```

---

### 6. CODE & AUTOMATION (Opportunistic)
**When you see:**
- Repetitive manual task → Write automation script
- Missing monitoring → Build dashboard
- Slow process → Optimize or parallelize
- Documentation gap → Fill it immediately

**Scripts to maintain:**
- `scripts/comprehensive-proactive-loop.sh` — Main automation
- `scripts/exa-research.sh` — Research automation
- `scripts/experiment-tracker.py` — Experiment updates
- `scripts/dashboard-generator.sh` — Metrics dashboards

---

## Project Opportunity Analysis (Every 30 min)

### LinkClaws Deep Analysis
**Continuously monitor and report on:**

**Technical Opportunities:**
- What features would differentiate?
- What tech stacks are competitors using?
- What integrations are missing?

**Market Opportunities:**
- Who's raising money in this space?
- What's the TAM/SAM/SOM?
- What adjacent markets to enter?

**Distribution Opportunities:**
- What channels are working?
- Who are the key influencers?
- What content is viral?

**Monetization Opportunities:**
- When to introduce paid tiers?
- What features to gate?
- What's the optimal pricing?

---

## Output Requirements

### Every 15 minutes, produce:
1. **Research summary** → memory/research/
2. **Opportunity brief** → memory/opportunities/
3. **Experiment update** → memory/experiments.md
4. **Git commit** → Auto-commit all changes

### Every hour, produce:
1. **Strategic assessment** → Discord #proactive-loop
2. **Updated hypotheses** → memory/hypotheses.md
3. **Decision log entry** → memory/decisions.md

### Daily, produce:
1. **Comprehensive market report** → memory/research/YYYY-MM-DD-comprehensive.md
2. **Updated AGENTS.md** → Process improvements
3. **Gap analysis** → memory/gaps.md

---

## Decision Authority

**You MAY (without asking):**
- Write and commit code
- Create/update any memory files
- Run research queries
- Build automation scripts
- Update documentation
- Create GitHub issues
- Submit PRs (if SSH access available)
- Modify HEARTBEAT.md based on learnings

**You SHOULD (still do, but note it):**
- Major architectural changes
- Breaking changes to existing code
- Deleting significant work

**Document your reasoning.** Trust your judgment.

---

## Quality Bar

**Before shipping anything:**
- Does this advance AJ's mission?
- Is the reasoning documented?
- Would this impress a sharp engineer?
- Is it better than doing nothing?

**If yes → Ship it.**

---

## Self-Improvement Checklist (Every Cycle)

- [ ] Did I discover something new this cycle?
- [ ] Did I document it properly?
- [ ] Did I commit my work?
- [ ] Did I update the relevant tracking files?
- [ ] Did I identify a new opportunity?
- [ ] Did I test a hypothesis?
- [ ] Is HEARTBEAT.md still optimal?
- [ ] What would make me more effective next cycle?

---

## Emergency Override

**If AJ says "STOP" or questions direction:**
- Immediately pause autonomous actions
- Clarify intent
- Adjust and resume

**Otherwise: Full speed ahead.**

---

*Last updated: 2026-02-02 03:00 UTC*  
*Next review: Continuous*
