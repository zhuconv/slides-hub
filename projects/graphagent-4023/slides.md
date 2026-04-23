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

## From a hardcoded pipeline to a hosted benchmark + LLM-agent baselines

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

- **GraphAnalyst bilevel pipeline** on 3 datasets / 7 model types — generalized val→test on IEEE-CIS (+0.4 AUC-ROC) but overfit on small-val tasks (YelpChi, IBM AML)

### Open problems this sprint closes

- Evaluation still runs **locally** — agents could `pd.concat([train, val, test])` and peek at test labels
- **No comparison** against LLM-agent baselines for tabular-graph ML

</div>

---

# GraphTestbed — a Kaggle-style leaderboard

<div class="grid grid-cols-2 gap-6 mt-3 text-sm">
<div>

### Why a hosted API, not local eval

- **Server-side GT** — agent can't `pd.concat([train, val, test])` because test labels never ship
- **5 submissions / day / IP / task**, scores rounded to 3dp → score-probing is statistically uninformative on a 19k-row test set

</div>
<div>

### Tasks live today

| Task | Metric | Test rows |
|---|:-:|---:|
| `figraph` | AUC-ROC | 3,596 |
| `arxiv-citation` | AUC-ROC | 193,696 |
| `ibm-aml` | F1 (minority) | 863,900 |
| `ieee-fraud-detection` | AUC-ROC | 506,691 |

</div>
</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Point:</strong> the leaderboard is the objective function — any harness we build gets scored against the same CSV contract, no hidden train/val leaks.
</div>

<div class="mt-2 text-xs opacity-60">
🤗 <a href="https://huggingface.co/spaces/lanczos/graphtestbed">lanczos/graphtestbed</a> · <a href="https://github.com/zhuconv/GraphTestbed">github.com/zhuconv/GraphTestbed</a>
</div>

---

# Introduction of Two SOTA Baselines

<div class="text-sm mt-2">

**Same 5-role skeleton, two search topologies.** Both are LLM-driven ML-engineering agents, wired into GraphTestbed via `agents/ai_build_ai/` and `agents/mlevolve/`:

```
Controller ── (Plan → Code → Execute → Parse → Refine)* ── Aggregate ── submission.csv
```

</div>

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### AI-Build-AI — Manager-driven sequential search

- **Controller**: a persistent Claude-SDK **Manager LLM** that picks the next tool each turn along a canonical pipeline (`setup → designer → coder(smoke) → coder(tuner) → designer(reviser) → aggregator`), with N candidate designs alive in parallel
- **Safety layer**: SDK hooks (restricted write dirs, bash guards, daily-budget sleeps)

</div>
<div class="p-3 bg-green-50 rounded border border-green-200">

### MLEvolve — Monte Carlo Graph Search

- **Controller**: **UCT search** over a `SearchNode` journal, multiple branches alive in parallel with time-aware explore/exploit and cross-branch fusion after 50 % of budget (LLM called per node to expand)
- **Safety layer**: dedicated `code_review_agent` pre-execution gate

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Both call an LLM to expand a candidate, keep a hall-of-fame on disk, and aggregate into one <code>submission.csv</code>. The difference is <em>how candidates are organized</em> — sequential pipeline vs. UCT tree — which is what actually changes behavior at budget limits.
</div>

---

# Leaderboard snapshot

<div class="text-xs mt-3">

**GraphLoomer** = our harness: GraphAnalyst's bilevel pipeline (0408 deck) wired through the 5-role skeleton, plus a bulk failure-pattern mining skill + free-form python op family.

</div>

<div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
<strong>Honest reading, up front:</strong> our harness is <em>not</em> SOTA end-to-end — we're 3rd of 4 on average. What the next two slides argue is a narrower but sharper win: the <em>graph-feature patterns</em> our pipeline discovers are <strong>transferable</strong> — they lift MLEvolve's own best solution by zero-code changes.
</div>

<div class="text-xs mt-3">

| Agent | `figraph` AUC | `arxiv-citation` AUC | `ibm-aml` F1 | `ieee-fraud` AUC | **Avg** |
|---|:-:|:-:|:-:|:-:|:-:|
| `open-aibuildai-claude-sonnet-4-6` † | **0.890** | **0.777** | **0.171** | 0.926 | **0.691** |
| `aibuildai-claude-sonnet-4-6` | 0.819 | 0.772 | 0.169 | **0.928** | **0.672** |
| **`graphloomer-claude-sonnet-4-6`** (ours) | **0.842** | 0.701 | 0.159 | 0.851 | **0.638** |
| `mlevolve-gpt-5.4` | 0.810 | 0.768 | 0.077 | 0.891 | 0.637 |

<div class="opacity-60 mt-1">† <code>open-aibuildai-*</code> = <strong>our reproduction</strong> (AI-Build-AI only released a binary on GitHub, so we re-implemented it from source); <code>aibuildai-*</code> = upstream binary. Both use <code>claude-sonnet-4-6</code>.</div>

