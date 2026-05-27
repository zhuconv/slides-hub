---
theme: default
title: "ALPHA — Learning Auditable Principles for Long-Horizon Agents"
info: "Kickoff proposal · May 2026"
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
.slidev-layout.fill h1 { font-size: 1.95rem; line-height: 1.18; margin-bottom: 0.3rem; }
.slidev-layout.fill h3 { font-size: 1.15rem; margin: 0 0 0.4rem; }
.slidev-layout.fill p  { line-height: 1.4; margin: 0.3rem 0; font-size: 0.95rem; }
.slidev-layout.fill li { line-height: 1.4; margin: 0.25rem 0; font-size: 0.9rem; }
.slidev-layout.fill ul { padding-left: 1.1rem; }
.slidev-layout.fill table { font-size: 0.82rem; }
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.82em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact table { font-size: 0.78em !important; }
</style>

# ALPHA

## Learning **Auditable Principles** for Long-Horizon Agents

<div class="mt-6 text-base opacity-80">
Kickoff proposal — a principle-memory layer with compliance inspection for unattended long-horizon coding agents
</div>

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · May 2026
</div>

---
class: fill
---

# Outline

<div class="grid grid-cols-3 gap-4 mt-3" style="min-height: 14rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### 1 · Problem
<div class="text-xs opacity-60 mt-1">slides 3–4</div>

- Long-horizon agents repeat themselves
- Memory just records — passive
- Skills compress — still passive

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### 2 · Method
<div class="text-xs opacity-60 mt-1">slides 5–6</div>

- Store: principle + experience (typed, like skill library)
- Verify: inspector → assumption.decision → repair if `violate`
- Four controls (B1 · B2 · A1 · A2) — each isolates one claim

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### 3 · Evaluation
<div class="text-xs opacity-60 mt-1">slides 7–9</div>

- Setup: FrontierCS · Harbor · mini-SWE-agent
- Three eval questions: did we win · did behavior change · can we trust it
- Success bar + paper-worthy claim

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
The headline cell — <strong>Ours vs B2 (Trace2Skill-adapted)</strong> on frozen held-out FrontierCS tasks: does enforcement beat distillation?
</div>

---
class: fill
---

# Long-horizon coding agents keep repeating themselves

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 15rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The setting we care about

- Given a repo, a benchmark, a budget, a task
- Agent runs **for hours**, edits code, calls evaluator, analyses feedback
- Returns a reproducible best submission or PR
- Unattended — no human in the loop during the run

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### What goes wrong in practice

- Score plateaus → agent keeps tuning the same constants
- Same failed idea retried under a new wrapper
- Evaluator feedback observed but **not acted on**
- Premature stops, invalid submissions, repeated compile bugs

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Memory <em>records</em> what happened. Skills <em>compress</em> what worked. Neither <strong>enforces</strong> what should happen next. The agent reads and ignores.
</div>

<div class="mt-2 text-xs opacity-60 text-center">
cf. LongCLI-Bench (arXiv 2602.14337) · SlopCodeBench (arXiv 2603.24755) · NL2Repo-Bench (arXiv 2512.12730) — 2025/26 benchmarks quantifying these long-horizon failure modes.
</div>

---
class: fill
---

# Reframe — principles as **enforceable** behavioral obligations

<div class="grid grid-cols-3 gap-4 mt-3" style="min-height: 14rem">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">

### Memory (passive)

Retrieve past summaries → inject into prompt.

The agent **may** use it. The agent **may** ignore it.

No effect on which actions are allowed.

</div>
<div class="p-4 bg-purple-50 rounded-lg border border-purple-200">

### Skills (passive)

Distill trajectories into a `SKILL.md` and prepend it.

Better than nothing — but the system prompt grows, the agent's freedom doesn't shrink.

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200">

### Principles (active)

A typed obligation, inspected **before action**.

If the planned action violates a relevant principle → **block & repair** before execution.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Hypothesis.</strong> Long-horizon agents improve when trajectory evidence becomes <em>auditable rules that gate behavior</em> — not just more text in the context window.
</div>

---
class: fill
---

# ALPHA = principle store + verification gate

