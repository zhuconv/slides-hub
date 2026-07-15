---
theme: default
title: "ALPHA - Do Agent Improvements Transfer?"
info: "Progress update - July 15, 2026"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
:root {
  --ink: #172033;
  --muted: #667085;
  --line: #d9e0ea;
  --blue: #2563eb;
  --blue-soft: #eff6ff;
  --green: #047857;
  --green-soft: #ecfdf5;
  --amber: #b45309;
  --amber-soft: #fffbeb;
  --purple: #6d28d9;
  --purple-soft: #f5f3ff;
  --slate-soft: #f8fafc;
}

.slidev-layout {
  color: var(--ink);
}

.slidev-layout.fill {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.2rem 3rem;
}

.slidev-layout.fill h1 {
  font-size: 1.95rem;
  line-height: 1.16;
  letter-spacing: -0.025em;
  margin: 0 0 0.55rem;
}

.slidev-layout.fill h2 {
  font-size: 1.25rem;
  line-height: 1.25;
}

.slidev-layout.fill h3 {
  font-size: 1.08rem;
  line-height: 1.25;
  margin: 0 0 0.35rem;
}

.slidev-layout.fill p,
.slidev-layout.fill li {
  font-size: 0.94rem;
  line-height: 1.42;
}

.slidev-layout.fill li {
  margin: 0.23rem 0;
}

.slidev-layout.fill ul {
  padding-left: 1.1rem;
}

.eyebrow {
  color: var(--blue);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  margin-bottom: 0.45rem;
}

.lede {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.45;
  max-width: 46rem;
}

.rule {
  height: 1px;
  background: var(--line);
  margin: 0.8rem 0 1rem;
}

.section-number {
  font-size: 3.5rem;
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.06em;
  color: #dbeafe;
}

.claim {
  font-size: 1.18rem;
  line-height: 1.35;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.soft-blue { background: var(--blue-soft); }
.soft-green { background: var(--green-soft); }
.soft-amber { background: var(--amber-soft); }
.soft-purple { background: var(--purple-soft); }
.soft-slate { background: var(--slate-soft); }

.panel {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1rem 1.1rem;
}

.story-half {
  padding: 0.25rem 1.2rem 0.4rem 0;
}

.story-half + .story-half {
  border-left: 1px solid var(--line);
  padding-left: 1.5rem;
}

.step-row {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 1rem;
  align-items: start;
  padding: 0.9rem 0;
  border-top: 1px solid var(--line);
}

.step-row:first-child { border-top: 0; }

.step-dot {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--blue);
  font-weight: 800;
}

.flow {
  display: flex;
  align-items: stretch;
  gap: 0.55rem;
}

.flow-node {
  flex: 1;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 0.8rem 0.9rem;
  background: white;
}

.flow-arrow {
  display: flex;
  align-items: center;
  color: #94a3b8;
  font-size: 1.5rem;
  font-weight: 700;
}

.metric {
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.035em;
}

.result-canvas {
  height: 18.3rem;
  margin-top: 1rem;
  border: 1.5px dashed #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 0.85rem;
}

.stat-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.78rem 0.9rem;
  background: white;
}

.stat-label {
  color: var(--muted);
  font-size: 0.72rem;
  line-height: 1.25;
  margin-top: 0.18rem;
}

.candidate-row {
  display: grid;
  grid-template-columns: 1.45fr 0.72fr 0.58fr;
  gap: 0.45rem;
  align-items: center;
  padding: 0.72rem 0;
  border-top: 1px solid var(--line);
  font-size: 0.78rem;
}

.candidate-row:first-of-type {
  border-top: 0;
}

.candidate-row b {
  color: var(--ink);
  white-space: nowrap;
}

.evidence-ci {
  margin-top: 0.55rem;
  padding: 0.48rem 0.62rem;
  border-left: 4px solid var(--amber);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.82);
}

.evidence-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.evidence-mini {
  padding: 0.42rem 0.58rem;
  border: 1px solid #ddd6fe;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.7);
}

