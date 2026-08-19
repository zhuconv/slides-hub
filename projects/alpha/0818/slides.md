---
theme: default
title: "ALPHA - Can Harness Optimization Improve Agents?"
info: "Wrap-up: generalizable gains versus evaluation noise — August 18, 2026"
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
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact table { font-size: 0.78em !important; }
.slidev-layout.compact table td, .slidev-layout.compact table th { padding: 0.12em 0.5em !important; }
</style>

# Can Harness Optimization<br>Improve Agents?

<div class="mt-6 text-base opacity-80">
Do the reported gains survive repeated runs? — project wrap-up
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · Aug 18, 2026
</div>

---
class: fill
---

# What we set out to test

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### The promise

- Optimizers rewrite prompts, tools, memory, and control logic from traces and reward
- Meta-Harness, AHE, and Retro Harness all report point-estimate gains
- No weight updates — the agent improves its own runtime

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### The assumption we question

- That reward is precise enough to identify an improvement
- Agent runs are stochastic with model, task, harness, and budget fixed
- None of the three makes uncertainty a condition for accepting a candidate

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Search then selects for useful edits <em>and</em> for favorable execution noise. A positive point estimate is not evidence that a candidate beats its seed.
</div>

---
class: fill
---

# Run everything ten times, then compare

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Measurement design

- 3 optimizers × 4 benchmarks: Terminal-Bench, FrontierCS, DeepSWE, APEX-Agents
- Each optimized harness paired against its own seed, matched model, image, verifier, budget
- ~10 fresh runs per arm per task; harness content-hashed before held-out execution

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Decision rule

- Difference taken within task first, then averaged over tasks
- Hierarchical bootstrap 95% CI: resample tasks, then runs
- Reliable = lower bound above zero *and* Holm-significant across all 12 comparisons

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Uncertainty is treated as part of the optimization problem, not as error bars added to a finished plot.
</div>

---
class: fill
---

# The noise is bigger than any effect we're chasing

<img src="/run_to_run_variance.png" class="w-full mt-2 rounded" style="max-height: 300px; object-fit: contain" />

<div class="mt-2 text-xs opacity-60">
Left: dots are the median within-task SD, whiskers the interquartile range over tasks.
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Median within-task reward SD is 14–23 pp with everything held fixed, and 33–41% of single-run comparisons disagree in <em>sign</em> with the repeated-run estimate.
</div>

---
class: compact
---

# Only 1 of 12 results survives its error bars

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
Eight cells have a positive point estimate. One has a lower bound above zero. The comparison that matters is 1 versus 11, not 8 versus 4.
</div>

---
class: fill
---

# What this does and doesn't prove

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Supported

- Only Retro Harness on Terminal-Bench survives multiplicity control
- A single execution could have made several other cells look like gains
- Optimizer-selected point estimates are especially vulnerable to execution noise

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Not claimed

- Absence of reliable evidence is not proof of zero effect
- 9 of 11 non-reliable intervals sit inside the ±5 pp band; two stay under-resolved
- The reliable cell's +0.8 lower bound does not establish a 5 pp effect

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The audit narrows what current evidence supports. It does not close the question.
</div>

---
class: fill
---

# Few tasks improve, about as many get worse

<img src="/task_level_outcomes.png" class="w-full mt-2 rounded" style="max-height: 275px; object-fit: contain" />

<div class="mt-2 text-xs opacity-60">
Improved / regressed require a CI excluding zero plus within-family BH correction; indistinguishable does not mean unchanged.
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Macro-averaged over benchmarks: 7.0–8.6% of method–task comparisons significantly improve, 5.3–7.8% significantly regress, and over 85% are indistinguishable.
</div>

---
class: fill
---

# Same pattern in every method and benchmark

<div class="mt-3 mx-auto text-sm" style="max-width: 900px">

| Method | Terminal-Bench | FrontierCS | DeepSWE | APEX-Agents |
|---|:-:|:-:|:-:|:-:|
| Meta-Harness | 4 / 50 / 5 (59) | 3 / 34 / 3 (40) | 5 / 64 / 6 (75) | 25 / 309 / 26 (360) |
| AHE | 5 / 50 / 4 (59) | 3 / 34 / 3 (40) | 6 / 64 / 5 (75) | 29 / 308 / 23 (360) |
| Retro Harness | 5 / 51 / 3 (59) | 3 / 35 / 2 (40) | 7 / 64 / 4 (75) | 33 / 306 / 21 (360) |

</div>

<div class="mt-2 text-xs opacity-60">
Each cell is improved / indistinguishable / regressed; held-out task count in parentheses. Improved and regressed require a CI excluding zero plus within-family BH correction.
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
An average reward hides the regression tail. Harness evaluation has to report both tails, not one number.
</div>

