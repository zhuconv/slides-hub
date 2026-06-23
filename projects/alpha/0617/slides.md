---
theme: default
title: "ALPHA - Scaling Evaluation Runs"
info: "Progress update - June 17, 2026"
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
.bar { height: 0.55rem; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.bar > span { display: block; height: 100%; background: #10b981; }
</style>

# ALPHA

## Scaling Evaluation Runs

<div class="mt-6 text-base opacity-80">
Progress update - moving from local sequential cells to GKE batch evaluation
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | June 17, 2026
</div>

---
class: fill
---

# What changed this week

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Built

- GKE path for Harbor-backed ALPHA evals
- Batch launchers for many independent cells
- In-cluster `gpt-5.5` router wiring and durable local reports

</div>
<div class="card green">

### Measured

- Replaced one-by-one local runs with schedulable GKE pods
- Ran a 32-cell SlopCodeBench `xjq` pilot
- Collected wall-clock, effective parallelism, and cost

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Claim for today: the evaluation environment is now scaled enough to test principle effects with repeated runs, instead of relying on isolated smoke tests.
</div>

---
class: fill
---

# Why scale is necessary

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card purple">

### Full benchmark evaluation

- `3 agent harnesses`
- `N problems`, where `N = 10-100`
- `3 repeated runs`
- `4 methods`

</div>
<div class="card green">

### Order of magnitude

- `3 x N x 3 x 4 = 36N cells`
- `N = 10` gives `360` cells
- `N = 100` gives `3,600` cells
- Sequential local runs quickly become days to weeks

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
The experiment unit is no longer "can one agent solve one task"; it is `problems x runs x methods x harnesses`.
</div>

<div class="source">
Source: full-benchmark evaluation grid used to size GKE batch runs.
</div>

---
class: fill
---

# GKE throughput from the `xjq` pilot

<div class="grid grid-cols-4 gap-4 mt-4">
<div class="card blue">
<div class="metric-label">cells</div>
<div class="metric">32</div>
<p>`1 task x 16 runs x 2 methods`</p>
</div>
<div class="card green">
<div class="metric-label">GKE wall time</div>
<div class="metric">86.6 min</div>
<p>Start-to-finish for the full batch</p>
</div>
<div class="card purple">
<div class="metric-label">sequential equivalent</div>
<div class="metric">8.65 h</div>
<p>Sum of all cell durations</p>
</div>
<div class="card amber">
<div class="metric-label">effective speedup</div>
<div class="metric">6.0x</div>
<p>`JOBS=8`, one agent per pod</p>
</div>
</div>

<div class="mt-5">
<div class="flex justify-between text-xs opacity-70 mb-1">
<span>GKE batch: 1.44 h</span><span>local sequential equivalent: 8.65 h</span>
</div>
<div class="bar"><span style="width: 16.7%"></span></div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Tracked LLM cost: `$64.42` total, `$2.01/cell` average. A same-shape 1,152-cell SlopCodeBench run is roughly `$2.3k` LLM spend if `xjq` is representative.
</div>

<div class="source">
Evidence: `alpha_v1_runs/scb_gke_pilot_xjq_xjqprinciple_waitguard_20260617_032640/`.
</div>

---
class: fill
---

# Scaling lessons

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="card blue">

### Concurrency shape

`CELL_CONCURRENCY=1` means one Harbor run inside one container.

Stable path: scale by many independent GKE jobs, not nested runs inside one pod.

</div>
<div class="card green">

### Efficiency bottleneck

Container setup is small: env `0.14 min`, agent setup `0.36 min`.

The main time is agent + LLM loop: agent `13.6 min`, verifier `1.7 min`.

</div>
<div class="card purple">

### Rate / cost control

This batch used `20.8M` tokens over `86.6 min`: `0.24M TPM` average.

Next scaling limit is likely backend TPM / RPM before Kubernetes.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Exact account capacity is org/project/model-level; read it from the dashboard or `x-ratelimit-*` headers before pushing `JOBS` higher.
</div>

<div class="source">
Sources: `xjq` pilot artifacts; OpenAI rate limit docs for org/project/model-level limits.
</div>

---
class: fill
---

# SlopCodeBench pilot: `xjq`

<p class="mt-2 opacity-75">
`xjq` is a checkpointed CLI coding task: implement XPath/CSS/JSON querying behavior while preserving earlier checkpoint tests and code quality.
</p>

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card green">

### Injected principle

Use a library-backed, centralized query-result pipeline.

Parse input, evaluate XPath/CSS/JSON, normalize results once, then apply `--first`, `--text`, `--json`, and compact output from one formatter.

</div>
<div class="card slate">

### Expected behavior change

Avoid checkpoint-by-checkpoint patch branches.

Extend the shared pipeline when new flags or formats arrive, instead of adding special-case paths that bypass prior semantics.

</div>
</div>

<div class="result-table mt-5">

| n plain/alpha | strict delta | core delta | erosion reduction |
|---:|---:|---:|---:|
| 16/16 | <span class="neu">-0.007</span> | <span class="neu">+0.0009</span> | <span class="pos">+0.121</span> |

</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Interpretation: no strict-pass claim yet; the positive pilot signal is lower structural erosion under the same task and repeat count.
</div>

<div class="source">
Evidence: `report.md`; principle: `principles_slopcodebench_xjq/query-result-pipeline/SKILL.md`; p-value for erosion reduction = 0.0047.
</div>

---
class: fill
---

# Next

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="card green">

### Whole benchmark

Run SlopCodeBench across all 36 problems with enough repeats to separate pass-rate, verbosity, and erosion effects.

</div>
<div class="card blue">

### Multiple benchmarks

Keep FrontierCS and SlopCodeBench under the same ALPHA accounting: method, harness, repeats, cost, and wall-clock.

</div>
<div class="card purple">

### Dig principles

Move from task-specific hints toward reusable principle families, then compare prompt injection with online intervention where the harness exposes hooks.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Next decision: spend the large-run budget only after selecting principle families that are plausible beyond a single task.
</div>
