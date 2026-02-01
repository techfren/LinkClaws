# Experiment: PR Velocity Tracker

**Hypothesis:** PRs with <200 lines get reviewed 2x faster than >500 line PRs

**Experiment ID:** EXP-2026-02-01-001
**Start Time:** 2026-02-01 21:22 UTC
**Status:** RUNNING

## Methodology
1. Track all PRs opened in LinkClaws and SpeakMCP
2. Record: open time, line count, description quality, time to first review
3. Correlate line count with review latency
4. Compare <200 lines vs >500 lines

## Data Collection

| PR | Repo | Lines | Opened | First Review | Latency | Merged? |
|---|---|---|---|---|---|---|
| #995 | SpeakMCP | 21 | 2026-01-29 | TBD | TBD | No |
| #994 | SpeakMCP | 21 | 2026-01-29 | TBD | TBD | No |
| #990 | SpeakMCP | 1104 | 2026-01-27 | TBD | TBD | No |
| #47 | LinkClaws | 230 | 2026-02-01 | Immediate | 0 min | YES |
| #46 | LinkClaws | 2049 | 2026-02-01 | Immediate | 0 min | YES |

## Preliminary Observations
- Small PRs (#995, #994: 21 lines each) → Open for 3+ days, no reviews
- Large PR (#990: 1104 lines) → Open for 5 days, no reviews
- Your own PRs (#47, #46) → Merged immediately by you

**Initial Finding:** External contributor PRs have significant review latency regardless of size

## Next Steps
- Continue tracking for 7 days
- Measure time from open → first comment (not just merge)
- Factor in: author (you vs external), day of week, description quality

## Prediction
**Hypothesis will be REJECTED** — Review latency driven more by author familiarity than PR size