.evidence-value {
  font-size: 1.08rem;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.evidence-label {
  color: var(--muted);
  font-size: 0.66rem;
  line-height: 1.2;
  margin-top: 0.18rem;
}

.split-table table,
.matrix-table table {
  width: 100%;
  font-size: 0.78rem;
}

.split-table th,
.split-table td,
.matrix-table th,
.matrix-table td {
  padding: 0.55rem 0.65rem;
  vertical-align: top;
}

.split-table th,
.matrix-table th {
  color: #344054;
  background: #f8fafc;
}

.split-table td:first-child,
.matrix-table td:first-child {
  font-weight: 750;
  white-space: nowrap;
}

.bench-row {
  display: grid;
  grid-template-columns: 8.5rem 1fr 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.72rem 0;
  border-top: 1px solid var(--line);
}

.bench-row:first-child { border-top: 0; }

.bench-name {
  font-weight: 800;
  letter-spacing: -0.01em;
}

.bench-axis {
  color: var(--blue);
  font-weight: 750;
}

.principle-core {
  border-left: 5px solid var(--purple);
  padding: 0.85rem 1.2rem;
  background: var(--purple-soft);
  border-radius: 0 9px 9px 0;
}

.runtime-loop {
  display: grid;
  grid-template-columns: 1fr 1.25rem 1fr 1.25rem 1fr;
  gap: 0.35rem;
  align-items: stretch;
}

.runtime-node {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.85rem;
  background: white;
}

.runtime-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 1.25rem;
}

.source {
  color: var(--muted);
  font-size: 0.64rem;
  line-height: 1.28;
  margin-top: 0.55rem;
}

.takeaway {
  margin-top: 1rem;
  padding: 0.72rem 0.95rem;
  border-radius: 8px;
  background: var(--amber-soft);
  border: 1px solid #fde68a;
  font-size: 0.88rem;
  line-height: 1.35;
}

.check { color: var(--green); font-weight: 800; }
.pending { color: var(--amber); font-weight: 750; }
.muted { color: var(--muted); }
</style>

# ALPHA

## Do Agent Improvements Transfer?

<div class="mt-6 text-base opacity-80">
paper draft &amp; full experiment matrix
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | July 15, 2026
</div>

---
class: fill
---

<div class="eyebrow">This week</div>

# We turned prior findings into a paper argument

<div class="mt-4 max-w-3xl mx-auto">

<div class="step-row">
  <div class="step-dot">1</div>
  <div>
    <h3>Revisited what the existing results actually establish</h3>
    <p class="muted">The goal was to separate robust evidence from observations that still need a stronger evaluation.</p>
  </div>
</div>

<div class="step-row">
  <div class="step-dot">2</div>
  <div>
    <h3>Drafted the Overleaf Introduction</h3>
    <p class="muted">The opening now centers the paper on transfer, rather than presenting ALPHA as only another harness intervention.</p>
  </div>
</div>

<div class="step-row">
  <div class="step-dot">3</div>
  <div>
    <h3>Built the Experiments tables</h3>
    <p class="muted">The table structure makes the benchmark × method comparison — and the missing evidence — explicit.</p>
  </div>
</div>

</div>

<div class="takeaway">The synthesis exposed a sharper story: we need to repair both the <b>evaluation of transfer</b> and the <b>mechanism that enables it</b>.</div>

---
class: fill
---

<div class="eyebrow">The story</div>

# The paper needs to earn two claims

<div class="grid grid-cols-2 gap-0 mt-5">

<div class="story-half">
  <div class="section-number">01</div>
  <h2>Prior evaluation can mistake proximity for transfer</h2>
  <p class="muted mt-3">If train and test share the repository, company world, target system, or answer-bearing family, a gain may reflect adaptation to nearby tasks.</p>
  <p class="claim mt-4">We need benchmark-specific OOD splits that hold out the context-bearing unit.</p>
</div>

<div class="story-half">
  <div class="section-number">02</div>
  <h2>ALPHA needs a mechanism that explains transfer</h2>
  <p class="muted mt-3">Transferable principles abstract beyond individual tasks — but principles are easy for an agent to ignore once execution begins.</p>
  <p class="claim mt-4">We need runtime verification and control to keep principles operative.</p>
</div>

</div>

<div class="takeaway">A stronger split makes the question credible; runtime verify &amp; control makes our answer plausible.</div>

---
class: fill
---

<div class="eyebrow">Baseline evidence · held-out FrontierCS</div>

# MetaHarness on held-out FrontierCS

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">

<div class="panel soft-blue">

### Method 1 - prompt evolution

<div class="text-xs muted mb-1">20 OOD problems · 160 runs</div>

<div class="candidate-row">
  <span>iterate_to_plateau</span><b>Δ = -0.019</b><span>p = 0.58</span>
