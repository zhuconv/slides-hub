---
theme: default
title: "ALPHA - Three Harnesses, One Principle Layer"
info: "Progress update - June 10, 2026"
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
.slidev-layout.fill h3 { font-size: 1.12rem; margin: 0 0 0.4rem; }
.slidev-layout.fill p  { line-height: 1.45; margin: 0.35rem 0; font-size: 1rem; }
.slidev-layout.fill li { line-height: 1.42; margin: 0.25rem 0; font-size: 0.96rem; }
.slidev-layout.fill ul { padding-left: 1.1rem; }
.slidev-layout.fill table { font-size: 0.82rem; }
.card {
  padding: 1.0rem;
  border-radius: 8px;
  border: 1px solid;
  min-height: 10rem;
}
.blue { background: #eff6ff; border-color: #bfdbfe; }
.green { background: #ecfdf5; border-color: #a7f3d0; }
.purple { background: #f5f3ff; border-color: #ddd6fe; }
.amber { background: #fffbeb; border-color: #fde68a; }
.slate { background: #f8fafc; border-color: #cbd5e1; }
.metric { font-size: 1.35rem; font-weight: 700; }
.source { font-size: 0.68rem; opacity: 0.58; margin-top: 0.55rem; line-height: 1.25; }
.bar { height: 0.55rem; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.bar > span { display: block; height: 100%; background: #10b981; }
</style>

# ALPHA

## Three Harnesses, One Principle Layer

<div class="mt-6 text-base opacity-80">
Progress update - directive injection, corrective intervention, and single-problem harness smoke tests
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | June 10, 2026
</div>

---
class: fill
---

# What changed

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Built

- ALPHA now attaches to **three harnesses**
- Same principle store, thin harness-specific glue

</div>
<div class="card green">

### Tested

- On single-problem smoke tests, **each harness has a lift case**
- This validates mechanics before claiming broad transfer

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Claim for today: principles can steer mini-swe/Harbor, Codex CLI, and Claude Code CLI on concrete FrontierCS tasks.
</div>

---
class: fill
---

# Background: why principles

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card purple">

### The failure shape

Some FrontierCS tasks are interactive: the solver asks a hidden judge/oracle questions, and reward drops when it uses too many.

A correct linear scan - one judge query per candidate - can still score poorly.

</div>
<div class="card green">

### ALPHA's role

Store reusable lessons as principles, then surface them through the harness at the moment the agent acts.

</div>
</div>

<div class="source">
Code map: `alpha_core/runtime.py`, `alpha_core/principles.py`, `alpha_harbor/agents/mini_swe_alpha.py`, `experiments/p7_transfer/run_cell.py`.
</div>

---
class: fill
---

# Two intervention modes

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Directive principle injection

- Principle is injected from turn 0
- Best for steering search before the agent commits to a plan

</div>
<div class="card green">

### Corrective principle intervention

- Detect a bad committed scheme
- Rewind before the commit, then inject the correction

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Prior result: auto-intervention lifted P0/P2/P4 means by +0.190, +0.225, +0.112 respectively; detect-then-rewind mattered.
</div>

<div class="source">
Evidence: `RESULTS.md` section 4, `auto_intervention/`, `scripts/run_alpha_v1.py`.
</div>

---
class: fill
---

# Two integration patterns

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Open loop: mini-swe + Harbor

We control the agent loop, so ALPHA hooks into `before_model`, `after_model`, `before_tool`, and `after_tool`.

This is the natural place for monitor -> rewind -> inject; the p7 smoke tests use the same hook surface for upfront principle injection.

</div>
<div class="card green">

### Closed agents: Codex + Claude

We cannot interrupt the private loop or stream mini-swe-style trajectory summaries.

The adapter renders transcript + final `solution.cpp` for the brain; if it fires, we respawn a fresh run with the principle present from token 0.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Closed-agent path is implemented twice: `codex_adapter` and `claude_code_adapter`.
</div>

<div class="source">
Entry point: `experiments/p7_transfer/run_cell.py`; open-loop hook: `alpha_adapters/mini_swe.py`; closed-agent brain/respawn: `codex_adapter/run_ab.py`, `claude_code_adapter/run_ab.py`.
</div>

---
class: fill
---

# Principle example: batched bisection

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card slate">

### Trigger

Use when an interactive task has a query limit and the obvious plan spends roughly one judge query per candidate.

</div>
<div class="card green">

### Obligation

Batch the query into a group test: split candidates, reuse controls, and halve the remaining set whenever the oracle allows it.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
The linear scan is kept as a fallback, not treated as the final algorithm.
</div>

<div class="source">
Principle file: `principles_mined_p3/batched-bisection-over-scans/SKILL.md`.
</div>

---
class: fill
---

# Example 1: Find Median (p144)

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card blue">

### Problem

Hidden permutation. A query returns the two median **values** of a chosen even-size subset.

Goal: find the indices of the two global medians with few queries.

</div>
<div class="card green">

### Principled behavior

Codex moved from complement/pair scans into balanced batched tests.

Local simulator: n=100 max 60 queries, avg 55.75.

</div>
</div>

<div class="mt-5 grid grid-cols-2 gap-4 text-sm">
<div>
Plain mean: <span class="metric">0.509</span>
<div class="bar"><span style="width: 50.9%"></span></div>
</div>
<div>
Principled mean: <span class="metric">0.651</span> | best run 0.936
<div class="bar"><span style="width: 65.1%"></span></div>
</div>
</div>

<div class="source">
Evidence: `experiments/p7_transfer/codex_fit/cells/codex__gpt-5.5__p144__*.json`; trace: `.../principled/run1/trace.txt`.
</div>

---
class: fill
---

# Example 2: Geemu (p52)

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card purple">

### Problem

Query `f(l,r)` returns the number of consecutive-value runs inside a position interval.

Recover the permutation up to complement.

</div>
<div class="card green">

### Principled behavior

Claude Code reformulated it as recovering edges of a Hamiltonian path, then binary-searched each new position's left-neighbors.

</div>
</div>

<div class="mt-5 grid grid-cols-2 gap-4 text-sm">
<div>
Plain mean: <span class="metric">0.666</span>
<div class="bar"><span style="width: 66.6%"></span></div>
</div>
<div>
Principled mean: <span class="metric">1.000</span> | `p_up = 0.05`
<div class="bar"><span style="width: 100%"></span></div>
</div>
</div>

<div class="source">
Evidence: `experiments/p7_transfer/run_final/summary.json`; trace: `.../cc__claude-opus-4-8__p52__principled/run1/trace.txt`.
</div>

---
class: fill
---

# Single-problem harness smoke tests

<div class="text-sm mt-3">

| Harness | Model | Problem | Plain | Principled | Delta | Evidence |
|---|---:|---:|---:|---:|---:|---|
| mini-swe / Harbor | gpt-5.5 | p249 | 0.833 | 0.966 | +0.133 | `run_final` |
| Codex CLI | gpt-5.5 | p144 | 0.509 | 0.651 | +0.142 | `codex_fit` |
| Claude Code CLI | Opus 4.8 | p52 | 0.666 | 1.000 | +0.334 | `run_final` |

</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Interpretation: the same principle abstraction can reach all three harness surfaces and change at least one concrete run distribution per harness.
</div>

<div class="source">
All rows are n=3 means on 0-1 reward. Mini-swe injection log: `.../p249__principled/.../agent/alpha/advice.jsonl` cites P1 with `system_addendum_chars=1008`.
</div>

---
class: fill
---

# Next step

<div class="grid grid-cols-2 gap-6 mt-4">
<div class="card green">

### Build a real transfer set

Find a compact principle set that improves multiple problems, not only one smoke case, while running unchanged across mini-swe, Codex, and Claude Code.

</div>
<div class="card blue">

### Fix execution parity

Same task/settings should not give opposite conclusions: some CC runs suggest gpt-5.5 is stuck near 0.5, while Codex reaches 1.0. Audit launch flags, env, scorer cases, timeouts, and Harbor/proxy wiring.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-base text-center">
Next claim needs both: a principle set that transfers, and a harness-parity audit that makes the rewards comparable.
</div>
