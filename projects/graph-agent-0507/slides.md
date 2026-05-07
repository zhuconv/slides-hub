---
theme: default
title: "GraphML-FS — A Feature-Synthesis Harness for Tabular Graph ML"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# GraphML-FS

## Feature-synthesis harness — controller / worker split, atomic search unit, typed operator bank

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · May 2026
</div>

---

# Recap — what we kept, what we changed

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Prior — `GraphAnalyst` (Apr) → `GraphLoomer / AutoPipe` (Apr–May)
- **Bilevel search**: outer = model type, inner = feature ops from a catalog
- **Whole-pipeline** as the unit of search — LLM emits `solution.py` candidates and a single agent loops Plan→Code→Execute→Refine
- **Failure-pattern mining** distilled 5 hand-curated `gp_*` graph features that transferred onto MLEvolve's solution
- 3rd-of-4 end-to-end on the public leaderboard

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Now — `GraphML-FS` (May)

Three deliberate architectural changes, all borrowed from how successful general MLAgents (MLEvolve, AI-Build-AI) decompose work:

1. **Controller ⊥ Worker** with intra-round **parallelism**
2. **Feature synthesis** as the atomic search unit (not whole pipelines)
3. **A small, typed operator bank** that gates every LLM proposal

Result: same essence (structured catalog, bilevel feature×model split, no free-form code), but the loop is faster, more parallel, and each step is independently checkable.

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The next 3 slides spell out one architectural pillar each, contrasted with the prior design.
</div>

---

# Pillar 1 — Controller / Worker separation, with intra-round parallelism

<div class="grid grid-cols-5 gap-3 mt-3 text-sm">
<div class="col-span-3">
<img src="/search_loop.svg" class="w-full rounded shadow" />
</div>
<div class="col-span-2 text-xs">

### Roles, not "an agent"
- **Controller** — *non-LLM*, rule-based: enumerates lanes, sets `AllowedSpace` per round, decides stop. One worker LLM call per atomic feature, **N parallel** within a round (configurable concurrency).
- **Worker (LLM)** — proposes a typed `AtomicFeatureProposalBatch` for the lane it's given. Stateless across calls.
- **Materializer / Evaluator / SetBuilder** — pure deterministic compute on parquets.

### What this borrows
- *AI-Build-AI's* role separation (manager picks tool; specialised LLMs do narrow jobs)
- *MLEvolve's* per-node LLM expansion in a search tree

### vs `GraphAnalyst` / `GraphLoomer`
- One LLM agent looped Plan→Code→Execute→Refine on a *whole pipeline*. Sequential. Long context per turn. Errors deep in the pipeline are hard to localise.

</div>
</div>

---

# Pillar 2 — Feature synthesis is the atomic search unit

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### What changed
- **Search unit shrinks** from "a `solution.py` script" → "**one atomic feature spec**"
- A spec is a typed object: `(lane, target_entity, path[], value_col, agg, window)` — not free-form code
- The **downstream** (impute → fit hist_gbdt/lightgbm/logistic → threshold-sweep on val → write CSV) is a *fixed* generic predict path; we never let the LLM rewrite it
- Specs are individually **canonicalized + hashed** → deduped across rounds, stored in `store.sqlite`

</div>
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Why this works
- LLM mistakes are **scoped to one feature**, not "pipeline crashed at row 47"
- Materialization + univariate eval per spec → cheap, **embarrassingly parallel** (DuckDB cached opens)
- Multivariate score is a join over already-evaluated parquets — adding round k+1 features doesn't re-run rounds 0..k
- Failure-pattern mining (GraphLoomer) and `gp_*` distillation are **emergent**: the worker's reflection on which lanes paid off becomes next round's `AllowedSpace`

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Essence preserved:</strong> bilevel feature×model still holds — outer ranks across <code>{base_only, top_k_per_lane, all_accepted, …}</code> sets, inner picks among <code>{hist_gbdt, lightgbm, logistic}</code> downstream models; the difference is the feature side now has a small, typed spec instead of free-form Python.
</div>

---

# Pillar 3 — A comprehensive but concise operator bank (8 lanes)

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Local lanes (single-table)
- **`direct_numeric`** — pass through a numeric col
- **`local_column_transform`** — `log1p` / clip / bucketize one col
- **`local_expr`** — DSL expression over base cols (`amount × is_external`)
- **`sparse_cross`** — categorical × categorical hashed cross

### Relational lanes (per relation pair, time-respecting)
- **`shared_key_group_aggregate`** — join + group-by + agg on shared FK
- **`account_history`** — windowed aggregates over the entity's own history
- **`account_static_aggregate`** — `(table, agg, value_col)` snapshot at event time
- **`account_mixed_history`** — 3-step relational walk (e.g. `tx → sender → tx_pool`)

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why a *typed* catalog
- Every lane has a strict **input dtype, output dtype, time-policy** contract
- Materializer rejects specs that violate the contract before SQL ever runs — no silent downstream nan-storms
- LLM degree-of-freedom is **capped to options the validator understands** — sonnet still 37 % materialize-fail on ibm-aml; a free-form prompt would be much worse

### What this borrows
- *MLEvolve's* `code_review_agent` pre-execution gate, but typed instead of natural-language
- *GraphLoomer's* "no free-form code" stance — extended with relational walks + fused-join `edge_preaggregate` materializer optimization

### vs prior
- GraphLoomer's catalog was structured **but mostly local**; relational walks required free-form Python escape hatches. GraphML-FS makes 3-step relational walks first-class — exactly the lanes that pay off on `ibm-aml` and `arxiv-citation`.

</div>
</div>

---

# Results — first on 3/4 GraphTestbed tasks

<div class="text-xs mt-2">

Single submission `graphfs-claude-sonnet-4-6` on the public leaderboard (<a href="https://huggingface.co/spaces/lanczos/graphtestbed">lanczos/graphtestbed</a>):

| Task | Metric | **GraphML-FS** | rank | next-best | gap |
|---|:-:|---:|:-:|---:|:-:|
| `figraph` | AUC-ROC | **0.895** | **#1** | 0.890 (open-aibuildai) | +0.005 |
| `arxiv-citation` | AUC-ROC | **0.789** | **#1** | 0.777 (open-aibuildai) | +0.012 |
| `ibm-aml` | F1 (minority) | **0.184** | **#1** | 0.171 (open-aibuildai) | +0.013 |
| `ieee-fraud-detection` | AUC | 0.921 | #3 | 0.928 (aibuildai) | −0.007 |

</div>

<div class="text-xs mt-3">

### Side-by-side design diff

| Concern | GraphAnalyst (Apr) | GraphLoomer (May) | **GraphML-FS (now)** |
|---|---|---|---|
| Search unit | model type + free-form features | whole `solution.py` from catalog | **single atomic feature spec** |
| Loop topology | Pilot-C single agent (P0→P1→P2) | 5-role pipeline, sequential | **Controller (rules) + Worker (LLM), N parallel / round** |
| Catalog | local feature ops only | structured + free-form escape hatch | **8 lanes incl. 3-step relational walks**; typed contracts |
| Persistence | logs + per-run jsonl | hall-of-fame on disk | **`store.sqlite`** (specs, evals, sets, rounds — replayable) |
| Predict | per-pipeline | per-pipeline | **fixed cross-class probabilistic ensemble** |
| Leaderboard | single-task experiments | 3rd of 4 | **#1 on 3 / 4** |

</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
GraphML-FS is the only system on graphtestbed holding first place on more than one task. Code: <code>github.com/zhuconv/AgenticFS</code> · branch <code>main</code>.
</div>
