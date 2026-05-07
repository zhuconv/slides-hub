---
theme: default
title: "GraphML-FS — A Feature-Synthesis Harness for Tabular Graph ML"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<style>
/* Light global tweaks — let slidev defaults breathe; per-slide compression below */
.slidev-layout table td, .slidev-layout table th { padding: 0.25em 0.5em !important; }
.slidev-layout li { margin: 0.15em 0 !important; }
/* The .compact class compresses dense slides only */
.slidev-layout.compact h1 { font-size: 1.6em !important; line-height: 1.15 !important; margin-bottom: 0.4em !important; }
.slidev-layout.compact h2 { font-size: 1.1em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; line-height: 1.2 !important; margin: 0.2em 0 0.2em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.35 !important; font-size: 0.95em !important; }
.slidev-layout.compact ul, .slidev-layout.compact ol { margin: 0.2em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.08em 0 !important; }
.slidev-layout.compact table { font-size: 0.85em !important; }
.slidev-layout.compact .p-3 { padding: 0.55rem 0.7rem !important; }
.slidev-layout.compact .p-4 { padding: 0.6rem 0.9rem !important; }
.slidev-layout.compact .p-2 { padding: 0.45rem 0.6rem !important; }
.slidev-layout.compact .mt-3 { margin-top: 0.5rem !important; }
.slidev-layout.compact .mt-4 { margin-top: 0.6rem !important; }
</style>

# GraphML-FS

## Feature-synthesis harness — controller / worker split, atomic search unit, typed operator bank

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · May 2026
</div>

---

# Recap — what we kept, what we changed

<div class="grid grid-cols-2 gap-3 mt-2 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Prior — `GraphAnalyst` (Apr) → `GraphLoomer` (May)
- **Bilevel search** — outer model type, inner feature ops from a catalog
- **Whole-pipeline as the unit of search**: LLM emits `solution.py` candidates; one agent loops Plan → Code → Execute → Refine
- Failure-pattern mining distilled 5 hand-curated `gp_*` features that transferred to MLEvolve
- 3rd of 4 end-to-end on the public leaderboard

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Now — `GraphML-FS`

Three architectural changes, all borrowed from how MLAgents (MLEvolve, AI-Build-AI) decompose work:

1. **Controller ⊥ Worker** with intra-round **parallelism**
2. **Feature synthesis** as the atomic search unit (not whole pipelines)
3. A small, **typed operator bank** that gates every LLM proposal

Same essence (structured catalog, no free-form code, bilevel feature × model) — but each step is now independently checkable and parallelizable.

</div>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Next 3 slides: one architectural pillar each, contrasted with the prior design.
</div>

---

# Pillar 1 — Controller / Worker separation, parallel rounds

<div class="grid grid-cols-5 gap-3 mt-2 text-sm">
<div class="col-span-3">
<img src="/search_loop.svg" class="w-full rounded shadow" />
</div>
<div class="col-span-2 text-xs">

### Roles, not "an agent"
- **Controller** *(non-LLM, rule-based)* — enumerates lanes, sets `AllowedSpace` per round, decides stop. **N parallel** worker calls within each round.
- **Worker (LLM)** — emits a typed `AtomicFeatureProposalBatch` for the lane it's given. Stateless across calls.
- **Materializer / Evaluator / SetBuilder** — pure deterministic compute on parquets.

### Borrowed
- *AI-Build-AI's* role separation
- *MLEvolve's* per-node LLM expansion in a search tree

### vs prior
- One LLM agent looped on a *whole pipeline*. Sequential, long context, errors hard to localise.

</div>
</div>

---

# Pillar 2 — Feature synthesis is the atomic unit

<div class="grid grid-cols-2 gap-3 mt-2 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What changed
- Search unit shrinks from "a `solution.py`" → **one atomic feature spec** = `(lane, target_entity, path[], value_col, agg, window)`
- Specs are individually canonicalized + hashed → deduped across rounds, persisted in `store.sqlite`
- The **downstream** (impute → fit hist_gbdt/lightgbm/logistic → threshold sweep on val → CSV) is a *fixed* generic predict path; the LLM never rewrites it

</div>
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Why this works
- LLM mistakes are scoped to one feature, not "pipeline crashed at row 47"
- Materialize + univariate eval per spec → cheap, **embarrassingly parallel** (DuckDB cached opens)
- Adding round k+1 features doesn't re-run rounds 0..k
- Failure-pattern mining is now **emergent**: which lanes paid off shapes the next round's `AllowedSpace`

</div>
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Essence preserved:</strong> bilevel feature × model still holds — outer ranks across <code>{base_only, top_k_per_lane, all_accepted, …}</code> sets, inner picks among <code>{hist_gbdt, lightgbm, logistic}</code>; difference is the feature side now uses a typed spec instead of free-form Python.
</div>

---
class: compact
---

# Pillar 3 — A typed operator bank (8 lane types)

<div class="text-xs mt-1">

