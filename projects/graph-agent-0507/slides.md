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
.slidev-layout.compact h1 { font-size: 1.5em !important; line-height: 1.15 !important; margin-bottom: 0.3em !important; }
.slidev-layout.compact h3 { font-size: 1em !important; margin: 0.15em 0 !important; }
.slidev-layout.compact p, .slidev-layout.compact li { line-height: 1.3 !important; font-size: 0.85em !important; }
.slidev-layout.compact ul { margin: 0.15em 0 !important; padding-left: 1.1em !important; }
.slidev-layout.compact li { margin: 0.05em 0 !important; }
.slidev-layout.compact table { font-size: 0.8em !important; }
.slidev-layout.compact .p-2 { padding: 0.5rem 0.6rem !important; }
.slidev-layout.compact .mt-3 { margin-top: 0.4rem !important; }
</style>

# GraphML-FS

## Feature synthesis as the atomic search unit — controller / worker split, typed operator bank

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · May 2026
</div>

---

# Recap

<div class="text-sm mt-4">

Prior deck: <a href="https://zhuconv.github.io/slides-hub/graphagent-4023/1" target="_blank" class="text-blue-700 underline">zhuconv.github.io/slides-hub/graphagent-4023</a>

</div>

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Where we left off — `GraphLoomer`

- Bilevel pipeline: outer model type, inner feature ops from a catalog
- **Whole `solution.py`** was the unit of search; one LLM agent looped Plan → Code → Execute → Refine
- 3rd of 4 end-to-end on GraphTestbed; failure-pattern features transferred to MLEvolve

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### What was missing

- **No parallelism inside a round** — one agent, one solution at a time
- **Errors hard to localise** — a feature bug crashed the whole pipeline
- **Free-form Python** outran the validator → debug churn dominated wall time

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
This deck: rebuild the harness around three architectural decisions, each fixing one of the gaps above.
</div>

---

# At a glance — three stages, one loop

<img src="/architecture.svg" class="w-full mt-3" />

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Setup runs once. Search loops until the controller stops. Predict materialises the best feature set into a single submission. Three pillars on the next three slides.
</div>

---

# Pillar 1 — Controller ⊥ Worker, parallel rounds

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What

- **Controller** — rule-based, no LLM. Enumerates lanes, sets `AllowedSpace`, decides stop.
- **Worker** — LLM. Stateless. Emits one `AtomicFeatureProposalBatch` for the lane it's given.
- **N workers per round, in parallel.**

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why it matters

- Round wall-time bounded by the slowest worker, not by total prompt count
- Errors localise to a single lane / spec
- Borrowed: AI-Build-AI's role separation; MLEvolve's per-node LLM expansion

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
GraphLoomer used one LLM looped on a whole pipeline — sequential, long context, blame hard to attribute. Splitting roles is the single biggest source of speed-up.
</div>

---

# Pillar 2 — atomic feature spec is the search unit

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### What

A single search step produces:

```
spec = (lane, target_entity, path[],
        value_col, agg, window)
```

Canonicalised + hashed → deduped across rounds → persisted in `store.sqlite`.

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why it matters

- Materialize + univariate eval is **per spec** → embarrassingly parallel
- Round k+1 reuses rounds 0..k's matrices
- LLM mistakes scope to one feature, not the whole pipeline
- "What paid off" → next round's `AllowedSpace`

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The downstream — impute → fit hist_gbdt / lightgbm / logistic → threshold sweep on val → CSV — is fixed code. The LLM never rewrites it.
</div>

---

# Pillar 3 — typed operator bank: 8 lane *types*

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Local
- **Pass-through**
- **Column transform** — log1p / clip / bucket
- **DSL expression** — expr over base cols
- **Hashed sparse cross** — cat × cat

### Relational *(time-respecting)*
- **First-order group aggregate** — *count of orders per customer*
- **Co-neighbor snapshot** — *count of txns per account*
- **Co-neighbor windowed history** — *7d txn sum per account*
- **Role-mixed co-neighbor history** — *mean recipient balance per sender*

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why a closed set

