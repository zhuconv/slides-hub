---
theme: default
title: "GraphAnalyst: EvoAgent"
drawings:
  persist: false
transition: slide-left
mdc: true
---

# GraphAnalyst — EvoAgent
## Evolutionary Feature Search for Graph Fraud Detection

Jiajun Zhu · UT Austin · March 2026

---

# Recap: Pilot A & Pilot B

## Pilot A — LLM Analyst
- **YelpChi**: 45,954 nodes, 32 features, 3 edge types (RUR, RTR, RSR), 14.5% fraud
- LLM classifies **low-confidence nodes** using posthoc-mined patterns
- Key patterns: `feature_13/14` thresholds, RUR edge presence, `feature_20 > 0.76`

## Pilot B — Feature Engineering
- Encode Pilot A patterns as structural features: `has_rur`, `rur_ratio`, `local_fraud_ratio`, `ego_density`
- Feed back to GNN and retrain → **significant recall improvement**

> **Takeaway**: LLM discovers interpretable fraud patterns (A) → structural features boost GNN recall (B)

---

# New Contributions & Conclusions

**1. Pilot C — Closed-Loop Pipeline**
Phase A (analyst on val set) → Phase B (engineer + retrain) → champion selection → repeat

**2. XGB-Graph Baseline (GADBench)**
Replace GraphSAGE with tree ensemble + 2-hop neighbor aggregation

**3. EvoAgent (AlphaEvolve-Lite)**
Structured mutations + template code gen + L1 filter + DB-driven prompt

| Conclusion | Evidence |
|:-----------|:---------|
| **XGB-Graph >> GraphSAGE** | R: 0.815 vs 0.618, F1: 0.869 vs 0.739, trains 450x faster |
| **Old Pilot C fails on strong baseline** | 0/2 rounds improved on XGB-Graph (6 retrains, 23 min) |
| **EvoAgent breaks through** | R: 0.815→0.847 (+3.2pp), 2/2 rounds improved in 6 min |

---

# EvoAgent Pipeline

<img src="/evoagent_pipeline.png" class="mx-auto" style="max-height: 85%; max-width: 95%;" />

---

# Results: Baseline Comparison

### GraphSAGE vs XGB-Graph on YelpChi

| Metric | GraphSAGE | XGB-Graph | Delta |
|:------:|:---------:|:---------:|:-----:|
| **Recall** | 0.618 | **0.815** | +0.197 |
| Precision | 0.512 | **0.744** | +0.232 |
| Macro F1 | 0.739 | **0.869** | +0.130 |
| AUC-ROC | 0.873 | **0.959** | +0.086 |
| Training Time | ~30 min | **~4s** | ~450x |

**Why XGB-Graph?** GADBench (2024): tree ensembles + neighbor agg beat GNNs on tabular-graph.

---

# Results: Three Settings Comparison

| | Old + GraphSAGE | Old + XGB-Graph | **EvoAgent + XGB** |
|:--|:-:|:-:|:-:|
| Baseline R | 0.618 | 0.815 | 0.815 |
| **Final R** | 0.622 (+0.4pp) | 0.815 (no Δ) | **0.847 (+3.2pp)** |
| Final P | 0.770 | 0.744 | **0.815** |
| Final F1 | 0.821 | 0.869 | **0.901** |
| Phase B Time | ~26 min | ~23 min | **~6 min** |
| Rounds Improved | 1/2 | **0/2** | **2/2** |

Old fails on strong baseline: 0 improvements in 6 XGB retrains. EvoAgent: 2/2 rounds, **4x faster**.

---

# Results: EvoAgent Iteration Trajectory

| Round | Iter | Recall | Status | Δ from baseline |
|:-----:|:----:|:------:|:------:|:-------:|
| **R1** (base=0.815) | 1 | 0.796 | rejected | -1.9pp |
| | 2 | 0.837 | improving | +2.2pp |
| | 3 | **0.842** | **ACCEPTED** ✓ | **+2.7pp** |
| **R2** (base=0.842) | 1 | 0.798 | rejected | -4.4pp |
| | 2 | 0.822 | rejected | -2.0pp |
| | 3 | **0.847** | **ACCEPTED** ✓ | **+0.5pp** |

Final: R = 0.815 → 0.842 → **0.847** (+3.2pp cumulative). Each round improves upon prior champion.

---

# Results: Search Efficiency

**Old Approach (Pilot C)**: LLM writes free-form Python → MCP multi-turn (~15 min/round) → often hurts recall → XGB-Graph: **6 retrains, 0 accepted**

**EvoAgent**: LLM proposes structured mutation (JSON) → single SDK call (~30s/iter) → template code gen → always valid → **6 retrains, 2 accepted**

| Metric | Old | EvoAgent | Speedup |
|:-------|:---:|:--------:|:-------:|
| Phase B time | 23 min | **6 min** | **4x** |
| Rounds improved | 0/2 | **2/2** | — |
| LLM interaction | Multi-turn MCP | **Single-turn SDK** | Simpler |
