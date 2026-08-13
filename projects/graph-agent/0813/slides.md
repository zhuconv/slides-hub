---
theme: default
title: "Harness Optimization is Asynchronous Human-in-the-Loop (HITL) RL"
info: "How evaluation, hypotheses, and code updates improve an agent harness — August 13, 2026"
class: text-center cover
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
.slidev-layout.fill { display: flex; flex-direction: column; justify-content: center; }
.slidev-layout.fill h1 { margin-bottom: 0.5rem; }
.slidev-layout table td, .slidev-layout table th { padding: 0.25em 0.6em; }
.slidev-layout.cover h1 { font-size: 2.2em !important; line-height: 1.25 !important; }
</style>

# Harness Optimization is Asynchronous<br>Human-in-the-Loop (HITL) RL

<div class="mt-6 text-base opacity-80">
Evaluate agent traces, form a hypothesis, update the harness, and repeat
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · Aug 13, 2026
</div>

---
class: fill
---

# Challenges in Harness Engineering

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · Base models keep changing

- A harness improvement is measured against one model version
- As the model evolves, that improvement may shrink or disappear
- Past verification no longer proves that the gain still holds

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 2 · Final metrics hide the cause

- Long runs contain many traces and engine sessions
- Small behavioral failures accumulate into the final metric
- The metric shows the outcome, but not which behavior caused it

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Harness improvement is hard to trust when updates are not reproducible and agent behavior is not observable.
</div>

---
class: fill
---

# Challenge 1: Model changes invalidate old gains

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### On the original model

- The harness fixes a repeated model failure
- Benchmarks show a clear improvement over the baseline harness
- The result is valid for that model, harness, and evaluation set

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### After the model changes

- The base model may fix the failure itself
- The harness change may become redundant or harmful
- The old benchmark result is now stale evidence

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
A harness gain is always relative to a specific base-model version; model drift creates uncertainty about whether the gain still exists.
</div>

---
class: fill
---

# Make every harness comparison reproducible

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Pin the base model

- Record the exact model version and inference settings
- Self-host the model when long-term version stability is required
- Change one variable at a time: model or harness, not both

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Use composable commits

- Put one harness change in each small commit
- Keep its evaluation configuration and results
- Replay, revert, or combine changes on any model version

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Reproducibility turns an old result into a test we can run again, instead of a claim we can only remember.
</div>

---
class: fill
---

# Challenge 2: Final metrics hide small failures

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What happens inside a run

- Tool errors, malformed outputs, retries, and timeouts
- Context overflow and unstable multi-step behavior
- Minor failures spread across many traces and engine sessions

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What the final metric shows

- It aggregates all of those failures into one number
- It arrives after the full run finishes
- It cannot tell us which behavior should be fixed

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The final metric tells us <b>whether performance changed</b>; it does not tell us <b>why it changed</b>.
</div>

---
class: fill
---

# Add a behavior-trace observability layer

<div class="grid grid-cols-3 gap-3 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · Collect

<ul>
<li>Use one trace schema across engine sessions</li>
<li>Capture tool calls, errors, retries, context, and outcomes</li>
</ul>

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 2 · Evaluate

<ul>
<li>Run stable checks on specific agent behaviors</li>
<li>Let an LLM read traces and mine recurring failure patterns</li>
</ul>

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### 3 · Aggregate

<ul>
<li>Measure pattern frequency across runs</li>
<li>Surface examples before they become a large metric regression</li>
</ul>

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Final metrics evaluate outcomes. Trace-level evaluations explain behavior and point to the next harness change.
</div>

---
class: fill
---

# Together, these pieces define the engineering loop

<div class="flex justify-center">
<img src="/loops.svg" class="mt-2" style="max-height: 340px" />
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Both loops use outcomes from the current system to decide how to update the system next.
</div>

---
class: fill
---

# The parts of the two loops line up

<div class="mt-3 text-sm">

| RL training | Harness optimization |
|---|---|
| Training data | Agent benchmarks or real tasks |
| Model | Harness code: prompts, tools, and workflows |
| Rollouts | Agent traces |
| Reward | Evaluation scores and qualitative feedback |
| Loss | A hypothesis about what should change |
| Optimizer update | A human turns the hypothesis into a code update |

