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

### Skills / SOPs (passive)

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

### Principle
A high-level behavioral obligation.

> *P2: When score plateaus after local edits, change the algorithmic hypothesis rather than only tuning constants.*

### Experience
A grounded `situation → action → reason` record under a principle, with evidence (task, score delta).

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Assumption
The inspector's runtime read of *how* the principle applies to the current state.

### Compliance decision
One of four statuses per relevant principle:

- `not_relevant` — ignore
- `pass` — supporting experience exists → inject
- `obey_new` — no matching experience → allow + log candidate
- `violate` — **block** and force repair

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Principles live as markdown files with YAML frontmatter. Experiences append-only under each principle. Both are human-readable — that's the <em>auditable</em> in ALPHA.
</div>

---
class: fill
---

# Runtime loop — inspect, gate, act, learn

<div class="grid grid-cols-2 gap-5 mt-3" style="min-height: 17rem">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">

### Inside a task

```text
while not done:
    plan       = agent.propose_plan(obs)
    report     = inspector.inspect(plan, principles)

    if report.has_violation():
        plan   = violation_gate.repair(plan, report)

    action     = agent.act(plan,
                   experiences=report.cited)
    result     = env.step(action)
    trajectory.append(...)
```

Inspect at: first plan · after each evaluator result · after compile/runtime failure · after 3 non-improving attempts · before large rewrite or final submit.

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200 text-sm">

### After a task

```text
updates = principle_updater.update(
    trajectory, score_curve,
    best_solution, principles)
principle_store.apply(updates)
```

Update rules — at most 3 new experiences per task; every experience cites score delta or error-recovery evidence; merge if semantic-sim &gt; 0.85; reject task-specific names; create a new principle only if none can host the experience.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-xs">
<strong>Only the gate actually changes which action runs.</strong> Everything else is text in the prompt — the A1 (no-gate) ablation is what isolates enforcement from prompting.
</div>

---
class: fill
---

# Methods — what's different at runtime

<div class="text-sm mt-3">

| Method | Learns from trajectories? | Knowledge unit | Runtime use | **Runtime enforcement?** |
|---|:---:|---|---|:---:|
| `B0` Vanilla mini-SWE-agent | — | — | — | no |
| `B1` Trajectory-summary memory | yes | episodic summaries | retrieve → prompt | no |
| `B2` Static principles | — | seed principles | inspect (no updates) | yes |
| `B3` **Trace2Skill-adapted** | yes | merged `SKILL.md` | inject → prompt | no |
| `Ours` **ALPHA** | yes | principle + experiences | **inspect → gate → repair** | **yes** |

</div>

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Why Trace2Skill is the key baseline
Same trajectory pool, same model, same budget. Both distill experience into reusable knowledge — Trace2Skill into a passive document, ALPHA into an enforceable rule. **Clean comparison of structure & runtime use, not data.**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Three baselines isolate three claims
`B1` — retrieval alone isn't enough.  
`B2` — static principles isolate "prompting" from "learning."  
`B3` — distilled skills isolate "passive doc" from "active rule."

</div>
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
- **Model** — one fixed model, `temp=0.2`, `≤150 steps`, `≤30 evaluator calls`, 2h wall time, seeds `{0,1,2}`

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200">

### Task split & phases

- **8 train · 16 eval · 2 case studies · 3 seeds**
- **Train phase** — methods update their knowledge (B1: memories · B3: `SKILL.md` · ALPHA: principles)
- **Frozen eval phase (main result)** — load frozen knowledge, run from scratch, **no updates**
- Optional **online continual eval** — secondary, after frozen works

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
Frozen held-out evaluation is the headline cell: <strong>Ours ALPHA vs B3 Trace2Skill-adapted</strong> on tasks neither method has seen.
</div>

---
class: fill
---

# Metrics — three families, one comparison

<div class="grid grid-cols-3 gap-3 mt-3 text-sm" style="min-height: 15rem">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">

### Performance

- `BestScore` ↑
- `FinalScore` ↑
- `ScoreAUC` ↑ (normalised by budget)
- `Score@{5,10,20}` evals
- **WinRate vs Trace2Skill** ↑

Paired bootstrap over (task, seed), 10k samples, 95% CI.

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200">

### Behavior

- `RepeatedIdeaRate` ↓
- `StagnationLength` ↓
- `EvaluatorFeedbackResponseRate` ↑
- `MajorStrategyChangeCount` ↑
- `InvalidSubmissionRate` ↓
- `PrematureStopRate` ↓

