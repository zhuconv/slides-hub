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
.slidev-layout { font-size: 0.92em; padding: 1.5rem 2.5rem !important; }
.slidev-layout h1 { font-size: 1.55em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout h2 { font-size: 1.1em !important; line-height: 1.2 !important; }
.slidev-layout h3 { font-size: 0.95em !important; line-height: 1.2 !important; margin: 0.3em 0 0.2em 0 !important; }
.slidev-layout p, .slidev-layout li { line-height: 1.32 !important; }
.slidev-layout ul, .slidev-layout ol { margin: 0.2em 0 !important; padding-left: 1.1em !important; }
.slidev-layout li { margin: 0.1em 0 !important; }
.slidev-layout table { font-size: 0.78em !important; }
.slidev-layout table td, .slidev-layout table th { padding: 0.18em 0.4em !important; }
.slidev-layout .p-3 { padding: 0.5rem 0.7rem !important; }
.slidev-layout .p-4 { padding: 0.6rem 0.85rem !important; }
.slidev-layout .mt-3, .slidev-layout .mt-4 { margin-top: 0.5rem !important; }
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

# Pillar 3 — A typed operator bank (8 lanes)

<div class="grid grid-cols-2 gap-3 mt-2 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Local lanes (single-table)
- `direct_numeric` · pass-through numeric col
- `local_column_transform` · log1p / clip / bucket
- `local_expr` · DSL expr over base cols
- `sparse_cross` · cat × cat hashed cross

### Relational lanes (per relation pair, time-respecting)
- `shared_key_group_aggregate` · join + group-by on shared FK
- `account_history` · windowed aggs over entity history
- `account_static_aggregate` · `(table, agg, value_col)` snapshot
- `account_mixed_history` · 3-step relational walk

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why *typed* + concise
- Every lane has a strict **input dtype, output dtype, time-policy** contract — materializer rejects illegal specs before SQL runs
- LLM degree-of-freedom **capped to options the validator understands**; sonnet still 37 % materialize-fail on ibm-aml — free-form would be much worse
- Borrows *MLEvolve's* `code_review_agent` pre-execution gate (typed instead of NL); extends *GraphLoomer's* "no free-form" stance

### vs prior
GraphLoomer's catalog was structured but mostly local; relational walks needed Python escape hatches. **GraphML-FS makes 3-step relational walks first-class** — exactly the lanes that pay off on `ibm-aml` and `arxiv-citation`.

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

# Next steps — bench rigor + closing the upper-bound gap

<div class="grid grid-cols-2 gap-3 mt-2 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### 1. Three-axis benchmark vs `MLEvolve` & `open-aibuildai`

Same protocol, three measurements per system × per task:

- **Performance** — leaderboard primary metric
- **API cost** — total `$` per task run (input + output tokens × current model price)
- **Efficiency** — wall-time + peak RAM end-to-end

And **swap models**: re-run each system across `claude-sonnet-4-6 / opus-4-7 / gpt-5.4 / haiku-4-5` to see if the pipeline architecture or the LLM choice dominates. Hypothesis: GraphML-FS has the lowest cost-per-point because the operator bank caps token count per LLM call.

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### 2. Close the gap to the upper bound

`autoresearch` (test-as-eval oracle, no real eval discipline) sets the ceiling each task can reach with this matrix. We're roughly **5 pts** off on multiple tasks:

| Task | GraphML-FS | autoresearch ceiling | Δ |
|---|---:|---:|---:|
| `arxiv-citation` | 0.789 | 0.824 | −0.035 |
| `figraph` | 0.895 | 0.940 | −0.045 |
| `ibm-aml` | 0.184 | 0.591 | −0.407 |

Closes via: **K-fold OOF** ensemble members, **Platt / isotonic** calibration before across-class agg, **auto-NS** for binary-imbalanced, **lane meta-prior** routing the worker's budget toward historically high-lift lanes per task type.

</div>
</div>

<div class="mt-2 p-2 bg-purple-50 rounded border border-purple-200 text-xs">
<strong>Exploration reminder · pre-NN vs post-NN graph aggregation.</strong> In our framework this is a <em>stacking</em> question: should an operator emit a column the downstream consumes (<strong>wide / pre-NN aggregation</strong>) or wrap a model whose predictions are then aggregated (<strong>deep / post-NN aggregation</strong>)? Adding deep operators forces a split between <em>differentiable</em> (gradients flow end-to-end) and <em>non-differentiable</em> (current 8 lanes) operators, which raises orchestration + canonical-hash complexity. Parked, not yet on the roadmap.
</div>

<div class="mt-1 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Code: <code>github.com/zhuconv/AgenticFS</code> · branch <code>main</code> · 39 tests, 3 commits past the graphagent-4023 state.
</div>