</div>
<div class="candidate-row">
  <span>anytime_deadline_loop</span><b>Δ = -0.039</b><span>p = 0.49</span>
</div>

</div>

<div class="panel soft-purple">

### Method 2 - agent-loop evolution

<div class="text-xs muted mb-1">plateau_diversify · 20 OOD problems · 320 runs</div>

<div class="mt-2 text-sm muted">paired Δ = <b>+0.018</b></div>

<div class="evidence-ci">
  <div class="evidence-value">[-0.021, +0.064]</div>
  <div class="evidence-label">95% CI crosses 0</div>
</div>

<div class="evidence-pair">
  <div class="evidence-mini">
    <div class="evidence-value">0.450</div>
    <div class="evidence-label">two-sided p</div>
  </div>
  <div class="evidence-mini">
    <div class="evidence-value">9 / 9 / 2</div>
    <div class="evidence-label">win / loss / tie</div>
  </div>
</div>

</div>

</div>

<div class="takeaway"><b>Nudge-triggered runs:</b> 95/160 (59%); within those runs, Δ = +0.0015 vs. baseline.</div>

---
class: fill
---

<div class="eyebrow">Baseline evidence · paired FrontierCS evaluation</div>

# Trace2Skill on FrontierCS

<div class="result-grid">

<div class="stat-card soft-blue">
  <div class="metric">-0.009</div>
  <div class="stat-label">paired Δ</div>
</div>

<div class="stat-card soft-purple">
  <div class="metric">0.43</div>
  <div class="stat-label">permutation p</div>
</div>

<div class="stat-card soft-slate">
  <div class="metric">20 / 22 / 28</div>
  <div class="stat-label">positive / negative / tie</div>
</div>

<div class="stat-card soft-amber">
  <div class="metric">66 / 70</div>
  <div class="stat-label">per-problem CIs crossing zero (94%)</div>
</div>

</div>

<div class="takeaway"><b>Evaluation scale:</b> 70 problems × 8 trials per arm = 1,120 total rollouts.</div>

---
class: fill
---

<div class="eyebrow">Evaluation contract</div>

# Each benchmark holds out a different context

<div class="mt-3">

<div class="bench-row">
  <div class="bench-name">DeepSWE</div>
  <div><span class="bench-axis">Repository</span><br><span class="muted text-sm">Every issue from one repo stays on one side.</span></div>
  <div class="text-sm"><b>Train:</b> 90 tasks · 73 repos<br><b>Test:</b> 23 tasks · 18 unseen repos</div>
</div>

<div class="bench-row">
  <div class="bench-name">YC-Bench</div>
  <div><span class="bench-axis">Company world</span><br><span class="muted text-sm">One full workforce × clients × market configuration.</span></div>
  <div class="text-sm"><b>Train:</b> 15 tasks · 5 worlds<br><b>Test:</b> 12 tasks · 4 held-out worlds</div>
</div>

<div class="bench-row">
  <div class="bench-name">Terminal-Bench</div>
  <div><span class="bench-axis">Target lineage / instance</span><br><span class="muted text-sm">Hold out targets; preserve workflow support.</span></div>
  <div class="text-sm"><b>Train:</b> 70 tasks<br><b>Test:</b> 19 tasks · 18 held-out targets</div>
</div>

</div>

<div class="takeaway">OOD is not a random 80/20 split: hold out the context-bearing unit, then freeze before test.</div>

<div class="source">Terminal-Bench is workflow-supported target-instance holdout, not workflow-OOD; 17 of 18 test target groups are single-task groups.</div>

---
class: fill
---

<div class="eyebrow">Part II · Mechanism</div>

# Transferable principles are the bridge

<p class="lede">Task artifacts are specific. A principle keeps the reusable decision rule while discarding names, paths, and answer-bearing details.</p>

<div class="flow mt-6">
  <div class="flow-node soft-slate">
    <h3>Trigger</h3>
    <p class="muted">Recognize a recurring failure situation.</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node soft-purple">
    <h3>Obligation</h3>
    <p class="muted">Apply a reusable decision or workflow rule.</p>
  </div>
  <div class="flow-arrow">→</div>
  <div class="flow-node soft-green">
    <h3>Evidence</h3>
    <p class="muted">Check whether execution actually follows it.</p>
  </div>
</div>

