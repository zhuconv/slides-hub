---
theme: default
title: "ALPHA - Full Runs on FrontierCS & SlopCodeBench"
info: "Progress update - July 1, 2026"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
.slidev-layout.fill {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.slidev-layout.fill h1 { font-size: 1.95rem; line-height: 1.15; margin-bottom: 0.4rem; }
.slidev-layout.fill h3 { font-size: 1.10rem; margin: 0 0 0.35rem; }
.slidev-layout.fill p  { line-height: 1.45; margin: 0.35rem 0; font-size: 0.98rem; }
.slidev-layout.fill li { line-height: 1.40; margin: 0.24rem 0; font-size: 0.93rem; }
.slidev-layout.fill ul { padding-left: 1.05rem; }
.slidev-layout.fill table { font-size: 0.78rem; }
.result-table table { font-size: 0.76rem; width: 100%; }
.result-table th, .result-table td { white-space: nowrap; }
.pos { color: #047857; font-weight: 700; }
.neg { color: #b91c1c; font-weight: 700; }
.neu { color: #475569; font-weight: 700; }
.card {
  padding: 1.0rem;
  border-radius: 8px;
  border: 1px solid;
  min-height: 9.6rem;
}
.blue { background: #eff6ff; border-color: #bfdbfe; }
.green { background: #ecfdf5; border-color: #a7f3d0; }
.purple { background: #f5f3ff; border-color: #ddd6fe; }
.amber { background: #fffbeb; border-color: #fde68a; }
.slate { background: #f8fafc; border-color: #cbd5e1; }
.metric { font-size: 1.42rem; font-weight: 750; letter-spacing: 0; }
.metric-label { font-size: 0.74rem; opacity: 0.68; text-transform: uppercase; letter-spacing: 0.02em; }
.source { font-size: 0.67rem; opacity: 0.58; margin-top: 0.55rem; line-height: 1.25; }
.codeish { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.86em; }
</style>

# ALPHA

## Full Runs on FrontierCS & SlopCodeBench

<div class="mt-6 text-base opacity-80">
Progress update - what the whole-benchmark runs actually say about principle injection
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | July 1, 2026
</div>

---
class: fill
---

# This week: two full runs, one accounting

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### FrontierCS - complete

- 35 interactive problems, `gpt-5.5`
- Self-mined principle set, delivered by progressive disclosure
- Firmed to `n ~ 30` per arm, permutation tests

</div>
<div class="card green">

### SlopCodeBench - complete

- 28 checkpointed coding problems, `gpt-5.5`
- Direction + Correction on the compliant ATS base
- 3 trials each (`k=3`), permutation CIs

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
The question moved from "does principle injection help?" to "which lever, on which problem?" - both benchmarks answer the same way.
</div>

---
class: fill
---

# FrontierCS: the honest headline

<div class="result-table mt-3">

| problem | plain -> set | delta | p | reading |
|---|---|---|---|---|
| p69 | 0.40 -> 0.92 | <span class="pos">+0.52</span> | <0.001 | lift, in-distribution |
| p231 | 0.36 -> 0.68 | <span class="pos">+0.32</span> | 0.006 | lift, in-distribution |
| p124 | 0.64 -> 0.85 | <span class="pos">+0.21</span> | <0.001 | lift, in-distribution |
| p25 | 0.70 -> 0.85 | <span class="pos">+0.15</span> | 0.006 | lift, in-distribution |

</div>

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card slate">

### Net effect

- Held-out net <span class="neu">+0.03</span> / problem
- 95% CI `[-0.00, +0.07]` - barely clears 0

</div>
<div class="card green">

### Safety

- <span class="pos">0 / 35</span> significant regressions
- Abstention: no-match -> agent pulls nothing

</div>
</div>

<div class="mt-4 p-3 amber rounded-lg text-sm">
A uniform set reliably elicits its own matches (all 4 lifts are mined-from) and harms nothing - but it does not transfer.
</div>

<div class="source">
Source: docs/frontiercs/principle-set-results.md; noise floor = plain split-half manufactures 10/35 "regressions".
</div>

---
class: fill
---

# FrontierCS: "unimproved" is not "model can't"

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="card blue">

### best@k

`~11/19` flat problems are reliability gaps.

Capability is present; best-of-k reaches the ceiling (p70 .75->.97, p141 .35->1.0).

</div>
<div class="card purple">

### oracle-directive

`+2` more are elicitation gaps.

Told what to aim for, p2 and p222 lift significantly - p222 refuted the "no better method" claim.

</div>
<div class="card slate">

### genuine floors

Only `~5/19` survive both rungs.

p30, p40, p54, p209, p154 - and even those are "not closeable at inference time," not proven incapable.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Failure under one harness is weak evidence of inability: success proves a task reachable, failure never proves it impossible. Attribute the gap to the cheapest rung that closes it.
</div>

---
class: fill
---

# FrontierCS: the lever that actually works

<div class="result-table mt-3">

| problem | plain -> matched | delta | note |
|---|---|---|---|
| p2 | 0.11 -> 0.32 | <span class="pos">+0.20</span> | replicated, p<1e-4 |
| p144 | 0.47 -> 0.68 | <span class="pos">+0.22</span> | batched group-testing, p=0.002 |
| p141 | 0.28 -> 0.61 | <span class="pos">+0.34</span> | p=0.036 |
| p4 | 0.51 -> 0.47 | <span class="neu">-0.04</span> | high-level principle, ns |
| p108 | mismatch | <span class="neg">-0.24</span> | wrong directive hurts |

</div>

<div class="mt-4 p-3 amber rounded-lg text-sm">
Benefit needs all three: a <strong>concrete directive</strong> (not a principle), a <strong>headroom problem</strong> (model underfits), and a <strong>match</strong> to the judge. Uniform injection is null on gpt-5.5 - the win is targeted elicitation, which needs a per-problem router.
</div>

<div class="source">
Evidence: principles/matched-p2, matched-p4; runs data/runs/alpha-fcs-p2matched*.
</div>

---
class: fill
---

# SlopCodeBench: same method, new format

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Direction (turn 0)

Prepend a mined principle to the task.

Consolidate a shared pipeline; keep DSL semantics before brevity.

</div>
<div class="card purple">

### Correction (online)

A general brain reads the agent trace, then re-runs on a detected bug.

Fired on `10/123` decisions (`~8%`), spec-tied: "inverts the required source priority" (conf 0.98).

</div>
</div>

<div class="mt-4 p-3 amber rounded-lg text-sm">
The brain is benchmark-agnostic: the same monitor that flags competitive-programming errors adapts to slop-task contracts out of the box, firing selectively rather than on every turn.
</div>

<div class="source">
Two axes scored per checkpoint: pass-rate (core, strict - higher better) and slop (verbosity, erosion - lower better).
</div>

---
class: fill
---

# SlopCodeBench: results (28 problems, k=3)

<div class="result-table mt-3">

| metric | reductions (better) | regressions (worse) | robustness sd (base -> method) |
|---|---|---|---|
| verbosity (lower) | <span class="pos">12</span> | 0 | 0.053 -> 0.059 |
| erosion (lower) | <span class="pos">6</span> | <span class="neg">2</span> | 0.068 -> 0.084 |
| core-pass (higher) | <span class="pos">1</span> | <span class="neg">2</span> | 0.035 -> 0.036 |
| strict-pass (higher) | <span class="pos">2</span> | <span class="neg">3</span> | 0.037 -> 0.053 |

</div>

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card green">

### The clean win

- 18 significant slop reductions (verbosity 12/0)
- Large in magnitude (up to -0.23 verbosity)

</div>
<div class="card slate">

### Honest reading

- Pass-rate held, slight strict-side cost (all <=0.10)
- Reliability roughly unchanged - correction adds a stochastic re-run

</div>
</div>

<div class="mt-4 p-3 amber rounded-lg text-sm">
The method trades a small pass-rate cost for a large slop reduction, at roughly unchanged reliability - exactly what Direction+Correction was built to do.
</div>

---
class: fill
---

# SlopCodeBench: where the pass-rate is lost

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="card slate">
<div class="metric-label">core tests</div>
<div class="metric">~25%</div>
<p>miss rate</p>
</div>
<div class="card blue">
<div class="metric-label">functionality tests</div>
<div class="metric">~31%</div>
<p>worst by rate - new feature</p>
</div>
<div class="card amber">
<div class="metric-label">regression tests</div>
<div class="metric">~24%</div>
<p>biggest bucket - existing behavior</p>
</div>
</div>

<div class="mt-4 grid grid-cols-2 gap-6">
<div class="card blue">

### Mechanism (trace-grounded)

The agent builds the feature, then reorders existing error-handling: `error_code` flips `UNKNOWN_OP -> SCHEMA_VALIDATION_FAILED`, a prior guard silently returns 0.

</div>
<div class="card green">

### Proposed principle

`preserve-existing-contracts`: new checks slot in additively, never preempt an existing branch; error/return codes are a contract.

</div>
</div>

<div class="mt-4 p-3 amber rounded-lg text-sm">
Regression tests dominate the strict-pass score (most tests), so preserving existing behavior is the biggest lever - and our slop-consolidation can work against it.
</div>

---
class: fill
---

# Through-line and next

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card purple">

### Both benchmarks agree

- Uniform principles: safe via abstention, but flat
- The win is a <strong>matched, concrete directive on a headroom problem</strong>
- Elicitation, not new capability, closes most gaps

</div>
<div class="card green">

### Next

- A/B the `preserve-existing-contracts` principle to cut the strict-pass cost
- Add best-of-N selection - correction alone did not lift reliability
- Wire the per-problem matched-directive router

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Spend the large-run budget on targeting (which directive, which problem), not on more uniform injection - that ceiling is now measured on two benchmarks.
</div>
