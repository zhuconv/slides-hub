---
theme: default
title: "AestheticAgent: Multi-Model Evolutionary Preference Discovery"
info: "Benchmark Report — Text-Only vs Evolve vs Multi-Model Evolve"
author: "Jiajun Zhu"
---

<style>
  :root { --slidev-code-font-size: 0.85em; }
  .slidev-layout { font-size: 1.05em; }
  table { font-size: 0.95em; }
  h1 { font-size: 1.9em !important; }
  h2 { font-size: 1.5em !important; }
  li { font-size: 1.0em; }
  p { font-size: 1.0em; }
  .small { font-size: 0.85em; }
</style>

# AestheticAgent

## Multi-Model Evolutionary Aesthetic Preference Discovery

Benchmark Report: Text-Only vs Evolve vs Multi-Model Evolve

<div class="small" style="margin-top: 2em; color: #666;">

Jiajun Zhu &mdash; April 2026

5 profiles &times; 3 methods &times; 10 rounds | FLUX / SD3.5 / SD1.5

</div>

---

# Problem Setting

Given a **hidden aesthetic preference** defined by 5 axes, discover it through iterative image generation and scoring.

| Axis | Example Values |
|------|---------------|
| art_style | Impressionism, Minimalism, Pop Art, Anime, ... (8 values) |
| color | Warm, Cool, Neutral, Vibrant, Monochrome, Earth (6 values) |
| art_medium | Oil Painting, Watercolor, Digital, Pencil, Ink, Pastel (6 values) |
| saturation | Vivid, Moderate, Muted (3 values) |
| detail | Fine, Moderate, Minimal (3 values) |

**Search space**: 8 &times; 6 &times; 6 &times; 3 &times; 3 = **2,592** possible liked profiles

**Oracle**: Claude scores generated images 1&ndash;10 against hidden GT (no profile leakage)

---

# Three Methods

<div class="grid grid-cols-3 gap-4">
<div>

### Text-Only
- Claude refines profiles based on score history
- Single profile per round
- No structured search
- **Baseline**

</div>
<div>

### Evolve (AlphaEvolve-Lite)
- Structured axis-level mutations
- L1 duplicate filter + L2 image eval
- Per-axis hypothesis tracking
- Win/loss pattern analysis
- Tournament parent selection

</div>
<div>

### Multi-Model Evolve
- Everything in Evolve, plus:
- **Cross-model exploration** (FLUX, SD3.5, SD1.5)
- Forced model mutations in early rounds
- Cross-model re-evaluation every 3 rounds
- VRAM management (swap models)

</div>
</div>

---
layout: image
image: /benchmark_comparison.png
backgroundSize: 90%
---

---

# Results Summary

| Profile | Text Liked | Evolve Liked | Multi Liked | Multi Best Model |
|---------|:---------:|:----------:|:----------:|:---------------:|
| minimalist | 0/5 | 2/5 | **3/5** | flux |
| dark_anime | 2/5 | 1/5 | **3/5** | flux |
| vibrant_pop | 3/5 | 0/5 | **3/5** | sd15 |
| warm_impressionist | 1/5 | **3/5** | 2/5 | flux |
| vibrant_surreal | 1/5 | 3/5 | **5/5** | sd35 |
| **Average** | **1.4/5** | **1.8/5** | **3.2/5** | |

<div style="margin-top:1em">

| Metric | Text-Only | Evolve | Multi-Model |
|--------|:---------:|:------:|:-----------:|
| Avg Liked Accuracy | 1.4/5 | 1.8/5 | **3.2/5** |
| Avg Preference Margin | 2.98 | 4.15 | **4.90** |

</div>

**Ordering confirmed**: Text-Only < Evolve < Multi-Model (both metrics)

---
layout: image
image: /benchmark_convergence.png
backgroundSize: 75%
---

---

# Multi-Model Advantage

<div class="grid grid-cols-2 gap-6">
<div>

