---
theme: default
title: "ALPHA - Intervention over a Production Harness"
info: "Progress update - July 8, 2026"
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
.pos { color: #047857; font-weight: 700; }
.neg { color: #b91c1c; font-weight: 700; }
.neu { color: #475569; font-weight: 700; }
.card {
  padding: 1.0rem;
  border-radius: 8px;
  border: 1px solid;
  min-height: 9.2rem;
}
.blue { background: #eff6ff; border-color: #bfdbfe; }
.green { background: #ecfdf5; border-color: #a7f3d0; }
.purple { background: #f5f3ff; border-color: #ddd6fe; }
.amber { background: #fffbeb; border-color: #fde68a; }
.slate { background: #f8fafc; border-color: #cbd5e1; }
.metric { font-size: 1.9rem; font-weight: 750; letter-spacing: 0; }
.metric-label { font-size: 0.72rem; opacity: 0.68; text-transform: uppercase; letter-spacing: 0.02em; }
.source { font-size: 0.67rem; opacity: 0.58; margin-top: 0.5rem; line-height: 1.25; }
</style>

# ALPHA

## Intervention over a production-level coding harness

<div class="mt-6 text-base opacity-80">
Where related work stops short — and the three challenges we solved to go further
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu | UT Austin | July 8, 2026
</div>

---
class: fill
---

# Related work has two blind spots

<div class="grid grid-cols-2 gap-4 mt-4">
<div class="card blue">

### 1 · Never the whole harness

- Surface-only edits on real harnesses — Skills, `AGENTS.md` (Codex, Claude Code)
- …or optimize a *toy* re-implementation (meta-harness)
- Nobody intervenes **inside** a production-grade harness

</div>
<div class="card green">

### 2 · A tiny benchmark set

- Almost all on TerminalBench · SWE-bench Pro · GAIA
- Base models already trained to death on them
- pass@k alone lifts a lot → a "trial" ≈ re-summarizing pass@(k−1)

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
The gains end up <b>shallow</b> (surface or toy) and <b>easy</b> (saturated benchmarks). We want deep + hard.
</div>

---
class: fill
---

# Why nobody did it: three challenges

<div class="grid grid-cols-3 gap-4 mt-5">
<div class="card blue">
<div class="metric-label">Challenge 1</div>

### Many benchmarks, many runners

Every eval framework starts agents its own way

</div>
<div class="card green">
<div class="metric-label">Challenge 2</div>

### Which open baseline harness to improve?

Codex is open, but it's Rust — unreadable

</div>
<div class="card purple">
<div class="metric-label">Challenge 3</div>

### Offline → online, on any harness

Prior work edits offline; we intervene live

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Each has a concrete answer — a <b>CLI waist</b> · <b>OpenHands SDK</b> · a <b>streaming brain/task protocol</b>.
</div>

---
class: fill
---

# Challenge 1 — every benchmark has its own runner

<div class="grid grid-cols-2 gap-4 mt-4">
<div class="card blue">

### The problem

- Each eval framework launches agents differently
- The "safe" few (TB / SWE-bench Pro / GAIA) are just the ones with a uniform local-Docker runner
- More benchmarks = N bespoke integrations

</div>
<div class="card green">

### Answer — make the CLI the interface

- Ship the method as one CLI: `alpha --execute` / `alpha --print`
- Same semantics as the `codex` / `claude` CLIs
- Every eval framework already drives those → instant compatibility

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
One stable CLI ⇒ the method plugs into any framework that already knows how to run an agent CLI.
</div>

---
class: fill
---

# Challenge 2 — what harness do we even improve on?

<div class="grid grid-cols-3 gap-4 mt-4">
<div class="card blue">
<div class="metric-label">Requirement 1</div>

### Readable (Python)

Rules out Codex (TS→Rust, black-box). We want to *understand* the harness, not just fuzz it.

</div>
<div class="card green">
<div class="metric-label">Requirement 2</div>

### Perf ≈ Codex / Claude Code

A real baseline, not a toy harness.

</div>
<div class="card purple">
<div class="metric-label">Requirement 3</div>

### Real impact

People actually use it → genuinely production-level.

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
<b>Answer: OpenHands SDK</b> — Python · 80K+ GitHub stars · benchmark-competitive with GPT &amp; Claude.
</div>

---
class: fill
---

<img src="/newplot.png" class="absolute top-0 left-0 w-full h-full object-contain bg-white" />

---
class: fill
---

# Challenge 3 — go online, on any harness

<div class="grid grid-cols-2 gap-4 mt-4">
<div class="card green">

### Open harness — in-process

- Streaming output = a Python **return object**
- Control = in-process calls
- e.g. OpenHands SDK

</div>
<div class="card amber">

### Close harness — CLI + files

- Streaming output = **raw JSON rollout file**
- Control = process handle: stop `codex exec` / `claude -p`, then `codex/claude resume`
- e.g. Codex, Claude Code

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
One abstraction covers both: a <b>Task Agent</b> that streams, and a <b>Brain Agent</b> that can stop · resume · rewind it.
</div>

---
class: fill
---

# The protocol: Brain Agent ↔ Task Agent

<img src="/aip.svg" class="mx-auto mt-2" style="max-height: 78%; max-width: 100%;" />

<div class="source">Agent Intervention Protocol — OBSERVE (task → brain, streaming → ATIF Steps) + CONTROL (brain → task, stop/resume/rewind); same seam whether the runtime is in-process or CLI+files.</div>

---
class: fill
---

# Deliverable & where we are

<div class="grid grid-cols-2 gap-4 mt-4">
<div class="card blue">

### The shape

- Runtimes: open (OpenHands) · close (Codex, Claude Code)
- One-click: `pipx install "alpha[openhands|codex|claude]"`
- Eval through a CLI adapter → method ⟂ eval framework (decoupled)

</div>
<div class="card green">

### Progress

- ✅ OpenHands runtime CLI done — `pipx install "alpha[openhands]"`
- Smoke stable (FrontierCS p2): plain <span class="neu">0.3634 ± 0.1409</span> → alpha <span class="pos">0.6926 ± 0.0104</span>
- Sanity: openhands+gpt vs codex+gpt comparable — avg 0.61 vs 0.63; <b>95% of problems tie, 5% worse</b>

</div>
</div>

<div class="mt-5 p-3 amber rounded-lg text-sm">
Method decoupled from framework; open runtime shipped and stable; close runtimes next.
</div>