</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The analogy is useful because both systems improve through repeated rollout, evaluation, and update.
</div>

---
class: fill
---

# Harness optimization has no explicit loss

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### RL training

- A predefined loss converts reward into an update signal
- The optimizer computes a parameter update automatically
- The same objective is used throughout training

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Harness optimization

- Evaluations show what worked and what failed
- A human must explain the failure as a hypothesis
- The hypothesis determines the next code update
- The same hypothesis can guide similar harnesses

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
An evaluation tells us <b>how the harness performed</b>; a hypothesis tells us <b>what to change</b>.
</div>

---
class: fill
---

# Every code update must be evaluated

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### RL training runs automatically

- Once data and the optimization algorithm are ready, the loop runs automatically
- Each optimizer step is followed by the next rollout
- Updates are small and guided by the loss

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Harness updates happen at human speed

- A human reviews traces and updates the code when ready
- A code update can change prompts, tools, or the full workflow
- The update may improve, regress, or simply move the failure

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
After every code update, run new rollouts and compare the evaluations. Keep the change only when the evidence supports it.
</div>

---
class: fill
---

# Compare good and bad traces to form hypotheses

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What the human does

- Compare successful and failed traces
- Find a repeated failure pattern
- Explain why the harness produces that pattern
- Propose the smallest change that tests the explanation

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What a hypothesis agent can do

- Group similar failures across many traces
- Summarize differences between good and bad traces
- Suggest likely causes and candidate changes
- Leave prioritization and final judgment to the human

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This part can be partly automated: an agent can mine failure patterns, while the human decides which hypothesis is worth testing.
</div>

---
class: fill
---

# Three types of harness optimization

<div class="grid grid-cols-3 gap-3 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1 · Fix incompatibilities

- Repair harness bugs
- Adapt the model to an environment or tool contract
- Recover capability the base model already has

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 2 · Offload long work

- Move a long subtask behind one tool call
- Use a subagent, skill, or fixed workflow
- Return the result instead of the full trajectory

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### 3 · Give direct guidance

- Encode a solution path you already know
- Add a focused prompt instruction or procedure
- Reduce search when the right approach is known

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
These changes improve the harness in different ways: fix an interface, shorten the working context, or narrow the search path.
</div>

---
class: fill
---

# Type 1: Fix model–environment mismatches

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Example: inefficient SQL

- A model may omit pushdown aggregation
- The query then fans out and uses too much memory
- If the mistake is occasional, add a prompt reminder
- If it is systematic, enforce a rewrite in code

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What this type can and cannot do

- It removes failures at the model–environment boundary
- It usually raises reliability more than reasoning ability
- The fix may be specific to the current base model
- Re-test it whenever the model changes

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Compatibility fixes recover blocked capability; they rarely create new reasoning capability in the base model.
</div>

<div class="mt-1 text-xs opacity-60">
Related evidence: <a href="https://arxiv.org/abs/2602.22480">VeRO (Ursekar et al., 2026)</a> reports larger gains on tool-use tasks than on reasoning-heavy tasks.
</div>

---
layout: center
class: text-center
---

# One more thing...

<div class="mt-6 text-lg opacity-80">
We just found the newly released DeepSeek Harness.<br>
It independently converges on both engineering choices.
</div>

---
class: fill
---

# Plugins let the harness evolve with the model

<div class="flex justify-center">
<a href="https://deepseek.com/harness/en/">
<img src="/deepseek-plugins.png" class="w-full mt-1 rounded" style="max-height: 300px; object-fit: contain" />
</a>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Instead of one fixed harness, DeepSeek composes models, tools, skills, sessions, and loops from swappable plugins. Different model versions can use different harness configurations.
</div>

---
class: fill
---

# Replayable traces make behavior observable

<div class="flex justify-center">
<a href="https://deepseek.com/harness/en/">
<img src="/deepseek-traceability.png" class="w-full mt-1 rounded" style="max-height: 300px; object-fit: contain" />
</a>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
DeepSeek provides the trace data plane. <b>The only missing piece is a solid eval suite</b> that automatically runs full evaluations after every harness update—and provides scientific evidence that the change works.
</div>
