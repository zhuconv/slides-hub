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

# Exp 1: Claude Text-Only Refiner (15 Rounds)

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

# Exp 2: Δ Optimization + E2T + Claude Diff (10 Rounds)

200-step noise prediction loss, then E2T text inversion, then Claude maps to profile.

| Round | Liked | Disliked | Loss | Key Event |
|-------|-------|----------|------|-----------|
| 0 | 0/5 | 1/5 | 1.48 | Start |
| 4 | **2/5** | 1/5 | 1.93 | Muted + Minimal |
| **6** | **3/5** | 0/5 | 1.78 | **Neutral + Muted + Minimal** |
| 7 | 1/5 | 0/5 | 1.62 | E2T resets to Impressionism |

**Peak 3/5** — Δ gradient found Neutral. But E2T is unstable, maps everything to Impressionism/Warm.

---

# Exp 3: Δ Optimization + Embedding Matching (22 Rounds)

Skip E2T entirely. Match Δ against pre-computed profile template embeddings via cosine similarity.

| Round | Liked | Disliked | Margin | Profile (Liked) |
|-------|-------|----------|--------|-----------------|
| 0 | 0/5 | 1/5 | +1.8 | Realism/Warm/Pastel/Moderate/Fine |
| **1** | **2/5** | 1/5 | +0.8 | Realism/**Neutral**/Pastel/**Muted**/Fine |
| 2-22 | **2/5** | 1/5 | +0.5~2.8 | (identical — plateau) |

**Result**: Stable 2/5 from Round 1 (Neutral + Muted). No regression (unlike E2T). But **complete plateau** — warm-init locks Δ to same fixed point every round.

---

# Three-Way Comparison

| | Text-Only (15r) | Δ+E2T (10r) | Δ+Embed (22r) |
|---|---|---|---|
| Liked peak | 2/5 | **3/5** | 2/5 |
| Liked final | 2/5 | 2/5 | 2/5 |
| Disliked peak | **3/5** | 1/5 | 1/5 |
| Stability | Drifts | **Regresses** | **Rock solid** |
| Found axes | Muted, Pencil | **Neutral**, Muted, Minimal | **Neutral**, Muted |
| Bottleneck | No gradient | E2T instability | Warm-init plateau |
| Time/round | ~2 min | ~6 min | ~5 min |

Each method finds different axes. Δ+E2T finds the most (3) but can't hold them.

---

# Root Cause: Warm-Init Fixed Point

Every round: `Δ_init = E(template(current_profile)) - E(base)`

When profile doesn't change → same Δ_init → same optimized Δ → same profile → **fixed point**

Embedding matching is too stable — it always returns to the same local minimum.

**Proposed fixes:**

1. **Δ accumulation**: carry optimized Δ across rounds instead of re-initializing
2. **Exploration noise**: add random perturbation to break fixed point
3. **Coordinate descent**: optimize one axis at a time
4. **Contrastive loss**: push Δ_pos away from Δ_neg, not just reconstruct

---

# Summary

- Full system implemented: 14 modules, 26/26 tests, 3 experiments on GH200
- **Embedding matching > E2T**: stable but plateaus at 2/5
- **Δ+E2T found 3/5 peak**: proves gradient helps, but E2T is unreliable
- **Core issue**: warm-init fixed point prevents exploration
- **Next**: Δ accumulation + exploration noise to break plateau
