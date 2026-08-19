---
theme: default
title: "CAN HARNESS OPTIMIZATION IMPROVE AGENTS?"
info: "GENERALIZABLE GAINS VERSUS EVALUATION NOISE"
class: text-center cover
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
.slidev-layout.fill { display: flex; flex-direction: column; justify-content: center; }
.slidev-layout.fill h1 { margin-bottom: 0.5rem; }
.slidev-layout table td, .slidev-layout table th { padding: 0.2em 0.55em; }
.slidev-layout.cover h1 { font-size: 2.1em !important; line-height: 1.25 !important; }
.slidev-layout.closing h1 { font-size: 1.65em !important; line-height: 1.15 !important; margin-bottom: 0.2em !important; }
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact table { font-size: 0.78em !important; }
.slidev-layout.compact table td, .slidev-layout.compact table th { padding: 0.12em 0.5em !important; }
</style>

# CAN HARNESS OPTIMIZATION<br>IMPROVE AGENTS?

<div class="mt-6 text-base opacity-80">
GENERALIZABLE GAINS VERSUS EVALUATION NOISE
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · Aug 19, 2026
</div>

---
class: fill
---

# A higher score is not yet an improvement

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What most evaluations report

- Run a benchmark once, or only a few times
- Compare the seed and optimized harness by point estimate
- Call a positive difference an improvement

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What that comparison omits

- Agent execution stays stochastic with task, model, harness, and budget fixed
- Search can select a lucky rollout instead of a better harness
- The real question is whether the gain clears repeat-run uncertainty

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Without repeated runs, we cannot tell a harness improvement from ordinary execution variance.
</div>

---
class: fill
---

# The same task moves by 14–23 points across runs

<img src="/run_to_run_variance.png" class="mx-auto mt-2 rounded" style="max-height: 285px; object-fit: contain" />

<div class="mt-2 text-xs opacity-60">
Dots: median within-task reward SD. Whiskers: interquartile range across tasks. Task, model, harness, and budget are held fixed.
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
A single task's one-run difference has roughly 20–33 pp of standard error. Small point-estimate gains are therefore easy to manufacture by chance.
</div>

---
class: fill
---

# We evaluate the gain, not just the score

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Repeated comparison

- 3 optimizers × 4 benchmarks
- Seed and optimized harness matched on model, image, verifier, and budget
- About 10 fresh runs per arm, per task

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Reliability rule

- Estimate the difference within each task first
- Hierarchical bootstrap: resample tasks, then runs
- Reliable only if the 95% lower bound exceeds zero and survives Holm correction

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Confidence intervals are part of the evaluator: a candidate is better only when its gain is repeatable.
</div>

---
class: compact
---

# Only 1 of 12 benchmark comparisons clears zero

<div class="mx-auto" style="max-width: 660px">

| Method | Benchmark | Δ (pp) | 95% CI | *p*<sub>Holm</sub> |
|---|---|---:|---|---:|
| Meta-Harness | Terminal-Bench | +0.9 | \[−2.8, +4.6\] | .74 |
| | FrontierCS | −0.5 | \[−4.1, +3.2\] | .91 |
| | DeepSWE | −0.8 | \[−3.7, +2.1\] | .84 |
| | APEX-Agents | −0.3 | \[−2.5, +1.9\] | .92 |
| AHE | Terminal-Bench | +1.8 | \[−1.7, +5.4\] | .28 |
| | FrontierCS | +0.3 | \[−3.4, +4.0\] | .95 |
| | DeepSWE | −1.8 | \[−5.2, +1.6\] | .31 |
| | APEX-Agents | +0.2 | \[−2.8, +3.1\] | .96 |
| **Retro Harness** | **Terminal-Bench** | **+3.5** | **\[+0.8, +6.2\]** | **.041** |
| | FrontierCS | +1.4 | \[−1.9, +4.7\] | .35 |
| | DeepSWE | +0.2 | \[−3.3, +3.8\] | .97 |
| | APEX-Agents | +0.9 | \[−2.4, +4.1\] | .62 |