- Each type fixes **input / output dtype, time policy, allowed aggs**
- Validator rejects illegal specs **before** SQL runs
- A new lane type is a **code change**, not an LLM choice

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The Worker LLM picks SQL <em>within</em> a lane instance — never invents a new lane type. Sonnet still hits 37 % materialize-fail with this guardrail; free-form would be much worse.
</div>

---

# Results — first on 3 / 4 GraphTestbed tasks

<div class="text-sm mt-4">

`graphfs-claude-sonnet-4-6` on the public leaderboard (<a href="https://huggingface.co/spaces/lanczos/graphtestbed">lanczos/graphtestbed</a>):

| Task | Metric | **GraphML-FS** | rank | next-best |
|---|:-:|---:|:-:|---|
| `figraph` | AUC-ROC | **0.895** | **#1** | 0.890 (open-aibuildai) |
| `arxiv-citation` | AUC-ROC | **0.789** | **#1** | 0.777 (open-aibuildai) |
| `ibm-aml` | F1 (minority) | **0.184** | **#1** | 0.171 (open-aibuildai) |
| `ieee-fraud-detection` | AUC-ROC | 0.921 | #3 | 0.928 (aibuildai) |

</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Same <code>claude-sonnet-4-6</code> as the AI-Build-AI runs — the harness is the differentiator, not the model.
</div>

---

# Bigger picture — graph learning is operator learning

<div class="grid grid-cols-2 gap-4 mt-4 text-xs">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Where graph FMs hard-code the operator

- **GNN / OFA** — fixed local message-passing
- **Tokenizer Transformers** (Graphormer, OpenGraph) — PE / SVD / token bias
- **Hybrid GT** (GraphGPS) — local MPNN + global attention
- **PFN / G2T-FM** — graph adapter into a tabular FM

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Pivot — operator scaling

First-class searchable modules:
- **Construction** — `A`, kNN, latent
- **Reduction** — sum / mean / attn
- **Multi-hop** — `A²`, PPR, RW, heat
- **Structure** — LapPE, RWSE, motif
- **Head** — MLP / RF / XGB / PFN

NN's job: select, compose, calibrate, fuse.

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
GraphML-FS's 8 lane <em>types</em> are this thesis instantiated on the tabular-graph side. Generalising to end-to-end GraphFM training is the longer arc — operator scaling vs architecture scaling.
</div>

---
class: compact
---

# Next steps

<div class="grid grid-cols-2 gap-2 mt-3 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### 1 — Three-axis bench
Per system × task × LLM: **performance**, **API cost**, **wall-time**. Compare GraphML-FS / MLEvolve / open-aibuildai across `sonnet-4-6 / opus-4-7 / gpt-5.4`. Hypothesis: typed bank caps tokens → lowest cost-per-point.

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### 2 — Close the autoresearch ceiling

| Task | now | ceiling | Δ |
|---|---:|---:|---:|
| `arxiv-citation` | 0.789 | 0.824 | −0.035 |
| `figraph` | 0.895 | 0.940 | −0.045 |
| `ibm-aml` | 0.184 | 0.591 | −0.407 |

K-fold OOF · calibration · auto-NS · lane meta-prior.

</div>
<div class="p-2 bg-purple-50 rounded border border-purple-200">

### 3 — Ship as skills + tools
Drop-ins for **MLEvolve** / **open-aibuildai**: `graphfs.search` (matrix + lift) and `graphfs.lane_eval` (score one spec on val). Distribute as **MCP server** — zero host-controller change.

</div>
<div class="p-2 bg-yellow-50 rounded border border-yellow-300">

### 4 — Reminder · pre-NN vs post-NN aggregation
Current 8 lanes are **pre-NN** (column → downstream). Post-NN = wrap a model whose preds aggregate. Forces a differentiable / non-differentiable lane split. **Parked.**

</div>
</div>
