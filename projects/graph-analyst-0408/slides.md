---
theme: default
title: "GraphAnalyst: Bilevel Pipeline Optimization"
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

# GraphAnalyst — Bilevel Pipeline Optimization

## Generalizing LLM-Agent Anomaly Detection Across Datasets

<div class="abs-br m-6 text-sm opacity-50">
Jiajun Zhu · UT Austin · April 2026
</div>

---

# Recap: Previous Meeting

<div class="grid grid-cols-2 gap-8 mt-2">
<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">

### System Overview
- LLM-agent pipeline for graph anomaly detection
- **Phase 0**: Automatic model selection
- **Phase 1**: LLM analyst (subgraph reasoning)
- **Phase 2**: Feature engineering + retrain
- **EvoAgent**: Structured evolutionary feature search

</div>
<div class="p-4 bg-green-50 rounded-lg border border-green-200">

### Previous Results (YelpChi only)

| Method | Recall | F1 |
|--------|:------:|:--:|
| Free-form + GraphSAGE | 0.622 | 0.821 |
| Free-form + XGB-Graph | 0.815 | 0.869 |
| **EvoAgent + XGB** | **0.847** | **0.901** |

- System only tested on YelpChi
- Hardcoded dataset-specific logic
- No support for edgeless/tabular datasets

</div>
</div>

<div class="mt-4 p-3 bg-yellow-50 rounded border border-yellow-300 text-sm">
<strong>Goal this sprint:</strong> Generalize pipeline to ANY dataset + add bilevel optimization
</div>

---

# What Changed: Generalization + Bilevel

<div class="grid grid-cols-2 gap-6 mt-2">
<div>

### 1. Dataset-Agnostic Pipeline
- **5 datasets**: YelpChi, Amazon, IEEE-CIS, IBM AML (account), IBM AML TX (transaction)
- **7 model types**: GraphSAGE, GCN, XGB, RF, MLP, TabTransformer, RNN Context
- `DatasetConfig` registry: each dataset declares capabilities
- Edgeless support: transaction context instead of subgraph reasoning
- `metric_weights` per dataset: 0.6×recall + 0.4×f1 (Yelp), 1.0×auc_roc (IEEE)

</div>
<div>

### 2. Bilevel Optimization (`--bilevel`)
- **Outer loop**: evolve pipeline candidates (model, loss, hyperparams)
- **Inner loop**: per-pipeline Phase A (failure analysis) + Phase B (feature engineering)
- Phase A: Cohen's d separability on val failures → identify discriminative features
- Phase B: Generate feature interactions → L1 validate → retrain → compare
- Each pipeline gets its own targeted improvement

</div>
</div>

<div class="mt-3">

### 3 Datasets Tested

| Dataset | Nodes | Edges | Anomaly % | Domain | Gold Metric |
|---------|------:|------:|:---------:|--------|:-----------:|
| **YelpChi** | 45K | 8M | 14.5% | Review fraud | 0.6R+0.4F1 |
| **IEEE-CIS** | 590K | 2.7M | 3.5% | Card fraud | AUC-ROC |
| **IBM AML TX** | 5M | 0 | 0.1% | Money laundering | Minority F1 |

</div>

---
layout: center
class: p-0
---

<img src="/fig1_overview.png" class="mx-auto" style="max-height: 95vh; max-width: 95vw;" />

---
layout: center
class: p-0
---

<img src="/fig2_inner_loop.png" class="mx-auto" style="max-height: 95vh; max-width: 95vw;" />

---

# Results

<div class="mt-2">

### Bilevel Val Improvement (Phase A+B per pipeline)

| Dataset | Champion | Base (val) | + Phase A+B | Δ | Pipelines Improved |
|---------|----------|:----------:|:-----------:|:-:|:------------------:|
| **YelpChi** | XGB-Graph | 0.794 | **0.804** | +1.0pp | 4/5 |
| **IEEE-CIS** | RF-Graph | 0.933 | 0.933 | — | 1/5 (XGB +0.5pp) |
| **IBM AML TX** | RNN Context | 0.587 | **0.593** | +0.6pp | 2/4 |

### Test Set Generalization

| Dataset | Base (test) | + Phase A+B (test) | Δ | Generalizes? |
|---------|:-----------:|:------------------:|:-:|:------------:|
| **IEEE-CIS** | 0.918 (AUC-ROC) | **0.922** | **+0.4pp** | ✅ |
| YelpChi | 0.794 (composite) | 0.781 | -1.2pp | ❌ |
| IBM AML TX | 0.776 (MinF1) | 0.582 | -19.4pp | ❌ |

</div>

<div class="mt-3 p-3 bg-green-50 rounded border border-green-300 text-sm">
<strong>IEEE-CIS: real test improvement.</strong> YelpChi & IBM AML TX: val overfit — feature interactions fit val noise.
</div>

---

# Conclusions & Next Steps

<div class="grid grid-cols-2 gap-6 mt-4">
<div>

### What Works ✅
- **Pipeline generalization**: 5 datasets, 7 models, dataset-agnostic
- **Bilevel architecture**: nested Phase A+B per pipeline, error-driven
- **Phase A**: Cohen's d separability identifies useful features
- **IEEE-CIS**: +0.4pp AUC-ROC on test — real generalization
- **Phase 0 auto-selection**: RNN for edgeless, XGB for graph datasets

</div>
<div>

### What Doesn't Work ❌
- **Val overfitting**: Feature interactions overfit small val sets
  - IBM AML TX: 443 val positives at 0.1% rate
  - YelpChi: val improvement doesn't transfer to test
- **SDK Phase B**: Claude Code prefers Bash over MCP tools
- **Budget management**: IBM AML TX exceeds 7200s timeout

</div>
</div>

<div class="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-300">

### Next Steps: Fixing Val→Test Generalization
1. **Cross-validation in inner loop** — k-fold on train set instead of single val split
2. **Feature complexity regularization** — limit interaction depth for small val sets
3. **Holdout validation** — split val into val-search + val-eval to detect overfitting
4. **Ensemble stability** — require improvement on multiple random seeds
5. **Investigate**: why IEEE-CIS generalizes but Yelp/IBM don't (val size? imbalance ratio?)

</div>

---
layout: center
---

# Thank You

<div class="mt-8 text-lg">

`python -m agent.orchestrator --pilot c --dataset <name> --bilevel --rounds 1`

GitHub: [zhuconv/GraphAgent](https://github.com/zhuconv/GraphAgent)

</div>
