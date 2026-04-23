---
theme: default
title: "GraphAgent: Leaderboard, Baselines, and Graph-Feature Augmentation"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# GraphAgent — Leaderboard · Baselines · Augmentation

## From hardcoded pipelines to a benchmark-driven multi-agent system

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · April 2026
</div>

---

# Recap

<div class="text-sm mt-4">

Prior deck: <a href="https://zhuconv.github.io/slides-hub/graph-analyst-0408/1" target="_blank" class="text-blue-700 underline">zhuconv.github.io/slides-hub/graph-analyst-0408</a>

</div>

<div class="p-4 mt-4 bg-blue-50 rounded border border-blue-200 text-sm">

### Where we left off

- **GraphAnalyst bilevel pipeline** — outer loop evolves model + hyperparams; inner loop does failure analysis + feature engineering
- Generalized from YelpChi-only to **3 datasets**, **7 model types**
- **IEEE-CIS** generalized val→test (+0.4 AUC-ROC)
- **YelpChi / IBM AML** overfit on tiny val sets

### Open problems

- Val→test generalization on small positive counts
- Evaluation still runs locally — agents could peek at test labels
- No comparison against LLM-agent baselines for tabular-graph ML

</div>

---

# GraphTestbed — a Kaggle-style leaderboard

<div class="grid grid-cols-2 gap-6 mt-2 text-sm">
<div>

### Why a hosted API, not local eval

- Local eval ⇒ agent can `pd.concat([train, val, test])` and cheat
- Hosted scoring API holds GT on server, never ships labels
- **5 submissions / day / IP / task**, scores rounded to 3dp → probing is statistically uninformative
- CSV-only contract → any harness (python, notebook, remote agent) works

### CLI

```bash
pip install git+https://github.com/zhuconv/GraphTestbed
gtb submit figraph --file preds.csv --agent my-agent
# ✓ Scored  primary (auc_roc): 0.842  rank: #2
gtb leaderboard figraph
```

</div>
<div>

### Tasks live today

| Task | Metric | Test rows | Backend |
|---|:-:|---:|---|
| `figraph` | AUC-ROC | 3,596 | local GT |
| `arxiv-citation` | AUC-ROC | 193,696 | local GT |
| `ibm-aml` | F1 (minority) | 863,900 | local GT |
| `ieee-fraud-detection` | AUC-ROC | 506,691 | Kaggle passthrough |

### Hosted