<div class="grid grid-cols-2 gap-6 mt-4" style="min-height: 14rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### 1 · Store *(like a skill library, but typed)*

```yaml
Principle:  { id, summary, status } + body
Experience: { situation, action, reason,
              evidence: { task, Δscore } }
```

Principle = the rule. Experience = evidence appended under it (≤ 3 per task, must cite Δscore).

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### 2 · Verify *(inspector gates each action)*

```yaml
Assumption: { principle_id, decision }
decision.status:
  not_relevant | pass | obey_new | violate
```

- `pass` → inject supporting experience
- `obey_new` → allow + log
- **`violate` → block & force repair**

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm text-center">
<code>plan → inspect → (if violate) repair → act → step → log</code> · <strong>only the gate changes which action runs</strong> — A1 ablation tests this
</div>

---
class: fill
---

# Four controls + Ours — what each one isolates

<div class="text-sm mt-3">

| Method | Stores | At runtime | Tests claim |
|---|---|---|---|
| `B1` Trajectory memory | episodic summaries | retrieves into prompt | *is retrieval enough?* |
| `B2` **Trace2Skill-adapted** | merged `SKILL.md` | injects into prompt | *is a distilled doc enough?* |
| `A1` Ours w/o gate | principles + experiences | injects, **never blocks** | *is enforcement the active ingredient?* |
| `A2` Ours offline-merge | merged once after training | inspects → **gates** → repairs | *is the win from format, not online schedule?* |
| `Ours` **ALPHA** | continually-updated principles + experiences | **inspects → gates → repairs** | full method |

</div>

<div class="mt-8 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Headline cell: <strong>Ours vs B2</strong>. A1 and A2 pre-empt the two obvious attacks on that result — <em>"this is just prompting"</em> and <em>"Trace2Skill only loses because it's offline."</em>
</div>

---
class: fill
---

# Experimental stack & main protocol

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 16rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Fixed stack (PoC)

- **Benchmark** — FrontierCS algorithmic tasks (open-ended, continuous score, long-horizon)
- **Runner** — Harbor (external evaluator wrapper)
- **Base agent** — mini-SWE-agent (small, hackable)
- **Model backend** — `gpt-5.4` or `claude-sonnet-4.6`

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Task split & phases

- **8 train · 16 eval · 2 case studies · 3 seeds**
- **Train phase** — methods update their knowledge (B1: memories · B2: `SKILL.md` · ALPHA: principles)
- **Frozen eval phase (main result)** — load frozen knowledge, run from scratch, **no updates**
- Optional **online continual eval** — secondary, after frozen works

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Frozen held-out evaluation is the headline cell: <strong>Ours ALPHA vs B2 Trace2Skill-adapted</strong> on tasks neither method has seen.
</div>

---
class: fill
---

# Evaluation — three questions, one headline cell

<div class="grid grid-cols-3 gap-4 mt-4" style="min-height: 12rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Q1 · Did ALPHA win?

- `BestScore` ↑
- `AUC` ↑
- **WinRate vs B2** ↑

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Q2 · Did behavior change?

- `RepeatedIdeaRate` ↓
- `EvaluatorFeedbackResponse` ↑
- `StagnationLength` ↓

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### Q3 · Can we trust it?

- `ViolationRepairSuccess` ↑
- `ExperienceUtility` ↑
- **`HumanAuditAgreement` ≥ 75%**

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Headline cell: <strong>Ours vs B2</strong> on frozen held-out tasks. Paired bootstrap over (task, seed), 10k samples, 95% CI.
</div>

---
class: fill
---

# Summary

<div class="grid grid-cols-3 gap-4 mt-4" style="min-height: 13rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Idea

Trajectory evidence is more useful as an **enforceable rule** than as retrievable text.

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Experiment

`Ours` vs `B2` on frozen FrontierCS held-out. **A1** and **A2** close the two obvious escape hatches.

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### Insights

**Ours &gt; B2** → principles are executable constraints.  
**Ours = B2** → trajectory text is enough.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-base text-center">
<strong>Memory helps agents remember. Skills help agents act. Principles help agents <em>govern</em> their actions.</strong>
</div>