</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Eight point estimates are positive, but only Retro Harness on Terminal-Bench is reliable. No method improves reliably across benchmarks.
</div>

---
class: fill
---

# For more than 85% of tasks, nothing is detectable

<img src="/task_level_outcomes.png" class="w-full mt-2 rounded" style="max-height: 275px; object-fit: contain" />

<div class="mt-2 text-xs opacity-60">
Improved and regressed require a CI excluding zero plus within-family BH correction; indistinguishable does not mean exactly unchanged.
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Significant improvements occur on 7.0–8.6% of tasks; significant regressions on 5.3–7.8%. Both tails are small, and neither is negligible.
</div>

---
class: fill
---

# The sparse, two-sided pattern appears everywhere

<div class="mt-3 mx-auto text-sm" style="max-width: 900px">

| Method | Terminal-Bench | FrontierCS | DeepSWE | APEX-Agents |
|---|:-:|:-:|:-:|:-:|
| Meta-Harness | 4 / 50 / 5 (59) | 3 / 34 / 3 (40) | 5 / 64 / 6 (75) | 25 / 309 / 26 (360) |
| AHE | 5 / 50 / 4 (59) | 3 / 34 / 3 (40) | 6 / 64 / 5 (75) | 29 / 308 / 23 (360) |
| Retro Harness | 5 / 51 / 3 (59) | 3 / 35 / 2 (40) | 7 / 64 / 4 (75) | 33 / 306 / 21 (360) |

</div>

<div class="mt-2 text-xs opacity-60">
Each cell is significant improvement / indistinguishable / significant regression; held-out task count in parentheses.
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The optimized harness is not a broad upgrade. It helps a few tasks, hurts a few tasks, and cannot be distinguished from its seed on the rest.
</div>

---
class: fill
---

# Hypothesis: search is optimizing noise

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### How candidates are produced

- The optimizer reads traces from train or evaluation tasks
- It rewrites prompts, tools, memory, or control logic
- The same noisy point estimate becomes its reward

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What this predicts

- Lucky candidates are promoted as improvements
- A repeat-run evaluator should reject those false positives
- Truly better candidates should still survive

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Test the hypothesis by changing only the search-time evaluator: require every proposed harness to be consistently, significantly better.
</div>

---
class: fill
---

# A robust search evaluator accepts 0 of 10 candidates

<img src="/metaharness_tb_iteration_ci.png" class="w-full mt-2 rounded" style="max-height: 285px; object-fit: contain" />

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Meta-Harness on Terminal-Bench: 6/10 candidates have positive point estimates; 0/10 have a familywise 95% lower bound above zero; 0 are promoted.
</div>

---
class: fill
---

# Robust evaluation exposes a generation bottleneck

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What the robust evaluator fixed

- It stopped rewarding favorable execution noise
- It prevented unstable candidates from replacing the seed
- It made the promotion decision trustworthy

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What it could not supply

- A candidate whose improvement repeats across runs
- Evidence that reliable candidates were frequent but filtered badly
- A generally better harness within the tested 10-round budget

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Noise-aware evaluation is necessary, but not sufficient. The deeper question is where any real harness gain comes from.
</div>

---
class: fill
---

# Task-level gains reveal three kinds of harness edits

<div class="grid grid-cols-3 gap-3 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · Compatibility repair

- Fix tool, shell, state, or environment contracts
- Remove failures that block capability the model already has

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 2 · Context offloading

- Move long context into a short ReAct loop
- Use a subagent as a tool to reduce attention rot

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### 3 · Directive guidance

- Add instructions that point toward a presumed answer region
- Try to change the model's downstream reasoning policy

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The key distinction is whether a patch restores access to existing capability or teaches a generally better behavior.
</div>

---
class: fill
---

# Significant wins come from infrastructure, not advice

<div class="mt-3 mx-auto text-sm" style="max-width: 780px">