---
class: fill
---

# Ten rounds, zero candidates accepted

<img src="/metaharness_tb_iteration_ci.png" class="w-full mt-2 rounded" style="max-height: 285px; object-fit: contain" />

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Each candidate is tested against the fixed seed on fresh runs with a pre-allocated α/10 budget. Promotion needs the interval's lower bound above zero, not the point — the incumbent never moves.
</div>

---
class: fill
---

# Fixing the noise did not find a better harness

<div class="mt-2 mx-auto text-sm" style="max-width: 620px">

| Decision threshold | Proposals passing | Promoted |
|---|:-:|:-:|
| Post-hoc sign, mean Δ > 0 | 6 / 10 | n/a |
| Familywise 95% lower bound > 0 | 0 / 10 | 0 / 10 |

</div>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What this does not support

- That certifiable improvements are already frequent among candidates and merely selected badly
- That filtering alone could produce an effect whose interval clears zero

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What stays open

- Budget-qualified: 10 iterations, one candidate each
- A larger generation budget or narrower intervals could change it

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Correcting evaluation noise is necessary for autonomous harness improvement, and not sufficient for it.
</div>

---
class: fill
---

# The wins were bug fixes, not advice

<div class="mt-3 mx-auto text-sm" style="max-width: 780px">

| Patch mechanism | Patches | Exposures | Sig. better | Sig. worse |
|---|---:|---:|---:|---:|
| Compatibility / bug repair | 43 | 260 | 19 (7.3%) | 3 (1.2%) |
| Context offloading | 31 | 190 | 5 (2.6%) | 4 (2.1%) |
| Directive guidance | 46 | 220 | 0 (0.0%) | 28 (12.7%) |
| **Total** | **120** | **670** | **24 (3.6%)** | **35 (5.2%)** |

</div>

<div class="mt-2 text-xs opacity-60">
Held-out patch–task exposures over all candidates — a finer-grained population than slides 7–8, which evaluate each method's final selected harness. Labels blind to outcomes (κ = 0.82); descriptive attribution, compound patches not causally ablated.
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
19 of 24 significant-win associations (79%) are compatibility repair; 5 are context offloading. Directive guidance accounts for none of them, and for 28 of 35 regressions.
</div>

---
class: fill
---

# Advice written from a trace only helps that trace

<div class="mt-3 mx-auto text-sm" style="max-width: 850px">

| Evaluation tasks | Sig. better | Indistinguishable | Sig. worse |
|---|---:|---:|---:|
| Source tasks used to write the guidance | 16/46 (34.8%) | 28/46 (60.9%) | 2/46 (4.3%) |
| Disjoint held-out task exposures | 0/220 (0.0%) | 192/220 (87.3%) | 28/220 (12.7%) |

</div>

<div class="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-sm">

- In blinded coding, 37 of 46 directives restate a source-specific action or solution region
- The instruction is syntactically reusable, but its evidence is a handful of selected trajectories

</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Consistent with overfitting at the level of behavior rather than parameters: fresh replays of the source task improve, held-out exposures show no significant improvement.
</div>

---
class: fill
---

# One way a good trace becomes a bad instruction

<div class="grid grid-cols-2 gap-3 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · High-reward source trace

Inspects a failing service unit, edits its launch command, restarts the daemon.

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### 2 · Generated directive

*"For service failures, inspect the unit definition and restart the daemon before deeper diagnosis."*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 3 · Fresh source replay

Skips the earlier unproductive branch; reward increases significantly.

</div>
<div class="p-3 bg-red-50 rounded border border-red-200">

### 4 · Held-out task

Root cause is certificate permissions. The directive induces repeated restarts — significant regression.

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Outside the source neighborhood a directive can consume context, constrain exploration, or steer toward the wrong solution family.
</div>

---
class: fill
---

# Wrap-up

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What we can say

- Harnesses matter, but only 1 of 12 method–benchmark comparisons is reliable
- Optimizing a noisy point estimate *can* manufacture apparent progress
- Significant patch–task wins concentrate in compatibility repair; guidance showed no held-out transfer

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Where to push next

- Generate over verifiable invariants: tool contracts, state transitions, context interfaces
- Require the lower bound to clear a practical threshold, not just zero
- Allocate repeated runs adaptively; always report the regression tail

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Agents can assist with harness engineering. Under the tested budget we find no reliable general behavioral self-improvement — the objective has to shift from a high-scoring harness <em>instance</em> to a repeatable <em>mechanism</em>.
</div>