Tests whether the gate **actually changes behavior**, not just score.

</div>
<div class="p-4 bg-purple-50 rounded-lg border border-purple-200">

### Principle-specific

- `Relevance` / `Pass` / `ObeyNew` / `Violation` rates
- `ViolationRepairSuccess` ↑
- `ExperienceReuseCount` ↑
- `ExperienceUtility` (Δscore within 3 evals)
- `CompressionRatio` (traj tokens ÷ principle tokens)
- **HumanAuditAgreement** ≥ 75% on sampled decisions

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-xs">
The strongest result: ALPHA &gt; Trace2Skill on score &amp; AUC <em>and</em> ALPHA &lt; Trace2Skill on repeated failures <em>and</em> the no-gate ablation loses to full ALPHA.
</div>

---
class: fill
---

# Ablations — what is actually doing the work

<div class="grid grid-cols-2 gap-4 mt-3" style="min-height: 15rem">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm">

### A1 — no violation gate
Inspect & inject, but never block.  
*Tests whether enforcement matters beyond extra prompting.*

### A2 — no continual update
Seed principles only, never append experience.  
*Tests whether learned experiences matter.*

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200 text-sm">

### A3 — no experiences
Principle titles & summaries only.  
*Tests whether grounded evidence matters.*

### A4 — offline principle merge
Collect all candidates from training trajectories, merge once at the end.  
*Separates the knowledge format (principle vs skill) from the update schedule.*

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>A4 directly answers the reviewer worry:</strong> "maybe Trace2Skill loses only because it is offline." If A4 still beats Trace2Skill, the win is the principle format itself.
</div>

---
class: compact
---

# 5-week roadmap

<div class="grid grid-cols-5 gap-2 mt-3">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### W1 · Harness
mini-SWE-agent × Harbor × FrontierCS

↳ trajectory log  
↳ score curve  
↳ score parser

**Done when** vanilla runs one task end-to-end.

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### W2 · Baselines
B1 trajectory memory.

B3 Trace2Skill-adapted: success / error analysts → patches → hierarchical merge → SKILL.

**Done when** B3 trains + evals on 2+2 tasks.

</div>
<div class="p-2 bg-purple-50 rounded border border-purple-200">

### W3 · ALPHA layer
store · retriever · **inspector** · **violation gate** · updater · merger

+ inspector / repair / updater prompts

**Done when** one task emits full inspector + violation + update logs.

</div>
<div class="p-2 bg-orange-50 rounded border border-orange-200">

### W4 · Main PoC
**8 train · 16 eval · 3 seeds · 5 methods**

Outputs: performance · behavior · principle metric CSVs + case studies.

</div>
<div class="p-2 bg-yellow-50 rounded border border-yellow-300">

### W5 · Ablations
A1 no-gate · A2 no-update · A3 no-experience · A4 offline-merge

+ score-curve, win-rate, principle-usage figures.

</div>
</div>

<div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm">
<strong>Gate before scaling.</strong> Run the 2×2 mini-PoC (B0 · B3 · Ours, 2 train + 2 eval, 1 seed) first. If ALPHA shows any signal on score / AUC / repeated-failure reduction → scale to the full 8×16. Otherwise inspect case studies before changing the method.
</div>

---
class: fill
---

# Success bar & what we want to claim

<div class="grid grid-cols-2 gap-6 mt-3" style="min-height: 15rem">
<div class="p-5 bg-blue-50 rounded-lg border border-blue-200 text-sm">

### Minimal success — any 2 of:

1. ALPHA beats Trace2Skill on held-out BestScore or AUC
2. ALPHA beats Trajectory Memory on held-out BestScore or AUC
3. ALPHA has lower `RepeatedIdeaRate` than Trace2Skill
4. ALPHA has higher `EvaluatorFeedbackResponseRate` than Trace2Skill
5. The no-gate ablation is worse than full ALPHA
6. Human audit finds &gt; 75% of inspector decisions reasonable

</div>
<div class="p-5 bg-green-50 rounded-lg border border-green-200 text-sm">

### Strongest result (paper-worthy)

- ALPHA &gt; Trace2Skill on **FinalScore** and **AUC**
- ALPHA &lt; Trace2Skill on **repeated failures**
- The **no-gate ablation loses** to full ALPHA

These together support the claim that principles are not just compressed memory — they are <strong>executable behavioral constraints</strong>.

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300 text-sm text-center">
<strong>Memory helps agents remember. Skills help agents act. Principles help agents <em>govern</em> their actions.</strong>
</div>
