---
theme: default
title: "ALPHA — Directive vs Corrective Principles, and what worked on P0"
info: "Progress update · June 2026"
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
.slidev-layout.fill h1 { font-size: 2.0rem; line-height: 1.15; margin-bottom: 0.5rem; }
.slidev-layout.fill h3 { font-size: 1.3rem; margin: 0 0 0.5rem; }
.slidev-layout.fill p  { line-height: 1.5; margin: 0.4rem 0; font-size: 1.15rem; }
.slidev-layout.fill li { line-height: 1.5; margin: 0.45rem 0; font-size: 1.15rem; }
.slidev-layout.fill ul { padding-left: 1.1rem; }
</style>

# ALPHA

## Directive vs **Corrective** Principles — what worked on **P0**

<div class="mt-6 text-base opacity-80">
Progress update · two ways a principle can steer an agent's behavior
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · June 2026
</div>

---
class: fill
---

# Recap ① · Agents repeat the same failures

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The setting

- Hours-long, unattended, one task
- Edits code, calls the evaluator
- Returns its best submission

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### What goes wrong

- Plateaus → keeps tuning constants
- Retries the same failed idea
- Sees feedback, doesn't act

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Memory records, skills compress — neither <strong>governs</strong> what comes next.
</div>

---
class: fill
---

# Recap ② · Passive memory & skills, active principles

<div class="grid grid-cols-3 gap-4 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Memory · *passive*

Past notes → prompt.

Agent may **ignore** it.

</div>
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Skills · *passive*

Distilled into the prompt.

Agent may **ignore** it.

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Principles · *active*

A rule with a *when*.

**Changes** the next action.

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Passive = context the agent can ignore · active = a rule that <strong>governs</strong> the action.
</div>

---
class: fill
---

# Recap ③ · The evaluation setup

<div class="grid grid-cols-3 gap-4 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Baselines

Trajectory memory

Trace2Skill

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Environment

Harbor — docker runner

mini-SWE-agent · `gpt-5.4`

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### Benchmark

FrontierCS

Open-ended, continuous score

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
This week: measured against the <strong>plain baseline</strong>.
</div>

---
class: fill
---

# P0 — our testbed, and the failure we target

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 11rem">
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### The task — P0

- Pack pieces into a rectangle
- Score = packing **density** (continuous)

</div>
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The failure

- Plain agent stops at the **first valid** layout
- Loose ~0.45 · reference ~0.93

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
We verify <strong>two ways</strong> a principle changes this behavior — prevent it, or correct it.
</div>

---
class: fill
---

# Way 1 · upfront directive — prevent the failure

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The directive — upfront

- In the prompt from turn 0, like skill metadata
- *"Don't stop at valid — keep improving the score; check density before submitting."*

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Across runs on P0

- **Best** single run **0.70** — the ceiling, not the norm
- **Average** only **~0.47** (baseline ~0.44): ~1/3 fail — overlap → 0

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
A directive is <strong>sometimes ignored</strong> → no lift. That is why we also need correction.
</div>

---
class: fill
---

# Way 2 · corrective at the failure — fix the behavior

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The corrective — at the failure

- Injected when it settles for a loose layout
- *"A valid-but-loose packing wastes the score — measure density and keep tightening."*

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Effect on P0

- Measures the objective in **every run** (6/24 → 24/24)
- **Mean** reward over runs: **0.37 → 0.57**

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Correction catches the runs a directive missed — fired exactly when the failure shows.
</div>

---
class: fill
---

# Next — assemble the two capabilities

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 11rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Verified

- Directive **prevents** (when followed); corrective **catches** the rest
- Both change behavior & beat the baseline on P0

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Next step

- One ALPHA agent, both principles on
- Prove the **same** principles transfer

</div>
</div>

<div class="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-base text-center">
Two capabilities, one agent — <strong>prevent</strong> what we can, <strong>correct</strong> the rest.
</div>