<div class="principle-core mt-6">
  <div class="claim">The transferable object is not a solved task; it is a compact rule for acting in a new task.</div>
</div>

<div class="takeaway">That abstraction is the product claim: one principle store should improve behavior beyond the traces and targets it came from.</div>

---
class: fill
---

<div class="eyebrow">The missing mechanism</div>

# But availability does not guarantee execution

<div class="grid grid-cols-2 gap-7 mt-5">

<div>
  <h2>At the start of a run</h2>
  <div class="panel soft-slate mt-3">
    <div class="metric">Principle exposed</div>
    <p class="muted mt-2">The agent can retrieve or read the relevant guidance.</p>
  </div>
  <div class="mt-4 text-center text-2xl muted">↓</div>
  <p class="text-center muted">Immediate task cues take over</p>
</div>

<div>
  <h2>During execution</h2>
  <div class="panel soft-amber mt-3">
    <div class="metric">Principle ignored</div>
    <p class="muted mt-2">A locally plausible plan can quietly violate the transferable rule.</p>
  </div>
  <div class="mt-4 text-center text-2xl muted">↓</div>
  <p class="text-center muted">The mistake compounds across later steps</p>
</div>

</div>

<div class="takeaway"><b>Retrieval makes principles available.</b> Runtime verification and control make them operational.</div>

---
class: fill
---

<div class="eyebrow">ALPHA</div>

# One principle store drives both phases

<div class="grid grid-cols-2 gap-6 mt-4">

<div class="panel soft-blue">
  <h2>Direction · before and during the task</h2>
  <p class="muted">Expose principles through the runtime's native skills channel.</p>
  <ul>
    <li><b>Menu:</b> descriptions up front; bodies pulled on demand</li>
    <li><b>Full:</b> all principle bodies supplied from turn 0</li>
  </ul>
</div>

<div class="panel soft-green">
  <h2>Correction · online supervision</h2>
  <p class="muted">Observe the live trajectory, assess compliance, then intervene.</p>
  <ul>
    <li><b>STEER:</b> redirect the current trajectory</li>
    <li><b>REWIND:</b> restore state before the bad commitment</li>
  </ul>
</div>

</div>

<div class="runtime-loop mt-6">
  <div class="runtime-node soft-slate"><b>Task agent</b><br><span class="muted text-sm">acts in the benchmark</span></div>
  <div class="runtime-arrow">→</div>
  <div class="runtime-node soft-purple"><b>OBSERVE + VERIFY</b><br><span class="muted text-sm">stream steps to the brain</span></div>
  <div class="runtime-arrow">→</div>
  <div class="runtime-node soft-green"><b>CONTROL</b><br><span class="muted text-sm">continue · steer · rewind</span></div>
</div>

<div class="takeaway">The method is not “prompt the agent with a lesson.” It is <b>principles + a runtime that verifies and enforces them</b>.</div>

<div class="source">Method surface: Direction + Correction over one principle store; docs/architecture/method-definition.md.</div>

---
class: fill
---

<div class="eyebrow">Next step</div>

# Run the four-benchmark transfer matrix

<div class="matrix-table mt-3">

| Benchmark | OOD contract | ALPHA | MetaHarness | RETRO | Trace2Skill | Plain harness |
|---|---|:---:|:---:|:---:|:---:|:---:|
| FrontierCS | <span class="pending">freeze split first</span> | ✓ | ✓ | ✓ | ✓ | ✓ |
| DeepSWE v1.1 | unseen repository | ✓ | ✓ | ✓ | ✓ | ✓ |
| Terminal-Bench 2.1 | workflow-supported target holdout | ✓ | ✓ | ✓ | ✓ | ✓ |
| YC-Bench | held-out company world | ✓ | ✓ | ✓ | ✓ | ✓ |

</div>

<div class="mt-5 grid grid-cols-3 gap-5">
  <div><div class="metric">1</div><div class="muted text-sm">Freeze method and principle store before test</div></div>
  <div><div class="metric">2</div><div class="muted text-sm">Use the same model, scaffold, budget, and repeated-trial protocol</div></div>
  <div><div class="metric">3</div><div class="muted text-sm">Report paired deltas on held-out units — not only aggregate pass rate</div></div>
</div>

<div class="principle-core mt-6">
  <div class="claim">If ALPHA improves across these held-out contexts, the paper can claim transfer — not benchmark-specific optimization.</div>
</div>