The bank has **8 hardcoded lane *types*** in <code>SearchLaneBuilder</code>. Each round, the builder expands them into many concrete **lane *instances*** keyed by (target entity × relation pair × direction). The Worker LLM proposes feature SQL <em>within</em> a given instance — it never invents a new lane type. That constraint is what makes the materializer's typed validation possible.

</div>

<div class="grid grid-cols-2 gap-3 mt-1 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Local lane types (single-table)
- `direct_numeric` · pass-through numeric col
- `local_column_transform` · log1p / clip / bucket
- `local_expr` · DSL expr over base cols
- `sparse_cross` · cat × cat hashed cross

### Relational lane types (per relation pair, time-respecting)
- `shared_key_group_aggregate` · join + group-by on shared FK
- `account_history` · windowed aggs over entity history
- `account_static_aggregate` · `(table, agg, value_col)` snapshot
- `account_mixed_history` · 3-step relational walk

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why a closed, typed lane *type* set
- Each lane type fixes an **input dtype, output dtype, time policy, allowed aggs/windows**; the materializer rejects illegal specs before SQL runs
- LLM degree-of-freedom **capped to options the validator understands**; sonnet still 37 % materialize-fail on ibm-aml — free-form would be much worse
- A new lane type is a **code change**, not an LLM choice — keeps the validator and downstream guarantees intact
- Borrows *MLEvolve's* `code_review_agent` pre-execution gate (typed, not NL); extends *GraphLoomer's* "no free-form" stance

### vs prior
GraphLoomer's catalog was structured but mostly local; relational walks needed Python escape hatches. **GraphML-FS makes 3-step relational walks first-class** — exactly the lane types that pay off on `ibm-aml` and `arxiv-citation`.

</div>
</div>

---

# Results — first on 3 / 4 GraphTestbed tasks

<div class="text-sm mt-2">

Single submission `graphfs-claude-sonnet-4-6` on the public leaderboard (<a href="https://huggingface.co/spaces/lanczos/graphtestbed">lanczos/graphtestbed</a>):

| Task | Metric | **GraphML-FS** | rank | next-best | gap |
|---|:-:|---:|:-:|---:|:-:|
| `figraph` | AUC-ROC | **0.895** | **#1** | 0.890 (open-aibuildai) | +0.005 |
| `arxiv-citation` | AUC-ROC | **0.789** | **#1** | 0.777 (open-aibuildai) | +0.012 |
| `ibm-aml` | F1 (minority) | **0.184** | **#1** | 0.171 (open-aibuildai) | +0.013 |
| `ieee-fraud-detection` | AUC | 0.921 | #3 | 0.928 (aibuildai) | −0.007 |

### Side-by-side design diff

| Concern | GraphAnalyst (Apr) | GraphLoomer (May) | **GraphML-FS** |
|---|---|---|---|
| Search unit | model + free-form features | whole `solution.py` | **atomic feature spec** |
| Loop | Pilot-C single agent | 5-role pipeline, sequential | **Controller + Worker, N parallel / round** |
| Catalog | local ops only | structured + free-form escape | **8 lanes incl. 3-step relational** |
| Persistence | logs / jsonl | hall-of-fame on disk | **`store.sqlite`** (replayable) |
| Leaderboard | per-task expts | 3rd of 4 | **#1 on 3 / 4** |

</div>

---
class: compact
---

# Next steps

<div class="grid grid-cols-2 gap-2 mt-2 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### 1. Three-axis bench vs `MLEvolve` & `open-aibuildai`

Per system × per task: **performance** (leaderboard metric), **API cost** ($ per run), **efficiency** (wall-time + peak RAM).

Cross-LLM: rerun each system across `sonnet-4-6 / opus-4-7 / gpt-5.4 / haiku-4-5` — does pipeline architecture or LLM choice dominate? Hypothesis: GraphML-FS lowest **cost-per-point** because the typed operator bank caps token count per LLM call.

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### 2. Close the autoresearch ceiling gap

`autoresearch` (test-as-eval oracle) sets the ceiling each task can reach with this matrix. We're ~5 pts off on multiple tasks:

| Task | now | ceiling | Δ |
|---|---:|---:|---:|
| `arxiv-citation` | 0.789 | 0.824 | −0.035 |
| `figraph` | 0.895 | 0.940 | −0.045 |
| `ibm-aml` | 0.184 | 0.591 | −0.407 |

Closes via **K-fold OOF**, **Platt / isotonic calibration**, **auto-NS** for imbalanced, **lane meta-prior**.

</div>
<div class="p-2 bg-purple-50 rounded border border-purple-200">

### 3. Ship as skills + tools to augment other agents

Package GraphML-FS as drop-ins that **MLEvolve** / **open-aibuildai** can call without modifying their controllers:

- **`graphfs.search`** — returns matrix + per-feature lift given `(task_dir, instruction)`
- **`graphfs.lane_eval`** — score a candidate spec on val without a full round
- Distributed as **MCP server** (4023's plug recommendation) — zero host-controller change

</div>
<div class="p-2 bg-yellow-50 rounded border border-yellow-300">

### 4. *Exploration reminder* — pre-NN vs post-NN graph aggregation

A *stacking* question in our framework:
- **wide / pre-NN** — operator emits a column the downstream consumes (current 8 lanes, all here)
- **deep / post-NN** — operator wraps a model whose predictions are then aggregated

Adding deep operators forces a split between **differentiable** (gradients flow end-to-end) and **non-differentiable** lanes — raises orchestration + canonical-hash complexity. **Parked**, not yet on the roadmap.

</div>
</div>

---

# Bigger picture — "graph learning is operator learning"

<div class="text-sm mt-2">

GraphML-FS's 8 lane *types* are one instance of a broader thesis: **lift graph structure from a hard-coded part of the architecture to a searchable, executable, composable operator catalog**. (Inside each type the LLM still searches over SQL; the *types* themselves are a closed code-level set.)

</div>

<div class="grid grid-cols-2 gap-3 mt-2 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Where prior Graph FMs hard-code the operator
- **GNN / OFA** — fixed local message-passing; repeats one A-neighbor reduction
- **PE / Tokenizer Transformer** (Graphormer, OpenGraph) — compresses structure into PE / SVD / token bias, no explicit reduction
- **Hybrid GT** (GraphGPS) — local MPNN + global attention; modular but coarse operator granularity
- **PFN / Graph-to-table** (GraphPFN, G2T-FM) — graph adapter or hand-crafted graph features into a tabular FM

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### Pivot — operator scaling, not architecture scaling
Treat as **first-class searchable modules**:
- **Relation construction** — `A`, `A_r`, kNN, latent graph
- **Neighborhood reduction** — sum / mean / max / attention
- **Multi-hop / diffusion** — `A²`, `Aᵏ`, PPR, RW, heat
- **Structure** — LapPE, RWSE, motif, subgraph
- **Global** — dense attention / memory
- **Head** — MLP / RF / XGB / PFN

NN's job becomes: **select, compose, calibrate, fuse** operators. Operator bank carries the graph algorithmic primitives.

</div>
</div>

<div class="mt-1 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
GraphML-FS already plays this game on the tabular-graph side; the broader thesis generalises it to end-to-end Graph FM training.
</div>

---
class: compact
---

# Operator-search scaling law (proposed)

<div class="grid grid-cols-2 gap-3 mt-2 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Hypothesis
Under matched compute, fit a joint scaling law:

$$\text{Error} = E_\infty + a \cdot C_{\text{NN}}^{-\alpha} + b \cdot C_{\text{Op}}^{-\beta} + c \cdot N_{\text{label}}^{-\gamma}$$

On **operator-dominant graph tasks** the conjecture is **β > α** — i.e. expanding the operator search space yields higher marginal return than continuing to deepen/widen a fixed NN architecture.

### Compute-matched curves
Three branches at the same FLOP budget: scale NN only, scale Op only, scale both. Plot accuracy vs compute and read off the slopes.

</div>
<div class="p-2 bg-purple-50 rounded border border-purple-200">

### Decisive ablation — No-op / Oracle-op / Search-op / Bigger-NN
| Branch | What it isolates |
|---|---|
| **No-op** | NN-only baseline (no graph operators) |
| **Oracle-op** | hand-picked best operator per task — *upper bound* |
| **Search-op** | our automated search (GraphML-FS-style bank) |
| **Bigger-NN** | same compute, all going into NN size |

**Decision rule:** if **Search-op ≈ Oracle-op > Bigger-NN**, the gap was a *missing operator*, not insufficient parameters. That's the empirical condition that legitimises operator scaling as the strategy.

</div>
</div>

---
class: compact
---

# Validation plan — synthetic separations + matched empirical scaling

<div class="grid grid-cols-2 gap-3 mt-2 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Synthetic tasks — each guarantees a failure mode
| Task | Architecture that fails | Operator needed |
|---|---|---|
| neighborhood copy / sum | PE-only Transformer | `AX` |
| k-hop pointer chasing | fixed-depth GNN | `Aᵏ` |
| barbell matching | hard-mask local GNN | global attn |
| triangle / motif | 1-WL GNN | motif |
| noisy latent neighbor | observed-edge-only mask | latent `A*` |

Each synthetic task *guarantees* one architecture class can never solve it without adding a specific operator — clean separation evidence.

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### Empirical — comparable settings
- **Baselines:** GraphGPS, GraphPFN, G2T-FM, OFA, RF-Graph, XGB-Graph
- **Training regimes reported separately:** scratch supervised, ICL (no target gradient), finetune, OOD transfer
- **Metrics:** accuracy / AUC + GPU-hours/FLOPs + label efficiency + OOD-size scaling
- **Claim test:** is the operator-search curve *steeper* than NN-scaling at matched compute?

### Expected take-away
> *Scale operator coverage, not only neural capacity.*

NN selects, composes, calibrates and fuses operators; the **operator bank** carries the graph algorithmic primitives. GraphML-FS is a working prototype of the bank in the tabular-graph regime — same thesis, different layer.

</div>
</div>

