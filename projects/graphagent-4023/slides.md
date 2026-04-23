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

# Recap: Previous Meeting (April 8)

<div class="grid grid-cols-2 gap-6 mt-2">
<div class="p-3 bg-blue-50 rounded border border-blue-200 text-sm">

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
<div class="p-3 bg-green-50 rounded border border-green-200 text-sm flex flex-col justify-center">

### Slides from last time
<a href="https://zhuconv.github.io/slides-hub/graph-analyst-0408/1" target="_blank" class="text-blue-700 underline">
zhuconv.github.io/slides-hub/graph-analyst-0408
</a>

<div class="mt-3 opacity-70">
This deck: what we did in the last sprint — a leaderboard, two baselines, and a generalizable trick that lifts them.
</div>

</div>
</div>

---

# 1 · GraphTestbed — a Kaggle-style leaderboard

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
# ✓ Scored  primary (auc_roc): 0.844  rank: #1
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

Leaderboard · [huggingface.co/spaces/lanczos/graphtestbed](https://huggingface.co/spaces/lanczos/graphtestbed)  
Repo · [github.com/zhuconv/GraphTestbed](https://github.com/zhuconv/GraphTestbed)

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Point:</strong> the leaderboard is the objective function. Any harness we build gets scored against the same CSV contract — no more hidden train/val leaks.
</div>

---

# 2 · Two baselines under one minimal framework

<div class="text-sm mt-2">

Both are LLM-driven ML-engineering agents wired into GraphTestbed via `agents/ai_build_ai/` and `agents/mlevolve/`. Read through the source code + paper — they fit one skeleton:

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
- Default: `gpt-5.3-codex-spark`

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>What is shared:</strong> both iterate plan→code→execute→refine; both keep a hall-of-fame; both aggregate into one submission.csv. <strong>What differs:</strong> search topology (linear state machine vs MCGS) and safety layer (SDK hooks vs prompt-based review).
</div>

---

# Leaderboard snapshot (figraph · AUC-ROC)

<div class="text-sm mt-4">

| Rank | Agent | Test AUC-ROC | Note |
|:-:|---|:-:|---|
| prior #1 | `aibuildai-claude-sonnet-4-6` | 0.819 | leader to beat |
| — | `autopipe-dev-baseline` | 0.788 | prior GraphLoomer replay |
| #4 | `autopipe-dev` (champion) | 0.814 | 15-min budget, 4 free-form python ops |
| #2 | `gp-patterns-mle-style-baseline` | 0.842 | MLEvolve-style XGB+LGBM on raw 772 cols |
| **#1** | **`gp-patterns-mle-style`** | **0.844** | same ensemble + 5 `gp_*` cols → **+0.025 vs. prior leader** |

</div>

<div class="mt-4 p-2 bg-green-50 rounded border border-green-300 text-xs">
Beating the leader required (a) a leaderboard to measure against and (b) the 5 distilled columns — not a new harness. Next slide: <em>what</em> those columns are.
</div>

---

# 3 · Case study — why a tabular pipeline breaks on a hub

<div class="grid grid-cols-2 gap-4 mt-2 text-sm">
<div>

### Node `L601398` (figraph val set)

- Degree z-score: **+35.98** (hub)
- **2,444 unique neighbors**; 6,167 train-labeled
- Neighbor positive fraction: **0.069** — identical to the population base rate
- A plain `mean_neighbor_label` feature says "nothing" → MLEvolve's tabular solution misclassifies it

<div class="mt-3 p-2 bg-red-50 rounded border border-red-300 text-xs">
Naïve feature reads = base rate ⇒ the tree model sees an <em>average-looking</em> node even though it is an extreme hub.
</div>

</div>
<div>

### Naïve vs. `gp_*` features

| Feature | Naïve | `gp_*` augmented |
|---|---:|---:|
| Neighborhood signal | `mean_nbr_label = 0.069` (base rate) | `gp_degree_z = +35.98` |
| Aggregate | unweighted mean over 2,356 labeled nbrs | `gp_cosine_weighted_label` |
| Size encoding | absent | `gp_train_neighbor_count = 6,167` |
| Net | indistinguishable from avg | sharp, predictive |

<div class="mt-3 p-2 bg-green-50 rounded border border-green-300 text-xs">
One scalar (<code>gp_degree_z</code>) flips the feature vector from noise to 36-σ hub signature — <strong>no changes to the agent framework</strong>.
</div>

</div>
</div>

---

# 3 · The 5 reusable columns (H1 + H2 distilled)

<div class="text-sm mt-3">

From GraphLoomer's `dev` branch: bulk failure-pattern mining (500 failures / round, 8 canonical structural clusters) + free-form python op family. Three patterns survive as reusable tricks:

</div>

<div class="grid grid-cols-3 gap-3 mt-3 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Trick A — Neighbor-label variance
`gp_neighbor_label_variance`

Bridge / mixed neighborhoods: mean ≈ base rate is useless, but variance ≈ 0.25 flags genuine uncertainty. Topology + train marginals only.

</div>
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Trick B — Cosine-weighted nbr label
`gp_cosine_weighted_label`

Hub / feature-cohesion-gap cases: weight neighbors by `cos(self, neighbor)` on the caller's own numeric features. Catalog-external, free-form origin.

</div>
<div class="p-2 bg-blue-50 rounded border border-blue-200">

### Trick C — Degree z-score gating
`gp_degree_z`

Graph-only scalar; tells the tree "this is a hub" so it gates neighbor-aggregate features instead of averaging them into the base rate.

</div>
</div>

<div class="text-xs mt-3">
+ `gp_train_neighbor_count`, `gp_neighbor_label_pos_frac` — the supporting columns the three tricks ride on.<br/>
Shipped as a one-line import: <code>autopipe.data.graph_pattern_features.add_graph_pattern_features(df, edges, train_mask)</code>.
</div>

---

# 3 · Generalization test — patch MLEvolve's `solution.py`

<div class="text-sm mt-2">

Byte-for-byte unmodified MLEvolve best-solution files. Only the CSV pre-loader is wrapped so the 5 `gp_*` columns reach the feature matrix — identical preprocessing, identical XGB+LGBM / transformer-tab stacks, identical thresholding afterwards.

</div>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div>

### Patched MLEvolve `solution.py`

| Task | Unpatched val | Patched val | Δ |
|---|---:|---:|---:|
| `figraph` | 0.8025 | **0.8100** | **+0.0075** |
| `arxiv-citation` | 0.7341 | **0.7384** | **+0.0043** |

On arxiv the patched val (0.7384) clears the leaderboard #1 (0.736) on MLEvolve's own slice — a distribution-shift gap on the gtb test set remains.

</div>
<div>

### Third task — `ibm-aml` (F1 on 0.08 % minority)

| Metric | Baseline | +5 `gp_*` | Δ |
|---|---:|---:|---:|
| val AUC-ROC | 0.9252 | **0.9413** | +0.016 |
| val F1 (best thr.) | 0.036 | **0.082** | **+130 % relative** |

Test F1 at top-1.0 % threshold: 0.014 → **0.023** on the real leaderboard.

</div>
</div>

<div class="mt-3 p-2 bg-green-50 rounded border border-green-300 text-xs">
<strong>Read:</strong> 5 columns lift 3 out of 3 tasks on a framework that was 100 % tabular. The trick is <em>generalizable to any multi-agent ML harness</em>, not tied to our search loop.
</div>

---

# 4 · Insights

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Method-side

1. **Failure-pattern mining beats per-row failure chat.** Analyzing 500 misclassified rows at once surfaces clusters (homophily violation, hub, bridge) that single-row inspection misses — and the percentages literally travel into the LLM's feature proposals as justification.
2. **Free-form python op > structured catalog** when a pattern couples edge construction + aggregation (e.g., cosine-weighted label aggregation). But sandbox + leakage gate are non-negotiable.
3. **Graph signal is distillable.** 5 columns encode what the full pipeline learns. Ship the columns, not the pipeline.

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Product-side (Sapien co-founder / chief scientist chat)

- Their shipped product behaves like **a coworker with deep data access**, not a fully-automated pipeline
- Customers buy *trust + iteration*, not end-to-end autonomy
- ⇒ we need **human-in-the-loop hooks** (mid-run edits, "why did you pick X?" queries, approve/reject feature ops) even if the underlying search is autonomous
- Trust comes step-by-step: start with suggestion-mode → accept-mode → full autonomy per customer maturity

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Both insights point the same direction: expose the <em>patterns</em> (why a node failed, which feature family is proposed, what the leaderboard says) as first-class interaction surfaces, not hidden search state.
</div>

---

# 5 · Next step — extending to a multi-agent system

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div>

### Option A — build our own
- Promote the 5-role skeleton (controller / planner / coder / executor / refiner) into a **graph-native harness**
- Reuse MLEvolve's MCGS + global memory
- Add a **DiagnosisAgent** with the failure-pattern skill as a first-class tool (already built in GraphLoomer)
- Expose HITL breakpoints at diagnosis + feature-proposal stages (Sapien insight)

</div>
<div>

### Option B — augment SOTA harnesses
- Ship a **graph-tool plugin** to MLEvolve / AI-Build-AI: `get_failure_patterns`, `graph_aggregate`, `add_graph_pattern_features`
- Zero changes to their controller / search — just more tools in the catalog
- Measured directly on GraphTestbed
- Lower cost, faster to iterate, broader impact

</div>
</div>

<div class="mt-4 text-sm">

### Concrete plan for next sprint

1. **Week 1** — Package `failure_patterns` + `graph_pattern_features` as an MCP server → drop-in for any agent harness
2. **Week 2** — Submit augmented MLEvolve / AI-Build-AI runs on all 4 GraphTestbed tasks; compare against bare harnesses
3. **Week 3** — Prototype HITL breakpoint at the diagnosis stage; user study with 1–2 beta testers
4. **Week 4** — Write up: "Graph-aware tools lift tabular LLM-agent harnesses across tasks"

</div>

<div class="mt-3 p-2 bg-green-50 rounded border border-green-300 text-xs">
Bet: Option B ships a paper + a public leaderboard result in 4 weeks; Option A is a 2-quarter project. Do B first, iterate A underneath.
</div>

---
layout: center
class: text-center
---

# Questions?

<div class="mt-6 text-sm opacity-70">

GraphTestbed · [github.com/zhuconv/GraphTestbed](https://github.com/zhuconv/GraphTestbed) · [🤗 lanczos/graphtestbed](https://huggingface.co/spaces/lanczos/graphtestbed)

Prior deck · [zhuconv.github.io/slides-hub/graph-analyst-0408](https://zhuconv.github.io/slides-hub/graph-analyst-0408/1)

</div>
