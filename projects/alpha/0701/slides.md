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
.slidev-layout.fill table { font-size: 0.82rem; }
.result-table table { font-size: 0.86rem; width: 100%; }
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
.metric { font-size: 2.0rem; font-weight: 750; letter-spacing: 0; }
.metric-label { font-size: 0.74rem; opacity: 0.68; text-transform: uppercase; letter-spacing: 0.02em; }
.source { font-size: 0.67rem; opacity: 0.58; margin-top: 0.55rem; line-height: 1.25; }
</style>

# ALPHA

## Full Runs on FrontierCS & SlopCodeBench

<div class="mt-6 text-base opacity-80">
Good / flat / bad across two benchmarks - where the method helps, where it's flat, where it hurts
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | July 1, 2026
</div>

---
class: fill
---

# FrontierCS: good / flat / bad

<p class="mt-2 opacity-75">35 interactive problems, `gpt-5.5`, ~30 runs/problem, self-mined principle set (permutation CIs).</p>

<div class="grid grid-cols-3 gap-4 mt-5">
<div class="card green">
<div class="metric-label">good - significantly better</div>
<div class="metric">4</div>
<p>p69 +0.52, p231 +0.32, p124 +0.21, p25 +0.15</p>
</div>
<div class="card slate">
<div class="metric-label">flat - no change</div>
<div class="metric">31</div>
<p>no significant difference</p>
</div>
<div class="card amber">
<div class="metric-label">bad - significantly worse</div>
<div class="metric">0</div>
<p>zero regressions</p>
</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
4 significant lifts, 0 regressions - better on some problems, no degradation on any of the rest.
</div>

---
class: fill
---

# SlopCodeBench: good / flat / bad

<p class="mt-2 opacity-75">28 checkpointed coding problems, `gpt-5.5`, k=3 trials, Direction + Correction (bootstrap CIs).</p>

<div class="result-table mt-4">

| metric | good (better) | flat (no change) | bad (worse) |
|---|:---:|:---:|:---:|
| verbosity (lower better) | <span class="pos">12</span> | 16 | 0 |
| erosion (lower better) | <span class="pos">6</span> | 20 | <span class="neg">2</span> |
| core-pass (higher better) | <span class="pos">1</span> | 25 | <span class="neg">2</span> |
| strict-pass (higher better) | <span class="pos">2</span> | 23 | <span class="neg">3</span> |

</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Slop strongly reduced (18 good / 2 bad); pass-rate held (only small dips). Better where the method acts, no degradation elsewhere.
</div>

---
class: fill
---

# Takeaway

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card green">

### Good-heavy, near-zero bad

- FrontierCS: 4 better / 0 worse (of 35)
- SlopCodeBench slop: 18 better / 2 worse
- Pass-rate: held, only small dips

</div>
<div class="card slate">

### Reliability

- Robust where it counts: near-zero regressions (<span class="pos">0/35</span> FrontierCS, only small dips on SCB)
- Reliably helps or holds - it seldom hurts
- Run-to-run variance not yet lower - best-of-N is the next test

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Two benchmarks, same pattern: significantly better where it targets, near-zero regressions on the rest - reliable in the sense of rarely breaking anything.
</div>
