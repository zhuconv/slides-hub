---
theme: default
title: "Aesthetic Preference Agent System"
info: Implementation Report
---

# Aesthetic Preference Agent System

Iterative aesthetic preference discovery via multi-agent loop

March 2026

---
layout: image
image: /architecture.png
backgroundSize: contain
---

---

# Target: Minimalist Modernist

| Axis | GT Liked | GT Disliked |
|------|----------|-------------|
| color | Neutral | Vibrant |
| art_style | Minimalism | Pop Art |
| art_medium | Pencil | Digital |
| detail | Minimal | Fine |
| saturation | Muted | Vivid |

**Start**: random — Realism / Warm / Pastel / Moderate / Fine (0/5 match)

---
layout: image
image: /before_after.png
backgroundSize: contain
---

---

# Exp 1: Claude Text-Only Refiner

Evaluator: Claude reads images via CLI. Refiner: Claude reasons from scores. **No GT leakage.**

| Round | Liked | Disliked | Margin | Key Event |
|-------|-------|----------|--------|-----------|
| 0 | 0/5 | 1/5 | +2.0 | Random start |
| 4 | **1/5** | 2/5 | +2.2 | saturation=Muted found |
| 7 | 1/5 | **3/5** | +1.8 | Pop Art + Digital + Vivid |
| 14 | 2/5 | 2/5 | +1.0 | medium=Pencil found (last round) |

**Final**: Liked 2/5 (Muted + Pencil), Disliked 2/5 (Digital + Vivid)

Bottleneck: no gradient direction, weak score signal (2-5 range)

---

# Exp 2: Δ Optimization + E2T + Claude Diff

200-step noise prediction loss, then E2T text inversion, then Claude maps to profile.

| Round | Liked | Disliked | Loss | Key Event |
|-------|-------|----------|------|-----------|
| 0 | 0/5 | 1/5 | 1.48 | Start |
| 4 | **2/5** | 1/5 | 1.93 | Muted + Minimal |
| **6** | **3/5** | 0/5 | 1.78 | **Neutral + Muted + Minimal** |
| 7 | 1/5 | 0/5 | 1.62 | E2T resets to Impressionism |

**Peak 3/5** — Δ gradient found Neutral. But E2T is unstable, maps everything to Impressionism/Warm.

---

# Exp 3: Δ + Embedding Matching + Score Weighting

Skip E2T. Match Δ against profile template embeddings via cosine similarity. Score-weighted loss + Δ accumulation across rounds.

| Round | Liked | Disliked | Margin | Key Event |
|-------|-------|----------|--------|-----------|
| 0 | 0/5 | 1/5 | +1.5 | Random start |
| **1** | **2/5** | 1/5 | +1.0 | **Neutral + Muted found** |
| 2-15 | **2/5** | 1/5 | +0.5~2.8 | Stable plateau |

**Stable 2/5** from Round 1. No regression (unlike E2T). But plateau — noise prediction loss doesn't directly optimize for profile discovery.

---

# Three-Way Comparison

| | Text-Only | Δ+E2T | Δ+Embed |
|---|---|---|---|
| Liked peak | 2/5 | **3/5** | 2/5 |
| Liked final | 2/5 | 2/5 | 2/5 |
| Disliked peak | **3/5** | 1/5 | 1/5 |
| Stability | Drifts | Regresses | **Rock solid** |
| Found axes | Muted, Pencil | **Neutral**, Muted, Minimal | **Neutral**, Muted |
| Bottleneck | No gradient | E2T instability | Plateau |

Each method finds different axes. Best single-round: Δ+E2T (3/5). Most stable: Δ+Embed (2/5).

---

# Conclusion

**1. All pipeline components work — but the task is genuinely hard.**

- SD1.5 generation, Claude evaluation, Δ optimization, embedding matching — all functional
- 26/26 tests passed on GH200 120GB
- Noise prediction loss converges (1.0-3.0), numerically stable in fp32
- Embedding-space profile matching is fast, stable, and interpretable
- Claude CLI evaluator provides meaningful (if noisy) image-level feedback

**2. Next step: fix the plateau problem.**

- Noise prediction loss reconstructs images, doesn't directly optimize for profile discovery
- Warm-init creates fixed points — need exploration mechanisms
- Promising directions: contrastive loss (push Δ_pos away from Δ_neg), coordinate descent (one axis at a time), trained E2T model (replace NN-based PoC)
