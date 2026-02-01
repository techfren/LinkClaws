# Experiments Log

## Active Experiments

### Experiment 1: PR Review Velocity Prediction
**Hypothesis:** PRs with <200 lines and clear descriptions get reviewed 2x faster.
**Method:** Track time from open → merge/comment for each PR, correlate with size/description quality.
**Start Date:** 2026-02-01
**Status:** Design phase

### Experiment 2: Contributor Response Time Optimization
**Hypothesis:** Contributors who get feedback within 24h are 3x more likely to complete PRs.
**Method:** Track contributor PRs, measure time to first response, correlate with completion rate.
**Start Date:** 2026-02-01
**Status:** Design phase

### Experiment 3: Auto-Labeling Issues by Content Analysis ⭐ RUNNING
**Hypothesis:** Auto-labeled issues get assigned 50% faster.
**Method:** Use LLM to analyze issue content, auto-apply labels (bug/feature/docs), track assignment time.
**Start Date:** 2026-02-01 20:37 UTC
**Status:** **BLOCKED - Permission issue**

#### Experiment #3 Findings
Permission denied to add labels via GitHub CLI. Pivoting to: **Recommended Labels Report**.

**LinkClaws Issues - Label Recommendations:**

| Issue | Title | Suggested Labels | Current Labels |
|---|---|---|---|
| #48 | PRs need rebase | `bug`, `automation` | None |
| #19 | Comments in dashboard | `enhancement`, `ui` | None |
| #18 | DM thread summaries | `enhancement`, `ui` | None |
| #17 | Pagination | `enhancement`, `performance` | None |
| #16 | Sidebar trending tags | `enhancement`, `ui` | None |
| #15 | Delete comment API | `enhancement`, `api` | None |
| #14 | Block/report API | `enhancement`, `api`, `security` | None |
| #13 | Twitter verification API | `enhancement`, `api` | None |
| #12 | Domain verification API | `enhancement`, `api` | None |
| #10 | Compliance/privacy | `enhancement`, `security`, `compliance` | None |
| #9 | Security - email verification | `bug`, `security` | None |
| #8 | Security - CSRF protection | `bug`, `security` | None |
| #7 | Security - API key rotation | `enhancement`, `security`, `api` | None |
| #5 | Performance - compound indexes | `enhancement`, `performance` | None |

**Action Required:** Labels exist but I lack permission to apply them. AJ can batch-apply using this mapping.

### Experiment 4: Documentation Gap Detection ⭐ RUNNING
**Hypothesis:** 40% of merged PRs lack documentation updates.
**Method:** Check if PRs touching API/code also update README/docs. Report gaps.
**Start Date:** 2026-02-01 20:35 UTC
**Status:** **FIRST RESULT OBTAINED**

#### Experiment #4 Findings (Initial)
| Commit | Feature | API Endpoint Added | Docs Updated? | Gap? |
|---|---|---|---|---|
| 5e9e5f0 | Delete comment API | POST /api/comments/delete | ❌ NO | ⚠️ **GAP FOUND** |
| 20b3a87 | Staged verification | Multiple endpoints | ✅ Partial | ✓ OK |

**API Documentation Coverage:**
- Total docs: 772 lines across 3 files
- Comments endpoints documented: 2 (create, get)
- Missing: DELETE /api/comments/delete

**Action:** Can auto-generate doc update or flag for manual update.

---

## Experiment Ideas Queue

1. **Test Coverage Threshold Alert** — Alert when PRs drop coverage below 70%
2. **Duplicate Detection Accuracy** — How often do duplicate PRs get created? Can we catch them earlier?
3. **Issue Stale-ness Prediction** — Predict which issues will go stale (no activity 30+ days)
4. **PR Description Template A/B** — Test structured templates vs free-form
5. **Weekend vs Weekday Merge Rate** — Do PRs merged on weekends have more bugs?
6. **Security Scanning** — Auto-scan PRs for security anti-patterns
7. **Dependency Update Automation** — Auto-create PRs for outdated dependencies
8. **Contributor Onboarding Funnel** — Track first-time contributor journey
9. **Code Review Bot Personas** — Test different review tones (friendly vs direct vs Socratic)
10. **Predictive Conflict Detection** — Predict which PRs will have merge conflicts before they happen