</div>

---

# Transferability test — setup

<div class="text-sm mt-4">

**Claim.** Our pipeline may not win end-to-end, but the features it *discovers* should be strong enough that dropping them into a tuned tabular harness lifts it — with zero changes to the harness.

</div>

<div class="p-4 mt-5 bg-blue-50 rounded border border-blue-200 text-sm">

### Protocol

1. **Take MLEvolve's best `solution.py`** per task — 100 % tabular, never reads the graph, already tuned by MLEvolve's 8-agent loop
2. **Wrap only the CSV pre-loader** so the 5 `gp_*` graph-pattern columns reach the feature matrix
3. **Byte-for-byte unchanged** everywhere else — preprocessing, XGB+LGBM / transformer-tab stacks, thresholding, early-stopping
4. **Any Δ must come from the 5 added columns** — this isolates *feature discovery* (our contribution) from *search orchestration* (MLEvolve's)

</div>

<div class="mt-4 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Why this matters: if the addon lifts the harness on <em>every</em> task, the <code>gp_*</code> aggregator is a portable artifact, not a method bolted to our specific controller.
</div>

---

# Transferability test — patterns lift MLEvolve's best on 3/3 tasks

<div class="grid grid-cols-2 gap-4 mt-4 text-sm">
<div>

### 5 graph-pattern columns (distilled)

- `gp_degree_z` — hub/periphery flag
- `gp_train_neighbor_count` — neighborhood size
- `gp_neighbor_label_pos_frac` — leakage-masked label-prop
- `gp_neighbor_label_variance` — **mixed/bridge flag** (new)
- `gp_cosine_weighted_label` — **feature-similarity-weighted label-prop** (new, free-form origin)

<div class="text-xs opacity-70 mt-2">Mined from 500 misclassified val rows / round — see 0408 deck for pipeline details.</div>

</div>
<div>

### Addon Δ on MLEvolve best `solution.py`

| Task | Unpatched val | + `gp_*` val | Δ |
|---|---:|---:|---:|
| `figraph` | 0.8025 | **0.8100** | **+0.0075** |
| `arxiv-citation` | 0.7341 | **0.7384** | **+0.0043** |
| `ibm-aml` (val F1) | 0.036 | **0.082** | +0.046 abs. |

<div class="text-xs opacity-70 mt-1">Caveat: ibm-aml baseline F1=0.036 is near-broken, so the "+130 % relative" is flattering; the absolute gain +0.046 is the honest number.</div>

</div>
</div>

---

# What we learned

<div class="grid grid-cols-2 gap-4 mt-3 text-sm">
<div class="p-3 bg-blue-50 rounded border border-blue-200">

### Method-side

1. **Should we keep the structured catalog (with free-form python op support)?** **Yes.** When a pattern couples edge construction + aggregation (e.g., cosine-weighted label aggregation), the free-form escape hatch is essential — but the structured catalog is what saves most of the debug effort. Without any constraint, some bugs are always unexpected; the catalog acts as a guardrail and free-form is the release valve.
2. **Do graph-pattern features as first-class support actually help?** **Yes — but the lift is modest in our current runs.** Likely a function of the current environment / data, or that we haven't given the design a long full-budget run yet. Worth confirming with longer sweeps before scaling the abstraction.

</div>
<div class="p-3 bg-purple-50 rounded border border-purple-200">

### Production-side — observability is important

<div class="text-xs opacity-70 mb-1">Signal from chat with Sapien's chief scientist, April 2026.</div>

- Their shipped product behaves like **a CFO-style coworker with deep finance-data access and traceability** — not a fully-automated pipeline
- Customers buy *trust + iteration*, not end-to-end autonomy
- ⇒ we need **human-in-the-loop hooks** (mid-run edits, "why did you pick X?", approve/reject feature ops) even when search is autonomous

</div>
</div>

<div class="mt-3 p-2 bg-yellow-50 rounded border border-yellow-300 text-xs">
Both sides point the same way: expose the <em>patterns</em> (why a node failed, which feature family is proposed, what the leaderboard says) as first-class interaction surfaces, not hidden search state.
</div>

---

# Next step

<div class="grid grid-cols-2 gap-6 mt-8 text-sm">
<div class="p-4 bg-blue-50 rounded border border-blue-200">

### Option A — build our own graph-native harness

- Promote the 5-role skeleton into a controller that uses failure-pattern mining as a first-class tool
- Reuse MLEvolve's MCGS + global memory

</div>
<div class="p-4 bg-green-50 rounded border border-green-200">

### Option B — ship a graph-tool plugin

- Package `get_failure_patterns`, `graph_aggregate`, `add_graph_pattern_features` as an **MCP server** — drop-in for MLEvolve / AI-Build-AI
- Zero changes to their controller — just more tools in the catalog

</div>
</div>