| Patch mechanism | Patches | Exposures | Sig. better | Sig. worse |
|---|---:|---:|---:|---:|
| Compatibility / bug repair | 43 | 260 | 19 (7.3%) | 3 (1.2%) |
| Context offloading | 31 | 190 | 5 (2.6%) | 4 (2.1%) |
| Directive guidance | 46 | 220 | 0 (0.0%) | 28 (12.7%) |
| **Total** | **120** | **670** | **24 (3.6%)** | **35 (5.2%)** |

</div>

<div class="mt-2 text-xs opacity-60">
Held-out patch–task exposures over all candidates. Labels are blind to outcomes (κ = 0.82); compound patches are not causally ablated.
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Compatibility repair contributes 19 of 24 significant wins; context offloading contributes 5. Directive guidance contributes 0 wins and 28 regressions.
</div>

---
class: fill
---

# Case study: one shell fix unlocks two tasks

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Meta-Harness patch

- `persistent_shell_note` fixes persistent-shell behavior
- Baseline shell-death `RuntimeError`s: **14**
- Patched shell-death `RuntimeError`s: **0**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Where the gain appears

- `compile-compcert`: **+71.8 pp**, CI [+30.2, +90.4]
- `build-cython-ext`: **+52.7 pp**, CI [+9.1, +79.3]
- These two tasks contribute ~90% of the aggregate point gain

</div>
</div>

<div class="mt-3 p-3 bg-purple-50 rounded border border-purple-200 text-sm text-center">
Terminal-Bench aggregate: <strong>+3.18 pp</strong> · 95% CI <strong>[−1.22, +7.79]</strong> · <em>p</em> = .155
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The patch removes a local compatibility failure; it does not establish general capability improvement. This is a candidate-level case, not a verdict on the whole method.
</div>

---
class: fill
---

# Direct guidance fits source tasks, not new tasks

<div class="mt-3 mx-auto text-sm" style="max-width: 850px">

| Evaluation tasks | Sig. better | Indistinguishable | Sig. worse |
|---|---:|---:|---:|
| Source tasks used to write the guidance | 16/46 (34.8%) | 28/46 (60.9%) | 2/46 (4.3%) |
| Disjoint held-out task exposures | 0/220 (0.0%) | 192/220 (87.3%) | 28/220 (12.7%) |

</div>

<div class="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-sm">

- 37 of 46 directives restate a source-specific action or solution region
- The optimizer turns a high-reward trajectory into a reusable-looking instruction

</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The optimizer does attempt directive guidance. It simply does not write guidance that transfers: 0 significant held-out wins, 28 regressions.
</div>

---
class: fill
---

# A winning trace can become harmful advice

<div class="grid grid-cols-2 gap-3 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · Observe a high-reward trace

Inspect a failing service unit, edit its launch command, restart the daemon.

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### 2 · Rewrite it as a rule

*“For service failures, inspect the unit and restart the daemon before deeper diagnosis.”*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 3 · Replay the source task

The rule skips an unproductive branch, so the same task scores higher.

</div>
<div class="p-3 bg-red-50 rounded border border-red-200">

### 4 · Apply it to a new task

The real cause is certificate permissions; repeated restarts waste the run.

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This is behavior-level overfitting: the prompt memorizes a successful path, not a general decision rule.
</div>

---
class: fill closing
---

# Harness optimization gains come from tools and interfaces—<br>not better instructions and reasoning

<div class="mt-1 text-xs opacity-60">
Related finding: VeRO reports tool-use gains but almost no improvement on reasoning-heavy benchmarks. <a href="https://labs.scale.com/blog/vero">Scale Labs, 2026</a>
</div>

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What the evidence says

- Single-run gains are smaller than ordinary execution variance
- Only 1 of 12 benchmark comparisons is reliable
- More than 85% of task outcomes are statistically indistinguishable
- Real wins concentrate in compatibility repair and context offloading

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What should change

- Evaluate candidates with repeated runs and confidence intervals
- Optimize verifiable contracts, state transitions, and context interfaces
- Report significant regressions alongside improvements
- Require transfer before calling a prompt rewrite better

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Under the tested methods and budgets, a base model does not reliably write a generally better harness for itself; it mostly repairs access to capability it already had.
</div>