### Model Selection Matters

Best model varies **by profile**:
- **vibrant_pop**: SD1.5 (margin 5.50) vs FLUX (2.75)
- **vibrant_surreal**: SD3.5 achieves **5/5 accuracy**
- **minimalist, dark_anime, warm_impr.**: FLUX wins

Single-model evolve is blind to this signal.

### Key Insight
No single model dominates all aesthetic styles. Multi-model search automatically discovers the best model&ndash;style pairing.

</div>
<div>

<img src="/benchmark_model_selection.png" style="width:100%" />

<div class="small" style="text-align:center; color:#666;">
Best model at each round (Multi-Model Evolve)
</div>

</div>
</div>

---
layout: image
image: /sample_images.png
backgroundSize: contain
---

---

# Convergence Analysis

<div class="grid grid-cols-2 gap-6">
<div>

### Text-Only (Baseline)
- Oscillates without converging
- Often stuck in local optima (Warm/Realism)
- Best margin: 2.98 avg

### Evolve (Single-Model)
- Systematic axis exploration
- Hypothesis bank prevents re-testing
- Better margin (4.15) but blind to model choice
- Fails on vibrant_pop (wrong local optimum)

</div>
<div>

### Multi-Model Evolve
- All benefits of Evolve, plus model diversity
- Cross-model re-eval catches missed opportunities
- **vibrant_surreal**: perfect 5/5 via SD3.5
- **vibrant_pop**: SD1.5 rescues a failed FLUX search
- Best overall: 3.2/5 accuracy, 4.90 margin

### Disliked Profile
- Improved from 1/5 to avg 2/5 with explicit disliked mutations
- Still room for improvement

</div>
</div>

---

# Technical Contributions

1. **VRAM-efficient model swapping**: Unload current model before loading next, enabling multi-model search on single GPU (48GB A6000)

2. **Disliked-side mutation guidance**: Sampler explicitly requests disliked profile mutations with per-axis dispref statistics

3. **Win/loss pattern analysis**: Track which axis changes led to margin improvements vs regressions, feed back into mutation proposals

4. **Cross-model re-evaluation**: Every 3 rounds, re-test best profile on untested models to find optimal model&ndash;style pairings

5. **Tournament parent selection**: Top-K tournament instead of greedy best-only, maintaining exploration diversity

---

# Limitations & Next Steps

<div class="grid grid-cols-2 gap-6">
<div>

### Current Limitations
- **Circular evaluation**: Same Claude family for scoring and mutations
- **Fixed prompts**: 4 base prompts for search and eval
- **Single seed**: No uncertainty estimates
- **Margin &ne; accuracy**: Best-margin candidate not always highest GT accuracy

</div>
<div>

### Planned Improvements
- **Held-out prompt evaluation** (20&ndash;40 unseen prompts)
- **Independent judge** (different model family)
- **Multi-seed runs** (3 seeds &times; 5 profiles &times; 3 methods)
- **Best-fixed-model baselines** (evolve_sd15, evolve_sd35)
- **Joint liked+disliked objective**

</div>
</div>

---

# Conclusion

<div style="font-size: 1.1em;">

**AestheticAgent** discovers hidden aesthetic preferences through evolutionary search over visual style profiles.

**Key result**: Multi-model evolutionary search (3.2/5 avg accuracy, 4.90 margin) consistently outperforms single-model evolve (1.8/5, 4.15) and text-only refinement (1.4/5, 2.98).

**Why it works**: Different generation models render aesthetic styles differently. FLUX excels at minimalist/classical styles, SD3.5 at surrealism, SD1.5 at pop art. Multi-model search automatically discovers these pairings.

</div>

<div style="margin-top: 2em; text-align: center; color: #888; font-size: 0.9em;">

Code: <code>~/AestheticAgent-dev</code> | Logs: <code>outputs/bench_logs/</code> | Figures: <code>outputs/benchmark_*.png</code>

</div>