Leaderboard · [🤗 lanczos/graphtestbed](https://huggingface.co/spaces/lanczos/graphtestbed)  
Repo · [github.com/zhuconv/GraphTestbed](https://github.com/zhuconv/GraphTestbed)

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Point:</strong> the leaderboard is the objective function. Any harness we build gets scored against the same CSV contract — no more hidden train/val leaks.
</div>

---

# Introduction of Two SOTA Baselines

<div class="text-sm mt-2">

Both are LLM-driven ML-engineering agents wired into GraphTestbed via `agents/ai_build_ai/` and `agents/mlevolve/`. Read through source + paper — they fit one skeleton:

```
Controller ── (Plan → Code → Execute → Parse → Refine)* ── Aggregate ── submission.csv
```

</div>

<div class="grid grid-cols-3 gap-3 mt-3 text-xs">
<div class="p-2 bg-gray-50 rounded border">

### Role (unified)
1. **Controller / search driver**
2. **Planner / Designer**
3. **Coder / Implementer**
4. **Executor + Parser**
5. **Refiner / Selector**

Candidates kept alive on disk, bounded by wall-clock + call count.

</div>
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### AI-Build-AI
- 5 Claude-SDK sub-agents; one **persistent Manager** LLM with MCP tool-calls
- Two-mode coder: `coder` (1-epoch smoke test) vs `tuner` (full run)
- Pydantic-typed I/O between agents
- Safety hooks: restricted write dirs, bash guards, daily-budget sleeps
- Default: `claude-sonnet-4-6`

</div>
<div class="p-2 bg-green-50 rounded border border-green-200">

### MLEvolve
- 8 prompt-based agents; search is **Monte Carlo Graph Search** over `SearchNode` journal
- UCT with time-aware explore/exploit, branch fusion after 50 % of budget
- **Global memory** (BM25 + FAISS) across runs
- Dedicated `code_review_agent` pre-execution gate
- Default: `gpt-5.4`

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Shared:</strong> both iterate plan→code→execute→refine; both keep a hall-of-fame; both aggregate into one <code>submission.csv</code>. <strong>Differ:</strong> search topology (linear state machine vs MCGS) and safety layer (SDK hooks vs prompt-based review).
</div>

---

# Leaderboard snapshot — live from 🤗 Space, 2026-04-23

<div class="text-xs mt-3">

| Agent | `figraph` AUC | `arxiv-citation` AUC | `ibm-aml` F1 | `ieee-fraud` AUC | **Avg** |
|---|:-:|:-:|:-:|:-:|:-:|
| `open-aibuildai-claude-sonnet-4-6` | **0.890** 🥇 | **0.777** 🥇 | **0.171** 🥇 | 0.926 | **0.691** 🥇 |
| `aibuildai-claude-sonnet-4-6` | 0.819 | 0.772 | 0.169 | **0.928** 🥇 | **0.672** 🥈 |
| **`graphloomer-claude-sonnet-4-6`** (ours) | **0.842** 🥈 | 0.701 | 0.159 | 0.851 | **0.638** 🥉 |
| `mlevolve-gpt-5.4` | 0.810 | 0.768 | 0.077 | 0.891 | 0.637 |

</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Honest reading:</strong> our harness is competitive but <em>not SOTA</em> across all tasks. On <code>figraph</code> it clears both AI-Build-AI variants we bench against; on the other three it trails. The win we actually want to demonstrate is <strong>not</strong> "we beat the leader" — it's that the <em>graph-feature patterns</em> our pipeline discovers are <em>transferable</em>. Next two slides set this up.
</div>

---

# Discovered graph-feature patterns are transferable

<div class="text-sm mt-3">

**Claim.** Our pipeline may not be SOTA end-to-end, but it *discovers good graph-pattern features*. If that claim is true, dropping those features into a strong tabular harness should lift it — without touching the rest of the harness.

</div>

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Setup

- Take **MLEvolve's best `solution.py`** per task (100% tabular — never reads the graph)
- Wrap only the CSV pre-loader so the 5 `gp_*` graph-pattern columns reach the feature matrix
- **Byte-for-byte unchanged**: preprocessing, XGB+LGBM / transformer-tab stacks, thresholding, early-stopping
- Any Δ must come from the 5 added columns

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Why this is a clean test

- Separates *feature discovery* (our contribution) from *search orchestration* (MLEvolve's contribution)
- The `solution.py` was already tuned by MLEvolve's 8-agent loop — any extra signal is strictly from the graph side
- Works as a sanity check that our `gp_*` aggregator is a **portable addon**, not a method tied to our controller
- Same 5 columns applied to 3 different task types (anomaly / future-prediction / minority-F1)

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
If the patterns generalize, MLEvolve's tabular best gets better with zero changes to its code. That is the bar.
</div>

---

# Discovered graph-feature patterns are transferable

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">
<div>

### 5 graph-pattern columns (distilled)

- `gp_degree_z` — hub/periphery flag (topology only)
- `gp_train_neighbor_count` — neighborhood size
- `gp_neighbor_label_pos_frac` — classical label-prop, leakage-masked
- `gp_neighbor_label_variance` — **mixed/bridge flag** (new)
- `gp_cosine_weighted_label` — **feature-similarity-weighted label-prop** (new, free-form origin)

Surfaced by the failure-pattern miner over 500 misclassified val rows / round across 8 canonical clusters (hub, isolated, homophily violation, bridge, feature-cohesion outlier, …).

</div>
<div>

### Addon Δ on MLEvolve best `solution.py`

| Task | Unpatched val | + `gp_*` val | Δ |
|---|---:|---:|---:|
| `figraph` | 0.8025 | **0.8100** | **+0.0075** |
| `arxiv-citation` | 0.7341 | **0.7384** | **+0.0043** |
| `ibm-aml` (val F1) | 0.036 | **0.082** | **+130 % rel.** |

3 / 3 tasks lifted on a harness that never read the graph. Arxiv patched val (0.7384) even clears the leaderboard #1 on MLEvolve's own slice.

</div>
</div>

<div class="mt-3 p-2 bg-green-50 rounded border border-green-300 text-xs">
<strong>Read:</strong> the 5 columns carry signal XGB+LGBM cannot recover from the raw tabular view alone. Claim supported — the <em>features</em> are portable even though our harness isn't SOTA end-to-end.
</div>

---

# Insights

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Method-side

1. **Failure-pattern mining beats per-row failure chat.** Analyzing 500 misclassified rows at once surfaces clusters (homophily violation, hub, bridge) that single-row inspection misses — and the percentages literally travel into the LLM's feature proposals as justification.
2. **Free-form python op > structured catalog** when a pattern couples edge construction + aggregation (e.g., cosine-weighted label aggregation). Sandbox + leakage gate are non-negotiable.
3. **Graph signal is distillable.** 5 columns encode what the full pipeline learns. Ship the columns, not the pipeline.

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Production-side (Observability is important)

- Their shipped product behaves like **a CFO-style coworker with deep finance-data access** — not a fully-automated pipeline; the system narrates what it saw, what it tried, and why it picked the number it did
- Customers buy *trust + iteration*, not end-to-end autonomy
- ⇒ we need **human-in-the-loop hooks** (mid-run edits, "why did you pick X?" queries, approve/reject feature ops) even if the underlying search is autonomous
- Trust comes step-by-step: suggestion-mode → accept-mode → full autonomy per customer maturity

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Both insights point the same direction: expose the <em>patterns</em> (why a node failed, which feature family is proposed, what the leaderboard says) as first-class interaction surfaces, not hidden search state.
</div>

---

# Next step — extending to a multi-agent system

<div class="grid grid-cols-2 gap-6 mt-8 text-sm">
<div class="p-4 bg-blue-50 rounded border border-blue-200">

### Option A — build our own

- Promote the 5-role skeleton (controller / planner / coder / executor / refiner) into a **graph-native harness**
- Reuse MLEvolve's MCGS + global memory
- Add a **DiagnosisAgent** with the failure-pattern skill as a first-class tool (already built in GraphLoomer)
- Expose HITL breakpoints at diagnosis + feature-proposal stages (Sapien insight)

</div>
<div class="p-4 bg-green-50 rounded border border-green-200">

### Option B — augment SOTA harnesses

- Ship a **graph-tool plugin** to MLEvolve / AI-Build-AI: `get_failure_patterns`, `graph_aggregate`, `add_graph_pattern_features`
- Zero changes to their controller / search — just more tools in the catalog
- Measured directly on GraphTestbed
- Lower cost, faster to iterate, broader impact

</div>
</div>
