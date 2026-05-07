---
theme: default
title: "GraphML-FS — Native Feature Search + Cross-Class Ensemble"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# GraphML-FS — Native Feature Search + Cross-Class Ensemble

## A graph-native ML harness that wins 3 / 4 GraphTestbed tasks

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · May 2026
</div>

---

# Recap

<div class="text-sm mt-4">

Prior deck: <a href="https://zhuconv.github.io/slides-hub/graphagent-4023/1" target="_blank" class="text-blue-700 underline">zhuconv.github.io/slides-hub/graphagent-4023</a>

</div>

<div class="p-4 mt-4 bg-blue-50 rounded border border-blue-200 text-sm">

### Where we left off (April 2026)

- A 5-role ML-engineering harness (`GraphLoomer`) — won the *transferability* test (5 hand-distilled `gp_*` graph-pattern columns lift MLEvolve's best on 3/3 tasks), but only **3rd of 4** end-to-end on the public leaderboard.
- The features were **manually distilled** from failure-pattern mining — not produced by the pipeline as a first-class artifact.

### What this sprint changes

- **Promote feature search to the core abstraction.** Replace the 5-role design loop with a controller that proposes / validates / materializes / evaluates atomic features in a typed lane catalog, and stitches them into feature sets persisted to a sqlite store.
- **Replace single-model predict with a generic cross-class probabilistic ensemble.**

</div>

---

# System overview

<div class="flex justify-center mt-2">
<img src="/search_loop.svg" class="mx-auto" style="max-height: 70vh; max-width: 95vw;" />
</div>

<div class="text-xs mt-3 opacity-80 text-center">
LLM-driven boxes = lavender; deterministic compute = blue; persistent state = green; I/O = yellow.
</div>

---

# Lane catalog — what the worker LLM is allowed to propose

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Local (single-table) lanes

- **`direct_numeric`** — pass through a numeric column as-is
- **`local_column_transform`** — `log1p`, `clip`, `bucket`, etc. on one column
- **`local_expr`** — DSL expression over base columns (`amount × is_external`)
- **`sparse_cross`** — categorical × categorical hashed cross

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Relational lanes  (per relation pair, time-respecting)

- **`shared_key_group_aggregate`** — join + group-by + agg on a shared FK
- **`account_history`** — windowed aggregates over the prediction-unit's own history
- **`account_static_aggregate`** — `(table, agg, value_col)` snapshot at event time
- **`account_mixed_history`** — 3-step relational walk (e.g. tx → sender → tx_pool)

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Why a typed catalog:</strong> caps the LLM's degree of freedom to options the materializer can validate (DSL gate, time-policy, leakage check). 119 sonnet proposals × ibm-aml had 37 % SQL failures; a free-form prompt would be much worse.
</div>

---

# Inside one search round (× N rounds)

<div class="text-sm mt-4">

Each round is a 7-step pipeline driven by a rule-based controller; the LLM is consulted only for step 1.

</div>

<div class="grid grid-cols-2 gap-3 mt-3 text-sm">
<div class="p-3 bg-purple-50 rounded border border-purple-200">

1. **Worker (LLM)** proposes `AtomicFeatureProposalBatch` within the round's `AllowedSpace`
2. **Canonicalize + validate** — DSL gate, time policy, temporal-asof leakage
3. **Materialize** in DuckDB → one parquet per accepted spec (with `edge_preaggregate` fused-join optimization for relational walks)

</div>
<div class="p-3 bg-blue-50 rounded border border-blue-200">

4. **Univariate evaluator** — per-feature score on val under the task primary metric
5. **FeatureSetBuilder** assembles 5 candidate sets: `base_only`, `all_accepted`, `top_k_per_lane`, `global_top_k`, `low_redundancy_top_k`
6. **Multivariate evaluator** — set-level fit on train, score on val
7. **Controller** writes round summary, picks `AllowedSpace` for round k+1

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Everything but step 1 is deterministic. <code>store.sqlite</code> persists features, evaluations, rounds — the whole run is replayable from a single dir.
</div>

---

# Predict + cross-class probabilistic ensemble

<div class="flex justify-center mt-2">
<img src="/ensemble.svg" class="mx-auto" style="max-height: 65vh; max-width: 95vw;" />
</div>

<div class="text-xs mt-3 opacity-80 text-center">
3 model classes × n_seeds members fit on the same train ∪ val, two-stage roll-up, single threshold sweep on aggregated val proba.
</div>

---

# Leaderboard — first on 3 / 4 tasks

<div class="text-xs mt-3">

Single submission `graphfs-claude-sonnet-4-6` (the system in this deck — `graphml run` with sonnet-4-6 → `graphml ensemble`):

| Task | Metric | **GraphML-FS** | rank | next-best | gap |
|---|:-:|---:|:-:|---:|:-:|
| `figraph` | AUC-ROC | **0.895** | **#1** | 0.890 (open-aibuildai) | +0.005 |
| `arxiv-citation` | AUC-ROC | **0.789** | **#1** | 0.777 (open-aibuildai) | +0.012 |
| `ibm-aml` | F1 (minority) | **0.184** | **#1** | 0.171 (open-aibuildai) | +0.013 |
| `ieee-fraud-detection` | AUC | 0.921 | #3 | 0.928 (aibuildai) | −0.007 |

</div>

<div class="mt-3 p-2 bg-blue-50 rounded border border-blue-200 text-xs">
<strong>Headline</strong>: GraphML-FS is the only system on <a href="https://huggingface.co/spaces/lanczos/graphtestbed">graphtestbed</a> that holds first place on more than one task — and is within 0.7 % of the leader on the one task it doesn't lead.
</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The decisive lifts on <code>ibm-aml</code> (+1.3 pp F1) and <code>arxiv-citation</code> (+1.2 pp AUC) come from the relational lanes — <code>shared_key_group_aggregate</code> + 3-step <code>account_mixed_history</code> on ibm-aml; <code>account_history</code> joins on paperAuthors / paperCategories on arxiv. Competitors run single-table tabular harnesses and never construct these.
</div>

---

# Ablation — where do the wins come from? (`ibm-aml`, F1)

<div class="text-sm mt-3">

Offline ablation on the autoresearch <code>gpt-5.4</code> run dir — same matrix, same ensemble code, only the **input / extras** change:

| Config | val F1 | **test F1** | Δ vs prior | what's responsible |
|---|---:|---:|---:|---|
| `base_only` (raw 7 cols) + single hist_gbdt | 0.136 | 0.103 | — | baseline |
| `base_only` + 3-class ensemble | 0.132 | 0.148 | +0.045 | ensemble alone (small) |
| 51 searched features + 3-class ensemble | 0.358 | **0.309** | +0.16 | **search-time atomic features** |
| 51 searched + ensemble + neg-undersample (offline) | — | **0.591** | +0.28 | NS head for imbalance — not in <code>main</code> branch yet |

</div>

<div class="mt-3 grid grid-cols-2 gap-3 text-xs">
<div class="p-2 bg-blue-50 rounded border border-blue-200">

**Search features = ~3× lift over raw.**  Test 0.103 → 0.309 with everything else fixed. The LLM-proposed atomic features in the relational lanes are the dominant component on `ibm-aml`.

</div>
<div class="p-2 bg-purple-50 rounded border border-purple-200">

**NS as a future leaderboard push.**  An offline experiment showed +0.28 on top of search+ensemble (0.309 → 0.591). Lives on a feature branch; only fires for binary-imbalanced minority_f1 with lightgbm. Easy to merge — the path to a strict 4/4 leaderboard sweep.

</div>
</div>

---

# Cross-LLM ablation — `gpt-5.4` vs `sonnet-4-6` on `ibm-aml`

<div class="text-sm mt-3">

Same SearchLaneBuilder, same `AllowedSpace`, same evaluator. Different LLM picks → different feature pool.

</div>

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### `gpt-5.4` (autoresearch-ibm-aml-may2)
- 87 proposals, **0 % materialize-fail**
- Lane distribution = **concentrated bets**:
  - 28 features on the same canonical 3-step path (account_mixed_history)
  - **13 `shared_key_group_aggregate`**
- best fs val F1 = **0.022**, ensemble test = **0.309**

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### `sonnet-4-6` (graphfs-claude-sonnet-4-6)
- 119 proposals, **37 % materialize-fail** (75 surviving)
- Lane distribution = **spread thin**:
  - 28 account_mixed_history features split across 6 direction variants
  - **0 `shared_key_group_aggregate`** (dropped this lane entirely)
- best fs val F1 = **0.013**, ensemble test = **0.184**

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Reading:</strong> the proportional gap on val (−41 %) propagates almost exactly to the gap on test (−40 %). Sonnet's "more features, more direction variants" exploration is <em>quantitatively richer but qualitatively worse</em> for this severely imbalanced fraud-detection task. Lane coverage matters more than proposal count.
</div>

---

# What's open

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Search side

- **K-fold OOF for ensemble members** (MLTeam-inspired) — replaces "n_seeds same split" with cross-validated diversity, gives lossless val proba
- **Probability calibration** before across-class aggregate (Platt / isotonic)
- **Lane meta-prior**: route the worker's budget toward the lanes with highest historical lift on the current task type

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### Predict side

- **Auto-NS**: detect binary-imbalanced task, fire neg-undersampling without flag
- **Member selector via LLM**: read val curves + drop_below_ratio diagnostics, pick member set instead of running all 3
- **Submit-time threshold-margin**: small positive offset to regularize against val-overfit

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
The pipeline is now a single binary on `main`: <code>graphml run</code> → <code>graphml ensemble</code> → submission.csv. 39 tests; 3 commits ahead of <code>graphagent-4023</code>'s state.
</div>

<div class="mt-2 text-xs opacity-60">
🤗 <a href="https://huggingface.co/spaces/lanczos/graphtestbed">lanczos/graphtestbed</a> · code: <code>github.com/zhuconv/AgenticFS</code> · branch <code>main</code>
</div>
