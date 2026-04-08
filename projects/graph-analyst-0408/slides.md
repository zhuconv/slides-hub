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

# What Changed

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

### Generalized Pipeline
- **3 datasets**, **7 model types** (GNN, tree, MLP, RNN)
- `DatasetConfig` registry: dataset-specific metrics, models, capabilities
- Edgeless dataset support (IBM AML TX: 5M nodes, no graph)

</div>
<div>

### Bilevel Optimization
- **Outer loop**: evolve pipeline (model + loss + hyperparams)
- **Inner loop**: per-pipeline Phase A (failure analysis) + Phase B (feature engineering + retrain)

</div>
</div>

<div class="mt-6">

### Datasets

| Dataset | Nodes | Edges | Anomaly % | Domain | Metric |
|---------|------:|------:|:---------:|--------|:------:|
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

<div class="text-sm">

| Dataset | Pipeline | Val Base→Bilevel | Test Base→Bilevel | Generalizes? |
|---------|----------|:----------------:|:-----------------:|:------------:|
| **YelpChi** | XGB | 0.794 → **0.804** (+1.0) | 0.794 → 0.781 (-1.2) | ❌ |
| **IEEE-CIS** | XGB | 0.918 → **0.923** (+0.5) | 0.918 → **0.922** (+0.4) | ✅ |
| **IBM AML TX** | RNN | 0.587 → **0.593** (+0.6) | 0.776 → 0.582 (-19.4) | ❌ |

</div>

<div class="mt-2 p-2 bg-green-50 rounded border border-green-300 text-sm">
✅ <strong>IEEE-CIS: val → test generalizes (+0.4pp AUC-ROC)</strong><br/>
❌ YelpChi & IBM AML TX: val improves but test degrades (overfit)
</div>

---

# Conclusions & Next Steps

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

### What Works ✅
- **Generalized pipeline**: 3 datasets, 7 models, one command
- **Bilevel Phase A+B improves val** on all datasets
- **IEEE-CIS**: +0.4pp AUC-ROC generalizes to test

### What Doesn't ❌
- **Val overfitting**: feature interactions overfit small val sets
  - IBM AML TX: 443 val positives → severe overfit
  - YelpChi: marginal val gains don't transfer

</div>
<div>

### Next Steps
1. **Cross-validation** in inner loop (k-fold instead of single val split)
2. **Holdout validation** — split val into search + eval to detect overfitting
3. **Investigate** why IEEE-CIS generalizes but others don't

</div>
</div>

