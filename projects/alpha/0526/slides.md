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
<div class="text-xs opacity-60 mt-1">slides 5–7</div>

- Four typed objects: principle · experience · assumption · compliance
- Runtime: inspect → gate → repair → update
- Four controls (B1 · B2 · A1 · A2) — each isolates one claim

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### 3 · Evaluation
<div class="text-xs opacity-60 mt-1">slides 8–10</div>

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

# What ALPHA stores — four typed objects

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 16rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Principle <span class="text-xs opacity-60">— persisted markdown</span>

```yaml
{ id, title, summary, status } + markdown body
```

> *P2: When score plateaus after local edits, change the algorithmic hypothesis rather than only tuning constants.*

### Experience <span class="text-xs opacity-60">— append-only under a principle</span>

```yaml
{ situation, action, reason,
  evidence: { task, Δscore }, tags }
```

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Assumption <span class="text-xs opacity-60">— ephemeral, inspector output</span>

```yaml
{ principle_id, relevance,
  decision: { status, required_action },
  supporting_experience_ids }
```

### decision.status <span class="text-xs opacity-60">— strict enum</span>

```text
enum { not_relevant | pass | obey_new | violate }
```

- `pass` — supporting experience exists → inject
- `obey_new` — no match → allow + log candidate
- `violate` — **block** and force repair

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Compliance is a strict 4-value enum; the other three are <strong>schema-shaped markdown records</strong>. The "typing" is contract-level — field roles and an enum decision — not language-level. That's enough to make principles <em>auditable</em>.
</div>

---
class: fill
---

# Runtime loop — inspect, gate, act, learn

<div class="grid grid-cols-2 gap-6 mt-4" style="min-height: 12rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### Inside a task

<div class="text-base mt-2 mb-3">

`plan` → `inspect` → if violate: `repair` → `act` → `env.step` → `log`

</div>

Inspector fires at: first plan, each evaluator result, compile/runtime failure, 3 non-improving attempts, before large rewrite or final submit.

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### After a task

<div class="text-base mt-2 mb-3">

`trajectory` → `updater` → append ≤ 3 new experiences

</div>

Each new experience must cite a Δscore or error-recovery event; merge into existing if semantic-sim &gt; 0.85.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Only the gate changes which action runs.</strong> Everything else is text in the prompt — the A1 (no-gate) ablation isolates enforcement from prompting.
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

# In summary — the bet, the test, the verdict

<div class="grid grid-cols-3 gap-4 mt-4" style="min-height: 13rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200">

### The bet
<div class="text-xs opacity-60 mt-1">what we think is true</div>

Trajectory evidence is more useful as an **enforceable rule** than as retrievable text.

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### The test
<div class="text-xs opacity-60 mt-1">how we'll know</div>

`Ours` vs `B2` on frozen FrontierCS held-out. **A1** and **A2** close the two obvious escape hatches.

</div>
<div class="p-5 bg-purple-50 rounded-lg border border-purple-200">

### The verdict
<div class="text-xs opacity-60 mt-1">either way is publishable</div>

**Ours &gt; B2** → principles are executable constraints.  
**Ours = B2** → trajectory text is enough.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-base text-center">
<strong>Memory helps agents remember. Skills help agents act. Principles help agents <em>govern</em> their actions.</strong>
</div>
